import { useState } from 'react'
import CampMap from './components/CampMap'
import SearchForm from './components/SearchForm'
import { searchParks } from './api'
import './App.css'

export default function App() {
  const [parks, setParks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)
  const [lastSearch, setLastSearch] = useState(null)

  async function handleSearch({ startDate, endDate, unitCategoryId }) {
    setLoading(true)
    setError(null)
    try {
      const results = await searchParks({ startDate, endDate, unitCategoryId })
      setParks(results)
      setLastSearch({ startDate, endDate })
      setSearched(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const available = parks.filter(p => p.Available)
  const unavailable = parks.filter(p => !p.Available)

  return (
    <div className="app">
      <header className="header">
        <h1>CA Campsite Availability</h1>
        <SearchForm onSearch={handleSearch} loading={loading} />
      </header>

      {error && (
        <div className="error-banner">
          Error: {error}
        </div>
      )}

      {searched && !loading && (
        <div className="stats-bar">
          <span className="stat available">{available.length} parks with availability</span>
          <span className="stat-sep">·</span>
          <span className="stat unavailable">{unavailable.length} fully booked</span>
          <span className="stat-sep">·</span>
          <span className="stat">{parks.length} total</span>
        </div>
      )}

      <div className="map-container">
        <CampMap parks={parks} loading={loading} search={lastSearch} />
      </div>
    </div>
  )
}
