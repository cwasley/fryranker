import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * A tiny admin login for /admin: one shared password in ADMIN_PASSWORD (a Vercel environment
 * variable; never committed). Logging in sets an httpOnly cookie holding an HMAC of the password,
 * so changing the password logs everyone out.
 */
export const ADMIN_COOKIE = 'fr_admin'

export const adminEnabled = () => Boolean(process.env.ADMIN_PASSWORD)

const token = (password: string) =>
  createHmac('sha256', password).update('fryranker-admin-v1').digest('hex')

const same = (a: string, b: string) => {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

/** The cookie value for a correct password, or null. */
export function login(password: string) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected || !same(password, expected)) return null
  return token(expected)
}

export function isAdmin(cookieValue: string | undefined) {
  const expected = process.env.ADMIN_PASSWORD
  return Boolean(expected && cookieValue && same(cookieValue, token(expected)))
}

/** Reads the admin cookie from a request's Cookie header (for route handlers). */
export function adminFromRequest(request: Request) {
  const header = request.headers.get('cookie') ?? ''
  const value = header
    .split(';')
    .map((part) => part.trim().split('='))
    .find(([name]) => name === ADMIN_COOKIE)?.[1]
  return isAdmin(value)
}
