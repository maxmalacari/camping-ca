import { useState } from 'react'
import './SearchForm.css'

const UNIT_CATEGORIES = [
  { id: 1,    label: 'Camping (all)' },
  { id: 1015, label: 'Hook-up Camping' },
  { id: 1014, label: 'Remote Camping' },
  { id: 1016, label: 'Equestrian' },
  { id: 2,    label: 'Group Camping' },
  { id: 1008, label: 'Lodging' },
]

function today() {
  return new Date().toISOString().slice(0, 10)
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export default function SearchForm({ onSearch, loading }) {
  const [startDate, setStartDate] = useState(addDays(today(), 7))
  const [endDate, setEndDate]     = useState(addDays(today(), 9))
  const [unitCategoryId, setUnitCategoryId] = useState(1)

  function handleSubmit(e) {
    e.preventDefault()
    onSearch({ startDate, endDate, unitCategoryId })
  }

  // Keep endDate >= startDate
  function handleStartChange(val) {
    setStartDate(val)
    if (val >= endDate) setEndDate(addDays(val, 1))
  }

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <label>
        <span>Check-in</span>
        <input
          type="date"
          value={startDate}
          min={today()}
          onChange={e => handleStartChange(e.target.value)}
          required
        />
      </label>
      <label>
        <span>Check-out</span>
        <input
          type="date"
          value={endDate}
          min={addDays(startDate, 1)}
          onChange={e => setEndDate(e.target.value)}
          required
        />
      </label>
      <label>
        <span>Type</span>
        <select value={unitCategoryId} onChange={e => setUnitCategoryId(Number(e.target.value))}>
          {UNIT_CATEGORIES.map(c => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={loading}>
        {loading ? 'Searching…' : 'Search'}
      </button>
    </form>
  )
}
