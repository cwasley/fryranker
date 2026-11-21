import { ADMIN_COOKIE } from '@/lib/admin'

export function POST(request: Request) {
  return new Response(null, {
    status: 303,
    headers: {
      Location: new URL('/admin/spots', request.url).toString(),
      'Set-Cookie': `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`,
    },
  })
}
