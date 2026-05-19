'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  onClose: () => void
  onCreated: (p: any) => void
}

export default function ProjectModal({ onClose, onCreated }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [genre, setGenre] = useState('')
  const [status, setStatus] = useState('development')
  const [loading, setLoading] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('projects').insert({
      title, description, genre, status, user_id: user!.id
    }).select().single()
    if (!error && data) { onCreated(data); onClose() }
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '24px' }}>
      <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 4, padding: '40px', width: '100%', maxWidth: 480 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
          <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '1rem', color: '#c0c0c0', letterSpacing: '0.1em' }}>New Project</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { label: 'Title *', value: title, set: setTitle, type: 'text', required: true },
            { label: 'Genre', value: genre, set: setGenre, type: 'text', required: false },
          ].map(f => (
            <div key={f.label}>
              <label style={{ fontFamily: "'Cinzel', serif", fontSize: '0.6rem', letterSpacing: '0.2em', color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>{f.label}</label>
              <input className="input-dark" type={f.type} value={f.value} onChange={e => f.set(e.target.value)} required={f.required}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 2 }} />
            </div>
          ))}
          <div>
            <label style={{ fontFamily: "'Cinzel', serif", fontSize: '0.6rem', letterSpacing: '0.2em', color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="input-dark"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 2, cursor: 'pointer' }}>
              {['development', 'pre-production', 'production', 'post-production', 'completed'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontFamily: "'Cinzel', serif", fontSize: '0.6rem', letterSpacing: '0.2em', color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Description</label>
            <textarea className="input-dark" value={description} onChange={e => setDescription(e.target.value)} rows={3}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 2, resize: 'vertical' }} />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}
            style={{ padding: '14px', borderRadius: 2, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontSize: '0.75rem', marginTop: 8 }}>
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      </div>
    </div>
  )
}