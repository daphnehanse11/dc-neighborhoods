'use client'

// Results are hidden until enough boundaries have been collected.
// The previous submission list is in git history if we need it back.

interface ResultsPanelProps {
  onDraw: () => void
}

export default function ResultsPanel({ onDraw }: ResultsPanelProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg p-6 z-10 max-h-[60vh] overflow-auto md:left-auto md:right-4 md:bottom-4 md:w-96 md:rounded-2xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        The results map is coming
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        We are collecting boundaries right now. Once enough people have drawn
        their neighborhoods, we will publish a map showing where they agree and
        where they don&apos;t.
      </p>
      <button
        onClick={onDraw}
        className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors"
      >
        Draw your neighborhood
      </button>
    </div>
  )
}
