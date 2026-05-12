const categoryColors = {
  'Бюджетная': 'badge-green',
  'Средняя': 'badge-blue',
  'Премиум': 'badge-purple',
}

export default function ComponentCard({ component, selected, onSelect }) {
  const categoryName = component.price_category?.category_name || ''
  return (
    <div
      onClick={onSelect}
      style={{
        background: '#fff',
        border: `2px solid ${selected ? '#3b82f6' : '#e5e7eb'}`,
        borderRadius: 12,
        padding: '16px 20px',
        cursor: 'pointer',
        transition: 'border-color .15s, box-shadow .15s',
        boxShadow: selected ? '0 0 0 3px #dbeafe' : 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={{ fontWeight: 600, fontSize: 15, flex: 1 }}>{component.component_name}</p>
        {categoryName && (
          <span className={`badge ${categoryColors[categoryName] || 'badge-blue'}`} style={{ marginLeft: 8 }}>
            {categoryName}
          </span>
        )}
      </div>
      {component.details && (
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {Object.entries(component.details).map(([k, v]) => (
            <span key={k} style={{ fontSize: 12, color: '#6b7280', background: '#f3f4f6', borderRadius: 6, padding: '2px 8px' }}>
              {k}: {String(v)}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

