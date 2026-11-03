export default function Barcode() {
  return (
    <div className="barcode" aria-hidden>
      {Array.from({ length: 34 }, (_, i) => (
        <i key={i} style={{ height: `${40 + ((i * 37) % 60)}%` }} />
      ))}
    </div>
  )
}
