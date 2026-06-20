import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getGroupBalances, createSettlement } from '../services/api'
import AppLayout from '../components/layout/AppLayout'
import MoneyRain from '../components/ui/MoneyRain'

export default function Balances() {
  const { user, currentGroup } = useAuth()
  const { addToast } = useToast()
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [settling, setSettling] = useState(null)
  const [rain, setRain] = useState(false)

  const load = async () => {
    if (!currentGroup) return
    setLoading(true)
    try {
      const res = await getGroupBalances(currentGroup.id)
      setBalance(res.data.data)
    } catch { addToast('Failed to load balances', 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [currentGroup?.id])

  const handleSettle = async (s) => {
    setSettling(`${s.fromUserId}-${s.toUserId}`)
    try {
      await createSettlement({
        groupId: currentGroup.id,
        paidByUserId: s.fromUserId,
        receivedByUserId: s.toUserId,
        amount: s.amount,
      })
      addToast('Settlement recorded!', 'success')
      setRain(true)
      load()
    } catch (err) { addToast(err.response?.data?.message || 'Failed to settle', 'error') }
    finally { setSettling(null) }
  }

  const fmt = (n) => `₹${Math.abs(Number(n)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

  if (!currentGroup) {
    return <AppLayout><EmptyGroupState /></AppLayout>
  }

  return (
    <AppLayout>
      <MoneyRain active={rain} onDone={() => setRain(false)} />

      <div style={{ marginBottom: 32 }}>
        <div className="label" style={{ marginBottom: 4 }}>{currentGroup.name}</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Balances</h1>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="skeleton" style={{ height: 300, borderRadius: 'var(--r-lg)' }} />
          <div className="skeleton" style={{ height: 300, borderRadius: 'var(--r-lg)' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 24, alignItems: 'start' }}>

          {/* Member balances */}
          <div className="glass" style={{ borderRadius: 'var(--r-lg)', padding: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, marginBottom: 20 }}>Member Balances</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {balance?.memberBalances?.map(m => {
                const isYou = m.userId === user.id
                const positive = m.netBalance > 0
                const zero = Math.abs(m.netBalance) < 0.01
                return (
                  <div key={m.userId} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '16px 18px', borderRadius: 'var(--r-md)',
                    background: 'var(--glass-1)', border: '1px solid var(--glass-border)',
                  }}>
                    <div className="avatar" style={{ background: `linear-gradient(135deg, ${memberColor(m.userId)})` }}>
                      {m.userName?.[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {m.userName}{isYou && <span className="badge badge-accent" style={{ fontSize: '0.6rem' }}>YOU</span>}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        Paid {fmt(m.totalPaid)} · Owes {fmt(m.totalOwed)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem',
                        color: zero ? 'var(--text-muted)' : positive ? 'var(--success)' : 'var(--danger)',
                      }}>
                        {zero ? '—' : positive ? `+${fmt(m.netBalance)}` : `-${fmt(m.netBalance)}`}
                      </div>
                      <span className={`badge ${zero ? 'badge-muted' : positive ? 'badge-success' : 'badge-danger'}`} style={{ marginTop: 4 }}>
                        {zero ? 'Settled' : positive ? 'Gets back' : 'Owes'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Summary bar */}
            <div className="divider" style={{ margin: '20px 0' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <SummaryStat label="Total Spend" value={fmt(balance?.totalGroupSpending)} />
              <SummaryStat label="Members" value={balance?.totalMembers} />
              <SummaryStat label="Expenses" value={balance?.totalExpenses} />
            </div>
          </div>

          {/* Settlement suggestions */}
          <div className="glass-strong" style={{ borderRadius: 'var(--r-lg)', padding: 24, position: 'sticky', top: 0 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, marginBottom: 6 }}>Suggested Settlements</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 20 }}>
              Minimum transactions to settle everyone up
            </p>

            {balance?.settlementSuggestions?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🎉</div>
                <div style={{ color: 'var(--success)', fontWeight: 600 }}>Everyone is settled up!</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {balance?.settlementSuggestions?.map((s, i) => {
                  const key = `${s.fromUserId}-${s.toUserId}`
                  return (
                    <div key={i} style={{
                      padding: '14px 16px', borderRadius: 'var(--r-md)',
                      background: 'var(--warning-dim)', border: '1px solid rgba(245,158,11,0.2)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div className="avatar avatar-sm" style={{ background: `linear-gradient(135deg, ${memberColor(s.fromUserId)})` }}>{s.fromUserName?.[0]}</div>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.fromUserName}</span>
                        <span style={{ color: 'var(--text-muted)' }}>→</span>
                        <div className="avatar avatar-sm" style={{ background: `linear-gradient(135deg, ${memberColor(s.toUserId)})` }}>{s.toUserName?.[0]}</div>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.toUserName}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--warning)' }}>
                          {fmt(s.amount)}
                        </span>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleSettle(s)}
                          disabled={settling === key}
                        >
                          {settling === key ? 'Settling…' : '✓ Mark Settled'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  )
}

function SummaryStat({ label, value }) {
  return (
    <div style={{ textAlign: 'center', padding: '10px 0' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>{value}</div>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  )
}

function memberColor(id) {
  const palettes = ['#7C3AED, #5B21B6', '#10B981, #059669', '#F43F5E, #BE123C', '#F59E0B, #D97706', '#38BDF8, #0284C7']
  return palettes[id % palettes.length]
}

function EmptyGroupState() {
  return (
    <div style={{ textAlign: 'center', padding: '100px 0' }}>
      <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.4 }}>⊜</div>
      <div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: 8 }}>No group selected</div>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Choose a group to view balances</div>
    </div>
  )
}
