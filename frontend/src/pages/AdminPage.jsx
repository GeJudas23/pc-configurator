import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import useAuthStore from '../store/authStore'

/* ─── константы ─── */
const TYPE_LABELS = {
  processor: 'Процессор',
  motherboard: 'Материнская плата',
  ram: 'ОЗУ',
  psu: 'Блок питания',
  gpu: 'Видеокарта',
}

const SOCKET_OPTIONS = ['LGA1700', 'LGA1200', 'AM5', 'AM4']
const MEMORY_OPTIONS = ['DDR4', 'DDR5']
const CERT_OPTIONS = ['', '80Plus', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Titanium']
const CERT_LABELS = {
  '': 'Без сертификата', '80Plus': '80 Plus', Bronze: '80 Plus Bronze',
  Silver: '80 Plus Silver', Gold: '80 Plus Gold',
  Platinum: '80 Plus Platinum', Titanium: '80 Plus Titanium',
}

const DETAIL_DEFAULTS = {
  processor:   { socket: 'LGA1700', tdp: 65, has_integrated_graphics: false },
  motherboard: { socket: 'LGA1700', memory_type: 'DDR4', memory_slots: 2, supports_integrated_graphics: true },
  ram:         { memory_type: 'DDR4', capacity_gb: 8, frequency_mhz: 3200 },
  psu:         { wattage: 500, efficiency_cert: 'Gold' },
  gpu:         { power_consumption: 150, power_connectors: '' },
}

/* ─── стили модального окна ─── */
const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, padding: 16,
}
const modalStyle = {
  background: '#fff', borderRadius: 16, padding: 28,
  width: '100%', maxWidth: 520,
  maxHeight: '90vh', overflowY: 'auto',
  boxShadow: '0 20px 60px rgba(0,0,0,.25)',
}

/* ─── вспомогательные компоненты ─── */
function Field({ label, children }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      {children}
    </div>
  )
}

function Select({ value, onChange, options, labelMap }) {
  return (
    <select className="form-input" value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o} value={o}>{labelMap ? labelMap[o] : o}</option>)}
    </select>
  )
}

/* ─── форма деталей по типу ─── */
function DetailFields({ type, detail, setDetail }) {
  const set = (k, v) => setDetail(d => ({ ...d, [k]: v }))

  if (type === 'processor') return (<>
    <Field label="Сокет">
      <Select value={detail.socket || 'LGA1700'} onChange={v => set('socket', v)} options={SOCKET_OPTIONS} />
    </Field>
    <Field label="TDP (Ватт)">
      <input className="form-input" type="number" min={1} value={detail.tdp ?? ''} onChange={e => set('tdp', +e.target.value)} />
    </Field>
    <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <input type="checkbox" id="igpu" checked={!!detail.has_integrated_graphics}
        onChange={e => set('has_integrated_graphics', e.target.checked)} />
      <label htmlFor="igpu" style={{ marginBottom: 0 }}>Встроенная графика</label>
    </div>
  </>)

  if (type === 'motherboard') return (<>
    <Field label="Сокет">
      <Select value={detail.socket || 'LGA1700'} onChange={v => set('socket', v)} options={SOCKET_OPTIONS} />
    </Field>
    <Field label="Тип памяти">
      <Select value={detail.memory_type || 'DDR4'} onChange={v => set('memory_type', v)} options={MEMORY_OPTIONS} />
    </Field>
    <Field label="Слотов памяти">
      <input className="form-input" type="number" min={1} max={8} value={detail.memory_slots ?? 2} onChange={e => set('memory_slots', +e.target.value)} />
    </Field>
    <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <input type="checkbox" id="sigpu" checked={!!detail.supports_integrated_graphics}
        onChange={e => set('supports_integrated_graphics', e.target.checked)} />
      <label htmlFor="sigpu" style={{ marginBottom: 0 }}>Поддержка встроенной графики</label>
    </div>
  </>)

  if (type === 'ram') return (<>
    <Field label="Тип памяти">
      <Select value={detail.memory_type || 'DDR4'} onChange={v => set('memory_type', v)} options={MEMORY_OPTIONS} />
    </Field>
    <Field label="Объём (ГБ)">
      <Select value={String(detail.capacity_gb ?? 8)} onChange={v => set('capacity_gb', +v)} options={['4','8','16','32','64']} />
    </Field>
    <Field label="Частота (МГц)">
      <input className="form-input" type="number" min={1600} value={detail.frequency_mhz ?? ''} onChange={e => set('frequency_mhz', +e.target.value)} />
    </Field>
  </>)

  if (type === 'psu') return (<>
    <Field label="Мощность (Ватт)">
      <input className="form-input" type="number" min={100} step={50} value={detail.wattage ?? ''} onChange={e => set('wattage', +e.target.value)} />
    </Field>
    <Field label="Сертификат эффективности">
      <Select value={detail.efficiency_cert ?? ''} onChange={v => set('efficiency_cert', v)} options={CERT_OPTIONS} labelMap={CERT_LABELS} />
    </Field>
  </>)

  if (type === 'gpu') return (<>
    <Field label="Потребляемая мощность (Ватт)">
      <input className="form-input" type="number" min={50} value={detail.power_consumption ?? ''} onChange={e => set('power_consumption', +e.target.value)} />
    </Field>
    <Field label="Разъёмы питания">
      <input className="form-input" value={detail.power_connectors ?? ''} onChange={e => set('power_connectors', e.target.value)} placeholder="например: 1x 16-pin" />
    </Field>
  </>)

  return null
}

