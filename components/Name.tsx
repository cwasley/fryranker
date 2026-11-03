/** Lets "Checkers/Rally's" break after the slash instead of mid-word. */
export default function Name({ text }: { text: string }) {
  const parts = text.split('/')
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && (
            <>
              /<wbr />
            </>
          )}
          {part}
        </span>
      ))}
    </>
  )
}
