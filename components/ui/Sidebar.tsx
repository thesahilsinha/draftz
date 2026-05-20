'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard',   label: 'Overview',     icon: '◈' },
  { href: '/screenplays', label: 'Screenplays',  icon: '✦' },
  { href: '/projects',    label: 'Projects',     icon: '◆' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Mobile hamburger */}
      <button onClick={() => setOpen(!open)} className="mobile-menu-btn"
        style={{ display: 'none', position: 'fixed', top: 14, left: 14, zIndex: 200,
          background: 'var(--surface)', border: '1px solid var(--border)', padding: '8px 13px',
          color: 'var(--text-primary)', cursor: 'pointer', borderRadius: 3,
          fontFamily: "'Cinzel', serif", fontSize: '1rem', lineHeight: 1,
        }}>
        {open ? '✕' : '☰'}
      </button>

      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}
        style={{ width: 220, minHeight: '100vh', background: '#050505',
          borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
          position: 'fixed', top: 0, left: 0, zIndex: 150, transition: 'transform 0.3s ease',
        }}>

        {/* Logo */}
        <div style={{ padding: '28px 24px 24px', borderBottom: '1px solid var(--border)' }}>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: '1.5rem', fontWeight: 900,
              color: 'var(--silver)', letterSpacing: '0.18em',
              textShadow: '0 0 20px rgba(200,200,200,0.12)' }}>
              DRAFTZ
            </h1>
          </Link>
          <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '0.78rem', color: 'var(--text-faint)',
            fontStyle: 'italic', marginTop: 3, letterSpacing: '0.04em' }}>
            Prodigy Pictures
          </p>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '20px 0' }}>
          {navItems.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 24px',
                  textDecoration: 'none',
                  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                  background: active ? 'rgba(255,255,255,0.05)' : 'transparent',
                  borderLeft: active ? '2px solid var(--silver)' : '2px solid transparent',
                  fontFamily: "'Cinzel', serif", fontSize: '0.64rem',
                  letterSpacing: '0.16em', textTransform: 'uppercase',
                  transition: 'all 0.2s',
                }}>
                <span style={{ fontSize: '0.85rem', opacity: active ? 1 : 0.5 }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)' }}>
          <button onClick={handleLogout} className="btn-ghost"
            style={{ width: '100%', padding: '10px 0', borderRadius: 2, cursor: 'pointer', fontSize: '0.6rem' }}>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}