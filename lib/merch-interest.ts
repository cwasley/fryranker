import { db } from './db'

/** "Want this?" counts by design id. */
export async function getMerchInterest(): Promise<Record<string, number>> {
  const rows = (await db()`SELECT design, count FROM merch_interest`) as {
    design: string
    count: number
  }[]
  return Object.fromEntries(rows.map((row) => [row.design, row.count]))
}
