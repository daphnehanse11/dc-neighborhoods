interface NeighborhoodInputProps {
  value: string
  onChange: (name: string) => void
}

export default function NeighborhoodAutocomplete({ value, onChange }: NeighborhoodInputProps) {
  return (
    <div>
      <label htmlFor="neighborhood-input" className="block text-sm font-medium text-gray-700 mb-1">
        Neighborhood Name
      </label>
      <input
        id="neighborhood-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What do you call your neighborhood?"
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
      />
      <p className="text-xs text-gray-500 mt-1">
        Use whatever name feels right to you
      </p>
    </div>
  )
}
