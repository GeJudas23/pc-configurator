import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import useAuthStore from '../store/authStore'
import ErrorList from '../components/ErrorList'

/* ═══════════════════════════════════════
   ПОШАГОВЫЙ WIZARD (оригинал)
═══════════════════════════════════════ */
const STEPS = [
  { key: 'category',    label: 'Категория',         endpoint: null },
  { key: 'processor',   label: 'Процессор',          endpoint: 'processors' },
  { key: 'motherboard', label: 'Мат. плата',         endpoint: 'motherboards' },
  { key: 'ram',         label: 'ОЗУ',                endpoint: 'ram' },
  { key: 'psu',         label: 'Блок питания',       endpoint: 'psus' },
  { key: 'gpu',         label: 'Видеокарта',         endpoint: 'gpus', optional: true },
]

const tagStyle = { fontSize: 12, color: '#6b7280', background: '#f3f4f6', borderRadius: 6, padding: '2px 8px' }

function WizardMode({ navigate }) {
  const [stepIdx, setStepIdx] = useState(0)
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => { client.get('/categories/').then(r => setCategories(r.data)) }, [])

  useEffect(() => {
    if (stepIdx === 0 || !selected.category) return
    const step = STEPS[stepIdx]
    if (!step.endpoint) return
    setLoading(true)
    client.get(`/${step.endpoint}/?category=${selected.category}`)
      .then(r => setItems(r.data))
      .finally(() => setLoading(false))
  }, [stepIdx, selected.category])

  const handleCategorySelect = (cat) => { setSelected({ category: cat.id }); setStepIdx(1) }
  const handleItemSelect = (item) => setSelected(prev => ({ ...prev, [STEPS[stepIdx].key]: item.id }))
  const handleNext = () => { setItems([]); setStepIdx(s => s + 1) }
  const submitBuild = async (sel) => {
    const payload = {
      processor_id: sel.processor, motherboard_id: sel.motherboard,
      ram_id: sel.ram, psu_id: sel.psu, gpu_id: sel.gpu || null,
      price_category_id: sel.category,
    }
    const { data } = await client.post('/compatibility/check/', payload)
    navigate('/result', { state: { checkResult: data, buildPayload: payload } })
  }

  const step = STEPS[stepIdx]
  const currentSelection = selected[step.key]

  return (
    <>
      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, flexWrap: 'wrap' }}>
        {STEPS.map((s, i) => (
          <div key={s.key} style={{
            flex: 1, minWidth: 60, textAlign: 'center', fontSize: 11, fontWeight: 600,
            padding: '6px 4px', borderRadius: 8,
            background: i < stepIdx ? '#10b981' : i === stepIdx ? '#3b82f6' : '#e5e7eb',
            color: i <= stepIdx ? '#fff' : '#6b7280',
          }}>{s.label}</div>
        ))}
      </div>

      <div className="card">
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
          {stepIdx === 0 ? 'Выберите ценовую категорию' : `Шаг ${stepIdx}: ${step.label}`}
        </h2>

        {stepIdx === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {categories.map(cat => (
              <div key={cat.id} onClick={() => handleCategorySelect(cat)} style={{
                padding: '20px 24px', border: '2px solid #e5e7eb', borderRadius: 12, cursor: 'pointer',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
              >
                <p style={{ fontWeight: 700, fontSize: 17 }}>{cat.category_name}</p>
                <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
                  {cat.min_price.toLocaleString()} ₽{cat.max_price ? ` — ${cat.max_price.toLocaleString()} ₽` : '+'} · {cat.description}
                </p>
              </div>
            ))}
          </div>
        ) : loading ? <p style={{ color: '#6b7280' }}>Загрузка...</p> : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {items.map(item => (
                <div key={item.id} onClick={() => handleItemSelect(item)} style={{
                  padding: '14px 18px',
                  border: `2px solid ${currentSelection === item.id ? '#3b82f6' : '#e5e7eb'}`,
                  borderRadius: 12, cursor: 'pointer', background: '#fff',
                  boxShadow: currentSelection === item.id ? '0 0 0 3px #dbeafe' : 'none',
                }}>
                  <p style={{ fontWeight: 600 }}>{item.component.component_name}</p>
                  <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {item.socket && <span style={tagStyle}>Сокет: {item.socket}</span>}
                    {item.tdp && <span style={tagStyle}>TDP: {item.tdp}W</span>}
                    {item.memory_type && <span style={tagStyle}>{item.memory_type}</span>}
                    {item.capacity_gb && <span style={tagStyle}>{item.capacity_gb} ГБ</span>}
                    {item.frequency_mhz && <span style={tagStyle}>{item.frequency_mhz} МГц</span>}
                    {item.wattage && <span style={tagStyle}>{item.wattage} W</span>}
                    {item.power_consumption && <span style={tagStyle}>{item.power_consumption}W</span>}
                  </div>
                </div>
              ))}
              {items.length === 0 && <p style={{ color: '#9ca3af' }}>Нет компонентов в выбранной категории.</p>}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              {step.optional && (
                <button className="btn btn-outline" onClick={() => submitBuild({ ...selected, gpu: null })}>
                  Пропустить (iGPU)
                </button>
              )}
              {stepIdx < STEPS.length - 1 ? (
                <button className="btn btn-primary" disabled={!currentSelection} onClick={handleNext}>Далее →</button>
              ) : (
                <button className="btn btn-success" disabled={!currentSelection} onClick={() => submitBuild(selected)}>
                  Проверить совместимость
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}

/* ═══════════════════════════════════════
   БЫСТРАЯ СБОРКА — каскадная фильтрация
═══════════════════════════════════════ */
const SLOT_LABELS = {
  processor:   'Процессор',
  motherboard: 'Материнская плата',
  ram:         'Оперативная память',
  psu:         'Блок питания',
  gpu:         'Видеокарта (необязательно)',
}
const SLOT_ENDPOINTS = {
  processor:   'processors',
  motherboard: 'motherboards',
  ram:         'ram',
  psu:         'psus',
  gpu:         'gpus',
}

/* Вычисляет совместимые варианты для каждого слота
   на основе текущего состояния выбора */
function computeCompatible(allOptions, selected, incompatibilities) {
  const proc = allOptions.processor?.find(p => String(p.id) === String(selected.processor))
  const mb   = allOptions.motherboard?.find(m => String(m.id) === String(selected.motherboard))
  const gpu  = allOptions.gpu?.find(g => String(g.id) === String(selected.gpu))

  // Индекс явных несовместимостей: "compId1:compId2"
  const incompatPairs = new Set(
    incompatibilities.flatMap(inc => [
      `${inc.component_1.id}:${inc.component_2.id}`,
      `${inc.component_2.id}:${inc.component_1.id}`,
    ])
  )

  // ID компонентов уже выбранных позиций
  const selectedCompIds = [
    proc?.component.id,
    mb?.component.id,
    allOptions.ram?.find(r => String(r.id) === String(selected.ram))?.component.id,
    allOptions.psu?.find(p => String(p.id) === String(selected.psu))?.component.id,
    gpu?.component.id,
  ].filter(Boolean)

  const blocked = (compId) =>
    selectedCompIds.some(sid => incompatPairs.has(`${sid}:${compId}`))

  const minWatts = (proc?.tdp || 0) + (gpu?.power_consumption || 0) + 100

  return {
    processor:   (allOptions.processor   || [])
      .filter(p => !mb  || p.socket     === mb.socket)
      .filter(p => !blocked(p.component.id)),

    motherboard: (allOptions.motherboard || [])
      .filter(m => !proc || m.socket     === proc.socket)
      .filter(m => !blocked(m.component.id)),

    ram:         (allOptions.ram         || [])
      .filter(r => !mb  || r.memory_type === mb.memory_type)
      .filter(r => !blocked(r.component.id)),

    psu:         (allOptions.psu         || [])
      .filter(p => (!proc && !gpu) || p.wattage >= minWatts)
      .filter(p => !blocked(p.component.id)),

    gpu:         (allOptions.gpu         || [])
      .filter(g => !blocked(g.component.id)),

    _minWatts: minWatts,
  }
}

/* Подсказки под каждым дропдауном, поясняющие активный фильтр */
const FILTER_HINTS = {
  processor: (sel, all) => {
    const mb = all.motherboard?.find(m => String(m.id) === String(sel.motherboard))
    return mb ? `Сокет ${mb.socket} — совместимо с выбранной материнской платой` : null
  },
  motherboard: (sel, all) => {
    const proc = all.processor?.find(p => String(p.id) === String(sel.processor))
    return proc ? `Сокет ${proc.socket} — совместимо с выбранным процессором` : null
  },
  ram: (sel, all) => {
    const mb = all.motherboard?.find(m => String(m.id) === String(sel.motherboard))
    return mb ? `Тип памяти ${mb.memory_type} — совместимо с выбранной материнской платой` : null
  },
  psu: (sel, all) => {
    const proc = all.processor?.find(p => String(p.id) === String(sel.processor))
    const gpu  = all.gpu?.find(g => String(g.id) === String(sel.gpu))
    if (!proc && !gpu) return null
    const parts = []
    if (proc) parts.push(`CPU ${proc.tdp}W`)
    if (gpu)  parts.push(`GPU ${gpu.power_consumption}W`)
    parts.push('запас 100W')
    return `Минимум ${(proc?.tdp || 0) + (gpu?.power_consumption || 0) + 100}W (${parts.join(' + ')})`
  },
  gpu: () => null,
}

function QuickMode({ navigate }) {
  const [allOptions, setAllOptions] = useState({})
  const [incompatibilities, setIncompatibilities] = useState([])
  const [categories, setCategories] = useState([])
  const [selected, setSelected] = useState({})
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [checkResult, setCheckResult] = useState(null)
  const [buildPayload, setBuildPayload] = useState(null)

  useEffect(() => {
    Promise.all([
      ...Object.entries(SLOT_ENDPOINTS).map(([slot, ep]) =>
        client.get(`/${ep}/`).then(r => [slot, r.data])
      ),
      client.get('/incompatibilities/').then(r => ['_incompat', r.data]),
      client.get('/categories/').then(r => ['_cats', r.data]),
    ]).then(all => {
      setAllOptions(Object.fromEntries(all.filter(([k]) => !k.startsWith('_'))))
      setIncompatibilities(all.find(([k]) => k === '_incompat')[1])
      setCategories(all.find(([k]) => k === '_cats')[1])
    }).finally(() => setLoading(false))
  }, [])

  // Пересчитываем совместимые варианты при каждом изменении выбора
  const filtered = useMemo(
    () => computeCompatible(allOptions, selected, incompatibilities),
    [allOptions, selected, incompatibilities]
  )

  const handleSelect = (slot, value) => {
    setSelected(prev => {
      const next = { ...prev, [slot]: value }
      // Снимаем выбор с позиций, которые больше не входят в отфильтрованный список
      const f = computeCompatible(allOptions, next, incompatibilities)
      for (const s of Object.keys(SLOT_ENDPOINTS)) {
        if (s !== slot && next[s]) {
          const still = (f[s] || []).some(o => String(o.id) === String(next[s]))
          if (!still) next[s] = ''
        }
      }
      return next
    })
    setCheckResult(null)
  }

  const handleCheck = async () => {
    setChecking(true)
    setCheckResult(null)
    const procItem = allOptions.processor?.find(p => String(p.id) === String(selected.processor))
    const catId = procItem?.component?.price_category?.id || categories[0]?.id
    const payload = {
      processor_id:      +selected.processor,
      motherboard_id:    +selected.motherboard,
      ram_id:            +selected.ram,
      psu_id:            +selected.psu,
      gpu_id:            selected.gpu ? +selected.gpu : null,
      price_category_id: +catId,
    }
    try {
      const { data } = await client.post('/compatibility/check/', payload)
      setCheckResult(data)
      setBuildPayload(payload)
    } finally {
      setChecking(false)
    }
  }

  const canCheck = selected.processor && selected.motherboard && selected.ram && selected.psu

  if (loading) return (
    <div className="card">
      <p style={{ color: '#6b7280' }}>Загрузка компонентов...</p>
    </div>
  )

  return (
    <div className="card">
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Быстрая сборка</h2>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
        Выберите любой компонент — остальные автоматически отфильтруются по совместимости.
      </p>

      <div style={{ display: 'grid', gap: 20 }}>
        {Object.entries(SLOT_LABELS).map(([slot, label]) => {
          const items = filtered[slot] || []
          const total = (allOptions[slot] || []).length
          const isOptional = slot === 'gpu'
          const hint = FILTER_HINTS[slot]?.(selected, allOptions)
          const isFiltered = items.length < total

          return (
            <div key={slot}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <label style={{ fontSize: 14, fontWeight: 600 }}>
                  {label}
                  {isOptional && (
                    <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 400, marginLeft: 6 }}>
                      (iGPU — можно пропустить)
                    </span>
                  )}
                </label>
                {isFiltered && total > 0 && (
                  <span style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600 }}>
                    {items.length} из {total}
                  </span>
                )}
              </div>

              <select
                className="form-input"
                value={selected[slot] || ''}
                onChange={e => handleSelect(slot, e.target.value)}
                style={{ borderColor: selected[slot] ? '#10b981' : undefined }}
              >
                <option value="">{isOptional ? '— Без видеокарты (iGPU) —' : '— Выберите —'}</option>
                {items.map(item => {
                  const specs = [
                    item.socket        && item.socket,
                    item.tdp           && `TDP ${item.tdp}W`,
                    item.memory_type   && item.memory_type,
                    item.capacity_gb   && `${item.capacity_gb} ГБ`,
                    item.frequency_mhz && `${item.frequency_mhz} МГц`,
                    item.wattage       && `${item.wattage}W`,
                    item.power_consumption && `${item.power_consumption}W`,
                  ].filter(Boolean).join(' · ')
                  return (
                    <option key={item.id} value={item.id}>
                      {item.component.component_name}{specs ? ` — ${specs}` : ''}
                    </option>
                  )
                })}
              </select>

              {hint && (
                <p style={{ fontSize: 12, color: '#3b82f6', marginTop: 4 }}>
                  ⚡ {hint}
                </p>
              )}
              {items.length === 0 && (
                <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>
                  Нет совместимых вариантов для текущего выбора
                </p>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-success" disabled={!canCheck || checking} onClick={handleCheck}>
          {checking ? 'Проверяем...' : '⚡ Проверить совместимость'}
        </button>
      </div>

      {checkResult && (
        <div style={{
          marginTop: 24, padding: '20px 24px', borderRadius: 12,
          background: checkResult.is_compatible ? '#d1fae5' : '#fee2e2',
          border: `1px solid ${checkResult.is_compatible ? '#6ee7b7' : '#fca5a5'}`,
        }}>
          <p style={{ fontWeight: 700, fontSize: 18, marginBottom: checkResult.is_compatible ? 0 : 16 }}>
            {checkResult.is_compatible ? '✅ Компоненты совместимы!' : '❌ Обнаружены ошибки'}
          </p>
          {!checkResult.is_compatible && <ErrorList errors={checkResult.errors} />}
          {checkResult.is_compatible && (
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-success btn-sm"
                onClick={() => navigate('/result', { state: { checkResult, buildPayload } })}>
                Сохранить сборку →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════
   ОБЁРТКА — переключатель режимов
═══════════════════════════════════════ */
export default function ConfiguratorPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [mode, setMode] = useState('quick') // 'wizard' | 'quick'

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      padding: '32px 16px',
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Конфигуратор ПК</h1>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/history')}>История</button>
            <button className="btn btn-outline btn-sm" onClick={() => { logout(); navigate('/login') }}>Выйти</button>
          </div>
        </div>

        {/* Переключатель режимов */}
        <div style={{
          display: 'flex', gap: 0, marginBottom: 24,
          background: '#fff', borderRadius: 10, padding: 4,
          boxShadow: '0 1px 4px rgba(0,0,0,.08)', width: 'fit-content',
        }}>
          {[
            { key: 'quick',  label: '⚡ Быстрая сборка' },
            { key: 'wizard', label: '🧭 Пошаговый wizard' },
          ].map(m => (
            <button key={m.key} onClick={() => setMode(m.key)} style={{
              padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font)', fontWeight: 600, fontSize: 14, transition: 'all .15s',
              background: mode === m.key ? '#3b82f6' : 'transparent',
              color: mode === m.key ? '#fff' : '#6b7280',
            }}>
              {m.label}
            </button>
          ))}
        </div>

        {mode === 'quick'
          ? <QuickMode navigate={navigate} />
          : <WizardMode navigate={navigate} />
        }
      </div>
    </div>
  )
}
