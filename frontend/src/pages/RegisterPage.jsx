import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuthStore()
  const [form, setForm] = useState({ login: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Пароли не совпадают')
      return
    }
    setLoading(true)
    try {
      const user = await register({ login: form.login, password: form.password })
      navigate(user.role === 'admin' ? '/admin' : '/configurator', { replace: true })
    } catch (err) {
      const data = err.response?.data
      setError(data?.login?.[0] || data?.password?.[0] || 'Ошибка регистрации')
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
        <h1 style={{ textAlign: 'center', fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Регистрация</h1>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: 28 }}>Создайте аккаунт пользователя</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Логин</label>
            <input className="form-input" value={form.login} onChange={e => setForm(f => ({ ...f, login: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input className="form-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label>Повторите пароль</label>
            <input className="form-input" type="password" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} required />
          </div>
          {error && <p className="error-msg" style={{ marginBottom: 12 }}>{error}</p>}
          <button className="btn btn-primary" style={{ width: '100%', marginBottom: 16 }} disabled={loading}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        <p style={{ textAlign: 'center', fontSize: 14, color: '#6b7280' }}>
          Уже есть аккаунт? <Link to="/login" style={{ color: '#3b82f6', fontWeight: 600 }}>Войти</Link>
        </p>
      </div>
    </div>
  )
}
