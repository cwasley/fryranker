import { db } from './db'

export type SuggestionGroup = {
  key: string
  city: string
  name: string
  status: 'pending' | 'approved'
  count: number
  ids: number[]
  kinds: string[]
  neighborhood: string | null
  address: string | null
  placeId: string | null
  notes: string[]
  latest: string
}

/** Pending and approved suggestions, grouped by city and name, most-suggested first. */
export async function getSuggestionGroups(): Promise<SuggestionGroup[]> {
  const rows = (await db()`
    SELECT city, LOWER(name) AS key, MIN(name) AS name, status, COUNT(*)::int AS count,
           ARRAY_AGG(id ORDER BY id) AS ids, ARRAY_AGG(DISTINCT kind) AS kinds,
           MAX(neighborhood) AS neighborhood, MAX(address) AS address,
           MAX(place_id) AS place_id, ARRAY_REMOVE(ARRAY_AGG(note), NULL) AS notes,
           MAX(created_at)::text AS latest
    FROM spot_suggestions
    WHERE status IN ('pending', 'approved')
    GROUP BY city, LOWER(name), status
    ORDER BY status DESC, count DESC, latest DESC
  `) as (Omit<SuggestionGroup, 'placeId' | 'ids'> & { place_id: string | null; ids: string[] })[]
  return rows.map(({ place_id, ids, ...row }) => ({
    ...row,
    key: `${row.city}:${row.key}:${row.status}`,
    placeId: place_id,
    ids: ids.map(Number),
  }))
}
