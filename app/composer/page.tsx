'use client'

import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'

interface ComposerResult {
  subject: string
  previewText: string
  htmlBody: string
  textBody: string
  subjectAlternatives: string[]
  writingNotes: string
}

export default function ComposerPage() {
  const [prompt, setPrompt] = useState('')
  const [segment, setSegment] = useState('')
  const [product, setProduct] = useState('')
  const [framework, setFramework] = useState('')
  const [tone, setTone] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ComposerResult | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const compose = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/composer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, segment, product, framework, tone }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const openInEditor = () => {
    if (!result) return
    const params = new URLSearchParams({
      subject: result.subject,
      html: result.htmlBody,
    })
    window.open(`/editor?${params}`, '_blank')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ marginLeft: 220, flex: 1, padding: '32px 40px', background: 'var(--bg)' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 className="display-font" style={{ fontSize: 32, letterSpacing: 1 }}>AI COMPOSER</h1>
          <p style={{ color: 'var(--text-muted)' }}>Claude writes in your NOCHILL voice. You approve and send.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 24, maxWidth: 1200 }}>
          {/* Input panel */}
          <div>
            <div className="nc-card">
              <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>What do you want to say?</h2>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                  Your Brief *
                </label>
                <textarea
                  className="nc-input"
                  placeholder="e.g. Send a re-engagement email to cold subscribers who downloaded my PDF. Reference my tax story. Offer the R197 ebook as the next step."
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  style={{ minHeight: 140 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                    Audience
                  </label>
                  <select className="nc-select" value={segment} onChange={e => setSegment(e.target.value)}>
                    <option value="">Any audience</option>
                    <option value="creator">Creators</option>
                    <option value="learner">Learners</option>
                    <option value="brand_fan">Brand Fans</option>
                    <option value="buyer">Buyers</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                    Product
                  </label>
                  <select className="nc-select" value={product} onChange={e => setProduct(e.target.value)}>
                    <option value="">No specific product</option>
                    <option value="starter_kit">R47 Starter Kit</option>
                    <option value="tax_ebook">R197 Tax Ebook</option>
                    <option value="accelerator">R497/mo Accelerator</option>
                    <option value="coaching">1:1 Coaching</option>
                    <option value="book">Book</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                    Framework
                  </label>
                  <select className="nc-select" value={framework} onChange={e => setFramework(e.target.value)}>
                    <option value="">Let AI decide</option>
                    <option value="RAWS">RAWS</option>
                    <option value="4E">4E</option>
                    <option value="PAIDS">PAIDS</option>
                    <option value="DARES">DARES</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                    Tone
                  </label>
                  <select className="nc-select" value={tone} onChange={e => setTone(e.target.value)}>
                    <option value="">NOCHILL default</option>
                    <option value="vulnerable">Vulnerable/Personal</option>
                    <option value="educational">Educational</option>
                    <option value="urgent">Urgent/FOMO</option>
                    <option value="celebratory">Celebratory</option>
                  </select>
                </div>
              </div>

              <button
                className="nc-btn-primary"
                onClick={compose}
                disabled={loading || !prompt.trim()}
                style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '12px' }}
              >
                {loading ? 'Writing...' : '✍️ Write with Claude'}
              </button>

              {error && (
                <div style={{ marginTop: 12, padding: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid var(--red)', borderRadius: 6, color: 'var(--red)', fontSize: 13 }}>
                  {error}
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="nc-card" style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>💡 Briefing Tips</div>
              <ul style={{ color: 'var(--text-muted)', fontSize: 12, paddingLeft: 16, lineHeight: 2 }}>
                <li>Include the goal (sell, warm, reactivate)</li>
                <li>Mention specific stories or pain points</li>
                <li>Name the product you want them to buy</li>
                <li>Specify the segment you're writing to</li>
              </ul>
            </div>
          </div>

          {/* Output panel */}
          <div>
            {loading && (
              <div className="nc-card" style={{ textAlign: 'center', padding: 60 }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>✍️</div>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Claude is writing...</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  In Ndivhuwo's voice, using NOCHILL frameworks
                </div>
              </div>
            )}

            {result && !loading && (
              <div className="animate-fade-in">
                {/* Subject lines */}
                <div className="nc-card" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 15 }}>Subject Line</h3>
                    <button onClick={() => copy(result.subject, 'subject')} className="nc-btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }}>
                      {copied === 'subject' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
                    {result.subject}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    {result.previewText}
                  </div>
                  {result.subjectAlternatives?.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                        Alternatives
                      </div>
                      {result.subjectAlternatives.map((alt, i) => (
                        <div key={i} style={{ fontSize: 13, padding: '4px 0', color: 'var(--text-dim)', borderBottom: '1px solid var(--border)' }}>
                          {alt}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Email body */}
                <div className="nc-card" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 15 }}>Email Body</h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => copy(result.htmlBody, 'html')} className="nc-btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }}>
                        {copied === 'html' ? '✓ Copied' : 'Copy HTML'}
                      </button>
                      <button onClick={openInEditor} className="nc-btn-primary" style={{ fontSize: 12, padding: '4px 10px' }}>
                        Open in Editor
                      </button>
                    </div>
                  </div>
                  <div
                    style={{
                      background: 'var(--bg-elevated)',
                      borderRadius: 6,
                      padding: 20,
                      fontSize: 14,
                      lineHeight: 1.7,
                      color: 'var(--text)',
                      maxHeight: 400,
                      overflowY: 'auto',
                    }}
                    dangerouslySetInnerHTML={{ __html: result.htmlBody }}
                  />
                </div>

                {/* Writing notes */}
                {result.writingNotes && (
                  <div className="nc-card" style={{ background: 'var(--accent-glow)', borderColor: 'var(--accent-dim)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginBottom: 6 }}>
                      Claude's Notes
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      {result.writingNotes}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!result && !loading && (
              <div className="nc-card" style={{ textAlign: 'center', padding: 60 }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🎯</div>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Your AI email will appear here</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  Fill in the brief on the left and click "Write with Claude"
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
