'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: '◈' },
  { href: '/screenplays', label: 'Screenplays', icon: '✦' },
  { href: '/projects', label: 'Projects', icon: '◆' },
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
      <button onClick={() => setOpen(!open)} style={{
        display: 'none', position: 'fixed', top: 16, left: 16, zIndex: 100,
        background: '#111', border: '1px solid #2a2a2a', padding: '8px 12px',
        color: '#c0c0c0', cursor: 'pointer', borderRadius: 2,
        fontFamily: "'Cinzel', serif", fontSize: '1rem',
      }} className="mobile-menu-btn">
        {open ? '✕' : '☰'}
      </button>

      <aside style={{
        width: 220, minHeight: '100vh', background: '#0a0a0a',
        borderRight: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column',
        padding: '32px 0', position: 'fixed', top: 0, left: 0, zIndex: 50,
        transition: 'transform 0.3s ease',
      }} className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div style={{ padding: '0 24px 32px', borderBottom: '1px solid #1a1a1a' }}>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: '1.4rem', fontWeight: 900, color: '#c0c0c0', letterSpacing: '0.15em', textShadow: '0 0 20px rgba(192,192,192,0.15)' }}>
              DRAFTZ
            </h1>
          </Link>
          <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '0.7rem', color: '#444', fontStyle: 'italic', marginTop: 2 }}>Prodigy Pictures</p>
        </div>

        <nav style={{ flex: 1, padding: '24px 0' }}>
          {navItems.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 24px', textDecoration: 'none',
                color: active ? '#e8e8e8' : '#555',
                background: active ? 'rgba(192,192,192,0.06)' : 'transparent',
                borderLeft: active ? '2px solid #c0c0c0' : '2px solid transparent',
                fontFamily: "'Cinzel', serif", fontSize: '0.65rem',
                letterSpacing: '0.15em', textTransform: 'uppercase',
                transition: 'all 0.2s',
              }}>
                <span style={{ fontSize: '0.9rem' }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: '24px', borderTop: '1px solid #1a1a1a' }}>
          <button onClick={handleLogout} className="btn-ghost" style={{
            width: '100%', padding: '10px', borderRadius: 2, cursor: 'pointer',
            fontSize: '0.6rem', letterSpacing: '0.15em',
          }}>
            Sign Out
          </button>
        </div>
      </aside>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: block !important; }
          .sidebar { transform: translateX(-100%); }
          .sidebar.sidebar-open { transform: translateX(0); }
        }
      `}</style>
    </>
  )
}