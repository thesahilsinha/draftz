'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ScreenplaysPage() {
  const [screenplays, setScreenplays] = useState<any[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editLogline, setEditLogline] = useState('')
  const [editStatus, setEditStatus] = useState('')

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const { data } = await supabase.from('screenplays').select('*, projects(title)').order('updated_at', { ascending: false })
    setScreenplays(data ?? [])
  }

  const startEdit = (s: any) => {
    setEditingId(s.id); setEditTitle(s.title); setEditLogline(s.logline ?? ''); setEditStatus(s.status)
  }

  const saveEdit = async (id: string) => {
    await supabase.from('screenplays').update({ title: editTitle, logline: editLogline, status: editStatus, updated_at: new Date().toISOString() }).eq('id', id)
    setEditingId(null); load()
  }

  const deleteScreenplay = async (id: string) => {
    if (!confirm('Delete this screenplay? This cannot be undone.')) return
    await supabase.from('screenplays').delete().eq('id', id)
    setScreenplays(prev => prev.filter(s => s.id !== id))
  }

  const statusColors: Record<string, string> = { draft: '#555', 'in-progress': '#8a7', review: '#a87', final: '#c0c0c0', optioned: '#7a8' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.6rem', letterSpacing: '0.3em', color: '#555', textTransform: 'uppercase', marginBottom: 6 }}>Prodigy Pictures</p>
          <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', color: '#c0c0c0', letterSpacing: '0.05em' }}>Screenplays</h1>
        </div>
        <Link href="/screenplays/new" className="btn-primary" style={{ padding: '12px 28px', textDecoration: 'none', fontSize: '0.7rem', borderRadius: 2 }}>+ New Screenplay</Link>
      </div>

      {screenplays.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <p style={{ fontFamily: "'Cinzel', serif", color: '#333', letterSpacing: '0.1em' }}>No screenplays yet</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {screenplays.map(s => (
          <div key={s.id} className="card-hover" style={{ background: '#111', borderRadius: 4, overflow: 'hidden' }}>
            {editingId === s.id ? (
              <div style={{ padding: '20px' }}>
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                  className="input-dark" style={{ width: '100%', padding: '8px 12px', borderRadius: 2, marginBottom: 8, fontFamily: "'Cinzel', serif" }} />
                <textarea value={editLogline} onChange={e => setEditLogline(e.target.value)} rows={2}
                  className="input-dark" placeholder="Logline..." style={{ width: '100%', padding: '8px 12px', borderRadius: 2, marginBottom: 8, resize: 'none', fontStyle: 'italic' }} />
                <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="input-dark"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 2, marginBottom: 12, cursor: 'pointer' }}>
                  {['draft', 'in-progress', 'review', 'final', 'optioned'].map(st => <option key={st} value={st}>{st}</option>)}
                </select>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => saveEdit(s.id)} className="btn-primary" style={{ flex: 1, padding: '8px', border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: '0.65rem' }}>Save</button>
                  <button onClick={() => setEditingId(null)} className="btn-ghost" style={{ flex: 1, padding: '8px', borderRadius: 2, cursor: 'pointer', fontSize: '0.65rem' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <Link href={`/screenplays/${s.id}`} style={{ textDecoration: 'none', display: 'block', padding: '24px 24px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.5rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: statusColors[s.status] ?? '#555', border: '1px solid currentColor', padding: '2px 8px', borderRadius: 2 }}>{s.status}</span>
                  </div>
                  <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: '1rem', color: '#c0c0c0', letterSpacing: '0.05em', marginBottom: 8 }}>{s.title}</h3>
                  {s.logline && <p style={{ fontFamily: "'EB Garamond', serif", color: '#666', fontSize: '0.9rem', fontStyle: 'italic', lineHeight: 1.5 }}>{s.logline}</p>}
                  <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '0.75rem', color: '#333', marginTop: 12 }}>{new Date(s.updated_at).toLocaleDateString()}</p>
                </Link>
                <div style={{ borderTop: '1px solid #1a1a1a', display: 'flex' }}>
                  <button onClick={() => startEdit(s)} style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', borderRight: '1px solid #1a1a1a' }}>
                    ✎ Edit Details
                  </button>
                  <button onClick={() => deleteScreenplay(s.id)} style={{ padding: '10px 16px', background: 'transparent', border: 'none', color: '#4a2a2a', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: '0.55rem', letterSpacing: '0.1em' }}>
                    ✕
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}