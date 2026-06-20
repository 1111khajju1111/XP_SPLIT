import React from 'react'
import Sidebar from './Sidebar'

export default function AppLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      {/* Aurora background */}
      <div className="aurora-bg">
        <div className="aurora-orb3" />
      </div>
      {/* Noise overlay */}
      <div className="noise-overlay" />

      <Sidebar />

      <main style={{
        flex: 1,
        padding: '32px 36px',
        overflowY: 'auto',
        position: 'relative',
        zIndex: 2,
        maxHeight: '100vh',
      }}>
        <div className="page-enter">
          {children}
        </div>
      </main>
    </div>
  )
}
