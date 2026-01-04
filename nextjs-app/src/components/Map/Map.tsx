'use client'

import { useRef, useEffect, useState } from 'react'
import maplibregl from 'maplibre-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import 'maplibre-gl/dist/maplibre-gl.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'

const DC_CENTER: [number, number] = [-77.0369, 38.9072]
const DC_ZOOM = 11

const DC_BOUNDS: [[number, number], [number, number]] = [
  [-77.5, 38.75],
  [-76.85, 39.15],
]

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
      minZoom: 10,
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
