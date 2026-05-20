'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard')
  }

  return (
    <div style={{ width: '100%', maxWidth: 420 }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 44 }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: '2.8rem', fontWeight: 900,
            color: 'var(--silver)', letterSpacing: '0.2em',
            textShadow: '0 0 40px rgba(200,200,200,0.15)' }}>
            DRAFTZ
          </h1>
        </Link>
        <p style={{ fontFamily: "'EB Garamond', serif", color: 'var(--text-muted)',
          fontStyle: 'italic', marginTop: 6, fontSize: '1rem' }}>
          Prodigy Pictures
        </p>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 4, padding: '40px 36px' }}>
        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '0.7rem', letterSpacing: '0.3em',
          color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 28, textAlign: 'center' }}>
          Sign In
        </h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {[
            { label: 'Email', type: 'email', value: email, set: setEmail },
            { label: 'Password', type: 'password', value: password, set: setPassword },
          ].map(f => (
            <div key={f.label}>
              <label style={{ fontFamily: "'Cinzel', serif", fontSize: '0.58rem', letterSpacing: '0.2em',
                color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                {f.label}
              </label>
              <input className="input-dark" type={f.type} value={f.value}
                onChange={e => f.set(e.target.value)} required
                style={{ width: '100%', padding: '12px 16px', fontSize: '1rem' }} />
            </div>
          ))}
          {error && (
            <p style={{ color: '#e07070', fontFamily: "'EB Garamond', serif",
              fontSize: '0.95rem', textAlign: 'center' }}>
              {error}
            </p>
          )}
          <button type="submit" className="btn-primary" disabled={loading}
            style={{ marginTop: 4, padding: '14px', borderRadius: 2, border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.72rem', width: '100%' }}>
            {loading ? 'Entering...' : 'Enter'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 22,
          fontFamily: "'EB Garamond', serif", color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          No account?{' '}
          <Link href="/register" style={{ color: 'var(--text-primary)', textDecoration: 'none',
            borderBottom: '1px solid var(--border)' }}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}