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

// Small coordinate offsets used when a park's stored coords resolve to a different
// nearby park. We try these in sequence until the API returns the right PlaceId.
const COORD_JITTER = [
  [0, 0], [0.02, 0], [-0.02, 0], [0, 0.02], [0, -0.02],
  [0.02, 0.02], [-0.02, -0.02], [0.02, -0.02], [-0.02, 0.02],
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

// Fetch facilities for a single park. Some parks' stored coordinates resolve to a
// different nearby park as SelectedPlace, so we retry with small coordinate jitters.
async function fetchFacilitiesForPark(park, startDate, nights, signal) {
  for (const [dlat, dlng] of COORD_JITTER) {
    if (signal?.aborted) return null
    try {
      const res = await fetch(`${RDR_BASE}/search/place`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({
          NightlyOnly: true,
          StartDate: startDate,
          Nights: nights,
          CountNearby: false,
          Latitude: park.Latitude + dlat,
          Longitude: park.Longitude + dlng,
          NearbyLimit: 1,
        }),
      })
      if (!res.ok) continue
      const data = await res.json()
      const selected = data.SelectedPlace
      if (selected?.PlaceId === park.PlaceId) {
        return Object.values(selected.Facilities || {})
      }
    } catch {
      // AbortError or network error — stop retrying
      return null
    }
  }
  return null // exhausted all jitter offsets
}

// Fetch facilities for a batch of parks, with concurrency limit.
// Calls onResult(placeId, facilities | null) as each park resolves.
export async function prefetchFacilities({ parks, startDate, endDate, onResult, signal }) {
  const nights = nightsBetween(startDate, endDate)
  const CONCURRENCY = 5
  let i = 0

  async function worker() {
    while (i < parks.length) {
      if (signal?.aborted) return
      const park = parks[i++]
      const facs = await fetchFacilitiesForPark(park, startDate, nights, signal)
      if (!signal?.aborted) onResult(park.PlaceId, facs)
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
}

// The site uses React Router route /:park/:parkId (park overview) and
// /park/:parkId/:facilityId (specific campground booking page).
// ?date=YYYY-MM-DD&night=N pre-populates the date picker.
export function buildReserveUrl(park, startDate, nights, facilityId) {
  const base = facilityId
    ? `https://www.reservecalifornia.com/park/${park.PlaceId}/${facilityId}`
    : `https://www.reservecalifornia.com/park/${park.PlaceId}`
  if (!startDate || !nights) return base
  return `${base}?date=${startDate}&night=${nights}`
}
