'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'

interface SequenceEmail {
  id: number
  stepNumber: number
  delayDays: number
  subject: string
  previewText: string | null
}

interface Sequence {
  id: number
  name: string
  description: string | null
  status: string
  triggerTag: string | null
  emails?: SequenceEmail[]
  enrollmentCount?: number
}

interface Segment { id: number; name: string; contactCount: number }

const RAWS_TEMPLATES = [
  {
    name: 'RAWS Re-engagement',
    description: 'Reactivate cold subscribers over 7 days',
    triggerTag: 'reactivate',
    emails: [
      { stepNumber: 1, delayDays: 0, subject: "We haven't spoken in a while...", previewText: "I want to check in." },
      { stepNumber: 2, delayDays: 3, subject: "Free framework: How I made R312K from content", previewText: "This changed everything." },
      { stepNumber: 3, delayDays: 7, subject: "Are you still in?", previewText: "Last chance to stay on my list." },
    ]
  },
  {
    name: 'RAWS Welcome Sequence',
    description: 'Welcome new subscribers and introduce NOCHILL',
    triggerTag: 'welcome',
    emails: [
      { stepNumber: 1, delayDays: 0, subject: "Welcome to the NOCHILL family 🔥", previewText: "Your journey starts here." },
      { stepNumber: 2, delayDays: 2, subject: "My story: From broke to R312K undeclared income", previewText: "The SARS story nobody expected." },
      { stepNumber: 3, delayDays: 5, subject: "The PAIDS framework that changed my life", previewText: "Platform, Audience, Income, Distribution, Systems." },
    ]
  },
]

