import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import client from '../api/client'
import ErrorList from '../components/ErrorList'

export default function ResultPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  if (!state?.checkResult) {
    navigate('/configurator', { replace: true })
    return null
  }

  const { checkResult, buildPayload } = state
  const isCompatible = checkResult.is_compatible

  const saveBuild = async () => {
    setSaving(true)
    try {
      await client.post('/builds/', buildPayload)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', padding: '32px 16px',
      background: isCompatible
        ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
        : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
    }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div className="card" style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>{isCompatible ? '✅' : '❌'}</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            {isCompatible ? 'Сборка совместима!' : 'Обнаружены проблемы'}
          </h1>
          <p style={{ color: '#6b7280', fontSize: 16 }}>
            {isCompatible
              ? 'Все компоненты совместимы между собой. Вы можете сохранить сборку.'
              : 'Исправьте найденные ошибки и попробуйте снова.'}
          </p>
        </div>

        {!isCompatible && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Ошибки совместимости</h2>
            <ErrorList errors={checkResult.errors} />
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={() => navigate('/configurator')}>
            Собрать заново
          </button>
          {isCompatible && !saved && (
            <button className="btn btn-success" onClick={saveBuild} disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить сборку'}
            </button>
          )}
          {saved && (
            <button className="btn btn-primary" onClick={() => navigate('/history')}>
              Посмотреть в истории →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
