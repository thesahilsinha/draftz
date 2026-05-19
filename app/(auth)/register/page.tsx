'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('270803')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } }
    })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard')
  }

  return (
    <div style={{ width: '100%', maxWidth: 420 }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: '2.5rem', fontWeight: 900, color: '#c0c0c0', letterSpacing: '0.2em', textShadow: '0 0 30px rgba(192,192,192,0.2)' }}>DRAFTZ</h1>
        </Link>
        <p style={{ fontFamily: "'EB Garamond', serif", color: '#888', fontStyle: 'italic', marginTop: 4 }}>Prodigy Pictures</p>
      </div>
      <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 4, padding: '40px 36px' }}>
        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '0.8rem', letterSpacing: '0.3em', color: '#888', textTransform: 'uppercase', marginBottom: 32, textAlign: 'center' }}>Create Account</h2>
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontFamily: "'Cinzel', serif", fontSize: '0.6rem', letterSpacing: '0.2em', color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Full Name</label>
            <input className="input-dark" type="text" value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: '12px 16px', borderRadius: 2 }} />
          </div>
          <div>
            <label style={{ fontFamily: "'Cinzel', serif", fontSize: '0.6rem', letterSpacing: '0.2em', color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Email</label>
            <input className="input-dark" type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '12px 16px', borderRadius: 2 }} />
          </div>
          <div>
            <label style={{ fontFamily: "'Cinzel', serif", fontSize: '0.6rem', letterSpacing: '0.2em', color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Password</label>
            <input className="input-dark" type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: '12px 16px', borderRadius: 2 }} />
          </div>
          {error && <p style={{ color: '#ff4444', fontFamily: "'EB Garamond', serif", fontSize: '0.9rem', textAlign: 'center' }}>{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}
            style={{ marginTop: 8, padding: '14px', borderRadius: 2, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontSize: '0.75rem' }}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 24, fontFamily: "'EB Garamond', serif", color: '#666', fontSize: '0.9rem' }}>
          Have an account?{' '}
          <Link href="/login" style={{ color: '#c0c0c0', textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}