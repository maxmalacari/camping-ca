import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { buildReserveUrl, nightsBetween } from '../api'
import './CampMap.css'

// California bounds for initial view
const CA_CENTER = [37.5, -119.5]
const CA_ZOOM = 6

function ParkMarkers({ parks, search }) {
  const nights = search ? nightsBetween(search.startDate, search.endDate) : null

  return parks.map(park => {
    const available = park.Available
    const partial   = park.PartialAvailable && !available
    const color = available ? '#38a169' : partial ? '#d69e2e' : '#e53e3e'
    const fillColor = available ? '#68d391' : partial ? '#f6e05e' : '#fc8181'
    const url = buildReserveUrl(park, search?.startDate, nights)

    // Count total available sites across all facilities
    const siteCount = park.AvailableUnitCount || 0

    return (
      <CircleMarker
        key={park.PlaceId}
        center={[park.Latitude, park.Longitude]}
        radius={available ? 9 : 6}
        pathOptions={{
          color,
          fillColor,
          fillOpacity: 0.85,
          weight: 2,
        }}
      >
        <Popup className="park-popup">
          <div className="popup-inner">
            <div className="popup-name">{park.Name}</div>
            {available ? (
              <div className="popup-available">
                {siteCount > 0
                  ? `${siteCount} site${siteCount !== 1 ? 's' : ''} available`
                  : 'Sites available'}
              </div>
            ) : (
              <div className="popup-unavailable">No availability</div>
            )}
            {park.Restrictions && (
              <div className="popup-meta">
                Stay: {park.Restrictions.MinimumStay}–{park.Restrictions.MaximumStay} nights
              </div>
            )}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="popup-link"
            >
              View on ReserveCalifornia →
            </a>
          </div>
        </Popup>
      </CircleMarker>
    )
  })
}

export default function CampMap({ parks, loading, search }) {
  return (
    <div className="map-wrapper">
      <MapContainer
        center={CA_CENTER}
        zoom={CA_ZOOM}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ParkMarkers parks={parks} search={search} />
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
            <span className="legend-dot available" />
            Available
          </div>
          <div className="legend-item">
            <span className="legend-dot unavailable" />
            Fully booked
          </div>
        </div>
      )}
    </div>
  )
}
