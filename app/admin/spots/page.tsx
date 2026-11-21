import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import AdminSpots from '@/components/AdminSpots'
import { ADMIN_COOKIE, adminEnabled, isAdmin } from '@/lib/admin'
import { designs } from '@/lib/merch'
import { getMerchInterest } from '@/lib/merch-interest'
import { getSuggestionGroups } from '@/lib/suggestions'

export const metadata: Metadata = {
  title: 'Review',
  robots: { index: false, follow: false },
}

const errors: Record<string, string> = {
  wrong: 'That password didn’t work.',
  slow: 'Too many tries. Wait an hour and try again.',
}

export default async function AdminSpotsPage({ searchParams }: PageProps<'/admin/spots'>) {
  if (!adminEnabled()) {
    return (
      <main className="page admin">
        <h1 className="cond">Review</h1>
        <p>
          Not set up yet. Add an <code>ADMIN_PASSWORD</code> environment variable in Vercel (Preview
          and Production), then redeploy.
        </p>
      </main>
    )
  }

  if (!isAdmin((await cookies()).get(ADMIN_COOKIE)?.value)) {
    const error = (await searchParams).error
    return (
      <main className="page admin">
        <h1 className="cond">Review</h1>
        <form className="admin-login" method="post" action="/api/admin/login">
          <label>
            Password
            <input type="password" name="password" autoComplete="current-password" required />
          </label>
          <button type="submit" className="btn primary">
            Log in
          </button>
          {typeof error === 'string' && errors[error] && <p role="alert">{errors[error]}</p>}
        </form>
      </main>
    )
  }

  const [groups, interest] = await Promise.all([getSuggestionGroups(), getMerchInterest()])
  return (
    <main className="page admin">
      <div className="admin-head">
        <h1 className="cond">Review</h1>
        <form method="post" action="/api/admin/logout">
          <button type="submit" className="btn">
            Log out
          </button>
        </form>
      </div>
      <AdminSpots groups={groups} />
      <section className="me-card">
        <h2 className="cond">Merch interest</h2>
        <ol className="me-rank">
          {[...designs]
            .sort((a, b) => (interest[b.id] ?? 0) - (interest[a.id] ?? 0))
            .map((design, i) => (
              <li key={design.id}>
                <span className="n cond">{i + 1}</span>
                <span>
                  {design.name} <small>({design.product})</small>
                </span>
                <small>{interest[design.id] ?? 0} want it</small>
              </li>
            ))}
        </ol>
      </section>
    </main>
  )
}
