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
  gpu:         'Видеокарта',
}
const SLOT_ENDPOINTS = {
  processor:   'processors',
  motherboard: 'motherboards',
  ram:         'ram',
  psu:         'psus',
  gpu:         'gpus',
}

function computeCompatible(allOptions, selected, incompatibilities) {
  const proc = allOptions.processor?.find(p => String(p.id) === String(selected.processor))
  const mb   = allOptions.motherboard?.find(m => String(m.id) === String(selected.motherboard))
  const gpu  = allOptions.gpu?.find(g => String(g.id) === String(selected.gpu))

  const incompatPairs = new Set(
    incompatibilities.flatMap(inc => [
      `${inc.component_1.id}:${inc.component_2.id}`,
      `${inc.component_2.id}:${inc.component_1.id}`,
    ])
  )
  const selectedCompIds = [
    proc?.component.id, mb?.component.id,
    allOptions.ram?.find(r => String(r.id) === String(selected.ram))?.component.id,
    allOptions.psu?.find(p => String(p.id) === String(selected.psu))?.component.id,
    gpu?.component.id,
  ].filter(Boolean)

  const blocked = (compId) => selectedCompIds.some(sid => incompatPairs.has(`${sid}:${compId}`))
  const minWatts = (proc?.tdp || 0) + (gpu?.power_consumption || 0) + 100

  return {
    processor:   (allOptions.processor   || []).filter(p => (!mb  || p.socket     === mb.socket)      && !blocked(p.component.id)),
    motherboard: (allOptions.motherboard || []).filter(m => (!proc || m.socket     === proc.socket)    && !blocked(m.component.id)),
    ram:         (allOptions.ram         || []).filter(r => (!mb  || r.memory_type === mb.memory_type) && !blocked(r.component.id)),
    psu:         (allOptions.psu         || []).filter(p => ((!proc && !gpu) || p.wattage >= minWatts) && !blocked(p.component.id)),
    gpu:         (allOptions.gpu         || []).filter(g => !blocked(g.component.id)),
    _minWatts: minWatts,
  }
}

