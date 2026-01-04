'use client'

import { useQuery } from '@tanstack/react-query'
import type { Submission } from '@/lib/types'

async function fetchSubmissions(): Promise<Submission[]> {
  const response = await fetch('/api/submissions')
  if (!response.ok) throw new Error('Failed to fetch submissions')
  return response.json()
}

export default function ResultsPanel() {
  const { data: submissions, isLoading, error } = useQuery({
    queryKey: ['submissions'],
    queryFn: fetchSubmissions,
  })

  // Group by neighborhood name
  const grouped = submissions?.reduce((acc, sub) => {
    const name = sub.neighborhoodName
    if (!acc[name]) acc[name] = []
    acc[name].push(sub)
    return acc
  }, {} as Record<string, Submission[]>) ?? {}

  const sortedNeighborhoods = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length)

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg p-4 z-10 max-h-[60vh] overflow-auto md:left-auto md:right-4 md:bottom-4 md:w-96 md:rounded-2xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Submitted Neighborhoods
      </h2>

      {isLoading && (
        <div className="py-8 text-center text-gray-500">
          Loading submissions...
        </div>
      )}

      {error && (
        <div className="py-8 text-center text-red-500">
          Failed to load submissions
        </div>
      )}

      {!isLoading && !error && sortedNeighborhoods.length === 0 && (
        <div className="py-8 text-center text-gray-500">
          No submissions yet. Be the first!
        </div>
      )}

      {sortedNeighborhoods.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            {submissions?.length} total submissions
          </p>
          {sortedNeighborhoods.map(([name, subs]) => (
            <div
              key={name}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <span className="font-medium text-gray-900">{name}</span>
              <span className="text-sm text-gray-500">
                {subs.length} {subs.length === 1 ? 'response' : 'responses'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
