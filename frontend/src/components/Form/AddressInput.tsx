import { useState, useCallback, useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { geocodeAddress } from '../../api/geocoding'
import type { Address } from '../../types'

interface AddressInputProps {
  value: Address | null
  onChange: (address: Address | null) => void
}

export default function AddressInput({ value, onChange }: AddressInputProps) {
  const [query, setQuery] = useState(value?.text || '')
  const [suggestions, setSuggestions] = useState<Address[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const geocodeMutation = useMutation({
    mutationFn: geocodeAddress,
    onSuccess: (results) => {
      setSuggestions(results)
      setShowSuggestions(results.length > 0)
    },
  })

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)

    // Clear existing debounce
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (val.length >= 3) {
      // Debounce: wait 400ms after user stops typing
      debounceRef.current = setTimeout(() => {
        geocodeMutation.mutate(val)
      }, 400)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [geocodeMutation])

  const handleSelect = useCallback((address: Address) => {
    setQuery(address.text.split(',')[0])
    onChange(address)
    setShowSuggestions(false)
  }, [onChange])

  const handleClear = useCallback(() => {
    setQuery('')
    onChange(null)
    setSuggestions([])
  }, [onChange])

  return (
    <div className="relative">
      <label htmlFor="address-input" className="block text-sm font-medium text-gray-700 mb-1">
        Your Address
      </label>
      <div className="relative">
        <input
          id="address-input"
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder="Enter your address in the DC area"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            type="button"
            aria-label="Clear address"
          >
            <span aria-hidden="true">×</span>
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {suggestions.map((addr, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => handleSelect(addr)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 text-sm border-b last:border-0"
              >
                {addr.text}
              </button>
            </li>
          ))}
        </ul>
      )}

      {geocodeMutation.isPending && (
        <p className="text-sm text-gray-500 mt-1">Searching...</p>
      )}
    </div>
  )
}
