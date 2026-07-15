'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import type { CaptureShareImage } from '@/lib/types'
import 'maplibre-gl/dist/maplibre-gl.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'

const DC_CENTER: [number, number] = [-77.0369, 38.9072]
const DC_ZOOM = 10

// Expanded bounds to include all Metro stations (Ashburn to Largo, Shady Grove to Branch Ave)
const DC_BOUNDS: [[number, number], [number, number]] = [
  [-77.55, 38.72],  // Southwest (includes Franconia, Huntington)
  [-76.80, 39.15],  // Northeast (includes Shady Grove, Greenbelt)
]

// Metro line colors
const LINE_COLORS: Record<string, string> = {
  red: '#E51636',
  orange: '#F68712',
  yellow: '#FFD520',
  green: '#00A850',
  blue: '#0076BD',
  silver: '#9D9F9C',
}

interface MetroStation {
  name: string
  lines: string[]
  coords: [number, number]
}

// Custom draw styles: mapbox-gl-draw's default theme uses a line-dasharray
// expression MapLibre v5 rejects, which breaks the control's setup entirely.
const DRAW_COLOR = '#2563eb'
const FIRST_VERTEX_COLOR = '#16a34a'
const DRAW_STYLES = [
  {
    id: 'gl-draw-polygon-fill',
    type: 'fill',
    filter: ['all', ['==', '$type', 'Polygon']],
    paint: { 'fill-color': DRAW_COLOR, 'fill-opacity': 0.12 },
  },
  {
    id: 'gl-draw-polygon-stroke',
    type: 'line',
    filter: ['all', ['==', '$type', 'Polygon']],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': DRAW_COLOR, 'line-width': 2.5 },
  },
  {
    id: 'gl-draw-line',
    type: 'line',
    filter: ['all', ['==', '$type', 'LineString']],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': DRAW_COLOR, 'line-width': 2.5, 'line-dasharray': [2, 2] },
  },
  {
    id: 'gl-draw-vertex-halo',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'vertex'], ['!=', 'coord_path', '0.0'], ['==', '$type', 'Point']],
    paint: { 'circle-radius': 9, 'circle-color': '#ffffff' },
  },
  {
    id: 'gl-draw-vertex',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'vertex'], ['!=', 'coord_path', '0.0'], ['==', '$type', 'Point']],
    paint: { 'circle-radius': 6, 'circle-color': DRAW_COLOR },
  },
  // The first vertex is the one you tap to close the shape, so make it stand out
  {
    id: 'gl-draw-vertex-first-halo',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'vertex'], ['==', 'coord_path', '0.0'], ['==', '$type', 'Point']],
    paint: { 'circle-radius': 10, 'circle-color': '#ffffff' },
  },
  {
    id: 'gl-draw-vertex-first',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'vertex'], ['==', 'coord_path', '0.0'], ['==', '$type', 'Point']],
    paint: { 'circle-radius': 7, 'circle-color': FIRST_VERTEX_COLOR },
  },
  {
    id: 'gl-draw-midpoint',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'midpoint'], ['==', '$type', 'Point']],
    paint: { 'circle-radius': 4, 'circle-color': DRAW_COLOR, 'circle-opacity': 0.7 },
  },
]

interface MapProps {
  mode: 'draw' | 'results'
  polygon: GeoJSON.Polygon | null
  onPolygonChange: (polygon: GeoJSON.Polygon | null) => void
  address: { text: string; point: [number, number] } | null
  isDrawing: boolean
  drawTrigger: number
  onClearDrawing: () => void
  onRegisterCapture?: (fn: CaptureShareImage) => void
}

