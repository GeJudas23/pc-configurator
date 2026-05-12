export default function ErrorList({ errors }) {
  if (!errors || errors.length === 0) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {errors.map((err, i) => (
        <div key={i} style={{
          background: '#fee2e2', border: '1px solid #fca5a5',
          borderRadius: 10, padding: '16px 20px',
        }}>
          <p style={{ fontWeight: 600, color: '#b91c1c', marginBottom: 6 }}>{err.message}</p>
          <p style={{ fontSize: 14, color: '#7f1d1d' }}>💡 {err.recommendation}</p>
        </div>
      ))}
    </div>
  )
}
