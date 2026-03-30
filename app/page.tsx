'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'

interface DashboardStats {
  totalContacts: number
  activeContacts: number
  totalCampaigns: number
  totalRevenue: number
  recentImports: number
  openRate: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const rawsItems = [
    { label: 'Reactivate', desc: 'Send re-engagement sequence to cold contacts', done: false },
    { label: 'Audience Segment', desc: 'Segment contacts by source and engagement', done: true },
    { label: 'Warm', desc: 'Run 3-part value sequence before selling', done: false },
    { label: 'Sell', desc: 'Send product campaign to warm segments', done: false },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ marginLeft: 220, flex: 1, padding: '32px 40px', background: 'var(--bg)' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 className="display-font" style={{ fontSize: 36, color: 'var(--text)', letterSpacing: 1 }}>
            EMAIL EMPIRE
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
            Your platform. Your audience. Your wealth.
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="nc-card" style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
              </div>
            ))
          ) : (
            <>
              <div className="nc-card animate-fade-in">
                <div className="stat-number">{stats?.totalContacts?.toLocaleString() || '0'}</div>
                <div className="stat-label">Total Contacts</div>
              </div>
              <div className="nc-card animate-fade-in">
                <div className="stat-number" style={{ color: 'var(--green)' }}>{stats?.activeContacts?.toLocaleString() || '0'}</div>
                <div className="stat-label">Active Contacts</div>
              </div>
              <div className="nc-card animate-fade-in">
                <div className="stat-number" style={{ color: 'var(--accent)' }}>{stats?.totalCampaigns || '0'}</div>
                <div className="stat-label">Campaigns Sent</div>
              </div>
              <div className="nc-card animate-fade-in">
                <div className="stat-number" style={{ color: 'var(--accent)' }}>
                  R{((stats?.totalRevenue || 0) / 100).toLocaleString()}
                </div>
                <div className="stat-label">Total Revenue</div>
              </div>
            </>
          )}
        </div>

        {/* Second row stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          <div className="nc-card">
            <div className="stat-number" style={{ color: 'var(--blue)' }}>{stats?.openRate?.toFixed(1) || '0'}%</div>
            <div className="stat-label">Avg Open Rate</div>
          </div>
          <div className="nc-card">
            <div className="stat-number">{stats?.recentImports || '0'}</div>
            <div className="stat-label">Imports (30 days)</div>
          </div>
          <div className="nc-card" style={{ background: 'var(--accent-glow)', borderColor: 'var(--accent-dim)' }}>
            <div className="stat-number" style={{ color: 'var(--accent)' }}>RAWS</div>
            <div className="stat-label">Active Framework</div>
          </div>
        </div>

        {/* RAWS Checklist */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div className="nc-card">
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--accent)' }}>RAWS</span> Framework Checklist
            </h2>
            {rawsItems.map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '12px 0',
                borderBottom: i < rawsItems.length - 1 ? '1px solid var(--border)' : 'none'
              }}>
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  border: `2px solid ${item.done ? 'var(--green)' : 'var(--border-bright)'}`,
                  background: item.done ? 'var(--green)' : 'transparent',
                  flexShrink: 0,
                  marginTop: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {item.done && <span style={{ color: '#000', fontSize: 12 }}>✓</span>}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{item.label}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Frameworks */}
          <div className="nc-card">
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              NOCHILL Frameworks
            </h2>
            {[
              { name: 'PAIDS', desc: 'Platform · Audience · Income · Distribution · Systems' },
              { name: '4E', desc: 'Entertain · Educate · Encourage · Earn' },
              { name: 'RAWS', desc: 'Reactivate · Audience Segment · Warm · Sell' },
              { name: 'DARES', desc: 'Digital · Automated · Recurring · Evergreen · Scalable' },
              { name: 'MS×TS×SS', desc: 'Mindset × Toolset × Skillset' },
            ].map((f, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: 12,
                padding: '10px 0',
                borderBottom: i < 4 ? '1px solid var(--border)' : 'none'
              }}>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 16,
                  color: 'var(--accent)',
                  minWidth: 80,
                  letterSpacing: 1
                }}>{f.name}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{f.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
            Quick Actions
          </h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="/import" className="nc-btn-primary">Import Contacts</a>
            <a href="/composer" className="nc-btn-primary">Write Email with AI</a>
            <a href="/campaigns" className="nc-btn-ghost">New Campaign</a>
            <a href="/sequences" className="nc-btn-ghost">New Sequence</a>
            <a href="/analytics" className="nc-btn-ghost">View Analytics</a>
          </div>
        </div>
      </main>
    </div>
  )
}
