import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getUserGroups, getGroupBalances, getGroupExpenses } from '../services/api'
import AppLayout from '../components/layout/AppLayout'

function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div className="glass" style={{
      borderRadius: 'var(--r-lg)', padding: '24px 28px',
      display: 'flex', flexDirection: 'column', gap: 12,
      transition: 'transform 0.2s, border-color 0.2s',
      cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--glass-border-h)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--glass-border)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span className="label">{label}</span>
        <span style={{ fontSize: '1.3rem', opacity: 0.7 }}>{icon}</span>
      </div>
      <div className="stat-value" style={{ color: accent || 'var(--text-primary)' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  )
}

function QuickAction({ icon, label, onClick, accent }) {
  return (
    <button onClick={onClick} className="glass" style={{
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--r-lg)', padding: '20px',
      cursor: 'pointer', display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 10, transition: 'all 0.2s',
      background: 'var(--glass-2)', color: 'var(--text-primary)',
      fontFamily: 'var(--font-body)',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.background = 'var(--glass-3)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'var(--glass-2)' }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: accent || 'var(--accent-dim)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.3rem',
      }}>{icon}</div>
      <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</span>
    </button>
  )
}

export default function Dashboard() {
  const { user, currentGroup, selectGroup } = useAuth()
  const navigate = useNavigate()
  const [groups, setGroups]   = useState([])
  const [balance, setBalance] = useState(null)
  const [recent, setRecent]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      try {
        const gr = await getUserGroups(user.id)
        setGroups(gr.data.data || [])

        const grp = currentGroup || gr.data.data?.[0]
        if (grp) {
          const [bal, exp] = await Promise.all([
            getGroupBalances(grp.id),
            getGroupExpenses(grp.id),
          ])
          setBalance(bal.data.data)
          setRecent((exp.data.data || []).slice(0, 5))
          if (!currentGroup && gr.data.data?.[0]) selectGroup(gr.data.data[0])
        }
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [user, currentGroup?.id])

  const myBalance = balance?.memberBalances?.find(m => m.userId === user?.id)
  const net = myBalance?.netBalance ?? 0
  const totalSpend = balance?.totalGroupSpending ?? 0
  const pendingCount = balance?.settlementSuggestions?.length ?? 0

  const fmt = (n) => `₹${Math.abs(Number(n)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

  return (
    <AppLayout>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div className="label" style={{ marginBottom: 6 }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
          Hey, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: '0.95rem' }}>
          {currentGroup ? `Viewing · ${currentGroup.name}` : 'Select a group to get started'}
        </p>
      </div>

      {/* Group selector */}
      {groups.length > 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
          {groups.map(g => (
            <button key={g.id} onClick={() => selectGroup(g)} className="btn btn-glass btn-sm" style={{
              borderColor: currentGroup?.id === g.id ? 'var(--accent)' : 'var(--glass-border)',
              color: currentGroup?.id === g.id ? 'var(--accent-light)' : 'var(--text-secondary)',
              background: currentGroup?.id === g.id ? 'var(--accent-dim)' : 'var(--glass-1)',
            }}>
              {g.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--r-lg)' }} />)}
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 32 }}>
            <StatCard
              label="My Balance"
              value={net >= 0 ? `+${fmt(net)}` : `-${fmt(net)}`}
              sub={net > 0 ? 'You are owed' : net < 0 ? 'You owe' : 'All settled'}
              accent={net > 0 ? 'var(--success)' : net < 0 ? 'var(--danger)' : 'var(--text-muted)'}
              icon={net >= 0 ? '↑' : '↓'}
            />
            <StatCard label="Group Spending" value={fmt(totalSpend)} sub={`${balance?.totalExpenses || 0} expenses`} icon="⊞" />
            <StatCard label="Members" value={balance?.totalMembers || groups.length} sub="Active members" icon="◈" />
            <StatCard label="Pending" value={pendingCount} sub="Settlements needed" accent={pendingCount > 0 ? 'var(--warning)' : undefined} icon="⟳" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
            {/* Recent expenses */}
            <div className="glass" style={{ borderRadius: 'var(--r-lg)', padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600 }}>Recent Expenses</h2>
                <button className="btn btn-glass btn-sm" onClick={() => navigate('/expenses')}>View all</button>
              </div>
              {recent.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>⊞</div>
                  <div>No expenses yet</div>
                  <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => navigate('/expenses')}>
                    Add first expense
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {recent.map((exp, i) => (
                    <div key={exp.id} style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '12px 14px', borderRadius: 'var(--r-md)',
                      background: i % 2 === 0 ? 'var(--glass-1)' : 'transparent',
                      transition: 'background 0.15s',
                    }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                        background: 'var(--accent-dim)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1rem',
                      }}>
                        {categoryIcon(exp.category)}
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {exp.expenseName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          Paid by {exp.paidByName} · {exp.expenseDate}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem' }}>{fmt(exp.amount)}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>÷{exp.includedMembers?.length}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Quick actions */}
              <div className="glass" style={{ borderRadius: 'var(--r-lg)', padding: 24 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, marginBottom: 16 }}>Quick Actions</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <QuickAction icon="+" label="Add Expense" onClick={() => navigate('/expenses')} accent="var(--accent-dim)" />
                  <QuickAction icon="◈" label="New Group" onClick={() => navigate('/groups')} accent="rgba(16,185,129,0.15)" />
                  <QuickAction icon="⊜" label="View Balances" onClick={() => navigate('/balances')} accent="rgba(245,158,11,0.15)" />
                  <QuickAction icon="◉" label="Analytics" onClick={() => navigate('/analytics')} accent="rgba(56,189,248,0.12)" />
                </div>
              </div>

              {/* Settlement suggestions */}
              {balance?.settlementSuggestions?.length > 0 && (
                <div className="glass" style={{ borderRadius: 'var(--r-lg)', padding: 24 }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, marginBottom: 16 }}>
                    Settle Up
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {balance.settlementSuggestions.slice(0, 3).map((s, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 14px', borderRadius: 'var(--r-md)',
                        background: 'var(--warning-dim)', border: '1px solid rgba(245,158,11,0.15)',
                      }}>
                        <div className="avatar avatar-sm" style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)' }}>
                          {s.fromUserName?.[0]}
                        </div>
                        <div style={{ flex: 1, fontSize: '0.8rem' }}>
                          <span style={{ fontWeight: 600 }}>{s.fromUserName}</span>
                          <span style={{ color: 'var(--text-muted)' }}> → </span>
                          <span style={{ fontWeight: 600 }}>{s.toUserName}</span>
                        </div>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--warning)', fontSize: '0.9rem' }}>
                          {fmt(s.amount)}
                        </span>
                      </div>
                    ))}
                    <button className="btn btn-glass btn-sm w-full" style={{ justifyContent: 'center', marginTop: 4 }} onClick={() => navigate('/settlements')}>
                      Manage settlements
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </AppLayout>
  )
}

function categoryIcon(cat) {
  const map = { Food: '🍽', Travel: '✈', Shopping: '🛍', Entertainment: '🎬', Utilities: '⚡', Rent: '🏠', Health: '💊' }
  return map[cat] || '💳'
}
