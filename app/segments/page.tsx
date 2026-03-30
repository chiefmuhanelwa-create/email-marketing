'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'

interface Segment {
  id: number
  name: string
  description: string | null
  type: string
  color: string
  contactCount: number
  rules: any
}

const SEGMENT_OFFERS: Record<string, { offer: string; sequence: string; icon: string }> = {
  creator: { offer: 'R497/mo Accelerator', sequence: 'Creator Warm-Up', icon: '🎬' },
  learner: { offer: 'R197 Tax Ebook', sequence: 'Knowledge Value', icon: '📚' },
  brand_fan: { offer: 'R47 Starter Kit', sequence: 'Brand Fan Welcome', icon: '🔥' },
  buyer: { offer: '1:1 Coaching', sequence: 'Buyer Upsell', icon: '💎' },
  unknown: { offer: 'Survey/Profile', sequence: 'Re-engagement', icon: '❓' },
  custom: { offer: 'Custom', sequence: 'Custom', icon: '⚙️' },
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/segments')
      .then(r => r.json())
      .then(data => { setSegments(data.segments || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ marginLeft: 220, flex: 1, padding: '32px 40px', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 className="display-font" style={{ fontSize: 32, letterSpacing: 1 }}>SEGMENTS</h1>
            <p style={{ color: 'var(--text-muted)' }}>Your Thabo avatar segments — know who you're talking to</p>
          </div>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-muted)' }}>Loading segments...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {segments.map(seg => {
              const meta = SEGMENT_OFFERS[seg.type] || SEGMENT_OFFERS.custom
              return (
                <div key={seg.id} className="nc-card animate-fade-in" style={{
                  borderLeft: `4px solid ${seg.color || 'var(--accent)'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 24 }}>{meta.icon}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{seg.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {seg.description || 'No description'}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="stat-number" style={{ fontSize: 28, color: seg.color || 'var(--accent)' }}>
                        {seg.contactCount.toLocaleString()}
                      </div>
                      <div className="stat-label" style={{ fontSize: 10 }}>contacts</div>
                    </div>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
                        Best Offer
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>{meta.offer}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
                        Sequence
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{meta.sequence}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                    <a href={`/campaigns?segment=${seg.id}`} className="nc-btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}>
                      Send Campaign
                    </a>
                    <a href={`/sequences?segment=${seg.id}`} className="nc-btn-ghost" style={{ fontSize: 12, padding: '6px 14px' }}>
                      Enroll
                    </a>
                  </div>
                </div>
              )
            })}

            {segments.length === 0 && !loading && (
              <div className="nc-card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60 }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🎯</div>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>No segments yet</div>
                <div style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
                  Import contacts to auto-generate your NOCHILL segments
                </div>
                <a href="/import" className="nc-btn-primary">Import Contacts</a>
              </div>
            )}
          </div>
        )}

        {/* NOCHILL Segment Guide */}
        <div className="nc-card" style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
            The Thabo Avatar Framework
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
            {[
              { name: 'Creators', icon: '🎬', source: 'survey, social_media', desc: 'Have audience, want monetisation' },
              { name: 'Learners', icon: '📚', source: 'pdf_download', desc: 'Want structured knowledge' },
              { name: 'Brand Fans', icon: '🔥', source: 'website_subscription', desc: 'Already know NOCHILL' },
              { name: 'Buyers', icon: '💎', source: 'tag: buyer', desc: 'Have purchased before' },
              { name: 'Unknown', icon: '❓', source: 'no source', desc: 'Need profiling first' },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{item.name}</div>
                <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 2 }}>{item.source}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
