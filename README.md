# CA Campsite Availability Map

An interactive map showing real-time campsite availability across all ~112 California State Parks on [ReserveCalifornia](https://www.reservecalifornia.com).

## Features

- Plots all reservable camping parks in California on an OpenStreetMap map
- Color-coded markers: **green** = availability for your dates, **red** = fully booked
- Click a marker to see available site count, stay limits, and a link to ReserveCalifornia with your dates pre-filled
- Filter by campsite type (standard camping, hook-ups, remote, group, lodging, etc.)

## Usage

Select check-in/check-out dates and a campsite type, then click **Search**. Results reflect availability for the full requested stay.

## Running locally

```bash
npm install
npm run dev
```

## How it works

The app queries the undocumented ReserveCalifornia API (`search/place`) with a `Nights` count from the geographic center of California. A single query with `NearbyLimit: 500` returns all parks statewide. Three regional query points (Central, SoCal, NorCal) are run in parallel and deduplicated as a safety net.

No backend or API key is required — CORS is open on the ReserveCalifornia API.
