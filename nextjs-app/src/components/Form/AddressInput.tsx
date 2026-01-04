'use client'

import { useState, useRef } from 'react'
import type { Address } from '@/lib/types'

// DC metro bounding box
const DC_BOUNDS = {
  minLon: -77.5,
  maxLon: -76.8,
  minLat: 38.7,
  maxLat: 39.1,
}

interface NominatimAddress {
  house_number?: string
  road?: string
  city?: string
  town?: string
  village?: string
  county?: string
  state?: string
  postcode?: string
}

interface NominatimResult {
  display_name: string
  lat: string
  lon: string
  address: NominatimAddress
}

function formatAddress(addr: NominatimAddress): string {
  const parts: string[] = []

  if (addr.house_number && addr.road) {
    parts.push(`${addr.house_number} ${addr.road}`)
  } else if (addr.road) {
    parts.push(addr.road)
  }

  const city = addr.city || addr.town || addr.village || addr.county
  if (city) parts.push(city)

  if (addr.state) {
    const abbrevs: Record<string, string> = {
      'Virginia': 'VA',
      'Maryland': 'MD',
      'District of Columbia': 'DC',
    }
    const stateAbbrev = abbrevs[addr.state] || addr.state
    parts.push(addr.postcode ? `${stateAbbrev} ${addr.postcode}` : stateAbbrev)
  }

  return parts.join(', ')
}

interface AddressInputProps {
  value: Address | null
  onChange: (address: Address | null) => void
}

export default function AddressInput({ value, onChange }: AddressInputProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const searchAddress = async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        format: 'json',
        addressdetails: '1',
        limit: '5',
        viewbox: `${DC_BOUNDS.minLon},${DC_BOUNDS.maxLat},${DC_BOUNDS.maxLon},${DC_BOUNDS.minLat}`,
        bounded: '1',
      })

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        { headers: { 'User-Agent': 'DCNeighborhoods/1.0' } }
      )

      if (response.ok) {
        const results: NominatimResult[] = await response.json()
        setSuggestions(
          results.map((r) => ({
            text: formatAddress(r.address) || r.display_name,
            point: [parseFloat(r.lon), parseFloat(r.lat)] as [number, number],
          }))
        )
      }
    } catch (error) {
      console.error('Geocoding error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (val: string) => {
    setQuery(val)
    setShowSuggestions(true)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      searchAddress(val)
    }, 400)
  }

  const handleSelect = (address: Address) => {
    setQuery(address.text)
    onChange(address)
    setSuggestions([])
    setShowSuggestions(false)
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Your Address
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        placeholder="Enter your street address"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
      />

      {isLoading && (
        <div className="absolute right-3 top-9">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {suggestions.map((addr, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => handleSelect(addr)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm text-gray-700"
              >
                {addr.text}
              </button>
            </li>
          ))}
        </ul>
      )}

      {value && (
        <p className="mt-1 text-xs text-green-600">
          Address selected: {value.text}
        </p>
      )}
    </div>
  )
}
