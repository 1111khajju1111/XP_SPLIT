import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getGroupAnalytics } from '../services/api'
import AppLayout from '../components/layout/AppLayout'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from 'recharts'

const COLORS = ['#7C3AED', '#10B981', '#F43F5E', '#F59E0B', '#38BDF8', '#A78BFA', '#FB923C', '#34D399']
const MONTHS = ['', 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function GlassTooltip({ active, payload, label, prefix = '₹' }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-strong" style={{ padding: '10px 14px', borderRadius: 'var(--r-md)', fontSize: '0.8rem' }}>
      {label && <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ fontWeight: 600 }}>{prefix}{Number(p.value).toLocaleString('en-IN')}</div>
      ))}
    </div>
  )
}

export default function Analytics() {
  const { currentGroup } = useAuth()
  const { addToast } = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentGroup) return
    setLoading(true)
    getGroupAnalytics(currentGroup.id)
      .then(res => setData(res.data.data))
      .catch(() => addToast('Failed to load analytics', 'error'))
      .finally(() => setLoading(false))
  }, [currentGroup?.id])

  const fmt = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`

  if (!currentGroup) {
    return <AppLayout><EmptyGroupState /></AppLayout>
  }

  if (loading) {
    return (
      <AppLayout>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 280, borderRadius: 'var(--r-lg)' }} />)}
        </div>
      </AppLayout>
    )
  }

  const categoryData = Object.entries(data?.categoryWiseSpending || {}).map(([name, value]) => ({ name, value: Number(value) }))
  const monthlyData = (data?.monthlyTrend || [])
    .slice().reverse()
    .map(m => ({ name: `${MONTHS[m.month]} '${String(m.year).slice(2)}`, amount: Number(m.amount) }))
  const memberData = (data?.memberWiseSpending || []).map(m => ({ name: m.memberName, amount: Number(m.amountPaid) }))

  return (
    <AppLayout>
      <div style={{ marginBottom: 32 }}>
        <div className="label" style={{ marginBottom: 4 }}>{currentGroup.name}</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Analytics & Insights</h1>
      </div>

      {/* Insight cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 28 }}>
        <InsightCard label="Total Spending" value={fmt(data?.totalSpending)} icon="◉" accent="var(--accent-light)" />
        <InsightCard label="Highest Spender" value={data?.highestSpender || '—'} icon="👑" accent="var(--warning)" small />
        <InsightCard label="Total Expenses" value={data?.totalExpenses} icon="⊞" />
        <InsightCard label="Members" value={data?.totalMembers} icon="◈" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Category distribution */}
        <div className="glass" style={{ borderRadius: 'var(--r-lg)', padding: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600, marginBottom: 4 }}>Expense Distribution</h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>By category</p>
          {categoryData.length === 0 ? <EmptyChart /> : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <ResponsiveContainer width="60%" height={220}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="var(--bg-surface)" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip content={<GlassTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                {categoryData.map((c, i) => (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem' }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                    <span style={{ fontWeight: 600 }}>{fmt(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Member contribution */}
        <div className="glass" style={{ borderRadius: 'var(--r-lg)', padding: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600, marginBottom: 4 }}>Member Contribution</h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>Who paid the most</p>
          {memberData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={memberData} layout="vertical" margin={{ left: 0, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" stroke="rgba(255,255,255,0.3)" fontSize={11} tickFormatter={v => `₹${v}`} />
                <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} width={70} />
                <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="amount" radius={[0, 8, 8, 0]}>
                  {memberData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Monthly trend - full width */}
      <div className="glass" style={{ borderRadius: 'var(--r-lg)', padding: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600, marginBottom: 4 }}>Spending Trend</h2>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>Monthly spending over time</p>
        {monthlyData.length === 0 ? <EmptyChart /> : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlyData} margin={{ left: -10, right: 16, top: 10 }}>
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#7C3AED" />
                  <stop offset="100%" stopColor="#A78BFA" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickFormatter={v => `₹${v}`} />
              <Tooltip content={<GlassTooltip />} />
              <Line type="monotone" dataKey="amount" stroke="url(#lineGrad)" strokeWidth={3} dot={{ fill: '#7C3AED', r: 4, strokeWidth: 2, stroke: '#0A0A14' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </AppLayout>
  )
}

function InsightCard({ label, value, icon, accent, small }) {
  return (
    <div className="glass" style={{ borderRadius: 'var(--r-lg)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: 'var(--glass-2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.3rem',
      }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div className="label" style={{ marginBottom: 4 }}>{label}</div>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: small ? '1.1rem' : '1.4rem',
          color: accent || 'var(--text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{value}</div>
      </div>
    </div>
  )
}

function EmptyChart() {
  return (
    <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
      No data yet
    </div>
  )
}

function EmptyGroupState() {
  return (
    <div style={{ textAlign: 'center', padding: '100px 0' }}>
      <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.4 }}>◉</div>
      <div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: 8 }}>No group selected</div>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Choose a group to view analytics</div>
    </div>
  )
}
