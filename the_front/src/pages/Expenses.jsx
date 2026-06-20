import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getGroupExpenses, addExpense, deleteExpense, getGroupMembers } from '../services/api'
import AppLayout from '../components/layout/AppLayout'
import MoneyRain from '../components/ui/MoneyRain'

const CATEGORIES = ['Food', 'Travel', 'Shopping', 'Entertainment', 'Utilities', 'Rent', 'Health', 'Other']
const CAT_ICON = { Food: '🍽', Travel: '✈', Shopping: '🛍', Entertainment: '🎬', Utilities: '⚡', Rent: '🏠', Health: '💊', Other: '💳' }

export default function Expenses() {
  const { user, currentGroup } = useAuth()
  const { addToast } = useToast()
  const [expenses, setExpenses] = useState([])
  const [members, setMembers]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [rain, setRain]         = useState(false)
  const [filterCat, setFilterCat] = useState('All')

  const [form, setForm] = useState({
    expenseName: '', amount: '', category: 'Food',
    expenseDate: new Date().toISOString().slice(0, 10),
    paidByUserId: '', includedMemberIds: [],
  })

  const load = async () => {
    if (!currentGroup) return
    setLoading(true)
    try {
      const [exp, mem] = await Promise.all([
        getGroupExpenses(currentGroup.id),
        getGroupMembers(currentGroup.id),
      ])
      setExpenses(exp.data.data || [])
      setMembers(mem.data.data || [])
    } catch { addToast('Failed to load expenses', 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [currentGroup?.id])

  useEffect(() => {
    if (members.length && !form.paidByUserId) {
      setForm(p => ({ ...p, paidByUserId: user.id, includedMemberIds: members.map(m => m.id) }))
    }
  }, [members])

  const toggleMember = (id) => {
    setForm(p => ({
      ...p,
      includedMemberIds: p.includedMemberIds.includes(id)
        ? p.includedMemberIds.filter(x => x !== id)
        : [...p.includedMemberIds, id],
    }))
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (form.includedMemberIds.length === 0) { addToast('Select at least one member', 'error'); return }
    setSaving(true)
    try {
      await addExpense({
        expenseName: form.expenseName,
        amount: parseFloat(form.amount),
        category: form.category,
        expenseDate: form.expenseDate,
        paidByUserId: Number(form.paidByUserId),
        groupId: currentGroup.id,
        includedMemberIds: form.includedMemberIds,
      })
      addToast('Expense added!', 'success')
      setRain(true)
      setShowAdd(false)
      setForm(p => ({ ...p, expenseName: '', amount: '', category: 'Food' }))
      load()
    } catch (err) { addToast(err.response?.data?.message || 'Failed to add expense', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return
    try {
      await deleteExpense(id)
      addToast('Expense deleted', 'success'); load()
    } catch { addToast('Failed to delete', 'error') }
  }

  const fmt = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
  const filtered = filterCat === 'All' ? expenses : expenses.filter(e => e.category === filterCat)
  const total = filtered.reduce((s, e) => s + Number(e.amount), 0)

  if (!currentGroup) {
    return (
      <AppLayout>
        <EmptyGroupState />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <MoneyRain active={rain} onDone={() => setRain(false)} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="label" style={{ marginBottom: 4 }}>{currentGroup.name}</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Expenses</h1>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => setShowAdd(true)}>+ Add Expense</button>
      </div>

      {/* Filter pills + total */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['All', ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setFilterCat(c)} className="btn btn-sm" style={{
              background: filterCat === c ? 'var(--accent-dim)' : 'var(--glass-1)',
              border: `1px solid ${filterCat === c ? 'rgba(124,58,237,0.3)' : 'var(--glass-border)'}`,
              color: filterCat === c ? 'var(--accent-light)' : 'var(--text-secondary)',
            }}>
              {c !== 'All' && CAT_ICON[c]} {c}
            </button>
          ))}
        </div>
        <div className="glass" style={{ padding: '8px 18px', borderRadius: 'var(--r-md)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total: </span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>{fmt(total)}</span>
        </div>
      </div>

      {/* Expense list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 76, borderRadius: 'var(--r-lg)' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass" style={{ borderRadius: 'var(--r-lg)', padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12, opacity: 0.4 }}>⊞</div>
          <div style={{ color: 'var(--text-secondary)' }}>No expenses found</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(exp => (
            <div key={exp.id} className="glass" style={{
              borderRadius: 'var(--r-lg)', padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 16,
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--glass-border-h)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
            >
              <div style={{
                width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                background: 'var(--accent-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.3rem',
              }}>{CAT_ICON[exp.category] || '💳'}</div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{exp.expenseName}</span>
                  <span className="badge badge-muted">{exp.category}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Paid by <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{exp.paidByName}</span> · {exp.expenseDate} · split {exp.includedMembers?.length} ways
                </div>
              </div>

              <div style={{ display: 'flex', marginRight: 8 }}>
                {exp.includedMembers?.slice(0, 4).map((m, i) => (
                  <div key={m.id} className="avatar avatar-sm" style={{
                    marginLeft: i > 0 ? -10 : 0, border: '2px solid var(--bg-surface)',
                    fontSize: '0.65rem', background: `linear-gradient(135deg, ${memberColor(m.id)})`,
                  }}>{m.name?.[0]}</div>
                ))}
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 90 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem' }}>{fmt(exp.amount)}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{fmt(exp.sharePerMember)}/person</div>
              </div>

              <button
                className="btn btn-glass btn-icon btn-sm"
                style={{ color: 'var(--danger)', opacity: 0.7 }}
                onClick={() => handleDelete(exp.id)}
                title="Delete"
              >✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Add Expense Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal glass-strong" style={{ maxWidth: 560 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700 }}>Add Expense</h2>
              <button className="btn btn-glass btn-icon btn-sm" onClick={() => setShowAdd(false)}>✕</button>
            </div>

            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label className="input-label">Expense Name</label>
                <input className="input" type="text" placeholder="Dinner at Olive Garden" value={form.expenseName} onChange={e => setForm(p => ({ ...p, expenseName: e.target.value }))} required autoFocus />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="input-group">
                  <label className="input-label">Amount (₹)</label>
                  <input className="input" type="number" step="0.01" min="0.01" placeholder="1000.00" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Date</label>
                  <input className="input" type="date" value={form.expenseDate} onChange={e => setForm(p => ({ ...p, expenseDate: e.target.value }))} />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Category</label>
                <select className="input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICON[c]} {c}</option>)}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Paid By</label>
                <select className="input" value={form.paidByUserId} onChange={e => setForm(p => ({ ...p, paidByUserId: e.target.value }))} required>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}{m.id === user.id ? ' (You)' : ''}</option>)}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Split Between ({form.includedMemberIds.length} selected)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {members.map(m => {
                    const selected = form.includedMemberIds.includes(m.id)
                    return (
                      <button
                        type="button" key={m.id}
                        onClick={() => toggleMember(m.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '6px 12px 6px 6px', borderRadius: 'var(--r-full)',
                          border: `1px solid ${selected ? 'var(--accent)' : 'var(--glass-border)'}`,
                          background: selected ? 'var(--accent-dim)' : 'var(--glass-1)',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        <div className="avatar avatar-sm" style={{ background: `linear-gradient(135deg, ${memberColor(m.id)})` }}>{m.name?.[0]}</div>
                        <span style={{ fontSize: '0.8rem', color: selected ? 'var(--accent-light)' : 'var(--text-secondary)', fontWeight: selected ? 600 : 400 }}>
                          {m.name}
                        </span>
                        {selected && <span style={{ color: 'var(--accent-light)' }}>✓</span>}
                      </button>
                    )
                  })}
                </div>
                {form.amount && form.includedMemberIds.length > 0 && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    Each pays ₹{(parseFloat(form.amount || 0) / form.includedMemberIds.length).toFixed(2)}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-glass" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>
                  {saving ? 'Adding…' : 'Add Expense'}
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
      <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.4 }}>◈</div>
      <div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: 8 }}>No group selected</div>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Choose or create a group to manage expenses</div>
    </div>
  )
}
