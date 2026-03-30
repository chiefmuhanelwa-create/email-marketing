'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'Dashboard', icon: '⚡' },
  { href: '/contacts', label: 'Contacts', icon: '👥' },
  { href: '/import', label: 'Import', icon: '📥' },
  { href: '/segments', label: 'Segments', icon: '🎯' },
  { href: '/campaigns', label: 'Campaigns', icon: '📣' },
  { href: '/sequences', label: 'Sequences', icon: '🔄' },
  { href: '/composer', label: 'AI Composer', icon: '✍️' },
  { href: '/editor', label: 'Email Editor', icon: '🎨' },
  { href: '/analytics', label: 'Analytics', icon: '📊' },
  { href: '/revenue', label: 'Revenue', icon: '💰' },
  { href: '/ab-test', label: 'A/B Tests', icon: '🧪' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      width: 220,
      background: 'var(--bg-card)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
    }}>
      {/* Brand */}
      <div style={{ padding: '24px 20px 16px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--accent)', letterSpacing: 2 }}>
          NO CHILL
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>
          Email Empire
        </div>
      </div>

      <hr className="accent-line" style={{ margin: '0 16px 8px' }} />

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0 8px', overflowY: 'auto' }}>
        {navItems.map(item => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item${isActive ? ' active' : ''}`}
              style={{ marginBottom: 2 }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          <div style={{ fontWeight: 600, color: 'var(--text-dim)' }}>NOCHILL PTY LTD</div>
          <div>For children's children 🔥</div>
        </div>
      </div>
    </aside>
  )
}
