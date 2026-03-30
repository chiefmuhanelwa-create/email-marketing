'use client'

import { useEffect, useState, useCallback } from 'react'
import Sidebar from '@/components/layout/Sidebar'

interface Contact {
  id: number
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  status: string
  source: string | null
  tags: string[]
  engagementScore: number
  totalEmailsSent: number
  totalEmailsOpened: number
  createdAt: string
}

interface ContactsResponse {
  contacts: Contact[]
  total: number
  page: number
  pageSize: number
}

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>
  return ((...args: any[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }) as T
}

export default function ContactsPage() {
  const [data, setData] = useState<ContactsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [page, setPage] = useState(1)

  const fetchContacts = useCallback(async (q: string, status: string, source: string, p: number) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (status) params.set('status', status)
    if (source) params.set('source', source)
    params.set('page', String(p))
    params.set('pageSize', '50')

    try {
      const res = await fetch(`/api/contacts?${params}`)
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const debouncedSearch = useCallback(debounce((q: string) => {
    setPage(1)
    fetchContacts(q, statusFilter, sourceFilter, 1)
  }, 400), [statusFilter, sourceFilter, fetchContacts])

  useEffect(() => {
    fetchContacts(search, statusFilter, sourceFilter, page)
  }, [statusFilter, sourceFilter, page])

  const handleSearch = (q: string) => {
    setSearch(q)
    debouncedSearch(q)
  }

  const exportCSV = async () => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (statusFilter) params.set('status', statusFilter)
    if (sourceFilter) params.set('source', sourceFilter)
    window.location.href = `/api/contacts/export?${params}`
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: 'nc-badge nc-badge-active',
      unsubscribed: 'nc-badge nc-badge-unsubscribed',
      bounced: 'nc-badge nc-badge-bounced',
      complained: 'nc-badge nc-badge-complained',
      pending: 'nc-badge nc-badge-pending',
    }
    return map[status] || 'nc-badge'
  }

  const totalPages = data ? Math.ceil(data.total / 50) : 0

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ marginLeft: 220, flex: 1, padding: '32px 40px', background: 'var(--bg)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 className="display-font" style={{ fontSize: 32, letterSpacing: 1 }}>CONTACTS</h1>
            <p style={{ color: 'var(--text-muted)' }}>
              {data?.total?.toLocaleString() || 0} contacts
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={exportCSV} className="nc-btn-ghost">Export CSV</button>
            <a href="/import" className="nc-btn-primary">Import</a>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <input
            className="nc-input"
            placeholder="Search by email or name..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            style={{ maxWidth: 320 }}
          />
          <select
            className="nc-select"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            style={{ maxWidth: 160 }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="unsubscribed">Unsubscribed</option>
            <option value="bounced">Bounced</option>
            <option value="complained">Complained</option>
            <option value="pending">Pending</option>
          </select>
          <select
            className="nc-select"
            value={sourceFilter}
            onChange={e => { setSourceFilter(e.target.value); setPage(1) }}
            style={{ maxWidth: 200 }}
          >
            <option value="">All Sources</option>
            <option value="pdf_download">PDF Download</option>
            <option value="survey">Survey</option>
            <option value="website_subscription">Website</option>
            <option value="social_media">Social Media</option>
            <option value="manual">Manual</option>
          </select>
        </div>

        {/* Table */}
        <div className="nc-card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading contacts...</div>
          ) : (
            <table className="nc-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Tags</th>
                  <th>Score</th>
                  <th>Sent / Opened</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody>
                {(data?.contacts || []).map(contact => (
                  <tr key={contact.id}>
                    <td style={{ color: 'var(--text)', fontWeight: 500 }}>{contact.email}</td>
                    <td>{[contact.firstName, contact.lastName].filter(Boolean).join(' ') || '—'}</td>
                    <td><span className={statusBadge(contact.status)}>{contact.status}</span></td>
                    <td style={{ fontSize: 12 }}>{contact.source || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(contact.tags || []).slice(0, 3).map((tag, i) => (
                          <span key={i} style={{
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border-bright)',
                            borderRadius: 4,
                            padding: '1px 6px',
                            fontSize: 11,
                            color: 'var(--text-dim)'
                          }}>{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ color: contact.engagementScore > 10 ? 'var(--accent)' : 'var(--text-muted)' }}>
                      {contact.engagementScore}
                    </td>
                    <td style={{ fontSize: 12 }}>{contact.totalEmailsSent} / {contact.totalEmailsOpened}</td>
                    <td style={{ fontSize: 12 }}>{new Date(contact.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            <button
              className="nc-btn-ghost"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{ padding: '6px 12px' }}
            >← Prev</button>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Page {page} of {totalPages}
            </span>
            <button
              className="nc-btn-ghost"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{ padding: '6px 12px' }}
            >Next →</button>
          </div>
        )}
      </main>
    </div>
  )
}
