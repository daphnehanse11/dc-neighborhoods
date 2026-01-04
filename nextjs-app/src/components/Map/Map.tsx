'use client'

import { useRef, useEffect, useState } from 'react'
import maplibregl from 'maplibre-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
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

interface MapProps {
  mode: 'draw' | 'results'
  polygon: GeoJSON.Polygon | null
  onPolygonChange: (polygon: GeoJSON.Polygon | null) => void
  address: { text: string; point: [number, number] } | null
  isDrawing: boolean
  drawTrigger: number
  onClearDrawing: () => void
}

export default function Map({ mode, onPolygonChange, address, isDrawing, drawTrigger, onClearDrawing }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const drawRef = useRef<MapboxDraw | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const metroMarkersRef = useRef<maplibregl.Marker[]>([])
  const [mapReady, setMapReady] = useState(false)

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
      {isDrawing && (
        <div className="absolute top-20 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-96 bg-blue-600 text-white p-3 rounded-lg shadow-lg text-center text-sm z-20">
          <p>Tap on the map to add points. Tap first point to close shape.</p>
          <button
            onClick={onClearDrawing}
            className="mt-2 underline text-blue-100 hover:text-white"
          >
            Cancel
          </button>
        </div>
      )}

      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <p className="text-gray-500">Loading map...</p>
        </div>
      )}
    </div>
  )
}
