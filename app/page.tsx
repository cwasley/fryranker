import RankerPage, { rankerMetadata } from '@/components/RankerPage'
import { categories } from '@/lib/categories'

export const revalidate = 300

export const generateMetadata = () => rankerMetadata(categories.fries)

export default function Home() {
  return <RankerPage category={categories.fries} />
}
