import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import useAuthStore from '../store/authStore'

export default function HistoryPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [builds, setBuilds] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client.get('/builds/')
      .then(r => setBuilds(r.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 16px' }}>
      <div className="page-header">
        <h1>Мои сборки</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/configurator')}>Новая сборка</button>
          <button className="btn btn-outline btn-sm" onClick={() => { logout(); navigate('/login') }}>Выйти</button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#6b7280' }}>Загрузка...</p>
      ) : builds.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ fontSize: 18, color: '#6b7280', marginBottom: 16 }}>У вас пока нет сохранённых сборок</p>
          <button className="btn btn-primary" onClick={() => navigate('/configurator')}>Собрать конфигурацию</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {builds.map(b => (
            <div key={b.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>Сборка #{b.id}</span>
                  <span className={`badge ${b.is_compatible ? 'badge-green' : 'badge-red'}`} style={{ marginLeft: 10 }}>
                    {b.is_compatible ? 'Совместима' : 'Ошибки'}
                  </span>
                </div>
                <span style={{ fontSize: 13, color: '#9ca3af' }}>
                  {new Date(b.created_at).toLocaleString('ru-RU')}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 14 }}>
                {[
                  ['Процессор', b.processor?.component?.component_name],
                  ['Материнская плата', b.motherboard?.component?.component_name],
                  ['Оперативная память', b.ram?.component?.component_name],
                  ['Блок питания', b.psu?.component?.component_name],
                  ['Видеокарта', b.gpu?.component?.component_name || '—'],
                  ['Категория', b.price_category?.category_name],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span style={{ color: '#6b7280' }}>{label}: </span>
                    <span style={{ fontWeight: 500 }}>{value || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
