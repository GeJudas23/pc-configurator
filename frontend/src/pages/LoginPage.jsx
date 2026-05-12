import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [form, setForm] = useState({ login: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form)
      navigate(user.role === 'admin' ? '/admin' : '/configurator', { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 420 }}>
        <h1 style={{ textAlign: 'center', fontSize: 26, fontWeight: 800, marginBottom: 8 }}>PC Configurator</h1>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: 28 }}>Войдите в свой аккаунт</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Логин</label>
            <input className="form-input" value={form.login} onChange={e => setForm(f => ({ ...f, login: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input className="form-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          </div>
          {error && <p className="error-msg" style={{ marginBottom: 12 }}>{error}</p>}
          <button className="btn btn-primary" style={{ width: '100%', marginBottom: 16 }} disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        <p style={{ textAlign: 'center', fontSize: 14, color: '#6b7280' }}>
          Нет аккаунта? <Link to="/register" style={{ color: '#3b82f6', fontWeight: 600 }}>Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  )
}
