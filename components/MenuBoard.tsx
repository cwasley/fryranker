import Link from 'next/link'
import { itemPath, type Category } from '@/lib/categories'
import type { Ranked } from '@/lib/standings'
import { formatCount } from '@/lib/text'
import Name from './Name'

type Props = {
  category: Category
  items: Ranked[]
  title: string
  sub?: string
  compact?: boolean
  className?: string
  children?: React.ReactNode
}

export default function MenuBoard({
  category,
  items,
  title,
  sub,
  compact,
  className = '',
  children,
}: Props) {
  return (
    <section className={`board ${className}`}>
      <h2 className="cond">{title}</h2>
      {sub && <p className="sub">{sub}</p>}
      <ol>
        {items.map((item) => (
          <li
            key={item.id}
            className={[item.rank <= 3 && 'podium', item.rank === 1 && 'champ']
              .filter(Boolean)
              .join(' ')}
          >
            <Link href={itemPath(category, item)}>
              <span className="n cond">{item.rank}</span>
              <span className="nm cond">
                <span>
                  <Name text={item.name} />
                </span>
              </span>
              <span className="sc cond">
                {item.score}
                {!compact && <small>pts</small>}
              </span>
              {!compact && (
                <span className="k">
                  {item.kind} · {formatCount(item.battles)} votes
                </span>
              )}
            </Link>
          </li>
        ))}
      </ol>
      {children}
    </section>
  )
}