export default function SequencesPage() {
  const [sequences, setSequences] = useState<Sequence[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [enrollModal, setEnrollModal] = useState<Sequence | null>(null)
  const [enrollSegment, setEnrollSegment] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const [viewEmails, setViewEmails] = useState<Sequence | null>(null)

  const [form, setForm] = useState({ name: '', description: '', triggerTag: '' })

  useEffect(() => {
    Promise.all([
      fetch('/api/sequences').then(r => r.json()),
      fetch('/api/segments').then(r => r.json()),
    ]).then(([sData, segData]) => {
      setSequences(sData.sequences || [])
      setSegments(segData.segments || [])
      setLoading(false)
    })
  }, [])

  const createSequence = async () => {
    const res = await fetch('/api/sequences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.id) {
      setSequences(prev => [data, ...prev])
      setShowModal(false)
      setForm({ name: '', description: '', triggerTag: '' })
    }
  }

  const loadTemplate = async (template: typeof RAWS_TEMPLATES[0]) => {
    const res = await fetch('/api/sequences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: template.name,
        description: template.description,
        triggerTag: template.triggerTag,
        emails: template.emails,
      }),
    })
    const data = await res.json()
    if (data.id) {
      setSequences(prev => [data, ...prev])
    }
  }

  const enrollContacts = async () => {
    if (!enrollModal || !enrollSegment) return
    setEnrolling(true)
    await fetch('/api/sequences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'enroll',
        sequenceId: enrollModal.id,
        segmentId: Number(enrollSegment),
      }),
    })
    setEnrolling(false)
    setEnrollModal(null)
    setEnrollSegment('')
  }

  const statusColor: Record<string, string> = {
    active: 'var(--green)',
    paused: 'var(--text-muted)',
    completed: 'var(--blue)',
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ marginLeft: 220, flex: 1, padding: '32px 40px', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 className="display-font" style={{ fontSize: 32, letterSpacing: 1 }}>SEQUENCES</h1>
            <p style={{ color: 'var(--text-muted)' }}>Drip campaigns that run on autopilot via hourly cron</p>
          </div>
          <button onClick={() => setShowModal(true)} className="nc-btn-primary">+ New Sequence</button>
        </div>

        {/* RAWS Templates */}
        {sequences.length === 0 && !loading && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', marginBottom: 12 }}>
              RAWS Templates — Load one to get started
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {RAWS_TEMPLATES.map((t, i) => (
                <div key={i} className="nc-card" style={{ borderLeft: '4px solid var(--accent)' }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{t.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{t.description}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 12 }}>
                    {t.emails.length} emails · Trigger: <code style={{ color: 'var(--accent)' }}>{t.triggerTag}</code>
                  </div>
                  <button onClick={() => loadTemplate(t)} className="nc-btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}>
                    Load Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ color: 'var(--text-muted)' }}>Loading sequences...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {sequences.map(seq => (
              <div key={seq.id} className="nc-card">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{seq.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{seq.description || 'No description'}</div>
                  </div>
                  <span className="nc-badge" style={{
                    background: `${statusColor[seq.status] || 'var(--text-muted)'}22`,
                    color: statusColor[seq.status] || 'var(--text-muted)',
                  }}>{seq.status}</span>
                </div>

                {seq.triggerTag && (
                  <div style={{ fontSize: 12, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Trigger tag:</span>
                    <code style={{ color: 'var(--accent)', background: 'var(--accent-glow)', padding: '1px 6px', borderRadius: 4 }}>
                      {seq.triggerTag}
                    </code>
                  </div>
                )}

                {seq.enrollmentCount !== undefined && (
                  <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 12 }}>
                    {seq.enrollmentCount} contacts enrolled
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setEnrollModal(seq)} className="nc-btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}>
                    Enroll Segment
                  </button>
                  <button onClick={() => setViewEmails(seq)} className="nc-btn-ghost" style={{ fontSize: 12, padding: '6px 14px' }}>
                    View Emails
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Sequence Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
            <div className="modal-content">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontWeight: 700, fontSize: 18 }}>New Sequence</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 24, cursor: 'pointer' }}>×</button>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Name</label>
                <input className="nc-input" placeholder="e.g. RAWS Re-engagement" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Description</label>
                <textarea className="nc-input" placeholder="What does this sequence do?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ minHeight: 80 }} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                  Trigger Tag (optional — auto-enrolls contacts with this tag)
                </label>
                <input className="nc-input" placeholder="e.g. reactivate" value={form.triggerTag} onChange={e => setForm(f => ({ ...f, triggerTag: e.target.value }))} />
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowModal(false)} className="nc-btn-ghost">Cancel</button>
                <button onClick={createSequence} className="nc-btn-primary" disabled={!form.name}>
                  Create Sequence
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enroll Modal */}
        {enrollModal && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setEnrollModal(null) }}>
            <div className="modal-content">
              <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>
                Enroll in: {enrollModal.name}
              </h2>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                  Select Segment
                </label>
                <select className="nc-select" value={enrollSegment} onChange={e => setEnrollSegment(e.target.value)}>
                  <option value="">Choose a segment...</option>
                  {segments.map(seg => (
                    <option key={seg.id} value={seg.id}>
                      {seg.name} ({seg.contactCount.toLocaleString()} contacts)
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setEnrollModal(null)} className="nc-btn-ghost">Cancel</button>
                <button onClick={enrollContacts} className="nc-btn-primary" disabled={!enrollSegment || enrolling}>
                  {enrolling ? 'Enrolling...' : 'Enroll Contacts'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Emails Modal */}
        {viewEmails && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setViewEmails(null) }}>
            <div className="modal-content" style={{ maxWidth: 600 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontWeight: 700, fontSize: 18 }}>Emails: {viewEmails.name}</h2>
                <button onClick={() => setViewEmails(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 24, cursor: 'pointer' }}>×</button>
              </div>
              {(viewEmails.emails || []).length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
                  No emails in this sequence yet.
                  <div style={{ marginTop: 16 }}>
                    <a href="/composer" className="nc-btn-primary" style={{ fontSize: 13 }}>Write with AI Composer</a>
                  </div>
                </div>
              ) : (
                <div>
                  {(viewEmails.emails || []).map((email, i) => (
                    <div key={email.id} style={{
                      padding: '16px 0',
                      borderBottom: i < (viewEmails.emails?.length || 0) - 1 ? '1px solid var(--border)' : 'none'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--accent)', minWidth: 24 }}>
                          {email.stepNumber}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{email.subject}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                            Day {email.delayDays} · {email.previewText || 'No preview'}
                          </div>
                        </div>
                        <a
                          href={`/editor?subject=${encodeURIComponent(email.subject)}`}
                          className="nc-btn-ghost"
                          style={{ fontSize: 12, padding: '4px 10px' }}
                        >
                          Edit
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
