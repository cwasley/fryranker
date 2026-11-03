export default function Chips({ tags, spicy }: { tags: string[]; spicy: RegExp }) {
  return (
    <span className="chips">
      {tags.map((tag) => (
        <span key={tag} className={`chip${spicy.test(tag) ? ' red' : ''}`}>
          {tag}
        </span>
      ))}
    </span>
  )
}
