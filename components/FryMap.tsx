'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import type { Map as LeafletMap, Marker } from 'leaflet'
import { readIds, SPOTS_EVENT } from '@/lib/visitor'

export type MapSpot = {
  id: number
  name: string
  neighborhood: string
  kind: string
  lat: number
  lng: number
  /** "#3" or "New". */
  label: string
  /** Top three on the board get bigger pins. */
  podium: boolean
  isNew: boolean
  /** The fry glyph as an SVG string, drawn on the server. */
  glyph: string
  href: string
  voteHref: string
  directions: string
}

type Props = {
  center: { lat: number; lng: number }
  spots: MapSpot[]
  /** localStorage key for the visitor's checked spots. */
  beenKey: string
}

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

function pinHtml(spot: MapSpot, been: boolean) {
  const classes = ['pin', spot.podium && 'podium', spot.isNew && 'new', been && 'been']
  return `<span class="${classes.filter(Boolean).join(' ')}"><span class="head">${spot.glyph}</span><b>${escape(spot.label)}</b></span>`
}

function popupHtml(spot: MapSpot) {
  const tag = spot.isNew ? 'New on the board' : `${spot.label} in LA`
  return `<div class="map-card">
    <span class="tag${spot.podium ? ' podium' : ''}">${escape(tag)}</span>
    <strong>${escape(spot.name)}</strong>
    <small>${escape(spot.neighborhood)} · ${escape(spot.kind)}</small>
    <span class="acts">
      <a href="${escape(spot.voteHref)}">Vote on it</a>
      <a href="${escape(spot.href)}">Details</a>
      <a href="${escape(spot.directions)}" target="_blank" rel="noopener">Directions</a>
    </span>
  </div>`
}

/**
 * The city's local spots on an OpenStreetMap map: fry-shaped pins, bigger for the top three,
 * with a check on the spots the visitor has had.
 */
export default function FryMap({ center, spots, beenKey }: Props) {
  const el = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let map: LeafletMap | undefined
    let live = true
    const markers = new Map<number, Marker>()
    let redraw = () => {}

    import('leaflet').then(({ default: L }) => {
      if (!live || !el.current) return
      map = L.map(el.current, { scrollWheelZoom: false }).setView([center.lat, center.lng], 10)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)

      const icon = (spot: MapSpot, been: boolean) => {
        // A square turned 45° into a teardrop: its point sits about 1.2 sizes below the top.
        const size = spot.podium ? 52 : 42
        const tip = Math.round(size * 1.21)
        return L.divIcon({
          className: 'fry-pin',
          html: pinHtml(spot, been).replace('class="pin', `style="--size:${size}px" class="pin`),
          iconSize: [size, tip],
          iconAnchor: [size / 2, tip],
          popupAnchor: [0, -tip + 4],
        })
      }
      redraw = () => {
        const been = readIds(beenKey) ?? new Set<number>()
        for (const spot of spots) markers.get(spot.id)?.setIcon(icon(spot, been.has(spot.id)))
      }

      const been = readIds(beenKey) ?? new Set<number>()
      for (const spot of spots) {
        const marker = L.marker([spot.lat, spot.lng], {
          icon: icon(spot, been.has(spot.id)),
          title: spot.name,
          alt: spot.name,
        })
          .bindPopup(popupHtml(spot))
          .addTo(map)
        markers.set(spot.id, marker)
      }
      if (spots.length > 1) {
        map.fitBounds(L.latLngBounds(spots.map((spot) => [spot.lat, spot.lng])), {
          padding: [30, 30],
        })
      }
    })

    const onSpots = () => redraw()
    window.addEventListener(SPOTS_EVENT, onSpots)
    window.addEventListener('storage', onSpots)
    return () => {
      live = false
      window.removeEventListener(SPOTS_EVENT, onSpots)
      window.removeEventListener('storage', onSpots)
      map?.remove()
    }
  }, [center, spots, beenKey])

  return <div ref={el} className="fry-map" role="region" aria-label="Map of local spots" />
}
