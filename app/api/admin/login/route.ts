import { ADMIN_COOKIE, adminEnabled, login } from '@/lib/admin'
import { db } from '@/lib/db'
import { allow } from '@/lib/limits'

/** `POST /api/admin/login` with a form field `password`. Redirects back to /admin/spots. */
export async function POST(request: Request) {
  const back = (query = '') => new URL(`/admin/spots${query}`, request.url)
  if (!adminEnabled()) return Response.redirect(back(), 303)
  if (!(await allow(db(), request, 'admin-login', 10, '1 hour'))) {
    return Response.redirect(back('?error=slow'), 303)
  }
  const form = await request.formData().catch(() => null)
  const value = login(String(form?.get('password') ?? ''))
  if (!value) return Response.redirect(back('?error=wrong'), 303)
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : ''
  return new Response(null, {
    status: 303,
    headers: {
      Location: back().toString(),
      'Set-Cookie': `${ADMIN_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000${secure}`,
    },
  })
}
