'use client'

import Sidebar from '@/components/layout/Sidebar'

export default function SettingsPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ marginLeft: 220, flex: 1, padding: '32px 40px', background: 'var(--bg)' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 className="display-font" style={{ fontSize: 32, letterSpacing: 1 }}>SETTINGS</h1>
          <p style={{ color: 'var(--text-muted)' }}>Platform configuration and integrations</p>
        </div>

        <div style={{ maxWidth: 700, display: 'grid', gap: 24 }}>
          {/* Email Settings */}
          <div className="nc-card">
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Email Configuration</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                { label: 'From Name', env: 'RESEND_FROM_NAME', value: 'Ndivhuwo | NO CHILL' },
                { label: 'From Email', env: 'RESEND_FROM_EMAIL', value: 'hello@nochill.co.za' },
                { label: 'Tracking Base URL', env: 'TRACKING_BASE_URL', value: 'https://email.nochill.co.za' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{item.env}</div>
                  </div>
                  <div style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '8px 12px',
                    fontSize: 13,
                    color: 'var(--text-dim)',
                    fontFamily: 'monospace',
                  }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
              Configure via environment variables in Vercel → Settings → Environment Variables
            </div>
          </div>

          {/* Integration */}
          <div className="nc-card">
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>External Integrations</h2>
            <div style={{ display: 'grid', gap: 16 }}>
              {[
                { name: 'Resend', desc: 'Transactional email + sequences', status: 'Connected', statusColor: 'var(--green)' },
                { name: 'AWS SES', desc: 'Bulk campaign sending', status: 'Configure', statusColor: 'var(--text-muted)' },
                { name: 'Paystack', desc: 'Payment webhooks', status: 'Configure', statusColor: 'var(--text-muted)' },
                { name: 'Gumroad', desc: 'Digital product sales', status: 'Configure', statusColor: 'var(--text-muted)' },
                { name: 'Anthropic Claude', desc: 'AI email composition', status: 'Connected', statusColor: 'var(--green)' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.desc}</div>
                  </div>
                  <span style={{ fontSize: 12, color: item.statusColor, fontWeight: 600 }}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cron */}
          <div className="nc-card">
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Cron Jobs</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                { path: '/api/cron/sequences', schedule: 'Every hour', desc: 'Sends due sequence emails' },
                { path: '/api/cron/campaigns', schedule: 'Every 15 minutes', desc: 'Sends scheduled campaigns' },
              ].map((job, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--accent)' }}>{job.path}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{job.desc}</div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{job.schedule}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Funnel Integration */}
          <div className="nc-card">
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>contentpreneurhub.online Integration</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Add this to your opt-in form handler on contentpreneurhub.online:
            </p>
            <pre style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-bright)',
              borderRadius: 6,
              padding: 16,
              fontSize: 12,
              color: 'var(--text-dim)',
              overflowX: 'auto',
              lineHeight: 1.6,
            }}>{`const subscribeToEmailEmpire = async (formData) => {
  await fetch('https://email.nochill.co.za/api/contacts/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_APP_SECRET'
    },
    body: JSON.stringify({
      email: formData.email,
      firstName: formData.name?.split(' ')[0],
      source: 'website_subscription',
      tags: ['funnel', 'contentpreneurhub'],
      sequenceTag: 'reactivate'
    })
  })
}`}</pre>
          </div>
        </div>
      </main>
    </div>
  )
}
