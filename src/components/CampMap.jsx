import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { buildReserveUrl, nightsBetween } from '../api'
import './CampMap.css'

const CA_CENTER = [37.5, -119.5]
const CA_ZOOM = 6

function PopupContent({ park, search, nights, facilities }) {
  // facilities: undefined = not yet fetched, null = fetch failed, [] = no results, [...] = loaded
  const available = park.Available
  const parkUrl   = buildReserveUrl(park, search?.startDate, nights)

  return (
    <div className="popup-body">
      <div className="popup-name">{park.Name}</div>

      {!search ? (
        <div className="popup-hint">Search for dates to see availability.</div>
      ) : facilities === undefined ? (
        <div className="popup-loading">
          <span className="popup-spinner" /> Loading facilities…
        </div>
      ) : facilities === null || facilities.length === 0 ? (
        <div className={available ? 'popup-available' : 'popup-unavailable'}>
          {available ? 'Sites available' : 'No availability'}
        </div>
      ) : (
        <div className="popup-facilities">
          {[...facilities]
            .sort((a, b) => b.Available - a.Available)
            .map(f => {
              const url = buildReserveUrl(park, search.startDate, nights, f.FacilityId)
              return (
                <div key={f.FacilityId} className={`facility-row ${f.Available ? 'avail' : 'unavail'}`}>
                  <span className="facility-dot" />
                  <span className="facility-name">{f.Name}</span>
                  {f.Available && (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="facility-book">
                      Book →
                    </a>
                  )}
                </div>
              )
            })}
        </div>
      )}

      <div className="popup-footer">
        {park.Restrictions && (
          <span className="popup-meta">
            Stay: {park.Restrictions.MinimumStay}–{park.Restrictions.MaximumStay} nights
          </span>
        )}
        <a href={parkUrl} target="_blank" rel="noopener noreferrer" className="popup-park-link">
          View all campgrounds →
        </a>
      </div>
    </div>
  )
}

function ParkMarkers({ parks, search, facilitiesMap }) {
  const nights = search ? nightsBetween(search.startDate, search.endDate) : null

  return parks.map(park => {
    const available = park.Available
    const partial   = park.PartialAvailable && !available
    const color     = available ? '#38a169' : partial ? '#d69e2e' : '#e53e3e'
    const fillColor = available ? '#68d391' : partial ? '#f6e05e' : '#fc8181'
    // undefined = not fetched yet (only available parks get prefetched)
    const facilities = facilitiesMap[park.PlaceId]

    return (
      <CircleMarker
        key={park.PlaceId}
        center={[park.Latitude, park.Longitude]}
        radius={available ? 9 : 6}
        pathOptions={{ color, fillColor, fillOpacity: 0.85, weight: 2 }}
      >
        <Popup className="park-popup" maxWidth={320} minWidth={260}>
          <PopupContent
            park={park}
            search={search}
            nights={nights}
            facilities={facilities}
          />
        </Popup>
      </CircleMarker>
    )
  })
}

export default function CampMap({ parks, loading, search, facilitiesMap }) {
  return (
    <div className="map-wrapper">
      <MapContainer
        center={CA_CENTER}
        zoom={CA_ZOOM}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ParkMarkers parks={parks} search={search} facilitiesMap={facilitiesMap} />
      </MapContainer>

      {loading && (
        <div className="loading-overlay">
          <div className="spinner" />
          Fetching availability…
        </div>
      )}

      {parks.length > 0 && (
        <div className="map-legend">
          <div className="legend-item">
            <span className="legend-dot available" />Available
          </div>
          <div className="legend-item">
            <span className="legend-dot unavailable" />Fully booked
          </div>
        </div>
      )}
    </div>
  )
}
