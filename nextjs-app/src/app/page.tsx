'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import SubmissionForm from '@/components/Form/SubmissionForm'
import ResultsPanel from '@/components/Results/ResultsPanel'
import type { CaptureShareImage } from '@/lib/types'

// Dynamic import for Map to avoid SSR issues with maplibre
const Map = dynamic(() => import('@/components/Map/Map'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
})

type View = 'draw' | 'results'

export default function Home() {
  const [view, setView] = useState<View>('draw')
  const [polygon, setPolygon] = useState<GeoJSON.Polygon | null>(null)
  const [address, setAddress] = useState<{ text: string; point: [number, number] } | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawTrigger, setDrawTrigger] = useState(0)
  const [showMobileTip, setShowMobileTip] = useState(false)
  const captureRef = useRef<CaptureShareImage | null>(null)

  useEffect(() => {
    if (!localStorage.getItem('mobileTipDismissed')) setShowMobileTip(true)
  }, [])

  const dismissMobileTip = useCallback(() => {
    setShowMobileTip(false)
    localStorage.setItem('mobileTipDismissed', '1')
  }, [])

  const registerCapture = useCallback((fn: CaptureShareImage) => {
    captureRef.current = fn
  }, [])

  const captureImage = useCallback<CaptureShareImage>((boundary, neighborhoodName) => {
    if (!captureRef.current) return Promise.reject(new Error('Map not ready'))
    return captureRef.current(boundary, neighborhoodName)
  }, [])

  const handleSubmissionComplete = () => {
    setPolygon(null)
    setAddress(null)
    setIsDrawing(false)
  }

  const handleStartDrawing = useCallback(() => {
    setIsDrawing(true)
    setDrawTrigger(t => t + 1)
  }, [])

  const handleClearDrawing = useCallback(() => {
    setPolygon(null)
    setIsDrawing(false)
  }, [])

  const handlePolygonChange = useCallback((p: GeoJSON.Polygon | null) => {
    setPolygon(p)
    if (p) setIsDrawing(false)
  }, [])

  return (
    <div className="h-screen w-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between z-10">
        <h1 className="text-lg font-semibold text-gray-900">DC Neighborhoods</h1>
        <nav className="flex gap-2">
          <button
            onClick={() => setView('draw')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'draw'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Draw
          </button>
          <button
            onClick={() => setView('results')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'results'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Results
          </button>
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1 relative">
        <Map
          mode={view}
          polygon={polygon}
          onPolygonChange={handlePolygonChange}
          address={address}
          isDrawing={isDrawing}
          drawTrigger={drawTrigger}
          onClearDrawing={handleClearDrawing}
          onRegisterCapture={registerCapture}
        />

        {view === 'draw' && showMobileTip && !isDrawing && (
          <div className="md:hidden absolute top-2 left-4 right-4 z-20 bg-gray-700/95 text-white text-sm rounded-lg shadow-lg p-3 flex items-start gap-2">
            <p className="flex-1">
              This works on your phone, but drawing boundaries is easier on a computer.
            </p>
            <button
              onClick={dismissMobileTip}
              aria-label="Dismiss"
              className="text-gray-300 hover:text-white px-1 font-medium"
            >
              ✕
            </button>
          </div>
        )}

        {view === 'draw' && (
          <SubmissionForm
            polygon={polygon}
            address={address}
            onAddressChange={setAddress}
            onSubmitComplete={handleSubmissionComplete}
            isDrawing={isDrawing}
            onStartDrawing={handleStartDrawing}
            onClearDrawing={handleClearDrawing}
            onCaptureImage={captureImage}
          />
        )}

        {view === 'results' && <ResultsPanel />}
      </main>
    </div>
  )
}
