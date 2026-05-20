'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import ProjectModal from '@/components/projects/ProjectModal'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<any>({})

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data } = await supabase.from('projects').select('*').order('updated_at', { ascending: false })
    setProjects(data ?? [])
  }

  const startEdit = (p: any) => { setEditingId(p.id); setEditData({ title: p.title, genre: p.genre ?? '', status: p.status, description: p.description ?? '' }) }

  const saveEdit = async (id: string) => {
    await supabase.from('projects').update({ ...editData, updated_at: new Date().toISOString() }).eq('id', id)
    setEditingId(null); load()
  }

  const deleteProject = async (id: string) => {
    if (!confirm('Delete this project and all its contents? This cannot be undone.')) return
    await supabase.from('projects').delete().eq('id', id)
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  const statusColor: Record<string, string> = { 'development': '#555', 'pre-production': '#8a7', 'production': '#7a8', 'post-production': '#68a', 'completed': '#c0c0c0' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.6rem', letterSpacing: '0.3em', color: '#555', textTransform: 'uppercase', marginBottom: 6 }}>Prodigy Pictures</p>
          <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', color: '#c0c0c0', letterSpacing: '0.05em' }}>Projects</h1>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary" style={{ padding: '12px 28px', fontSize: '0.7rem', borderRadius: 2, border: 'none', cursor: 'pointer' }}>+ New Project</button>
      </div>

      {projects.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <p style={{ fontFamily: "'Cinzel', serif", color: '#333', letterSpacing: '0.1em' }}>No projects yet</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {projects.map(p => (
          <div key={p.id} className="card-hover" style={{ background: '#111', borderRadius: 4, overflow: 'hidden' }}>
            {editingId === p.id ? (
              <div style={{ padding: '20px' }}>
                {[
                  { label: 'Title', key: 'title', type: 'text' },
                  { label: 'Genre', key: 'genre', type: 'text' },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 8 }}>
                    <label style={{ fontFamily: "'Cinzel', serif", fontSize: '0.5rem', letterSpacing: '0.15em', color: '#555', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>{f.label}</label>
                    <input value={editData[f.key]} onChange={e => setEditData((d: any) => ({ ...d, [f.key]: e.target.value }))}
                      className="input-dark" style={{ width: '100%', padding: '8px 12px', borderRadius: 2 }} />
                  </div>
                ))}
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontFamily: "'Cinzel', serif", fontSize: '0.5rem', letterSpacing: '0.15em', color: '#555', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Status</label>
                  <select value={editData.status} onChange={e => setEditData((d: any) => ({ ...d, status: e.target.value }))} className="input-dark"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 2, cursor: 'pointer' }}>
                    {['development', 'pre-production', 'production', 'post-production', 'completed'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontFamily: "'Cinzel', serif", fontSize: '0.5rem', letterSpacing: '0.15em', color: '#555', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Description</label>
                  <textarea value={editData.description} onChange={e => setEditData((d: any) => ({ ...d, description: e.target.value }))} rows={2}
                    className="input-dark" style={{ width: '100%', padding: '8px 12px', borderRadius: 2, resize: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => saveEdit(p.id)} className="btn-primary" style={{ flex: 1, padding: '8px', border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: '0.65rem' }}>Save</button>
                  <button onClick={() => setEditingId(null)} className="btn-ghost" style={{ flex: 1, padding: '8px', borderRadius: 2, cursor: 'pointer', fontSize: '0.65rem' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <Link href={`/projects/${p.id}`} style={{ textDecoration: 'none', display: 'block', padding: '24px 24px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.5rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: statusColor[p.status] ?? '#555', border: '1px solid currentColor', padding: '2px 8px', borderRadius: 2 }}>{p.status}</span>
                    <span style={{ color: '#1a1a1a', fontSize: '1.2rem' }}>◆</span>
                  </div>
                  <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: '1rem', color: '#c0c0c0', letterSpacing: '0.05em', marginBottom: 8 }}>{p.title}</h3>
                  {p.genre && <p style={{ fontFamily: "'EB Garamond', serif", color: '#555', fontSize: '0.85rem', fontStyle: 'italic' }}>{p.genre}</p>}
                  {p.description && <p style={{ fontFamily: "'EB Garamond', serif", color: '#444', fontSize: '0.85rem', marginTop: 8, lineHeight: 1.5 }}>{p.description.slice(0, 80)}{p.description.length > 80 ? '...' : ''}</p>}
                  <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '0.75rem', color: '#333', marginTop: 12 }}>{new Date(p.created_at).toLocaleDateString()}</p>
                </Link>
                <div style={{ borderTop: '1px solid #1a1a1a', display: 'flex' }}>
                  <button onClick={() => startEdit(p)} style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', borderRight: '1px solid #1a1a1a' }}>
                    ✎ Edit
                  </button>
                  <button onClick={() => deleteProject(p.id)} style={{ padding: '10px 16px', background: 'transparent', border: 'none', color: '#4a2a2a', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: '0.55rem' }}>
                    ✕
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {showModal && <ProjectModal onClose={() => setShowModal(false)} onCreated={p => { setProjects(prev => [p, ...prev]); setShowModal(false) }} />}
    </div>
  )
}