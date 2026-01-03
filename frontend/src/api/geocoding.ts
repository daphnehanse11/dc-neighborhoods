// DC metro bounding box for Nominatim
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
  importance: number
  address: NominatimAddress
}

function formatAddress(addr: NominatimAddress): string {
  const parts: string[] = []

  // Street address
  if (addr.house_number && addr.road) {
    parts.push(`${addr.house_number} ${addr.road}`)
  } else if (addr.road) {
    parts.push(addr.road)
  }

  // City (prefer city, fall back to town/village/county)
  const city = addr.city || addr.town || addr.village || addr.county
  if (city) {
    parts.push(city)
  }

  // State abbreviation
  if (addr.state) {
    const stateAbbrev = getStateAbbrev(addr.state)
    if (addr.postcode) {
      parts.push(`${stateAbbrev} ${addr.postcode}`)
    } else {
      parts.push(stateAbbrev)
    }
  }

  return parts.join(', ')
}

function getStateAbbrev(state: string): string {
  const abbrevs: Record<string, string> = {
    'Virginia': 'VA',
    'Maryland': 'MD',
    'District of Columbia': 'DC',
    'Washington, D.C.': 'DC',
  }
  return abbrevs[state] || state
}

export async function geocodeAddress(query: string): Promise<Array<{ text: string; point: [number, number] }>> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    addressdetails: '1',
    limit: '5',
    viewbox: `${DC_BOUNDS.minLon},${DC_BOUNDS.maxLat},${DC_BOUNDS.maxLon},${DC_BOUNDS.minLat}`,
    bounded: '1',
  })

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: {
      'User-Agent': 'DCNeighborhoods/1.0',
    },
  })

  if (!response.ok) {
    throw new Error('Geocoding failed')
  }

  const results: NominatimResult[] = await response.json()

  return results.map((r) => ({
    text: formatAddress(r.address) || r.display_name,
    point: [parseFloat(r.lon), parseFloat(r.lat)] as [number, number],
  }))
}
