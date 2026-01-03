import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import Map from './components/Map/Map'
import SubmissionForm from './components/Form/SubmissionForm'
import ResultsPanel from './components/Results/ResultsPanel'
import './index.css'

const queryClient = new QueryClient()

type View = 'draw' | 'results'

function App() {
  const [view, setView] = useState<View>('draw')
  const [polygon, setPolygon] = useState<GeoJSON.Polygon | null>(null)
  const [address, setAddress] = useState<{ text: string; point: [number, number] } | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawTrigger, setDrawTrigger] = useState(0)

  const handleSubmissionComplete = () => {
    setPolygon(null)
    setAddress(null)
    setIsDrawing(false)
  }

  const handleStartDrawing = useCallback(() => {
    setIsDrawing(true)
    setDrawTrigger(t => t + 1) // Increment to trigger effect in Map
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
    <QueryClientProvider client={queryClient}>
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
          />

          {view === 'draw' && (
            <SubmissionForm
              polygon={polygon}
              address={address}
              onAddressChange={setAddress}
              onSubmitComplete={handleSubmissionComplete}
              isDrawing={isDrawing}
              onStartDrawing={handleStartDrawing}
              onClearDrawing={handleClearDrawing}
            />
          )}

          {view === 'results' && <ResultsPanel />}
        </main>
      </div>
    </QueryClientProvider>
  )
}

export default App
