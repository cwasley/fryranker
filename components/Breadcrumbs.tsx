import Link from 'next/link'
import JsonLd from './JsonLd'
import { absoluteUrl } from '@/lib/site'

type Crumb = { name: string; href: string }

export default function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <ol>
          {trail.map((crumb, i) => (
            <li key={crumb.href}>
              {i === trail.length - 1 ? (
                <span aria-current="page">{crumb.name}</span>
              ) : (
                <Link href={crumb.href}>{crumb.name}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: trail.map((crumb, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: crumb.name,
            item: absoluteUrl(crumb.href),
          })),
        }}
      />
    </>
  )
}
