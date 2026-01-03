import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAllSubmissions } from '../../api/submissions'

export default function ResultsPanel() {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null)

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['submissions'],
    queryFn: getAllSubmissions,
  })

  // Group submissions by neighborhood
  const neighborhoodCounts = submissions.reduce((acc, sub) => {
    const name = sub.neighborhoodName.toLowerCase()
    acc[name] = (acc[name] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const sortedNeighborhoods = Object.entries(neighborhoodCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)

  return (
    <div className="absolute top-0 right-0 bottom-0 w-80 bg-white shadow-lg overflow-auto z-10 hidden md:block">
      <div className="p-4 border-b sticky top-0 bg-white">
        <h2 className="text-lg font-semibold text-gray-900">Neighborhood Results</h2>
        <p className="text-sm text-gray-500 mt-1">
          {submissions.length} submissions so far
        </p>
      </div>

      {isLoading ? (
        <div className="p-4 text-center text-gray-500">Loading...</div>
      ) : sortedNeighborhoods.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          <p>No submissions yet.</p>
          <p className="text-sm mt-2">Be the first to draw your neighborhood!</p>
        </div>
      ) : (
        <ul className="divide-y">
          {sortedNeighborhoods.map(([name, count]) => (
            <li key={name}>
              <button
                onClick={() => setSelectedNeighborhood(name === selectedNeighborhood ? null : name)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex justify-between items-center ${
                  selectedNeighborhood === name ? 'bg-blue-50' : ''
                }`}
              >
                <span className="font-medium capitalize">{name}</span>
                <span className="text-sm text-gray-500">
                  {count} {count === 1 ? 'response' : 'responses'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="p-4 border-t text-xs text-gray-400">
        <p>Consensus boundaries require at least 5 submissions per neighborhood.</p>
      </div>
    </div>
  )
}
