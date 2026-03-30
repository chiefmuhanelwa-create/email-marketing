'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'

interface AbTest {
  id: number
  name: string
  status: string
  subjectA: string
  subjectB: string
  splitPct: number
  sentA: number
  openedA: number
  sentB: number
  openedB: number
  winner: string | null
  createdAt: string
}

export default function AbTestPage() {
  const [tests, setTests] = useState<AbTest[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', subjectA: '', subjectB: '', splitPct: 50 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/ab-test').then(r => r.json()).then(d => { setTests(d.tests || []); setLoading(false) })
  }, [])

  const createTest = async () => {
    if (!form.name || !form.subjectA || !form.subjectB) return
    setSaving(true)
    const res = await fetch('/api/ab-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.id) {
      setTests(prev => [data, ...prev])
      setShowModal(false)
      setForm({ name: '', subjectA: '', subjectB: '', splitPct: 50 })
    }
    setSaving(false)
  }

  const openRate = (opened: number, sent: number) =>
    sent > 0 ? ((opened / sent) * 100).toFixed(1) : '0.0'

  const getWinner = (test: AbTest) => {
    if (test.winner) return test.winner
    const rateA = test.sentA > 0 ? test.openedA / test.sentA : 0
    const rateB = test.sentB > 0 ? test.openedB / test.sentB : 0
    if (rateA === 0 && rateB === 0) return null
    return rateA >= rateB ? 'A' : 'B'
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ marginLeft: 220, flex: 1, padding: '32px 40px', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 className="display-font" style={{ fontSize: 32, letterSpacing: 1 }}>A/B TESTS</h1>
            <p style={{ color: 'var(--text-muted)' }}>Test subject lines to maximize open rates</p>
          </div>
          <button onClick={() => setShowModal(true)} className="nc-btn-primary">+ New A/B Test</button>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-muted)' }}>Loading tests...</div>
        ) : tests.length === 0 ? (
          <div className="nc-card" style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🧪</div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>No A/B tests yet</div>
            <div style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
              Test two subject lines to find which one gets more opens
            </div>
            <button onClick={() => setShowModal(true)} className="nc-btn-primary">Create Your First Test</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 20 }}>
            {tests.map(test => {
              const winner = getWinner(test)
              const rateA = openRate(test.openedA, test.sentA)
              const rateB = openRate(test.openedB, test.sentB)
              return (
                <div key={test.id} className="nc-card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{test.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        Created {new Date(test.createdAt).toLocaleDateString()} · {test.splitPct}/{100 - test.splitPct} split
                      </div>
                    </div>
                    <span className="nc-badge" style={{
                      background: test.status === 'completed' ? 'rgba(34,197,94,0.15)' : 'rgba(249,115,22,0.15)',
                      color: test.status === 'completed' ? 'var(--green)' : 'var(--accent)',
                    }}>{test.status}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    {/* Variant A */}
                    <div style={{
                      padding: 16,
                      background: winner === 'A' ? 'rgba(34,197,94,0.08)' : 'var(--bg-elevated)',
                      border: `1px solid ${winner === 'A' ? 'var(--green)' : 'var(--border)'}`,
                      borderRadius: 8,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span className="display-font" style={{ fontSize: 20, color: 'var(--accent)' }}>A</span>
                        {winner === 'A' && <span className="nc-badge nc-badge-active">Winner</span>}
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>{test.subjectA}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <div className="stat-number" style={{ fontSize: 28, color: winner === 'A' ? 'var(--green)' : 'var(--text)' }}>{rateA}%</div>
                          <div className="stat-label">Open Rate</div>
                        </div>
                        <div>
                          <div className="stat-number" style={{ fontSize: 28 }}>{test.sentA.toLocaleString()}</div>
                          <div className="stat-label">Sent</div>
                        </div>
                      </div>
                    </div>

                    {/* Variant B */}
                    <div style={{
                      padding: 16,
                      background: winner === 'B' ? 'rgba(34,197,94,0.08)' : 'var(--bg-elevated)',
                      border: `1px solid ${winner === 'B' ? 'var(--green)' : 'var(--border)'}`,
                      borderRadius: 8,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span className="display-font" style={{ fontSize: 20, color: 'var(--blue)' }}>B</span>
                        {winner === 'B' && <span className="nc-badge nc-badge-active">Winner</span>}
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>{test.subjectB}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <div className="stat-number" style={{ fontSize: 28, color: winner === 'B' ? 'var(--green)' : 'var(--text)' }}>{rateB}%</div>
                          <div className="stat-label">Open Rate</div>
                        </div>
                        <div>
                          <div className="stat-number" style={{ fontSize: 28 }}>{test.sentB.toLocaleString()}</div>
                          <div className="stat-label">Sent</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
            <div className="modal-content">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontWeight: 700, fontSize: 18 }}>New A/B Test</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 24, cursor: 'pointer' }}>×</button>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Test Name</label>
                <input className="nc-input" placeholder="e.g. Black Friday Subject Test" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Subject A</label>
                <input className="nc-input" placeholder="First subject line..." value={form.subjectA} onChange={e => setForm(f => ({ ...f, subjectA: e.target.value }))} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Subject B</label>
                <input className="nc-input" placeholder="Second subject line..." value={form.subjectB} onChange={e => setForm(f => ({ ...f, subjectB: e.target.value }))} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                  Split: {form.splitPct}% A / {100 - form.splitPct}% B
                </label>
                <input
                  type="range"
                  min={10}
                  max={90}
                  value={form.splitPct}
                  onChange={e => setForm(f => ({ ...f, splitPct: Number(e.target.value) }))}
                  style={{ width: '100%', accentColor: 'var(--accent)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowModal(false)} className="nc-btn-ghost">Cancel</button>
                <button onClick={createTest} className="nc-btn-primary" disabled={!form.name || !form.subjectA || !form.subjectB || saving}>
                  {saving ? 'Creating...' : 'Create Test'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
