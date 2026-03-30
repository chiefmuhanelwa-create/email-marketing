'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'

interface AnalyticsData {
  growthByDay: Array<{ date: string; count: number }>
  sourceBreakdown: Array<{ source: string; count: number }>
  statusBreakdown: Array<{ status: string; count: number }>
  engagementStats: { avgScore: number; opened: number; clicked: number; sent: number }
  recentEvents: Array<{ eventType: string; count: number; date: string }>
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const openRate = data?.engagementStats
    ? data.engagementStats.sent > 0
      ? ((data.engagementStats.opened / data.engagementStats.sent) * 100).toFixed(1)
      : '0.0'
    : '0.0'

  const clickRate = data?.engagementStats
    ? data.engagementStats.sent > 0
      ? ((data.engagementStats.clicked / data.engagementStats.sent) * 100).toFixed(1)
      : '0.0'
    : '0.0'

  const sourceColors: Record<string, string> = {
    pdf_download: '#F97316',
    survey: '#3b82f6',
    website_subscription: '#22c55e',
    social_media: '#a855f7',
    manual: '#666',
    other: '#444',
  }

  const maxGrowth = data?.growthByDay ? Math.max(...data.growthByDay.map(d => d.count), 1) : 1

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ marginLeft: 220, flex: 1, padding: '32px 40px', background: 'var(--bg)' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 className="display-font" style={{ fontSize: 32, letterSpacing: 1 }}>ANALYTICS</h1>
          <p style={{ color: 'var(--text-muted)' }}>Track your list growth and engagement</p>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-muted)' }}>Loading analytics...</div>
        ) : (
          <>
            {/* Key metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
              <div className="nc-card">
                <div className="stat-number" style={{ color: 'var(--accent)' }}>{openRate}%</div>
                <div className="stat-label">Open Rate</div>
              </div>
              <div className="nc-card">
                <div className="stat-number" style={{ color: 'var(--blue)' }}>{clickRate}%</div>
                <div className="stat-label">Click Rate</div>
              </div>
              <div className="nc-card">
                <div className="stat-number">{data?.engagementStats?.sent?.toLocaleString() || 0}</div>
                <div className="stat-label">Total Sent</div>
              </div>
              <div className="nc-card">
                <div className="stat-number" style={{ color: 'var(--green)' }}>{data?.engagementStats?.avgScore?.toFixed(1) || 0}</div>
                <div className="stat-label">Avg Engagement Score</div>
              </div>
            </div>

            {/* Growth chart */}
            <div className="nc-card" style={{ marginBottom: 24 }}>
              <h2 style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Contact Growth (30 Days)</h2>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 120 }}>
                {(data?.growthByDay || []).map((d, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div
                      title={`${d.date}: ${d.count} contacts`}
                      style={{
                        width: '100%',
                        background: d.count > 0 ? 'var(--accent)' : 'var(--bg-elevated)',
                        height: `${Math.max((d.count / maxGrowth) * 100, d.count > 0 ? 4 : 2)}px`,
                        borderRadius: '2px 2px 0 0',
                        transition: 'height 0.2s',
                        cursor: 'default',
                      }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                <span>{data?.growthByDay?.[0]?.date || ''}</span>
                <span>{data?.growthByDay?.[data.growthByDay.length - 1]?.date || ''}</span>
              </div>
            </div>

            {/* Source breakdown + status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div className="nc-card">
                <h2 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>By Source</h2>
                {(data?.sourceBreakdown || []).map((s, i) => {
                  const total = data?.sourceBreakdown.reduce((sum, x) => sum + x.count, 0) || 1
                  const pct = ((s.count / total) * 100).toFixed(1)
                  return (
                    <div key={i} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: 'var(--text)' }}>{s.source || 'unknown'}</span>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.count.toLocaleString()} ({pct}%)</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${pct}%`,
                            background: sourceColors[s.source] || 'var(--accent)',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="nc-card">
                <h2 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>By Status</h2>
                {(data?.statusBreakdown || []).map((s, i) => {
                  const total = data?.statusBreakdown.reduce((sum, x) => sum + x.count, 0) || 1
                  const pct = ((s.count / total) * 100).toFixed(1)
                  const color = s.status === 'active' ? 'var(--green)'
                    : s.status === 'bounced' || s.status === 'complained' ? 'var(--red)'
                    : s.status === 'unsubscribed' ? 'var(--text-muted)'
                    : 'var(--blue)'
                  return (
                    <div key={i} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: 'var(--text)' }}>{s.status}</span>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.count.toLocaleString()} ({pct}%)</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
