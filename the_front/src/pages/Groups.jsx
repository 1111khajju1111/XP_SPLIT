import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getUserGroups, createGroup, joinGroup, leaveGroup, deleteGroup, regenInviteCode } from '../services/api'
import AppLayout from '../components/layout/AppLayout'

export default function Groups() {
  const { user, selectGroup, currentGroup } = useAuth()
  const { addToast } = useToast()
  const [groups, setGroups]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin]   = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', description: '' })
  const [joinCode, setJoinCode]   = useState('')
  const [saving, setSaving]       = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await getUserGroups(user.id)
      setGroups(res.data.data || [])
    } catch { addToast('Failed to load groups', 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (user) load() }, [user])

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await createGroup({ name: createForm.name, description: createForm.description, createdByUserId: user.id })
      addToast('Group created!', 'success')
      setShowCreate(false); setCreateForm({ name: '', description: '' })
      load()
    } catch (err) { addToast(err.response?.data?.message || 'Failed to create', 'error') }
    finally { setSaving(false) }
  }

  const handleJoin = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await joinGroup({ inviteCode: joinCode, userId: user.id })
      addToast('Joined group!', 'success')
      setShowJoin(false); setJoinCode('')
      load()
    } catch (err) { addToast(err.response?.data?.message || 'Invalid code', 'error') }
    finally { setSaving(false) }
  }

  const handleLeave = async (g) => {
    if (!confirm(`Leave "${g.name}"?`)) return
    try {
      await leaveGroup(g.id, user.id)
      addToast('Left group', 'success'); load()
    } catch (err) { addToast(err.response?.data?.message || 'Failed', 'error') }
  }

  const handleDelete = async (g) => {
    if (!confirm(`Delete "${g.name}" permanently?`)) return
    try {
      await deleteGroup(g.id, user.id)
      addToast('Group deleted', 'success'); load()
    } catch (err) { addToast(err.response?.data?.message || 'Failed', 'error') }
  }

  const handleRegen = async (g) => {
    try {
      const res = await regenInviteCode(g.id, user.id)
      addToast(`New code: ${res.data.data.inviteCode}`, 'info'); load()
    } catch (err) { addToast('Failed to regenerate', 'error') }
  }

  const copyCode = (code) => {
    navigator.clipboard.writeText(code)
    addToast('Invite code copied!', 'success')
  }

  return (
    <AppLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <div className="label" style={{ marginBottom: 4 }}>Manage</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Groups</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-glass" onClick={() => setShowJoin(true)}>Join Group</button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Group</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 'var(--r-lg)' }} />)}
        </div>
      ) : groups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.4 }}>◈</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: 8 }}>No groups yet</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 28 }}>Create one or join with an invite code</div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create your first group</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20 }}>
          {groups.map(g => {
            const isOwner = g.createdByUserId === user.id
            const isActive = currentGroup?.id === g.id
            return (
              <div key={g.id} className="glass" style={{
                borderRadius: 'var(--r-lg)', padding: 24,
                borderColor: isActive ? 'var(--accent)' : 'var(--glass-border)',
                boxShadow: isActive ? '0 0 0 1px var(--accent), var(--shadow-card)' : 'var(--shadow-card)',
                transition: 'all 0.2s',
                display: 'flex', flexDirection: 'column', gap: 16,
              }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: `linear-gradient(135deg, ${groupColor(g.id)})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1rem', fontWeight: 700,
                        color: '#fff', flexShrink: 0,
                      }}>
                        {g.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem' }}>{g.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>by {g.createdByName}</div>
                      </div>
                    </div>
                    {g.description && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>{g.description}</div>}
                  </div>
                  {isActive && <span className="badge badge-accent">Active</span>}
                  {isOwner && !isActive && <span className="badge badge-muted">Owner</span>}
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: 0, background: 'var(--glass-1)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                  {[
                    { label: 'Members', val: g.memberCount },
                    { label: 'Expenses', val: g.expenseCount },
                  ].map((s, i) => (
                    <div key={i} style={{ flex: 1, padding: '10px 14px', borderRight: i === 0 ? '1px solid var(--glass-border)' : 'none' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem' }}>{s.val}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Invite code */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'var(--glass-1)', borderRadius: 'var(--r-md)',
                  padding: '8px 12px', border: '1px solid var(--glass-border)',
                }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flex: 1 }}>
                    Code: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-accent)', letterSpacing: '0.1em' }}>{g.inviteCode}</span>
                  </span>
                  <button className="btn btn-glass btn-sm" style={{ padding: '4px 10px', fontSize: '0.72rem' }} onClick={() => copyCode(g.inviteCode)}>Copy</button>
                  {isOwner && (
                    <button className="btn btn-glass btn-sm" style={{ padding: '4px 10px', fontSize: '0.72rem' }} onClick={() => handleRegen(g)}>↻</button>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => selectGroup(g)}
                  >
                    {isActive ? '✓ Selected' : 'Select'}
                  </button>
                  {!isOwner ? (
                    <button className="btn btn-danger btn-sm" onClick={() => handleLeave(g)}>Leave</button>
                  ) : (
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(g)}>Delete</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal glass-strong">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700 }}>New Group</h2>
              <button className="btn btn-glass btn-icon btn-sm" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label className="input-label">Group Name</label>
                <input className="input" type="text" placeholder="Weekend Trip, Flat Mates…" value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} required autoFocus />
              </div>
              <div className="input-group">
                <label className="input-label">Description (optional)</label>
                <input className="input" type="text" placeholder="What's this group for?" value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-glass" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>
                  {saving ? 'Creating…' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Modal */}
      {showJoin && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowJoin(false)}>
          <div className="modal glass-strong">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700 }}>Join a Group</h2>
              <button className="btn btn-glass btn-icon btn-sm" onClick={() => setShowJoin(false)}>✕</button>
            </div>
            <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label className="input-label">Invite Code</label>
                <input
                  className="input" type="text"
                  placeholder="Enter 8-character code"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  style={{ fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '0.15em', textAlign: 'center' }}
                  maxLength={8} required autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-glass" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowJoin(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>
                  {saving ? 'Joining…' : 'Join Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

function groupColor(id) {
  const palettes = [
    '#7C3AED, #5B21B6', '#10B981, #059669',
    '#F43F5E, #BE123C', '#F59E0B, #D97706',
    '#38BDF8, #0284C7', '#A78BFA, #7C3AED',
  ]
  return palettes[id % palettes.length]
}
