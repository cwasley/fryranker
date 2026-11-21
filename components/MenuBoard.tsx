import Link from 'next/link'
import { itemPath, type Category } from '@/lib/categories'
import type { Ranked } from '@/lib/standings'
import { votes } from '@/lib/text'
import Name from './Name'

type Props = {
  category: Category
  items: Ranked[]
  title: string
  sub?: string
  className?: string
  children?: React.ReactNode
}

export default function MenuBoard({
  category,
  items,
  title,
  sub,
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
            className={[
              !item.isNew && item.rank <= 3 && 'podium',
              !item.isNew && item.rank === 1 && 'champ',
              item.isNew && 'new',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <Link href={itemPath(category, item)}>
              <span className="n cond">{item.isNew ? 'New' : item.rank}</span>
              <span className="nm cond">
                <span>
                  <Name text={item.name} />
                </span>
              </span>
              <span className="sc cond">
                {item.score}
                <small>pts</small>
              </span>
              <span className="k">
                {item.kind} · {votes(item.battles)}
              </span>
            </Link>
          </li>
        ))}
      </ol>
      {children}
    </section>
  )
}