export default function Map({ mode, polygon, onPolygonChange, address, isDrawing, drawTrigger, onClearDrawing, onRegisterCapture }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const drawRef = useRef<MapboxDraw | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const metroMarkersRef = useRef<maplibregl.Marker[]>([])
  const [mapReady, setMapReady] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: DC_CENTER,
      zoom: DC_ZOOM,
      maxBounds: DC_BOUNDS,
      minZoom: 9,
      maxZoom: 18,
      // Needed so the canvas can be read back when generating the share image
      canvasContextAttributes: { preserveDrawingBuffer: true },
    })

    map.on('load', () => {
      // Hide neighborhood labels
      const style = map.getStyle()
      if (style?.layers) {
        style.layers.forEach((layer) => {
          if (layer.id.includes('place') && !layer.id.includes('country') && !layer.id.includes('state')) {
            map.setLayoutProperty(layer.id, 'visibility', 'none')
          }
        })
      }

      // Load and display metro stations
      fetch('/metro-stations.json')
        .then(res => res.json())
        .then((stations: MetroStation[]) => {
          stations.forEach(station => {
            // Create gradient for multi-line stations
            const colors = station.lines.map(line => LINE_COLORS[line] || '#666')
            let background: string

            if (colors.length === 1) {
              background = colors[0]
            } else {
              // Create conic gradient with equal segments
              const segments = colors.map((color, i) => {
                const start = (i / colors.length) * 360
                const end = ((i + 1) / colors.length) * 360
                return `${color} ${start}deg ${end}deg`
              }).join(', ')
              background = `conic-gradient(${segments})`
            }

            // Create a custom element for the metro marker
            const el = document.createElement('div')
            el.className = 'metro-marker'
            el.style.width = '14px'
            el.style.height = '14px'
            el.style.background = background
            el.style.border = '2px solid white'
            el.style.borderRadius = '50%'
            el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)'
            el.style.cursor = 'pointer'

            const marker = new maplibregl.Marker({ element: el })
              .setLngLat(station.coords)
              .setPopup(
                new maplibregl.Popup({ offset: 10, closeButton: false })
                  .setHTML(`<div style="font-size:12px;font-weight:500;">${station.name}</div>`)
              )
              .addTo(map)

            metroMarkersRef.current.push(marker)
          })
        })
        .catch(err => console.error('Failed to load metro stations:', err))

      // Initialize draw control
      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {},
        touchEnabled: true,
        touchBuffer: 25,
        clickBuffer: 5,
        boxSelect: false,
        styles: DRAW_STYLES,
      })

      map.addControl(draw as unknown as maplibregl.IControl)
      drawRef.current = draw

      map.on('draw.create', (e: unknown) => {
        const event = e as { features: GeoJSON.Feature[] }
        const feature = event.features[0]
        if (feature?.geometry?.type === 'Polygon') {
          onPolygonChange(feature.geometry as GeoJSON.Polygon)
        }
      })

      map.on('draw.update', (e: unknown) => {
        const event = e as { features: GeoJSON.Feature[] }
        const feature = event.features[0]
        if (feature?.geometry?.type === 'Polygon') {
          onPolygonChange(feature.geometry as GeoJSON.Polygon)
        }
      })

      map.on('draw.delete', () => {
        onPolygonChange(null)
      })

      setMapReady(true)
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.addControl(new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: false,
    }), 'top-right')

    mapRef.current = map

    return () => {
      metroMarkersRef.current.forEach(m => m.remove())
      metroMarkersRef.current = []
      map.remove()
      mapRef.current = null
      drawRef.current = null
      setMapReady(false)
    }
  }, [onPolygonChange])

  // Handle draw trigger from parent
  useEffect(() => {
    if (drawTrigger > 0 && drawRef.current && mapReady) {
      drawRef.current.deleteAll()
      drawRef.current.changeMode('draw_polygon')
    }
  }, [drawTrigger, mapReady])

  // Re-show instructions each time drawing starts
  useEffect(() => {
    if (isDrawing) setShowInstructions(true)
  }, [isDrawing])

  // Exit draw mode when drawing is cancelled or the polygon is cleared
  useEffect(() => {
    if (!isDrawing && !polygon && drawRef.current && mapReady) {
      drawRef.current.deleteAll()
      drawRef.current.changeMode('simple_select')
    }
  }, [isDrawing, polygon, mapReady])

  // Generate a shareable image: basemap framed to the boundary (no address
  // marker, since HTML markers are not part of the GL canvas), the polygon
  // drawn in a clean style, and a caption band.
  const captureShareImage = useCallback<CaptureShareImage>(async (boundary, neighborhoodName) => {
    const map = mapRef.current
    if (!map) throw new Error('Map not ready')

    // Remove the draw control's rendering of the polygon; we draw our own below
    drawRef.current?.deleteAll()

    const ring = boundary.coordinates[0] as [number, number][]
    const bounds = ring.reduce(
      (b, c) => b.extend(c),
      new maplibregl.LngLatBounds(ring[0], ring[0])
    )
    map.fitBounds(bounds, { padding: 60, duration: 0 })
    // Wait for tiles at the new view, but don't hang if 'idle' never fires
    // (e.g. the tab is backgrounded and rendering is paused)
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, 2500)
      map.once('idle', () => {
        clearTimeout(timer)
        resolve()
      })
    })

    const mapCanvas = map.getCanvas()
    const W = 1080
    const mapH = Math.round((W * mapCanvas.height) / mapCanvas.width)
    const BAND = 200
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = mapH + BAND
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')

    ctx.drawImage(mapCanvas, 0, 0, W, mapH)

    // Boundary polygon: project() returns CSS px; canvas px = CSS px * dpr
    const dpr = window.devicePixelRatio || 1
    const scale = (W / mapCanvas.width) * dpr
    ctx.beginPath()
    ring.forEach((coord, i) => {
      const p = map.project(coord)
      if (i === 0) ctx.moveTo(p.x * scale, p.y * scale)
      else ctx.lineTo(p.x * scale, p.y * scale)
    })
    ctx.closePath()
    ctx.fillStyle = 'rgba(37, 99, 235, 0.15)'
    ctx.fill()
    ctx.strokeStyle = '#2563eb'
    ctx.lineWidth = 6
    ctx.lineJoin = 'round'
    ctx.stroke()

    // Map data attribution
    ctx.font = '20px system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
    ctx.fillRect(W - ctx.measureText('© CARTO © OpenStreetMap contributors').width - 24, mapH - 34, W, 34)
    ctx.fillStyle = '#4b5563'
    ctx.fillText('© CARTO © OpenStreetMap contributors', W - 12, mapH - 11)

    // Caption band
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, mapH, W, BAND)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#111827'
    let titleSize = 52
    ctx.font = `bold ${titleSize}px system-ui, sans-serif`
    const title = `${neighborhoodName}, according to me`
    while (ctx.measureText(title).width > W - 80 && titleSize > 26) {
      titleSize -= 2
      ctx.font = `bold ${titleSize}px system-ui, sans-serif`
    }
    ctx.fillText(title, W / 2, mapH + 92)
    ctx.font = '26px system-ui, sans-serif'
    ctx.fillStyle = '#9ca3af'
    ctx.fillText(`Draw yours at ${window.location.host}`, W / 2, mapH + 158)

    return canvas.toDataURL('image/png')
  }, [])

  useEffect(() => {
    if (mapReady && onRegisterCapture) onRegisterCapture(captureShareImage)
  }, [mapReady, onRegisterCapture, captureShareImage])

  // Handle address marker
  useEffect(() => {
    if (!mapRef.current) return

    if (markerRef.current) {
      markerRef.current.remove()
      markerRef.current = null
    }

    if (address) {
      const marker = new maplibregl.Marker({ color: '#dd6b20' })
        .setLngLat(address.point)
        .addTo(mapRef.current)
      markerRef.current = marker
      mapRef.current.flyTo({ center: address.point, zoom: 14 })
    }
  }, [address])

  // Handle mode changes
  useEffect(() => {
    if (!drawRef.current) return
    if (mode === 'results') {
      drawRef.current.deleteAll()
      onPolygonChange(null)
    }
  }, [mode, onPolygonChange])

  return (
    <div className="absolute inset-0">
      <div ref={mapContainer} className="h-full w-full" />

      {/* Drawing instructions overlay */}
      {isDrawing && showInstructions && (
        <div className="absolute top-20 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-96 bg-blue-600 text-white p-3 rounded-lg shadow-lg text-center text-sm z-20">
          <p>Tap on the map to add points. Tap the green starting point to close the shape.</p>
          <button
            onClick={() => setShowInstructions(false)}
            className="mt-3 w-full py-2 px-4 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 active:bg-blue-100"
          >
            OK
          </button>
          <button
            onClick={onClearDrawing}
            className="mt-2 underline text-blue-100 hover:text-white"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Persistent cancel while drawing, after instructions are dismissed */}
      {isDrawing && !showInstructions && (
        <button
          onClick={onClearDrawing}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white text-gray-700 py-2 px-4 rounded-full shadow-lg text-sm font-medium hover:bg-gray-50 z-20"
        >
          Cancel drawing
        </button>
      )}

      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <p className="text-gray-500">Loading map...</p>
        </div>
      )}
    </div>
  )
}
