'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'

interface Campaign {
  id: number
  name: string
  subject: string
  status: string
  provider: string
  totalRecipients: number
  totalSent: number
  totalOpened: number
  totalClicked: number
  sentAt: string | null
  createdAt: string
}

interface Segment { id: number; name: string; contactCount: number }

const statusColors: Record<string, string> = {
  draft: 'var(--text-muted)',
  scheduled: 'var(--blue)',
  sending: 'var(--accent)',
  sent: 'var(--green)',
  paused: 'var(--red)',
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [sending, setSending] = useState<number | null>(null)

  const [form, setForm] = useState({
    name: '', subject: '', previewText: '', htmlContent: '', textContent: '',
    provider: 'ses', segmentIds: [] as number[], sendToAll: false,
    scheduledAt: '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/campaigns').then(r => r.json()),
      fetch('/api/segments').then(r => r.json()),
    ]).then(([cData, sData]) => {
      setCampaigns(cData.campaigns || [])
      setSegments(sData.segments || [])
      setLoading(false)
    })
  }, [])

  const createCampaign = async () => {
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.id) {
      setCampaigns(prev => [data, ...prev])
      setShowModal(false)
      setForm({ name: '', subject: '', previewText: '', htmlContent: '', textContent: '', provider: 'ses', segmentIds: [], sendToAll: false, scheduledAt: '' })
    }
  }

  const sendCampaign = async (id: number) => {
    setSending(id)
    await fetch(`/api/campaigns?id=${id}&action=send`, { method: 'POST' })
    const res = await fetch('/api/campaigns')
    const data = await res.json()
    setCampaigns(data.campaigns || [])
    setSending(null)
  }

  const openRate = (c: Campaign) =>
    c.totalSent > 0 ? ((c.totalOpened / c.totalSent) * 100).toFixed(1) : '0.0'

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ marginLeft: 220, flex: 1, padding: '32px 40px', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 className="display-font" style={{ fontSize: 32, letterSpacing: 1 }}>CAMPAIGNS</h1>
            <p style={{ color: 'var(--text-muted)' }}>One-time broadcast emails to your segments</p>
          </div>
          <button onClick={() => setShowModal(true)} className="nc-btn-primary">+ New Campaign</button>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-muted)' }}>Loading campaigns...</div>
        ) : (
          <div className="nc-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="nc-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Status</th>
                  <th>Provider</th>
                  <th>Recipients</th>
                  <th>Open Rate</th>
                  <th>Sent At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{c.subject}</div>
                    </td>
                    <td>
                      <span className="nc-badge" style={{
                        background: `${statusColors[c.status]}22`,
                        color: statusColors[c.status],
                      }}>{c.status}</span>
                    </td>
                    <td style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>{c.provider}</td>
                    <td>{c.totalRecipients.toLocaleString()}</td>
                    <td>
                      <span style={{ color: Number(openRate(c)) > 20 ? 'var(--green)' : 'var(--text-dim)' }}>
                        {openRate(c)}%
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {c.sentAt ? new Date(c.sentAt).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      {c.status === 'draft' && (
                        <button
                          onClick={() => sendCampaign(c.id)}
                          disabled={sending === c.id}
                          className="nc-btn-primary"
                          style={{ fontSize: 12, padding: '4px 12px' }}
                        >
                          {sending === c.id ? 'Sending...' : 'Send Now'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {campaigns.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                      No campaigns yet. Create your first one!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Create Campaign Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
            <div className="modal-content" style={{ maxWidth: 700 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontWeight: 700, fontSize: 18 }}>New Campaign</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 24, cursor: 'pointer' }}>×</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Campaign Name</label>
                  <input className="nc-input" placeholder="e.g. Black Friday 2024" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Provider</label>
                  <select className="nc-select" value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}>
                    <option value="ses">AWS SES (bulk)</option>
                    <option value="resend">Resend (transactional)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Subject Line</label>
                <input className="nc-input" placeholder="Your subject line..." value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Preview Text</label>
                <input className="nc-input" placeholder="Short preview..." value={form.previewText} onChange={e => setForm(f => ({ ...f, previewText: e.target.value }))} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>HTML Content</label>
                <textarea className="nc-input" placeholder="Paste HTML from editor..." value={form.htmlContent} onChange={e => setForm(f => ({ ...f, htmlContent: e.target.value }))} style={{ minHeight: 200, fontFamily: 'monospace', fontSize: 12 }} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Target Segments</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  {segments.map(seg => (
                    <label key={seg.id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '4px 10px', background: form.segmentIds.includes(seg.id) ? 'var(--accent-glow)' : 'var(--bg-elevated)', border: `1px solid ${form.segmentIds.includes(seg.id) ? 'var(--accent)' : 'var(--border-bright)'}`, borderRadius: 6, fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={form.segmentIds.includes(seg.id)}
                        onChange={e => {
                          if (e.target.checked) setForm(f => ({ ...f, segmentIds: [...f.segmentIds, seg.id] }))
                          else setForm(f => ({ ...f, segmentIds: f.segmentIds.filter(id => id !== seg.id) }))
                        }}
                        style={{ display: 'none' }}
                      />
                      {seg.name} ({seg.contactCount.toLocaleString()})
                    </label>
                  ))}
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)' }}>
                  <input type="checkbox" checked={form.sendToAll} onChange={e => setForm(f => ({ ...f, sendToAll: e.target.checked }))} />
                  Send to ALL active contacts
                </label>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Schedule (optional)</label>
                <input
                  className="nc-input"
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowModal(false)} className="nc-btn-ghost">Cancel</button>
                <button onClick={createCampaign} className="nc-btn-primary" disabled={!form.name || !form.subject}>
                  Save Campaign
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
