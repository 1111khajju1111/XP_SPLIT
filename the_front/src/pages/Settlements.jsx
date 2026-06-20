import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getGroupSettlements, getGroupMembers, createSettlement } from '../services/api'
import AppLayout from '../components/layout/AppLayout'
import MoneyRain from '../components/ui/MoneyRain'

export default function Settlements() {
  const { user, currentGroup } = useAuth()
  const { addToast } = useToast()
  const [settlements, setSettlements] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [rain, setRain] = useState(false)
  const [form, setForm] = useState({ paidByUserId: '', receivedByUserId: '', amount: '' })

  const load = async () => {
    if (!currentGroup) return
    setLoading(true)
    try {
      const [s, m] = await Promise.all([
        getGroupSettlements(currentGroup.id),
        getGroupMembers(currentGroup.id),
      ])
      setSettlements(s.data.data || [])
      setMembers(m.data.data || [])
    } catch { addToast('Failed to load settlements', 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [currentGroup?.id])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (form.paidByUserId === form.receivedByUserId) { addToast('Payer and receiver must differ', 'error'); return }
    setSaving(true)
    try {
      await createSettlement({
        groupId: currentGroup.id,
        paidByUserId: Number(form.paidByUserId),
        receivedByUserId: Number(form.receivedByUserId),
        amount: parseFloat(form.amount),
      })
      addToast('Settlement recorded!', 'success')
      setRain(true)
      setShowAdd(false)
      setForm({ paidByUserId: '', receivedByUserId: '', amount: '' })
      load()
    } catch (err) { addToast(err.response?.data?.message || 'Failed', 'error') }
    finally { setSaving(false) }
  }

  const fmt = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
  const totalSettled = settlements.reduce((s, x) => s + Number(x.amount), 0)

  if (!currentGroup) {
    return <AppLayout><EmptyGroupState /></AppLayout>
  }

  return (
    <AppLayout>
      <MoneyRain active={rain} onDone={() => setRain(false)} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="label" style={{ marginBottom: 4 }}>{currentGroup.name}</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Settlements</h1>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => setShowAdd(true)}>+ Record Settlement</button>
      </div>

      {/* Summary */}
      <div className="glass" style={{ borderRadius: 'var(--r-lg)', padding: '20px 28px', marginBottom: 24, display: 'flex', gap: 40 }}>
        <div>
          <div className="label" style={{ marginBottom: 4 }}>Total Settled</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{fmt(totalSettled)}</div>
        </div>
        <div>
          <div className="label" style={{ marginBottom: 4 }}>Transactions</div>
          <div className="stat-value">{settlements.length}</div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 70, borderRadius: 'var(--r-lg)' }} />)}
        </div>
      ) : settlements.length === 0 ? (
        <div className="glass" style={{ borderRadius: 'var(--r-lg)', padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12, opacity: 0.4 }}>⟳</div>
          <div style={{ color: 'var(--text-secondary)' }}>No settlements recorded yet</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {settlements.map(s => (
            <div key={s.id} className="glass" style={{
              borderRadius: 'var(--r-lg)', padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="avatar avatar-sm" style={{ background: `linear-gradient(135deg, ${memberColor(s.paidByUserId)})` }}>{s.paidByName?.[0]}</div>
                <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{s.paidByName}</span>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>→</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="avatar avatar-sm" style={{ background: `linear-gradient(135deg, ${memberColor(s.receivedByUserId)})` }}>{s.receivedByName?.[0]}</div>
                <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{s.receivedByName}</span>
              </div>

              <div style={{ flex: 1, fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right', paddingRight: 16 }}>
                {new Date(s.settledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>

              <span className="badge badge-success">{s.status}</span>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--success)', minWidth: 90, textAlign: 'right' }}>
                {fmt(s.amount)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Settlement Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal glass-strong">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700 }}>Record Settlement</h2>
              <button className="btn btn-glass btn-icon btn-sm" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label className="input-label">Paid By</label>
                <select className="input" value={form.paidByUserId} onChange={e => setForm(p => ({ ...p, paidByUserId: e.target.value }))} required>
                  <option value="">Select member</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Received By</label>
                <select className="input" value={form.receivedByUserId} onChange={e => setForm(p => ({ ...p, receivedByUserId: e.target.value }))} required>
                  <option value="">Select member</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Amount (₹)</label>
                <input className="input" type="number" step="0.01" min="0.01" placeholder="500.00" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-glass" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>
                  {saving ? 'Recording…' : 'Record Settlement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

function memberColor(id) {
  const palettes = ['#7C3AED, #5B21B6', '#10B981, #059669', '#F43F5E, #BE123C', '#F59E0B, #D97706', '#38BDF8, #0284C7']
  return palettes[id % palettes.length]
}

function EmptyGroupState() {
  return (
    <div style={{ textAlign: 'center', padding: '100px 0' }}>
      <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.4 }}>⟳</div>
      <div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: 8 }}>No group selected</div>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Choose a group to view settlements</div>
    </div>
  )
}