/* ─── Модал компонента (добавить / редактировать) ─── */
function ComponentModal({ initial, categories, onClose, onSaved }) {
  const isEdit = !!initial

  const [base, setBase] = useState({
    component_name: initial?.component_name ?? '',
    component_type: initial?.component_type ?? 'processor',
    price_category_id: initial?.price_category?.id ?? (categories[0]?.id ?? ''),
    is_required: initial?.is_required ?? true,
  })
  const [detail, setDetail] = useState(
    initial?.details ?? DETAIL_DEFAULTS[initial?.component_type ?? 'processor']
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleTypeChange = (t) => {
    setBase(b => ({ ...b, component_type: t }))
    setDetail(DETAIL_DEFAULTS[t])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    const body = { ...base, detail_data: detail }
    try {
      if (isEdit) {
        const { data } = await client.patch(`/components/${initial.id}/`, body)
        onSaved(data, 'edit')
      } else {
        const { data } = await client.post('/components/', body)
        onSaved(data, 'add')
      }
      onClose()
    } catch (err) {
      const d = err.response?.data
      setError(d ? JSON.stringify(d) : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>{isEdit ? 'Редактировать компонент' : 'Добавить компонент'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280' }}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <Field label="Название">
            <input className="form-input" required value={base.component_name}
              onChange={e => setBase(b => ({ ...b, component_name: e.target.value }))} />
          </Field>

          <Field label="Тип компонента">
            <Select value={base.component_type} onChange={handleTypeChange}
              options={Object.keys(TYPE_LABELS)} labelMap={TYPE_LABELS} />
          </Field>

          <Field label="Ценовая категория">
            <select className="form-input" value={base.price_category_id}
              onChange={e => setBase(b => ({ ...b, price_category_id: +e.target.value }))}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
            </select>
          </Field>

          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" id="is_req" checked={base.is_required}
              onChange={e => setBase(b => ({ ...b, is_required: e.target.checked }))} />
            <label htmlFor="is_req" style={{ marginBottom: 0 }}>Обязательный компонент</label>
          </div>

          <hr style={{ margin: '16px 0', borderColor: '#e5e7eb' }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 12 }}>ХАРАКТЕРИСТИКИ</p>
          <DetailFields type={base.component_type} detail={detail} setDetail={setDetail} />

          {error && <p className="error-msg" style={{ marginBottom: 12 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Отмена</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Модал несовместимости ─── */
function IncompatModal({ components, onClose, onSaved }) {
  const [form, setForm] = useState({ component_1_id: '', component_2_id: '', reason: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.component_1_id === form.component_2_id) {
      setError('Нельзя указать один компонент дважды')
      return
    }
    setSaving(true)
    setError('')
    try {
      const { data } = await client.post('/incompatibilities/', form)
      onSaved(data)
      onClose()
    } catch (err) {
      const d = err.response?.data
      setError(d ? JSON.stringify(d) : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Добавить несовместимость</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280' }}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <Field label="Компонент 1">
            <select className="form-input" required value={form.component_1_id}
              onChange={e => setForm(f => ({ ...f, component_1_id: e.target.value }))}>
              <option value="">— Выберите компонент —</option>
              {components.map(c => <option key={c.id} value={c.id}>{c.component_name} ({TYPE_LABELS[c.component_type]})</option>)}
            </select>
          </Field>
          <Field label="Компонент 2">
            <select className="form-input" required value={form.component_2_id}
              onChange={e => setForm(f => ({ ...f, component_2_id: e.target.value }))}>
              <option value="">— Выберите компонент —</option>
              {components.map(c => <option key={c.id} value={c.id}>{c.component_name} ({TYPE_LABELS[c.component_type]})</option>)}
            </select>
          </Field>
          <Field label="Причина несовместимости">
            <textarea className="form-input" required rows={3} value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
          </Field>
          {error && <p className="error-msg" style={{ marginBottom: 12 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Отмена</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Сохранение...' : 'Добавить'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Основная страница ─── */
export default function AdminPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [components, setComponents] = useState([])
  const [incompatibilities, setIncompatibilities] = useState([])
  const [categories, setCategories] = useState([])
  const [tab, setTab] = useState('components')
  const [loading, setLoading] = useState(true)

  const [compModal, setCompModal] = useState(null) // null | 'add' | component-object
  const [incompatModal, setIncompatModal] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [comp, incompat, cats] = await Promise.all([
        client.get('/components/'),
        client.get('/incompatibilities/'),
        client.get('/categories/'),
      ])
      setComponents(comp.data)
      setIncompatibilities(incompat.data)
      setCategories(cats.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const deleteComponent = async (id) => {
    if (!window.confirm('Удалить компонент? Все связанные сборки потеряют этот компонент.')) return
    await client.delete(`/components/${id}/`)
    setComponents(prev => prev.filter(c => c.id !== id))
  }

  const deleteIncompat = async (id) => {
    if (!window.confirm('Удалить запись несовместимости?')) return
    await client.delete(`/incompatibilities/${id}/`)
    setIncompatibilities(prev => prev.filter(i => i.id !== id))
  }

  const handleCompSaved = (data, mode) => {
    if (mode === 'add') {
      setComponents(prev => [...prev, data])
    } else {
      setComponents(prev => prev.map(c => c.id === data.id ? data : c))
    }
  }

  const handleIncompatSaved = (data) => {
    setIncompatibilities(prev => [...prev, data])
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px' }}>
      {/* Header */}
      <div className="page-header">
        <h1>Панель администратора</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: '#6b7280' }}>Привет, <strong>{user?.login}</strong></span>
          <button className="btn btn-outline btn-sm" onClick={() => { logout(); navigate('/login') }}>Выйти</button>
        </div>
      </div>

      {/* Tabs + action button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['components', 'incompatibilities'].map(t => (
            <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab(t)}>
              {t === 'components' ? `Компоненты (${components.length})` : `Несовместимости (${incompatibilities.length})`}
            </button>
          ))}
        </div>
        <button
          className="btn btn-success btn-sm"
          onClick={() => tab === 'components' ? setCompModal('add') : setIncompatModal(true)}
        >
          + {tab === 'components' ? 'Добавить компонент' : 'Добавить несовместимость'}
        </button>
      </div>

      {loading ? (
        <p style={{ color: '#6b7280' }}>Загрузка...</p>
      ) : tab === 'components' ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead style={{ background: '#f3f4f6' }}>
              <tr>
                {['ID', 'Название', 'Тип', 'Категория', 'Обяз.', 'Действия'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {components.map(c => (
                <tr key={c.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 16px', color: '#9ca3af', fontSize: 12 }}>#{c.id}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 500, maxWidth: 260 }}>
                    <div>{c.component_name}</div>
                    {c.details && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                        {Object.entries(c.details)
                          .filter(([, v]) => v !== null && v !== '' && v !== false)
                          .map(([k, v]) => (
                            <span key={k} style={{ fontSize: 11, color: '#6b7280', background: '#f3f4f6', borderRadius: 4, padding: '1px 6px' }}>
                              {k}: {String(v)}
                            </span>
                          ))}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>{TYPE_LABELS[c.component_type]}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="badge badge-blue">{c.price_category?.category_name}</span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>{c.is_required ? '✓' : '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => setCompModal(c)}>Изменить</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteComponent(c.id)}>Удалить</button>
                    </div>
                  </td>
                </tr>
              ))}
              {components.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center', color: '#9ca3af' }}>Компоненты не найдены</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead style={{ background: '#f3f4f6' }}>
              <tr>
                {['Компонент 1', 'Компонент 2', 'Причина несовместимости', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {incompatibilities.map(inc => (
                <tr key={inc.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 500 }}>{inc.component_1?.component_name}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{TYPE_LABELS[inc.component_1?.component_type]}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 500 }}>{inc.component_2?.component_name}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{TYPE_LABELS[inc.component_2?.component_type]}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280', maxWidth: 320 }}>{inc.reason}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteIncompat(inc.id)}>Удалить</button>
                  </td>
                </tr>
              ))}
              {incompatibilities.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '32px 16px', textAlign: 'center', color: '#9ca3af' }}>Записей нет</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Модалки */}
      {compModal && (
        <ComponentModal
          initial={compModal === 'add' ? null : compModal}
          categories={categories}
          onClose={() => setCompModal(null)}
          onSaved={handleCompSaved}
        />
      )}
      {incompatModal && (
        <IncompatModal
          components={components}
          onClose={() => setIncompatModal(false)}
          onSaved={handleIncompatSaved}
        />
      )}
    </div>
  )
}
