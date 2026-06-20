import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { updateUser } from '../services/api'
import AppLayout from '../components/layout/AppLayout'

export default function Profile() {
  const { user, login } = useAuth()
  const { addToast } = useToast()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [form, setForm] = useState({
    name: user?.name || '', dob: user?.dob || '', mobile: user?.mobile || '',
  })

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const res = await updateUser(user.id, form)
      login(res.data.data)
      addToast('Profile updated!', 'success')
      setEditing(false)
    } catch (err) { addToast(err.response?.data?.message || 'Failed to update', 'error') }
    finally { setSaving(false) }
  }

  return (
    <AppLayout>
      <div style={{ marginBottom: 32 }}>
        <div className="label" style={{ marginBottom: 4 }}>Account</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Profile</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, maxWidth: 900 }}>
        {/* Avatar card */}
        <div className="glass" style={{ borderRadius: 'var(--r-lg)', padding: 32, textAlign: 'center' }}>
          <div className="avatar-lg" style={{
            width: 96, height: 96, fontSize: '2rem', margin: '0 auto 20px',
            background: 'linear-gradient(135deg, var(--accent), #5B21B6)',
            boxShadow: '0 8px 32px var(--accent-glow)',
          }}>
            {initials}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem' }}>{user?.name}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>@{user?.username}</div>
          <div className="divider" style={{ margin: '20px 0' }} />
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <DetailRow icon="✉" label={user?.email} />
            {user?.mobile && <DetailRow icon="☎" label={user.mobile} />}
            {user?.dob && <DetailRow icon="🎂" label={new Date(user.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />}
          </div>
        </div>

        {/* Edit form */}
        <div className="glass" style={{ borderRadius: 'var(--r-lg)', padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600 }}>Edit Details</h2>
            {!editing && <button className="btn btn-glass btn-sm" onClick={() => setEditing(true)}>Edit</button>}
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input className="input" type="text" value={form.name} disabled={!editing} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="input-group">
                <label className="input-label">Date of Birth</label>
                <input className="input" type="date" value={form.dob} disabled={!editing} onChange={e => setForm(p => ({ ...p, dob: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">Mobile</label>
                <input className="input" type="tel" value={form.mobile} disabled={!editing} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))} />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Username</label>
              <input className="input" type="text" value={user?.username} disabled />
            </div>
            <div className="input-group">
              <label className="input-label">Email</label>
              <input className="input" type="email" value={user?.email} disabled />
            </div>

            {editing && (
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-glass" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setEditing(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </AppLayout>
  )
}

function DetailRow({ icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
      <span style={{ opacity: 0.6 }}>{icon}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  )
}
