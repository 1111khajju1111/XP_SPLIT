import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { loginUser, registerUser } from '../services/api'

export default function AuthPage() {
  const [mode, setMode]     = useState('login') // 'login' | 'register'
  const [loading, setLoading] = useState(false)
  const [form, setForm]     = useState({
    name: '', username: '', email: '', password: '',
    dob: '', mobile: '', usernameOrEmail: '',
  })
  const { login } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await loginUser({ usernameOrEmail: form.usernameOrEmail, password: form.password })
      login(res.data.data)
      addToast('Welcome back!', 'success')
      navigate('/dashboard')
    } catch (err) {
      addToast(err.response?.data?.message || 'Login failed', 'error')
    } finally { setLoading(false) }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await registerUser({
        name: form.name, username: form.username,
        email: form.email, password: form.password,
        dob: form.dob || null, mobile: form.mobile || null,
      })
      login(res.data.data)
      addToast('Account created!', 'success')
      navigate('/dashboard')
    } catch (err) {
      addToast(err.response?.data?.message || 'Registration failed', 'error')
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
      background: 'var(--bg-void)',
    }}>
      {/* Aurora */}
      <div className="aurora-bg"><div className="aurora-orb3" /></div>
      <div className="noise-overlay" />

      {/* Auth card */}
      <div className="glass-strong" style={{
        width: '100%', maxWidth: 440,
        borderRadius: 'var(--r-xl)',
        padding: '44px 40px',
        position: 'relative', zIndex: 2,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, var(--accent), #5B21B6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', boxShadow: '0 8px 32px var(--accent-glow)',
          }}>✂</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            XP_SPLIT
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4 }}>
            {mode === 'login' ? 'Welcome back' : 'Start splitting expenses'}
          </div>
        </div>

        {/* Mode toggle */}
        <div style={{
          display: 'flex', padding: 4, gap: 4,
          background: 'var(--glass-1)', borderRadius: 'var(--r-md)',
          border: '1px solid var(--glass-border)', marginBottom: 28,
        }}>
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: '9px 0',
              border: 'none', cursor: 'pointer',
              borderRadius: 'calc(var(--r-md) - 2px)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem', fontWeight: mode === m ? 600 : 400,
              color: mode === m ? '#fff' : 'var(--text-secondary)',
              background: mode === m ? 'linear-gradient(135deg, var(--accent), #5B21B6)' : 'transparent',
              transition: 'all 0.2s',
              boxShadow: mode === m ? '0 2px 12px var(--accent-glow)' : 'none',
            }}>
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <label className="input-label">Username or Email</label>
              <input
                className="input"
                type="text"
                placeholder="john or john@example.com"
                value={form.usernameOrEmail}
                onChange={e => set('usernameOrEmail', e.target.value)}
                required autoFocus
              />
            </div>
            <div className="input-group">
              <label className="input-label">Password</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={loading}
              style={{ marginTop: 8, justifyContent: 'center' }}
            >
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input className="input" type="text" placeholder="John Doe" value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
              <div className="input-group">
                <label className="input-label">Username</label>
                <input className="input" type="text" placeholder="johndoe" value={form.username} onChange={e => set('username', e.target.value)} required />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Email</label>
              <input className="input" type="email" placeholder="john@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div className="input-group">
              <label className="input-label">Password</label>
              <input className="input" type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="input-group">
                <label className="input-label">Date of Birth</label>
                <input className="input" type="date" value={form.dob} onChange={e => set('dob', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Mobile</label>
                <input className="input" type="tel" placeholder="+91 98765…" value={form.mobile} onChange={e => set('mobile', e.target.value)} />
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={loading}
              style={{ marginTop: 8, justifyContent: 'center' }}
            >
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          By continuing, you agree to split expenses fairly ✌
        </div>
      </div>
    </div>
  )
}
