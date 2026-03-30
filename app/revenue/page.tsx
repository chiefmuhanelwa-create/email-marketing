'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'

interface RevenueEvent {
  id: number
  email: string
  productName: string | null
  amountZar: number
  source: string | null
  occurredAt: string
  campaignId: number | null
}

interface RevenueSummary {
  totalZar: number
  byProduct: Array<{ product: string; total: number; count: number }>
  byCampaign: Array<{ campaignName: string; total: number; count: number }>
  dailyRevenue: Array<{ date: string; total: number }>
  recentSales: RevenueEvent[]
}

const formatZar = (cents: number) => 'R' + (cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

export default function RevenuePage() {
  const [data, setData] = useState<RevenueSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ email: '', product: '', amount: '', source: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/revenue').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  const logSale = async () => {
    if (!form.email || !form.amount) return
    setSaving(true)
    const res = await fetch('/api/revenue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email,
        product: form.product,
        amount: Number(form.amount),
        source: form.source || 'manual',
      }),
    })
    const saved = await res.json()
    if (saved.ok) {
      setShowModal(false)
      setForm({ email: '', product: '', amount: '', source: '' })
      const refreshed = await fetch('/api/revenue').then(r => r.json())
      setData(refreshed)
    }
    setSaving(false)
  }

  const maxDaily = data?.dailyRevenue ? Math.max(...data.dailyRevenue.map(d => d.total), 1) : 1

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ marginLeft: 220, flex: 1, padding: '32px 40px', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 className="display-font" style={{ fontSize: 32, letterSpacing: 1 }}>REVENUE</h1>
            <p style={{ color: 'var(--text-muted)' }}>Track sales attributed to your email campaigns</p>
          </div>
          <button onClick={() => setShowModal(true)} className="nc-btn-primary">Log Sale</button>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-muted)' }}>Loading revenue...</div>
        ) : (
          <>
            {/* Total */}
            <div className="nc-card" style={{ marginBottom: 24, background: 'var(--accent-glow)', borderColor: 'var(--accent-dim)' }}>
              <div className="stat-number" style={{ fontSize: 56, color: 'var(--accent)' }}>
                {formatZar(data?.totalZar || 0)}
              </div>
              <div className="stat-label">Total Revenue Attributed to Email</div>
            </div>

            {/* Daily chart */}
            {data?.dailyRevenue && data.dailyRevenue.length > 0 && (
              <div className="nc-card" style={{ marginBottom: 24 }}>
                <h2 style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Daily Revenue (30 Days)</h2>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 100 }}>
                  {data.dailyRevenue.map((d, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div
                        title={`${d.date}: ${formatZar(d.total)}`}
                        style={{
                          width: '100%',
                          background: d.total > 0 ? 'var(--accent)' : 'var(--bg-elevated)',
                          height: `${Math.max((d.total / maxDaily) * 100, d.total > 0 ? 4 : 2)}px`,
                          borderRadius: '2px 2px 0 0',
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>{data.dailyRevenue[0]?.date}</span>
                  <span>{data.dailyRevenue[data.dailyRevenue.length - 1]?.date}</span>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
              {/* By product */}
              <div className="nc-card">
                <h2 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>By Product</h2>
                {(data?.byProduct || []).length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No sales yet</div>
                ) : (
                  (data?.byProduct || []).map((p, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{p.product || 'Unknown'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.count} sales</div>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>{formatZar(p.total)}</div>
                    </div>
                  ))
                )}
              </div>

              {/* By campaign */}
              <div className="nc-card">
                <h2 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>By Campaign (Attribution)</h2>
                {(data?.byCampaign || []).length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No attributions yet</div>
                ) : (
                  (data?.byCampaign || []).map((c, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{c.campaignName || 'Unattributed'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.count} sales</div>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>{formatZar(c.total)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent sales */}
            <div className="nc-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 15 }}>
                Recent Sales
              </div>
              <table className="nc-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Product</th>
                    <th>Amount</th>
                    <th>Source</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recentSales || []).slice(0, 20).map(sale => (
                    <tr key={sale.id}>
                      <td style={{ color: 'var(--text)' }}>{sale.email}</td>
                      <td>{sale.productName || '—'}</td>
                      <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{formatZar(sale.amountZar)}</td>
                      <td style={{ fontSize: 12 }}>{sale.source || '—'}</td>
                      <td style={{ fontSize: 12 }}>{new Date(sale.occurredAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {(data?.recentSales || []).length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                        No sales yet. Connect Paystack webhook to auto-log sales.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Log Sale Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
            <div className="modal-content">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontWeight: 700, fontSize: 18 }}>Log a Sale</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 24, cursor: 'pointer' }}>×</button>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Customer Email</label>
                <input className="nc-input" placeholder="customer@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Product</label>
                <select className="nc-select" value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))}>
                  <option value="">Select product</option>
                  <option value="R47 Starter Kit">R47 Starter Kit</option>
                  <option value="R197 Tax Ebook">R197 Tax Ebook</option>
                  <option value="R497/mo Accelerator">R497/mo Accelerator</option>
                  <option value="1:1 Coaching">1:1 Coaching</option>
                  <option value="Book">Book</option>
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Amount (ZAR)</label>
                <input className="nc-input" type="number" placeholder="e.g. 197" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Source</label>
                <input className="nc-input" placeholder="e.g. contentpreneurhub" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} />
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowModal(false)} className="nc-btn-ghost">Cancel</button>
                <button onClick={logSale} className="nc-btn-primary" disabled={!form.email || !form.amount || saving}>
                  {saving ? 'Saving...' : 'Log Sale'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
