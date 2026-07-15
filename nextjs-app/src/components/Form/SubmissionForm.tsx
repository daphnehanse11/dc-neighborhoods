'use client'

import { useState, useEffect, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import AddressInput from './AddressInput'
import NeighborhoodInput from './NeighborhoodInput'
import type { Address, SubmissionPayload, CaptureShareImage } from '@/lib/types'

async function createSubmission(payload: SubmissionPayload) {
  const response = await fetch('/api/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Submission failed')
  }
  return response.json()
}

interface SubmissionFormProps {
  polygon: GeoJSON.Polygon | null
  address: Address | null
  onAddressChange: (address: Address | null) => void
  onSubmitComplete: () => void
  isDrawing: boolean
  onStartDrawing: () => void
  onClearDrawing: () => void
  onCaptureImage: CaptureShareImage
}

export default function SubmissionForm({
  polygon,
  address,
  onAddressChange,
  onSubmitComplete,
  isDrawing,
  onStartDrawing,
  onClearDrawing,
  onCaptureImage,
}: SubmissionFormProps) {
  const [neighborhoodName, setNeighborhoodName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [shareImage, setShareImage] = useState<string | null>(null)
  const [captureFailed, setCaptureFailed] = useState(false)
  const [canShare, setCanShare] = useState(false)

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && !!navigator.canShare)
  }, [])

  const submitMutation = useMutation({
    mutationFn: createSubmission,
    onSuccess: async (_data, variables) => {
      setSuccess(true)
      try {
        const image = await onCaptureImage(variables.boundary, variables.neighborhoodName)
        setShareImage(image)
      } catch {
        // The share image is a bonus; the submission itself already succeeded
        setCaptureFailed(true)
      }
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Submission failed')
    },
  })

  const handleDone = useCallback(() => {
    setSuccess(false)
    setShareImage(null)
    setCaptureFailed(false)
    setNeighborhoodName('')
    onSubmitComplete()
  }, [onSubmitComplete])

  const handleShare = useCallback(async () => {
    if (!shareImage) return
    try {
      const blob = await (await fetch(shareImage)).blob()
      const file = new File([blob], 'my-neighborhood.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] })
      }
    } catch {
      // User cancelled the share sheet or sharing is unavailable
    }
  }, [shareImage])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!address) {
      setError('Please enter your address')
      return
    }
    if (!neighborhoodName.trim()) {
      setError('Please enter a neighborhood name')
      return
    }
    if (!polygon) {
      setError('Please draw your neighborhood boundary on the map')
      return
    }

    submitMutation.mutate({
      addressText: address.text,
      addressPoint: address.point,
      neighborhoodName: neighborhoodName.trim(),
      boundary: polygon,
    })
  }, [address, neighborhoodName, polygon, submitMutation])

  const isComplete = address && neighborhoodName.trim() && polygon

  return (
    <div className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg p-4 z-10 max-h-[60vh] overflow-auto md:left-auto md:right-4 md:bottom-4 md:w-96 md:rounded-2xl ${isDrawing ? 'hidden' : ''}`}>
      {success ? (
        <div className="text-center py-4">
          <p className="text-lg font-medium text-green-600">Thanks for your submission!</p>
          <p className="text-sm text-gray-500 mt-1">Your neighborhood has been recorded.</p>

          {shareImage ? (
            <>
              <img
                src={shareImage}
                alt="Your neighborhood boundary"
                className="mt-3 mx-auto max-h-64 rounded-lg border border-gray-200"
              />
              <p className="text-xs text-gray-500 mt-2">
                The image shows only your boundary, not your address.
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {canShare && (
                  <button
                    type="button"
                    onClick={handleShare}
                    className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors"
                  >
                    Share
                  </button>
                )}
                <a
                  href={shareImage}
                  download="my-neighborhood.png"
                  className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Download image
                </a>
              </div>
            </>
          ) : captureFailed ? null : (
            <p className="text-sm text-gray-400 mt-3">Making your shareable map…</p>
          )}

          <button
            type="button"
            onClick={handleDone}
            className="mt-3 text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Draw Your Neighborhood
          </h2>

          <AddressInput value={address} onChange={onAddressChange} />

          <NeighborhoodInput
            value={neighborhoodName}
            onChange={setNeighborhoodName}
          />

          {/* Boundary drawing section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Neighborhood Boundary
            </label>
            {!polygon && (
              <button
                type="button"
                onClick={onStartDrawing}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors"
              >
                Draw Boundary on Map
              </button>
            )}
            {polygon && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Boundary drawn
                </span>
                <button
                  type="button"
                  onClick={onClearDrawing}
                  className="text-sm text-gray-500 hover:text-gray-700 ml-auto"
                >
                  Clear & redraw
                </button>
              </div>
            )}
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-4 text-sm border-t pt-3">
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${address ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className={address ? 'text-gray-700' : 'text-gray-400'}>Address</span>
            </span>
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${neighborhoodName.trim() ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className={neighborhoodName.trim() ? 'text-gray-700' : 'text-gray-400'}>Name</span>
            </span>
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${polygon ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className={polygon ? 'text-gray-700' : 'text-gray-400'}>Boundary</span>
            </span>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={!isComplete || submitMutation.isPending}
            className={`w-full py-3 px-4 rounded-lg font-medium text-base transition-colors ${
              isComplete
                ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit My Neighborhood'}
          </button>

          <p className="text-xs text-gray-500 text-center">
            Once enough people have drawn their neighborhoods, we will publish
            a map of where they agree and where they don&apos;t.
          </p>

          <p className="text-xs text-gray-500 text-center">
            Your address stays private. It anchors your submission and never
            appears on the public map.
          </p>
        </form>
      )}
    </div>
  )
}
