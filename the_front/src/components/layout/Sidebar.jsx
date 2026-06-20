import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { path: '/dashboard',   label: 'Dashboard',   icon: '⬡' },
  { path: '/groups',      label: 'Groups',       icon: '◈' },
  { path: '/expenses',    label: 'Expenses',     icon: '⊞' },
  { path: '/balances',    label: 'Balances',     icon: '⊜' },
  { path: '/settlements', label: 'Settlements',  icon: '⟳' },
  { path: '/analytics',   label: 'Analytics',    icon: '◉' },
]

export default function Sidebar() {
  const { user, logout, currentGroup } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U'

  return (
    <aside style={{
      width: collapsed ? 72 : 240,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 12px',
      gap: 8,
      flexShrink: 0,
      transition: 'width 0.3s cubic-bezier(0.16,1,0.3,1)',
      borderRight: '1px solid var(--glass-border)',
      background: 'rgba(10,10,20,0.6)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      position: 'relative',
      zIndex: 10,
    }}>

      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '4px 10px 16px',
        borderBottom: '1px solid var(--glass-border)',
        marginBottom: 8,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, var(--accent), #5B21B6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem', flexShrink: 0,
          boxShadow: '0 4px 16px var(--accent-glow)',
        }}>✂</div>
        {!collapsed && (
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.01em' }}>
              XP_SPLIT
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
              SPLIT SMARTER
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(p => !p)}
          className="btn btn-glass btn-icon"
          style={{ marginLeft: 'auto', padding: '6px', fontSize: '0.75rem', opacity: 0.6 }}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Active group pill */}
      {!collapsed && currentGroup && (
        <div style={{
          padding: '8px 12px',
          background: 'var(--accent-dim)',
          border: '1px solid rgba(124,58,237,0.2)',
          borderRadius: 'var(--r-md)',
          marginBottom: 8,
        }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 2 }}>
            ACTIVE GROUP
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent-light)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentGroup.name}
          </div>
        </div>
      )}

      {/* Nav links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
        {NAV.map(item => {
          const active = pathname.startsWith(item.path)
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex', alignItems: 'center',
                gap: 12, padding: collapsed ? '11px 18px' : '11px 14px',
                borderRadius: 'var(--r-md)',
                border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem', fontWeight: active ? 600 : 400,
                color: active ? '#fff' : 'var(--text-secondary)',
                background: active
                  ? 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(91,33,182,0.2))'
                  : 'transparent',
                borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all 0.18s var(--ease-out-expo)',
                textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden',
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--glass-1)'; e.currentTarget.style.color = 'var(--text-primary)' } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' } }}
              title={collapsed ? item.label : ''}
            >
              <span style={{ fontSize: '1.05rem', flexShrink: 0, opacity: active ? 1 : 0.7 }}>{item.icon}</span>
              {!collapsed && item.label}
            </button>
          )
        })}
      </nav>

      {/* User area */}
      <div style={{
        borderTop: '1px solid var(--glass-border)',
        paddingTop: 16,
        display: 'flex', alignItems: 'center', gap: 10,
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        <div
          className="avatar avatar-sm pointer"
          onClick={() => navigate('/profile')}
          style={{ flexShrink: 0 }}
          title="Profile"
        >
          {user?.profilePhotoUrl
            ? <img src={user.profilePhotoUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            : initials
          }
        </div>
        {!collapsed && (
          <>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                @{user?.username}
              </div>
            </div>
            <button
              className="btn btn-glass btn-icon btn-sm"
              onClick={logout}
              title="Sign out"
              style={{ padding: '6px 8px', opacity: 0.6, fontSize: '0.8rem' }}
            >
              ⏻
            </button>
          </>
        )}
      </div>
    </aside>
  )
}
