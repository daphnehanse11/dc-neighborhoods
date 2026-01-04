import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

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

    // Validate polygon
    if (boundary.type !== 'Polygon' || !boundary.coordinates?.length) {
      return NextResponse.json(
        { error: 'Invalid polygon geometry' },
        { status: 400 }
      )
    }

    const sessionId = uuidv4()
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex')
    const normalizedName = neighborhoodName.trim().toLowerCase()

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
    const result = await pool.query(
      `SELECT
        id, session_id, address_text, neighborhood_name, submitted_at,
        ST_AsGeoJSON(address_point)::json as address_point,
        ST_AsGeoJSON(boundary)::json as boundary
      FROM submissions
      WHERE is_flagged = false
      ORDER BY submitted_at DESC`
    )

    const submissions = result.rows.map(row => ({
      id: row.id,
      sessionId: row.session_id,
      addressText: row.address_text,
      addressPoint: row.address_point.coordinates,
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