const FILTER_HINTS = {
  processor:   (sel, all) => { const m = all.motherboard?.find(m => String(m.id) === String(sel.motherboard)); return m ? `Сокет ${m.socket} (по материнской плате)` : null },
  motherboard: (sel, all) => { const p = all.processor?.find(p => String(p.id) === String(sel.processor));   return p ? `Сокет ${p.socket} (по процессору)` : null },
  ram:         (sel, all) => { const m = all.motherboard?.find(m => String(m.id) === String(sel.motherboard)); return m ? `${m.memory_type} (по материнской плате)` : null },
  psu: (sel, all) => {
    const p = all.processor?.find(p => String(p.id) === String(sel.processor))
    const g = all.gpu?.find(g => String(g.id) === String(sel.gpu))
    if (!p && !g) return null
    const min = (p?.tdp || 0) + (g?.power_consumption || 0) + 100
    return `Мин. ${min}W${p ? ` (CPU ${p.tdp}W` : ''}${g ? ` + GPU ${g.power_consumption}W` : ''}${p || g ? ' + 100W)' : ''}`
  },
  gpu: () => null,
}

/* Генерирует до maxCount полностью совместимых сборок.
   Случайная выборка: быстрее находит разнообразные комбинации. */
function generateBuilds(filteredOptions, selected, maxCount = 9) {
  const { processor: procs = [], motherboard: mbs = [], ram: rams = [], psu: psus = [], gpu: gpus = [] } = filteredOptions
  if (!procs.length || !mbs.length || !rams.length || !psus.length) return []

  const rnd  = arr => arr[Math.floor(Math.random() * arr.length)]
  const byId = (arr, id) => arr.filter(x => String(x.id) === String(id))
  const sh   = arr => [...arr].sort(() => Math.random() - 0.5)

  // Закреплённые слоты — только выбранный элемент; свободные — перемешанный массив
  const procPool = selected.processor   ? byId(procs, selected.processor)   : sh(procs)
  const mbPool   = selected.motherboard ? byId(mbs,   selected.motherboard) : sh(mbs)
  const ramPool  = selected.ram         ? byId(rams,  selected.ram)         : sh(rams)
  const psuPool  = selected.psu         ? byId(psus,  selected.psu)         : sh(psus)
  const gpuPool  = selected.gpu         ? byId(gpus,  selected.gpu)         : sh(gpus)

  const builds = []
  const seen = new Set()
  const MAX_TRIES = 400

  for (let i = 0; i < MAX_TRIES && builds.length < maxCount; i++) {
    const proc = rnd(procPool)

    const compatMbs = mbPool.filter(m => m.socket === proc.socket)
    if (!compatMbs.length) continue
    const mb = rnd(compatMbs)

    const compatRams = ramPool.filter(r => r.memory_type === mb.memory_type)
    if (!compatRams.length) continue
    const ram = rnd(compatRams)

    const minW = proc.tdp + 100
    const compatPsus = psuPool.filter(p => p.wattage >= minW)
    if (!compatPsus.length) continue
    const psu = rnd(compatPsus)

    // GPU: 75% шанс включить; если выбран конкретный — обязателен
    let gpu = null
    if (selected.gpu) {
      const g = gpuPool[0]
      gpu = g && psu.wattage >= proc.tdp + g.power_consumption + 100 ? g : null
    } else if (gpuPool.length && Math.random() > 0.25) {
      const compatGpus = gpuPool.filter(g => psu.wattage >= proc.tdp + g.power_consumption + 100)
      if (compatGpus.length) gpu = rnd(compatGpus)
    }

    const key = `${proc.id}-${mb.id}-${ram.id}-${psu.id}-${gpu?.id ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)

    builds.push({ proc, mb, ram, psu, gpu })
  }

  return builds
}

function BuildCard({ build, onSelect, isActive }) {
  const { proc, mb, ram, psu, gpu } = build
  const type = gpu
    ? { label: 'Игровая',  color: '#7c3aed', bg: '#ede9fe' }
    : proc.tdp >= 100
    ? { label: 'Рабочая',  color: '#b45309', bg: '#fef3c7' }
    : { label: 'Офисная',  color: '#047857', bg: '#d1fae5' }

  const rows = [
    { key: 'cpu', name: proc.component.component_name, spec: `${proc.socket} · ${proc.tdp}W TDP` },
    { key: 'mb',  name: mb.component.component_name,   spec: `${mb.socket} · ${mb.memory_type}` },
    { key: 'ram', name: ram.component.component_name,  spec: `${ram.capacity_gb} ГБ · ${ram.frequency_mhz} МГц` },
    { key: 'psu', name: psu.component.component_name,  spec: `${psu.wattage}W · ${psu.efficiency_cert}` },
    ...(gpu ? [{ key: 'gpu', name: gpu.component.component_name, spec: `${gpu.power_consumption}W` }] : []),
  ]

  return (
    <div
      onClick={onSelect}
      style={{
        background: isActive ? '#eff6ff' : '#fff',
        border: `1.5px solid ${isActive ? '#3b82f6' : '#e5e7eb'}`,
        borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
        transition: 'box-shadow .15s, border-color .15s',
        boxShadow: isActive ? '0 0 0 3px #dbeafe' : 'none',
      }}
      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(59,130,246,.12)' } }}
      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none' } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: type.color, background: type.bg, borderRadius: 6, padding: '2px 8px' }}>
          {type.label}
        </span>
        <span style={{ fontSize: 10, color: '#9ca3af' }}>{gpu ? 'дискр. GPU' : 'iGPU'}</span>
      </div>

      {rows.map(row => (
        <div key={row.key} style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {row.name}
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>{row.spec}</div>
        </div>
      ))}

      <button
        style={{
          marginTop: 8, width: '100%', padding: '6px 0',
          background: isActive ? '#10b981' : '#3b82f6',
          color: '#fff', border: 'none', borderRadius: 8,
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}
      >
        {isActive ? '✓ Выбрана' : 'Применить →'}
      </button>
    </div>
  )
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
  const [suggestedBuilds, setSuggestedBuilds] = useState([])

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

  const filtered = useMemo(
    () => computeCompatible(allOptions, selected, incompatibilities),
    [allOptions, selected, incompatibilities]
  )

  // Пересчитываем предложения при смене фильтрованных вариантов
  useEffect(() => {
    setSuggestedBuilds(generateBuilds(filtered, selected))
  }, [filtered]) // filtered меняется вместе с selected

  const handleSelect = (slot, value) => {
    setSelected(prev => {
      const next = { ...prev, [slot]: value }
      const f = computeCompatible(allOptions, next, incompatibilities)
      for (const s of Object.keys(SLOT_ENDPOINTS)) {
        if (s !== slot && next[s]) {
          if (!(f[s] || []).some(o => String(o.id) === String(next[s]))) next[s] = ''
        }
      }
      return next
    })
    setCheckResult(null)
  }

  const applyBuild = (build) => {
    setSelected({
      processor:   String(build.proc.id),
      motherboard: String(build.mb.id),
      ram:         String(build.ram.id),
      psu:         String(build.psu.id),
      gpu:         build.gpu ? String(build.gpu.id) : '',
    })
    setCheckResult(null)
  }

  const isBuildActive = (build) =>
    String(build.proc.id) === String(selected.processor) &&
    String(build.mb.id)   === String(selected.motherboard) &&
    String(build.ram.id)  === String(selected.ram) &&
    String(build.psu.id)  === String(selected.psu) &&
    String(build.gpu?.id || '') === String(selected.gpu || '')

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
    <div className="card"><p style={{ color: '#6b7280' }}>Загрузка компонентов...</p></div>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, alignItems: 'start' }}>

      {/* ── Левая колонка: форма ── */}
      <div className="card" style={{ position: 'sticky', top: 24, minWidth: 0, width: '100%' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Быстрая сборка</h2>
        <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 20 }}>
          Выбор компонента фильтрует остальные по совместимости.
        </p>

        <div style={{ display: 'grid', gap: 16 }}>
          {Object.entries(SLOT_LABELS).map(([slot, label]) => {
            const items = filtered[slot] || []
            const total = (allOptions[slot] || []).length
            const isOptional = slot === 'gpu'
            const hint = FILTER_HINTS[slot]?.(selected, allOptions)

            return (
              <div key={slot}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>
                    {label}
                    {isOptional && <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400, marginLeft: 4 }}>(необяз.)</span>}
                  </label>
                  {items.length < total && (
                    <span style={{ fontSize: 10, color: '#3b82f6', fontWeight: 600 }}>{items.length}/{total}</span>
                  )}
                </div>
                <select
                  className="form-input"
                  value={selected[slot] || ''}
                  onChange={e => handleSelect(slot, e.target.value)}
                  style={{ fontSize: 13, borderColor: selected[slot] ? '#10b981' : undefined, maxWidth: '100%', width: '100%' }}
                >
                  <option value="">{isOptional ? '— Без GPU (iGPU) —' : '— Выберите —'}</option>
                  {items.map(item => {
                    const name = item.component.component_name
                    const specs = [
                      item.socket,
                      item.tdp           && `${item.tdp}W`,
                      item.memory_type,
                      item.capacity_gb   && `${item.capacity_gb}ГБ`,
                      item.wattage       && `${item.wattage}W`,
                      item.power_consumption && `${item.power_consumption}W`,
                    ].filter(Boolean).join('·')
                    return (
                      <option key={item.id} value={item.id}>
                        {name.length > 30 ? name.slice(0, 29) + '…' : name}{specs ? ` (${specs})` : ''}
                      </option>
                    )
                  })}
                </select>
                {hint && <p style={{ fontSize: 11, color: '#3b82f6', marginTop: 3 }}>⚡ {hint}</p>}
                {items.length === 0 && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>Нет совместимых вариантов</p>}
              </div>
            )
          })}
        </div>

        <button
          className="btn btn-success"
          disabled={!canCheck || checking}
          onClick={handleCheck}
          style={{ marginTop: 20, width: '100%' }}
        >
          {checking ? 'Проверяем...' : '⚡ Проверить совместимость'}
        </button>

        {checkResult && (
          <div style={{
            marginTop: 16, padding: '14px 16px', borderRadius: 10,
            background: checkResult.is_compatible ? '#d1fae5' : '#fee2e2',
            border: `1px solid ${checkResult.is_compatible ? '#6ee7b7' : '#fca5a5'}`,
          }}>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: checkResult.is_compatible ? 0 : 10 }}>
              {checkResult.is_compatible ? '✅ Совместимо!' : '❌ Ошибки совместимости'}
            </p>
            {!checkResult.is_compatible && <ErrorList errors={checkResult.errors} />}
            {checkResult.is_compatible && (
              <button className="btn btn-success btn-sm" style={{ marginTop: 8, width: '100%' }}
                onClick={() => navigate('/result', { state: { checkResult, buildPayload } })}>
                Сохранить сборку →
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Правая колонка: предложения сборок ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <span style={{ fontSize: 16, fontWeight: 700 }}>Доступные сборки</span>
            <span style={{
              marginLeft: 8, fontSize: 12, fontWeight: 600, color: '#3b82f6',
              background: '#eff6ff', borderRadius: 20, padding: '2px 10px',
            }}>
              {suggestedBuilds.length}
            </span>
          </div>
          <button
            onClick={() => setSuggestedBuilds(generateBuilds(filtered, selected))}
            style={{
              background: 'none', border: '1.5px solid #e5e7eb', borderRadius: 8,
              cursor: 'pointer', fontSize: 13, color: '#6b7280', padding: '4px 12px',
              fontFamily: 'var(--font)',
            }}
          >
            ⟳ Обновить
          </button>
        </div>

        {suggestedBuilds.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <p style={{ color: '#9ca3af', fontSize: 14 }}>Нет подходящих сборок для текущего выбора</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {suggestedBuilds.map((build, i) => (
              <BuildCard
                key={i}
                build={build}
                onSelect={() => applyBuild(build)}
                isActive={isBuildActive(build)}
              />
            ))}
          </div>
        )}
      </div>

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
      <div style={{ maxWidth: mode === 'quick' ? 1280 : 720, margin: '0 auto' }}>
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
