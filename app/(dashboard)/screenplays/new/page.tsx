'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewScreenplayPage() {
  const [title, setTitle] = useState('')
  const [logline, setLogline] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('screenplays').insert({
      title, logline, user_id: user!.id,
      content: [{ type: 'scene-heading', text: 'INT. LOCATION - DAY' }],
      status: 'draft'
    }).select().single()
    if (!error && data) router.push(`/screenplays/${data.id}`)
    else setLoading(false)
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <Link href="/screenplays" style={{ fontFamily: "'Cinzel', serif", fontSize: '0.6rem', letterSpacing: '0.2em', color: '#555', textDecoration: 'none', textTransform: 'uppercase' }}>← Back</Link>
      <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: '2rem', color: '#c0c0c0', marginTop: 24, marginBottom: 40, letterSpacing: '0.05em' }}>New Screenplay</h1>

      <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <label style={{ fontFamily: "'Cinzel', serif", fontSize: '0.6rem', letterSpacing: '0.2em', color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Title *</label>
          <input className="input-dark" type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Untitled Screenplay"
            style={{ width: '100%', padding: '14px 16px', borderRadius: 2, fontSize: '1.1rem' }} />
        </div>
        <div>
          <label style={{ fontFamily: "'Cinzel', serif", fontSize: '0.6rem', letterSpacing: '0.2em', color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Logline</label>
          <textarea className="input-dark" value={logline} onChange={e => setLogline(e.target.value)} rows={3} placeholder="One sentence that captures the essence of your story..."
            style={{ width: '100%', padding: '14px 16px', borderRadius: 2, resize: 'vertical', fontStyle: 'italic' }} />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}
          style={{ padding: '14px', borderRadius: 2, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontSize: '0.75rem' }}>
          {loading ? 'Creating...' : 'Begin Writing'}
        </button>
      </form>
    </div>
  )
}