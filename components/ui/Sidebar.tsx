'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'
import { useTheme, ThemeMode } from '@/lib/theme'

const navItems = [
  { href: '/dashboard',   label: 'Overview',    icon: '◈' },
  { href: '/screenplays', label: 'Screenplays', icon: '✦' },
  { href: '/projects',    label: 'Projects',    icon: '◆' },
]

const THEMES: { value: ThemeMode; label: string; icon: string; desc: string }[] = [
  { value: 'noir',     label: 'Noir',      icon: '◼', desc: 'Dark & cinematic' },
  { value: 'light',    label: 'Light',     icon: '◻', desc: 'Clean & minimal'  },
  { value: 'colorful', label: 'Readable',  icon: '◈', desc: 'Vibrant & clear'  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const current = THEMES.find(t => t.value === theme)!

  return (
    <>
      <button onClick={() => setOpen(!open)} className="mobile-menu-btn"
        style={{ display: 'none', position: 'fixed', top: 14, left: 14, zIndex: 200,
          background: 'var(--surface)', border: '1px solid var(--border)',
          padding: '8px 13px', color: 'var(--text)', cursor: 'pointer', borderRadius: 3,
          fontFamily: "'Cinzel', serif", fontSize: '1rem', lineHeight: 1 }}>
        {open ? '✕' : '☰'}
      </button>

      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}
        style={{ width: 220, minHeight: '100vh', background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--sidebar-border)', display: 'flex',
          flexDirection: 'column', position: 'fixed', top: 0, left: 0, zIndex: 150,
          transition: 'transform 0.3s ease' }}>

        {/* Logo */}
        <div style={{ padding: '28px 24px 22px', borderBottom: '1px solid var(--sidebar-border)' }}>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <h1 className="sidebar-logo" style={{ fontFamily: "'Cinzel', serif", fontSize: '1.5rem',
              fontWeight: 900, color: 'var(--text)', letterSpacing: '0.18em' }}>
              DRAFTZ
            </h1>
          </Link>
          <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '0.78rem',
            color: 'var(--text-faint)', fontStyle: 'italic', marginTop: 2 }}>
            Prodigy Pictures
          </p>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '18px 0' }}>
          {navItems.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                className={active ? 'sidebar-nav-active' : ''}
                style={{ display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 24px', textDecoration: 'none',
                  color: active ? 'var(--text)' : 'var(--text-muted)',
                  background: active ? 'rgba(255,255,255,0.05)' : 'transparent',
                  borderLeft: active ? '2px solid var(--silver)' : '2px solid transparent',
                  fontFamily: "'Cinzel', serif", fontSize: '0.64rem',
                  letterSpacing: '0.16em', textTransform: 'uppercase', transition: 'all 0.2s' }}>
                <span style={{ fontSize: '0.85rem', opacity: active ? 1 : 0.5 }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Theme switcher */}
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--sidebar-border)', paddingTop: 16 }}>
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.5rem', letterSpacing: '0.22em',
            color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: 8 }}>
            Appearance
          </p>

          {/* Current theme button */}
          <button onClick={() => setThemeOpen(o => !o)}
            style={{ width: '100%', padding: '10px 14px', background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'border-color 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--silver)' }}>{current.icon}</span>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.6rem',
                  letterSpacing: '0.12em', color: 'var(--text)', textTransform: 'uppercase' }}>
                  {current.label}
                </p>
                <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '0.72rem',
                  color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {current.desc}
                </p>
              </div>
            </div>
            <span style={{ color: 'var(--text-faint)', fontSize: '0.7rem',
              transform: themeOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              ▾
            </span>
          </button>

          {/* Dropdown */}
          {themeOpen && (
            <div style={{ marginTop: 4, background: 'var(--surface2)',
              border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
              {THEMES.map(t => (
                <button key={t.value} onClick={() => { setTheme(t.value); setThemeOpen(false) }}
                  style={{ width: '100%', padding: '10px 14px', background: theme === t.value
                    ? 'rgba(255,255,255,0.06)' : 'transparent',
                    border: 'none', borderLeft: theme === t.value
                      ? '2px solid var(--silver)' : '2px solid transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                    transition: 'all 0.15s' }}>
                  <span style={{ fontSize: '0.9rem',
                    color: theme === t.value ? 'var(--silver)' : 'var(--text-faint)' }}>
                    {t.icon}
                  </span>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.6rem',
                      letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: theme === t.value ? 'var(--text)' : 'var(--text-sub)' }}>
                      {t.label}
                    </p>
                    <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '0.7rem',
                      color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      {t.desc}
                    </p>
                  </div>
                  {theme === t.value && (
                    <span style={{ marginLeft: 'auto', color: 'var(--silver)', fontSize: '0.7rem' }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sign out */}
        <div style={{ padding: '12px 16px 24px' }}>
          <button onClick={handleLogout} className="btn-ghost"
            style={{ width: '100%', padding: '10px 0', borderRadius: 4, fontSize: '0.6rem' }}>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}