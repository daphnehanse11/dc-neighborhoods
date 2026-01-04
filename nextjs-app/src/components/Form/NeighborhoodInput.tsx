'use client'

import { useState, useEffect, useRef } from 'react'

interface NeighborhoodSeed {
  name: string
  alternate_names: string[]
  jurisdiction: string
}

interface NeighborhoodInputProps {
  value: string
  onChange: (value: string) => void
}

export default function NeighborhoodInput({ value, onChange }: NeighborhoodInputProps) {
  const [suggestions, setSuggestions] = useState<NeighborhoodSeed[]>([])
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodSeed[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load neighborhood seeds
  useEffect(() => {
    fetch('/neighborhoods.json')
      .then(res => res.json())
      .then(data => setNeighborhoods(data))
      .catch(err => console.error('Failed to load neighborhoods:', err))
  }, [])

  // Filter suggestions based on input
  useEffect(() => {
    if (!value.trim() || neighborhoods.length === 0) {
      setSuggestions([])
      return
    }

    const query = value.toLowerCase()
    const matches = neighborhoods.filter(n => {
      // Match against name
      if (n.name.toLowerCase().includes(query)) return true
      // Match against alternate names
      if (n.alternate_names.some(alt => alt.toLowerCase().includes(query))) return true
      return false
    }).slice(0, 6) // Limit to 6 suggestions

    setSuggestions(matches)
  }, [value, neighborhoods])

  const handleSelect = (name: string) => {
    onChange(name)
    setSuggestions([])
    setShowSuggestions(false)
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Neighborhood Name
      </label>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setShowSuggestions(true)
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => {
          // Delay to allow click on suggestion
          setTimeout(() => setShowSuggestions(false), 150)
        }}
        placeholder="What do you call your neighborhood?"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
      />

      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
          {suggestions.map((n, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => handleSelect(n.name)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm"
              >
                <span className="text-gray-900">{n.name}</span>
                <span className="text-gray-400 ml-2 text-xs">{n.jurisdiction}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-1 text-xs text-gray-500">
        Use whatever name feels right to you
      </p>
    </div>
  )
}
