// Reserve California API — no auth required, CORS is open
const RDR_BASE = 'https://california-rdr.prod.cali.rd12.recreation-management.tylerapp.com/rdr'

// Three query points across CA. Testing shows querying from the geographic center
// already returns all ~112 parks statewide, but we run all three in parallel and
// deduplicate to guard against any edge cases where a park is only nearby one point.
const QUERY_POINTS = [
  { lat: 37.5,  lng: -119.5 }, // Central CA / geographic center
  { lat: 34.0,  lng: -117.5 }, // Southern CA
  { lat: 40.5,  lng: -122.5 }, // Northern CA
]

export function nightsBetween(startDate, endDate) {
  const ms = new Date(endDate) - new Date(startDate)
  return Math.max(1, Math.round(ms / 86400000))
}

async function fetchParksFrom({ lat, lng, startDate, endDate, unitCategoryId }) {
  const res = await fetch(`${RDR_BASE}/search/place`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      NightlyOnly: true,
      UnitCategoryId: unitCategoryId,
      StartDate: startDate,
      Nights: nightsBetween(startDate, endDate),
      CountNearby: true,
      Latitude: lat,
      Longitude: lng,
      NearbyLimit: 500,
    }),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data = await res.json()

  const places = []
  if (data.SelectedPlace) places.push(data.SelectedPlace)
  if (Array.isArray(data.NearbyPlaces)) places.push(...data.NearbyPlaces)
  return places
}

export async function searchParks({ startDate, endDate, unitCategoryId = 1 }) {
  const results = await Promise.all(
    QUERY_POINTS.map(pt => fetchParksFrom({ ...pt, startDate, endDate, unitCategoryId }))
  )

  // Deduplicate by PlaceId — keep first occurrence (center query is most reliable)
  const seen = new Set()
  const parks = []
  for (const batch of results) {
    for (const p of batch) {
      if (!seen.has(p.PlaceId) && p.Latitude && p.Longitude) {
        seen.add(p.PlaceId)
        parks.push(p)
      }
    }
  }
  return parks
}

// The site uses React Router route /:park/:parkId.
// When :park === "park" (literal) it loads the facility grid for :parkId.
// Any other slug causes a /pagenotfound redirect, so we always use /park/{placeId}.
// ?date=YYYY-MM-DD&night=N pre-populates the date picker on the park page.
export function buildReserveUrl(park, startDate, nights) {
  const base = `https://www.reservecalifornia.com/park/${park.PlaceId}`
  if (!startDate || !nights) return base
  return `${base}?date=${startDate}&night=${nights}`
}
