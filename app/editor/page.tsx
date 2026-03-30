'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'

const BLOCKS = [
  { label: 'Heading', icon: 'H', html: '<h2 style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:#f0f0f0;margin:0 0 16px 0;">Your Heading Here</h2>' },
  { label: 'Paragraph', icon: '¶', html: '<p style="font-family:Georgia,serif;font-size:16px;color:#d4d4d4;line-height:1.7;margin:0 0 16px 0;">Your text here. Keep it real, keep it NOCHILL.</p>' },
  { label: 'Button', icon: '⬛', html: '<p style="margin:24px 0;text-align:center;"><a href="#" style="background:#F97316;color:#000;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;">Call to Action</a></p>' },
  { label: 'Divider', icon: '—', html: '<hr style="border:none;border-top:1px solid #333;margin:24px 0;" />' },
  { label: 'Signature', icon: '✍', html: '<p style="font-family:Georgia,serif;font-size:15px;color:#d4d4d4;margin:24px 0 0 0;">Stay real,<br/><strong style="color:#F97316;">Ndivhuwo</strong><br/><span style="color:#666;font-size:13px;">NOCHILL PTY LTD</span></p>' },
  { label: 'PS Line', icon: 'PS', html: '<p style="font-family:Georgia,serif;font-size:14px;color:#999;margin:24px 0 0 0;border-top:1px solid #222;padding-top:16px;"><strong>P.S.</strong> Your postscript here — this is where deals happen.</p>' },
]

export default function EditorPage() {
  const [html, setHtml] = useState('')
  const [subject, setSubject] = useState('')
  const [preview, setPreview] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const s = params.get('subject')
    const h = params.get('html')
    if (s) setSubject(s)
    if (h) setHtml(h)
  }, [])

  const insertBlock = (blockHtml: string) => {
    setHtml(prev => prev + '\n' + blockHtml)
  }

  const quickWrite = async () => {
    if (!aiPrompt.trim()) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/composer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      })
      const data = await res.json()
      if (data.htmlBody) {
        setHtml(data.htmlBody)
        if (data.subject && !subject) setSubject(data.subject)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setAiLoading(false)
      setAiPrompt('')
    }
  }

  const copyHTML = () => {
    navigator.clipboard.writeText(html)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ marginLeft: 220, flex: 1, padding: '32px 40px', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 className="display-font" style={{ fontSize: 32, letterSpacing: 1 }}>EMAIL EDITOR</h1>
            <p style={{ color: 'var(--text-muted)' }}>Build and preview your email HTML</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setPreview(!preview)} className="nc-btn-ghost">
              {preview ? 'Edit' : 'Preview'}
            </button>
            <button onClick={copyHTML} className="nc-btn-primary">Copy HTML</button>
          </div>
        </div>

        {/* Subject */}
        <div style={{ marginBottom: 16 }}>
          <input
            className="nc-input"
            placeholder="Subject line..."
            value={subject}
            onChange={e => setSubject(e.target.value)}
            style={{ fontSize: 16, fontWeight: 600 }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16 }}>
          {/* Blocks panel */}
          <div>
            <div className="nc-card">
              <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', marginBottom: 12 }}>
                Insert Block
              </div>
              {BLOCKS.map((block, i) => (
                <button
                  key={i}
                  onClick={() => insertBlock(block.html)}
                  className="nc-btn-ghost"
                  style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 6, padding: '8px 12px' }}
                >
                  <span style={{ fontFamily: 'monospace', fontSize: 14, color: 'var(--accent)', minWidth: 24 }}>{block.icon}</span>
                  <span style={{ fontSize: 13 }}>{block.label}</span>
                </button>
              ))}

              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />

              {/* AI Quick Write */}
              <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', marginBottom: 8 }}>
                AI Quick Write
              </div>
              <textarea
                className="nc-input"
                placeholder="Brief Claude..."
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                style={{ minHeight: 80, fontSize: 12 }}
              />
              <button
                onClick={quickWrite}
                disabled={aiLoading || !aiPrompt.trim()}
                className="nc-btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: 8, fontSize: 12 }}
              >
                {aiLoading ? 'Writing...' : 'Generate'}
              </button>
            </div>
          </div>

          {/* Editor / Preview */}
          <div>
            {preview ? (
              <div className="nc-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text-muted)' }}>
                  Preview (dark background)
                </div>
                <div style={{ background: '#0a0a0a', padding: 40, minHeight: 400 }}>
                  <div
                    style={{ maxWidth: 600, margin: '0 auto', fontFamily: 'Georgia,serif', color: '#d4d4d4', fontSize: 16, lineHeight: 1.7 }}
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                </div>
              </div>
            ) : (
              <textarea
                className="nc-input"
                value={html}
                onChange={e => setHtml(e.target.value)}
                placeholder="Start typing HTML or use the blocks and AI Quick Write on the left..."
                style={{ minHeight: 500, fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6 }}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
