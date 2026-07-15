import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

const MAX_SUBMISSIONS_PER_HOUR = 10

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { addressText, addressPoint, neighborhoodName, boundary } = body

    // Validate required fields
    if (!addressText || !addressPoint || !neighborhoodName || !boundary) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (typeof neighborhoodName !== 'string' || !neighborhoodName.trim() || neighborhoodName.trim().length > 100) {
      return NextResponse.json(
        { error: 'Neighborhood name must be between 1 and 100 characters' },
        { status: 400 }
      )
    }

    if (typeof addressText !== 'string' || addressText.length > 500) {
      return NextResponse.json(
        { error: 'Address is too long' },
        { status: 400 }
      )
    }

    const isLngLat = (p: unknown): p is [number, number] =>
      Array.isArray(p) && p.length === 2 &&
      typeof p[0] === 'number' && Number.isFinite(p[0]) && Math.abs(p[0]) <= 180 &&
      typeof p[1] === 'number' && Number.isFinite(p[1]) && Math.abs(p[1]) <= 90

    if (!isLngLat(addressPoint)) {
      return NextResponse.json(
        { error: 'Invalid address point' },
        { status: 400 }
      )
    }

    // Validate polygon: a single closed ring of 4-500 valid coordinates
    const ring = boundary?.type === 'Polygon' ? boundary.coordinates?.[0] : null
    if (
      !ring ||
      boundary.coordinates.length !== 1 ||
      !Array.isArray(ring) ||
      ring.length < 4 ||
      ring.length > 500 ||
      !ring.every(isLngLat)
    ) {
      return NextResponse.json(
        { error: 'Invalid polygon geometry' },
        { status: 400 }
      )
    }

    const validity = await pool.query(
      'SELECT ST_IsValid(ST_GeomFromGeoJSON($1)) AS ok',
      [JSON.stringify(boundary)]
    )
    if (!validity.rows[0].ok) {
      return NextResponse.json(
        { error: 'Boundary must not cross over itself. Try redrawing it.' },
        { status: 400 }
      )
    }

    const sessionId = uuidv4()
    // x-forwarded-for can be a list (client, proxy1, ...); the first entry is the client
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex')
    const normalizedName = neighborhoodName.trim().toLowerCase()

    const recentCount = await pool.query(
      `SELECT COUNT(*) FROM submissions
       WHERE ip_hash = $1 AND submitted_at > NOW() - INTERVAL '1 hour'`,
      [ipHash]
    )
    if (Number(recentCount.rows[0].count) >= MAX_SUBMISSIONS_PER_HOUR) {
      return NextResponse.json(
        { error: 'Too many submissions from this address. Please try again in an hour.' },
        { status: 429 }
      )
    }

    const result = await pool.query(
      `INSERT INTO submissions (
        session_id, address_text, address_point, neighborhood_name,
        neighborhood_name_normalized, boundary, ip_hash
      ) VALUES (
        $1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6,
        ST_SetSRID(ST_GeomFromGeoJSON($7), 4326), $8
      ) RETURNING id, session_id, address_text, neighborhood_name, submitted_at,
        ST_AsGeoJSON(address_point)::json as address_point,
        ST_AsGeoJSON(boundary)::json as boundary`,
      [
        sessionId,
        addressText,
        addressPoint[0], // longitude
        addressPoint[1], // latitude
        neighborhoodName.trim(),
        normalizedName,
        JSON.stringify(boundary),
        ipHash,
      ]
    )

    const row = result.rows[0]
    return NextResponse.json({
      id: row.id,
      sessionId: row.session_id,
      addressText: row.address_text,
      addressPoint: row.address_point.coordinates,
      neighborhoodName: row.neighborhood_name,
      boundary: row.boundary,
      submittedAt: row.submitted_at,
    })
  } catch (error) {
    console.error('Error creating submission:', error)
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Public endpoint: never expose addresses, address points, or session ids
    const result = await pool.query(
      `SELECT
        id, neighborhood_name, submitted_at,
        ST_AsGeoJSON(boundary)::json as boundary
      FROM submissions
      WHERE is_flagged = false
      ORDER BY submitted_at DESC`
    )

    const submissions = result.rows.map(row => ({
      id: row.id,
      neighborhoodName: row.neighborhood_name,
      boundary: row.boundary,
      submittedAt: row.submitted_at,
    }))

    return NextResponse.json(submissions)
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}
