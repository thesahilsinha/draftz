'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type Tab = 'overview' | 'songs' | 'targets' | 'arts' | 'memos' | 'entities' | 'callsheet' | 'analytics'

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'overview',   icon: '◈', label: 'Overview'   },
  { id: 'memos',      icon: '✉', label: 'Memos'      },
  { id: 'entities',   icon: '◉', label: 'Entities'   },
  { id: 'callsheet',  icon: '◷', label: 'Call Sheet' },
  { id: 'analytics',  icon: '◎', label: 'Analytics'  },
  { id: 'songs',      icon: '♪', label: 'Songs'      },
  { id: 'targets',    icon: '◆', label: 'Targets'    },
  { id: 'arts',       icon: '✧', label: 'Arts'       },
]

const inputS: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 2 }
const labelS: React.CSSProperties = { fontFamily: "'Cinzel', serif", fontSize: '0.55rem', letterSpacing: '0.18em', color: '#555', textTransform: 'uppercase' as const, display: 'block', marginBottom: 5 }

export default function ProjectDetailPage() {
  const { id } = useParams()
  const [project, setProject] = useState<any>(null)
  const [tab, setTab] = useState<Tab>('overview')
  const [songs, setSongs] = useState<any[]>([])
  const [targets, setTargets] = useState<any[]>([])
  const [arts, setArts] = useState<any[]>([])
  const [memos, setMemos] = useState<any[]>([])
  const [entities, setEntities] = useState<any[]>([])
  const [callSheets, setCallSheets] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editingProject, setEditingProject] = useState(false)
  const [projEdit, setProjEdit] = useState<any>({})
  const fileRef = useRef<HTMLInputElement>(null)

  // Form states
  const [songForm, setSongForm] = useState({ title: '', artist: '', url: '' })
  const [targetForm, setTargetForm] = useState({ title: '', description: '', due_date: '' })
  const [artTitle, setArtTitle] = useState(''); const [artFile, setArtFile] = useState<File | null>(null)
  const [memoForm, setMemoForm] = useState({ title: '', content: '', color: '#1a1a1a', pinned: false })
  const [entityForm, setEntityForm] = useState({ name: '', role: '', category: 'cast', email: '', phone: '', notes: '' })
  const [csForm, setCsForm] = useState({ title: '', shoot_date: '', location: '', general_call_time: '', notes: '' })
  const [logForm, setLogForm] = useState({ title: '', log_type: 'update', value: '', unit: '', notes: '' })

  // Editing states
  const [editingMemo, setEditingMemo] = useState<string | null>(null)
  const [editMemoData, setEditMemoData] = useState<any>({})
  const [editingEntity, setEditingEntity] = useState<string | null>(null)
  const [editEntityData, setEditEntityData] = useState<any>({})
  const [editingTarget, setEditingTarget] = useState<string | null>(null)
  const [editTargetData, setEditTargetData] = useState<any>({})
  const [editingSong, setEditingSong] = useState<string | null>(null)
  const [editSongData, setEditSongData] = useState<any>({})

  const getUser = async () => { const { data: { user } } = await supabase.auth.getUser(); return user }

  useEffect(() => {
    const load = async () => {
      const { data: p } = await supabase.from('projects').select('*').eq('id', id).single()
      setProject(p); setProjEdit({ title: p.title, genre: p.genre ?? '', status: p.status, description: p.description ?? '' })
      const [s, t, a, m, e, cs, lg] = await Promise.all([
        supabase.from('songs').select('*').eq('project_id', id).order('created_at', { ascending: false }),
        supabase.from('targets').select('*').eq('project_id', id).order('created_at', { ascending: false }),
        supabase.from('arts').select('*').eq('project_id', id).order('created_at', { ascending: false }),
        supabase.from('memos').select('*').eq('project_id', id).order('pinned', { ascending: false }),
        supabase.from('entities').select('*').eq('project_id', id).order('category'),
        supabase.from('call_sheets').select('*').eq('project_id', id).order('shoot_date', { ascending: true }),
        supabase.from('production_logs').select('*').eq('project_id', id).order('logged_at', { ascending: false }),
      ])
      setSongs(s.data ?? []); setTargets(t.data ?? []); setArts(a.data ?? [])
      setMemos(m.data ?? []); setEntities(e.data ?? []); setCallSheets(cs.data ?? []); setLogs(lg.data ?? [])
    }
    load()
  }, [id])

  const saveProjectEdit = async () => {
    await supabase.from('projects').update({ ...projEdit, updated_at: new Date().toISOString() }).eq('id', id)
    setProject((p: any) => ({ ...p, ...projEdit })); setEditingProject(false)
  }

  const del = async (table: string, itemId: string, setState: Function) => {
    await supabase.from(table).delete().eq('id', itemId)
    setState((prev: any[]) => prev.filter((x: any) => x.id !== itemId))
  }

  const add = async (table: string, data: any, setState: Function, reset: Function) => {
    setLoading(true)
    const user = await getUser()
    const { data: row } = await supabase.from(table).insert({ ...data, project_id: id, user_id: user!.id }).select().single()
    if (row) setState((p: any[]) => [row, ...p]); reset(); setLoading(false)
  }

  const toggleTarget = async (t: any) => {
    await supabase.from('targets').update({ completed: !t.completed }).eq('id', t.id)
    setTargets(p => p.map(x => x.id === t.id ? { ...x, completed: !x.completed } : x))
  }

  const uploadArt = async (e: React.FormEvent) => {
    e.preventDefault(); if (!artFile) return; setLoading(true)
    const user = await getUser()
    const ext = artFile.name.split('.').pop()
    const path = `${user!.id}/${id}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('project-assets').upload(path, artFile)
    if (!upErr) {
      const { data: { publicUrl } } = supabase.storage.from('project-assets').getPublicUrl(path)
      const { data: row } = await supabase.from('arts').insert({ title: artTitle || artFile.name, url: publicUrl, project_id: id, user_id: user!.id }).select().single()
      if (row) { setArts(p => [row, ...p]); setArtTitle(''); setArtFile(null); if (fileRef.current) fileRef.current.value = '' }
    }
    setLoading(false)
  }

  if (!project) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><p style={{ fontFamily: "'Cinzel', serif", color: '#333', letterSpacing: '0.2em' }}>Loading...</p></div>

  const tabBtnStyle = (t: Tab): React.CSSProperties => ({
    fontFamily: "'Cinzel', serif", fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase',
    padding: '9px 14px', cursor: 'pointer', border: 'none', background: tab === t ? '#1a1a1a' : 'transparent',
    color: tab === t ? '#c0c0c0' : '#444',
    borderBottom: tab === t ? '2px solid #c0c0c0' : '2px solid transparent',
    transition: 'all 0.2s', whiteSpace: 'nowrap' as const, flexShrink: 0,
  })

  const sectionTitle = (title: string) => (
    <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '0.6rem', letterSpacing: '0.25em', color: '#555', textTransform: 'uppercase', marginBottom: 20 }}>{title}</h2>
  )

  const ENTITY_CATEGORIES = ['cast', 'crew', 'vendor', 'location', 'executive', 'other']
  const LOG_TYPES = ['update', 'shoot-day', 'budget', 'milestone', 'issue', 'note']
  const statusColor: Record<string, string> = { 'development': '#555', 'pre-production': '#8a7', 'production': '#7a8', 'post-production': '#68a', 'completed': '#c0c0c0' }

  return (
    <div>
      {/* Project Header */}
      <div style={{ marginBottom: 32 }}>
        <Link href="/projects" style={{ fontFamily: "'Cinzel', serif", fontSize: '0.6rem', letterSpacing: '0.2em', color: '#444', textDecoration: 'none', textTransform: 'uppercase' }}>← Projects</Link>
        {editingProject ? (
          <div style={{ marginTop: 16, background: '#111', border: '1px solid #2a2a2a', borderRadius: 4, padding: 24, maxWidth: 600 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              {[{ label: 'Title', key: 'title' }, { label: 'Genre', key: 'genre' }].map(f => (
                <div key={f.key}>
                  <label style={labelS}>{f.label}</label>
                  <input value={projEdit[f.key]} onChange={e => setProjEdit((d: any) => ({ ...d, [f.key]: e.target.value }))} className="input-dark" style={{ width: '100%', padding: '8px 12px', borderRadius: 2 }} />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelS}>Status</label>
              <select value={projEdit.status} onChange={e => setProjEdit((d: any) => ({ ...d, status: e.target.value }))} className="input-dark" style={{ width: '100%', padding: '8px 12px', borderRadius: 2 }}>
                {['development', 'pre-production', 'production', 'post-production', 'completed'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelS}>Description</label>
              <textarea value={projEdit.description} onChange={e => setProjEdit((d: any) => ({ ...d, description: e.target.value }))} rows={2} className="input-dark" style={{ width: '100%', padding: '8px 12px', borderRadius: 2, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={saveProjectEdit} className="btn-primary" style={{ padding: '8px 24px', border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: '0.65rem' }}>Save</button>
              <button onClick={() => setEditingProject(false)} className="btn-ghost" style={{ padding: '8px 20px', borderRadius: 2, cursor: 'pointer', fontSize: '0.65rem' }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.55rem', letterSpacing: '0.15em', color: statusColor[project.status] ?? '#555', textTransform: 'uppercase', border: '1px solid currentColor', padding: '2px 10px', borderRadius: 2 }}>{project.status}</span>
              <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', color: '#c0c0c0', marginTop: 8, letterSpacing: '0.05em' }}>{project.title}</h1>
              {project.genre && <p style={{ fontFamily: "'EB Garamond', serif", color: '#666', fontStyle: 'italic', marginTop: 2 }}>{project.genre}</p>}
              {project.description && <p style={{ fontFamily: "'EB Garamond', serif", color: '#555', marginTop: 6, maxWidth: 600, lineHeight: 1.6, fontSize: '0.95rem' }}>{project.description}</p>}
            </div>
            <button onClick={() => setEditingProject(true)} className="btn-ghost" style={{ padding: '8px 20px', borderRadius: 2, cursor: 'pointer', fontSize: '0.6rem', letterSpacing: '0.1em' }}>✎ Edit Project</button>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a1a', marginBottom: 32, overflowX: 'auto', gap: 0 }}>
        {TABS.map(t => <button key={t.id} style={tabBtnStyle(t.id)} onClick={() => setTab(t.id)}>{t.icon} {t.label}</button>)}
      </div>

      {/* ─── OVERVIEW ─── */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {[
            { label: 'Screenplays', value: '—', icon: '✦', link: '/screenplays' },
            { label: 'Songs', value: songs.length, icon: '♪' },
            { label: 'Targets', value: `${targets.filter(t => t.completed).length} / ${targets.length}`, icon: '◆' },
            { label: 'Entities', value: entities.length, icon: '◉' },
            { label: 'Call Sheets', value: callSheets.length, icon: '◷' },
            { label: 'Arts', value: arts.length, icon: '✧' },
            { label: 'Log Entries', value: logs.length, icon: '◎' },
            { label: 'Memos', value: memos.length, icon: '✉' },
          ].map(stat => (
            <div key={stat.label} className="card-hover" style={{ background: '#111', padding: '20px 24px', borderRadius: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.5rem', letterSpacing: '0.2em', color: '#444', textTransform: 'uppercase', marginBottom: 6 }}>{stat.label}</p>
                  <p style={{ fontFamily: "'Cinzel', serif", fontSize: '1.8rem', fontWeight: 700, color: '#c0c0c0' }}>{stat.value}</p>
                </div>
                <span style={{ color: '#222', fontSize: '1.4rem' }}>{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── MEMOS ─── */}
      {tab === 'memos' && (
        <div>
          {sectionTitle('Memos')}
          <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 4, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={labelS}>Title</label>
                <input className="input-dark" value={memoForm.title} onChange={e => setMemoForm(f => ({ ...f, title: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 2 }} />
              </div>
              <div>
                <label style={labelS}>Color Tag</label>
                <select className="input-dark" value={memoForm.color} onChange={e => setMemoForm(f => ({ ...f, color: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 2, cursor: 'pointer' }}>
                  {[['#1a1a1a', 'Default'], ['#1a2a1a', 'Green'], ['#2a1a1a', 'Red'], ['#1a1a2a', 'Blue'], ['#2a2a1a', 'Yellow'], ['#2a1a2a', 'Purple']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={labelS}>Content</label>
              <textarea className="input-dark" value={memoForm.content} onChange={e => setMemoForm(f => ({ ...f, content: e.target.value }))} rows={3} style={{ width: '100%', padding: '9px 12px', borderRadius: 2, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <label style={{ ...labelS, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={memoForm.pinned} onChange={e => setMemoForm(f => ({ ...f, pinned: e.target.checked })) } style={{ accentColor: '#c0c0c0' }} /> Pin Memo
              </label>
              <button onClick={() => add('memos', memoForm, setMemos, () => setMemoForm({ title: '', content: '', color: '#1a1a1a', pinned: false }))}
                disabled={!memoForm.title || loading} className="btn-primary"
                style={{ padding: '8px 20px', border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: '0.65rem', marginLeft: 'auto' }}>Add Memo</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {memos.length === 0 && <p style={{ fontFamily: "'EB Garamond', serif", color: '#444', fontStyle: 'italic' }}>No memos yet.</p>}
            {memos.map(m => (
              <div key={m.id} style={{ background: m.color, border: '1px solid #2a2a2a', borderRadius: 4, overflow: 'hidden' }}>
                {editingMemo === m.id ? (
                  <div style={{ padding: 16 }}>
                    <input className="input-dark" value={editMemoData.title} onChange={e => setEditMemoData((d: any) => ({ ...d, title: e.target.value }))} style={{ width: '100%', padding: '7px 10px', borderRadius: 2, marginBottom: 8 }} />
                    <textarea className="input-dark" value={editMemoData.content} onChange={e => setEditMemoData((d: any) => ({ ...d, content: e.target.value }))} rows={3} style={{ width: '100%', padding: '7px 10px', borderRadius: 2, resize: 'none', marginBottom: 8 }} />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={async () => { await supabase.from('memos').update({ title: editMemoData.title, content: editMemoData.content }).eq('id', m.id); setMemos(p => p.map(x => x.id === m.id ? { ...x, ...editMemoData } : x)); setEditingMemo(null) }} className="btn-primary" style={{ flex: 1, padding: '6px', border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: '0.6rem' }}>Save</button>
                      <button onClick={() => setEditingMemo(null)} className="btn-ghost" style={{ flex: 1, padding: '6px', borderRadius: 2, cursor: 'pointer', fontSize: '0.6rem' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ padding: '16px 16px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.75rem', color: '#c0c0c0', letterSpacing: '0.05em', flex: 1 }}>{m.pinned ? '📌 ' : ''}{m.title}</p>
                      </div>
                      {m.content && <p style={{ fontFamily: "'EB Garamond', serif", color: '#888', fontSize: '0.9rem', lineHeight: 1.5 }}>{m.content}</p>}
                      <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '0.7rem', color: '#444', marginTop: 10 }}>{new Date(m.created_at).toLocaleDateString()}</p>
                    </div>
                    <div style={{ borderTop: '1px solid #2a2a2a', display: 'flex' }}>
                      <button onClick={() => { setEditingMemo(m.id); setEditMemoData({ title: m.title, content: m.content }) }} style={{ flex: 1, padding: '8px', background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: '0.5rem', letterSpacing: '0.1em', borderRight: '1px solid #2a2a2a' }}>✎ Edit</button>
                      <button onClick={() => del('memos', m.id, setMemos)} style={{ padding: '8px 14px', background: 'transparent', border: 'none', color: '#4a2a2a', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── ENTITIES ─── */}
      {tab === 'entities' && (
        <div>
          {sectionTitle('Cast, Crew & Connections')}
          <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 4, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 10 }}>
              {[{ label: 'Name *', key: 'name' }, { label: 'Role / Title', key: 'role' }, { label: 'Email', key: 'email' }, { label: 'Phone', key: 'phone' }].map(f => (
                <div key={f.key}>
                  <label style={labelS}>{f.label}</label>
                  <input className="input-dark" value={(entityForm as any)[f.key]} onChange={e => setEntityForm(frm => ({ ...frm, [f.key]: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 2 }} />
                </div>
              ))}
              <div>
                <label style={labelS}>Category</label>
                <select className="input-dark" value={entityForm.category} onChange={e => setEntityForm(f => ({ ...f, category: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 2, cursor: 'pointer' }}>
                  {ENTITY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={labelS}>Notes</label>
              <input className="input-dark" value={entityForm.notes} onChange={e => setEntityForm(f => ({ ...f, notes: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 2 }} />
            </div>
            <button onClick={() => add('entities', entityForm, setEntities, () => setEntityForm({ name: '', role: '', category: 'cast', email: '', phone: '', notes: '' }))}
              disabled={!entityForm.name || loading} className="btn-primary"
              style={{ padding: '9px 24px', border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: '0.65rem' }}>Add Entity</button>
          </div>

          {/* Group by category */}
          {ENTITY_CATEGORIES.map(cat => {
            const group = entities.filter(e => e.category === cat)
            if (group.length === 0) return null
            return (
              <div key={cat} style={{ marginBottom: 28 }}>
                <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.55rem', letterSpacing: '0.2em', color: '#555', textTransform: 'uppercase', marginBottom: 10, borderBottom: '1px solid #1a1a1a', paddingBottom: 6 }}>{cat}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {group.map(e => (
                    <div key={e.id} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 4, overflow: 'hidden' }}>
                      {editingEntity === e.id ? (
                        <div style={{ padding: 14 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 8 }}>
                            {[{ l: 'Name', k: 'name' }, { l: 'Role', k: 'role' }, { l: 'Email', k: 'email' }, { l: 'Phone', k: 'phone' }].map(f => (
                              <div key={f.k}>
                                <label style={{ ...labelS, fontSize: '0.45rem' }}>{f.l}</label>
                                <input className="input-dark" value={editEntityData[f.k] ?? ''} onChange={ev => setEditEntityData((d: any) => ({ ...d, [f.k]: ev.target.value }))} style={{ width: '100%', padding: '7px 10px', borderRadius: 2 }} />
                              </div>
                            ))}
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            <label style={{ ...labelS, fontSize: '0.45rem' }}>Notes</label>
                            <input className="input-dark" value={editEntityData.notes ?? ''} onChange={ev => setEditEntityData((d: any) => ({ ...d, notes: ev.target.value }))} style={{ width: '100%', padding: '7px 10px', borderRadius: 2 }} />
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={async () => { await supabase.from('entities').update(editEntityData).eq('id', e.id); setEntities(p => p.map(x => x.id === e.id ? { ...x, ...editEntityData } : x)); setEditingEntity(null) }} className="btn-primary" style={{ flex: 1, padding: '6px', border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: '0.6rem' }}>Save</button>
                            <button onClick={() => setEditingEntity(null)} className="btn-ghost" style={{ flex: 1, padding: '6px', borderRadius: 2, cursor: 'pointer', fontSize: '0.6rem' }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
                          <div>
                            <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.8rem', color: '#c0c0c0', letterSpacing: '0.04em' }}>{e.name}</p>
                            {e.role && <p style={{ fontFamily: "'EB Garamond', serif", color: '#666', fontSize: '0.85rem', fontStyle: 'italic' }}>{e.role}</p>}
                            <div style={{ display: 'flex', gap: 16, marginTop: 4, flexWrap: 'wrap' }}>
                              {e.email && <a href={`mailto:${e.email}`} style={{ fontFamily: "'EB Garamond', serif", color: '#555', fontSize: '0.8rem', textDecoration: 'none' }}>✉ {e.email}</a>}
                              {e.phone && <span style={{ fontFamily: "'EB Garamond', serif", color: '#555', fontSize: '0.8rem' }}>✆ {e.phone}</span>}
                              {e.notes && <span style={{ fontFamily: "'EB Garamond', serif", color: '#444', fontSize: '0.8rem', fontStyle: 'italic' }}>{e.notes}</span>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => { setEditingEntity(e.id); setEditEntityData({ name: e.name, role: e.role, email: e.email, phone: e.phone, notes: e.notes }) }} style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', padding: '6px 10px', fontSize: '0.75rem' }}>✎</button>
                            <button onClick={() => del('entities', e.id, setEntities)} style={{ background: 'transparent', border: 'none', color: '#4a2a2a', cursor: 'pointer', padding: '6px 10px', fontSize: '0.75rem' }}>✕</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          {entities.length === 0 && <p style={{ fontFamily: "'EB Garamond', serif", color: '#444', fontStyle: 'italic' }}>No entities added yet.</p>}
        </div>
      )}

      {/* ─── CALL SHEET ─── */}
      {tab === 'callsheet' && (
        <div>
          {sectionTitle('Call Sheets')}
          <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 4, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 10 }}>
              {[
                { label: 'Sheet Title *', key: 'title', type: 'text' },
                { label: 'Shoot Date', key: 'shoot_date', type: 'date' },
                { label: 'Location', key: 'location', type: 'text' },
                { label: 'General Call Time', key: 'general_call_time', type: 'time' },
              ].map(f => (
                <div key={f.key}>
                  <label style={labelS}>{f.label}</label>
                  <input type={f.type} className="input-dark" value={(csForm as any)[f.key]} onChange={e => setCsForm(frm => ({ ...frm, [f.key]: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 2 }} />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={labelS}>Notes</label>
              <textarea className="input-dark" value={csForm.notes} onChange={e => setCsForm(f => ({ ...f, notes: e.target.value }))} rows={2} style={{ width: '100%', padding: '9px 12px', borderRadius: 2, resize: 'none' }} />
            </div>
            <button onClick={() => add('call_sheets', csForm, setCallSheets, () => setCsForm({ title: '', shoot_date: '', location: '', general_call_time: '', notes: '' }))}
              disabled={!csForm.title || loading} className="btn-primary"
              style={{ padding: '9px 24px', border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: '0.65rem' }}>Create Call Sheet</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {callSheets.length === 0 && <p style={{ fontFamily: "'EB Garamond', serif", color: '#444', fontStyle: 'italic' }}>No call sheets yet.</p>}
            {callSheets.map(cs => (
              <div key={cs.id} className="card-hover" style={{ background: '#111', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.95rem', color: '#c0c0c0', letterSpacing: '0.05em', marginBottom: 6 }}>{cs.title}</p>
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                      {cs.shoot_date && <span style={{ fontFamily: "'EB Garamond', serif", color: '#888', fontSize: '0.85rem' }}>📅 {new Date(cs.shoot_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>}
                      {cs.general_call_time && <span style={{ fontFamily: "'EB Garamond', serif", color: '#888', fontSize: '0.85rem' }}>⏰ Call: {cs.general_call_time}</span>}
                      {cs.location && <span style={{ fontFamily: "'EB Garamond', serif", color: '#888', fontSize: '0.85rem' }}>📍 {cs.location}</span>}
                    </div>
                    {cs.notes && <p style={{ fontFamily: "'EB Garamond', serif", color: '#555', fontSize: '0.85rem', marginTop: 8, fontStyle: 'italic' }}>{cs.notes}</p>}
                  </div>
                  <button onClick={() => del('call_sheets', cs.id, setCallSheets)} style={{ background: 'transparent', border: 'none', color: '#4a2a2a', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
                </div>
                {/* Entity call times from this project */}
                {entities.length > 0 && (
                  <div style={{ borderTop: '1px solid #1a1a1a', padding: '12px 24px' }}>
                    <p style={{ ...labelS, marginBottom: 8 }}>Cast & Crew on this sheet</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {entities.filter(e => e.category === 'cast' || e.category === 'crew').map(e => (
                        <span key={e.id} style={{ fontFamily: "'EB Garamond', serif", fontSize: '0.8rem', color: '#666', background: '#1a1a1a', padding: '3px 10px', borderRadius: 2, border: '1px solid #2a2a2a' }}>
                          {e.name}{e.role ? ` — ${e.role}` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── ANALYTICS / PRODUCTION LOG ─── */}
      {tab === 'analytics' && (
        <div>
          {sectionTitle('Production Log & Analytics')}
          <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 4, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={labelS}>Entry Title *</label>
                <input className="input-dark" value={logForm.title} onChange={e => setLogForm(f => ({ ...f, title: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 2 }} />
              </div>
              <div>
                <label style={labelS}>Type</label>
                <select className="input-dark" value={logForm.log_type} onChange={e => setLogForm(f => ({ ...f, log_type: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 2, cursor: 'pointer' }}>
                  {LOG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelS}>Value (optional)</label>
                <input className="input-dark" type="number" value={logForm.value} onChange={e => setLogForm(f => ({ ...f, value: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 2 }} />
              </div>
              <div>
                <label style={labelS}>Unit</label>
                <input className="input-dark" value={logForm.unit} placeholder="hrs, ₹, days..." onChange={e => setLogForm(f => ({ ...f, unit: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 2 }} />
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={labelS}>Notes</label>
              <input className="input-dark" value={logForm.notes} onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 2 }} />
            </div>
            <button onClick={() => add('production_logs', { ...logForm, value: logForm.value ? parseFloat(logForm.value) : null, logged_at: new Date().toISOString() }, setLogs, () => setLogForm({ title: '', log_type: 'update', value: '', unit: '', notes: '' }))}
              disabled={!logForm.title || loading} className="btn-primary"
              style={{ padding: '9px 24px', border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: '0.65rem' }}>Log Entry</button>
          </div>

          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
            {LOG_TYPES.map(lt => {
              const group = logs.filter(l => l.log_type === lt)
              if (group.length === 0) return null
              const total = group.reduce((s, l) => s + (l.value ?? 0), 0)
              return (
                <div key={lt} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 4, padding: '16px 20px' }}>
                  <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.5rem', letterSpacing: '0.18em', color: '#444', textTransform: 'uppercase', marginBottom: 6 }}>{lt}</p>
                  <p style={{ fontFamily: "'Cinzel', serif", fontSize: '1.6rem', color: '#c0c0c0', fontWeight: 700 }}>{group.length}</p>
                  {total > 0 && <p style={{ fontFamily: "'EB Garamond', serif", color: '#555', fontSize: '0.8rem', marginTop: 2 }}>Total: {total} {group[0].unit}</p>}
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {logs.length === 0 && <p style={{ fontFamily: "'EB Garamond', serif", color: '#444', fontStyle: 'italic' }}>No log entries yet.</p>}
            {logs.map(l => (
              <div key={l.id} className="card-hover" style={{ background: '#111', padding: '14px 20px', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.5rem', letterSpacing: '0.12em', color: '#555', textTransform: 'uppercase', border: '1px solid #2a2a2a', padding: '1px 7px', borderRadius: 2 }}>{l.log_type}</span>
                    {l.value != null && <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.65rem', color: '#888' }}>{l.value} {l.unit}</span>}
                  </div>
                  <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.8rem', color: '#c0c0c0', letterSpacing: '0.04em' }}>{l.title}</p>
                  {l.notes && <p style={{ fontFamily: "'EB Garamond', serif", color: '#555', fontSize: '0.82rem', fontStyle: 'italic', marginTop: 3 }}>{l.notes}</p>}
                  <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '0.7rem', color: '#333', marginTop: 4 }}>{new Date(l.logged_at).toLocaleString()}</p>
                </div>
                <button onClick={() => del('production_logs', l.id, setLogs)} style={{ background: 'transparent', border: 'none', color: '#4a2a2a', cursor: 'pointer', padding: '8px' }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── SONGS ─── */}
      {tab === 'songs' && (
        <div>
          {sectionTitle('Songs & Music')}
          <form onSubmit={e => { e.preventDefault(); add('songs', songForm, setSongs, () => setSongForm({ title: '', artist: '', url: '' })) }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 24, padding: 20, background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 4 }}>
            {[{ label: 'Song Title *', key: 'title' }, { label: 'Artist', key: 'artist' }, { label: 'URL / Link', key: 'url' }].map(f => (
              <div key={f.key}>
                <label style={labelS}>{f.label}</label>
                <input className="input-dark" value={(songForm as any)[f.key]} onChange={e => setSongForm(frm => ({ ...frm, [f.key]: e.target.value }))} required={f.key === 'title'} style={{ width: '100%', padding: '9px 12px', borderRadius: 2 }} />
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '10px', border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: '0.65rem' }}>Add Song</button>
            </div>
          </form>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {songs.length === 0 && <p style={{ fontFamily: "'EB Garamond', serif", color: '#444', fontStyle: 'italic' }}>No songs added yet.</p>}
            {songs.map(s => (
              <div key={s.id} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 4, overflow: 'hidden' }}>
                {editingSong === s.id ? (
                  <div style={{ padding: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                    {[{ l: 'Title', k: 'title' }, { l: 'Artist', k: 'artist' }, { l: 'URL', k: 'url' }].map(f => (
                      <div key={f.k}>
                        <label style={{ ...labelS, fontSize: '0.45rem' }}>{f.l}</label>
                        <input className="input-dark" value={editSongData[f.k] ?? ''} onChange={e => setEditSongData((d: any) => ({ ...d, [f.k]: e.target.value }))} style={{ width: '100%', padding: '7px 10px', borderRadius: 2 }} />
                      </div>
                    ))}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                      <button onClick={async () => { await supabase.from('songs').update(editSongData).eq('id', s.id); setSongs(p => p.map(x => x.id === s.id ? { ...x, ...editSongData } : x)); setEditingSong(null) }} className="btn-primary" style={{ flex: 1, padding: '7px', border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: '0.6rem' }}>Save</button>
                      <button onClick={() => setEditingSong(null)} className="btn-ghost" style={{ flex: 1, padding: '7px', borderRadius: 2, cursor: 'pointer', fontSize: '0.6rem' }}>✕</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px' }}>
                    <div>
                      <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1rem', color: '#c0c0c0' }}>♪ {s.title}</p>
                      {s.artist && <p style={{ fontFamily: "'EB Garamond', serif", color: '#555', fontSize: '0.85rem' }}>{s.artist}</p>}
                      {s.url && <a href={s.url} target="_blank" rel="noreferrer" style={{ color: '#888', fontSize: '0.7rem', fontFamily: "'Cinzel', serif", letterSpacing: '0.08em' }}>→ Open Link</a>}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => { setEditingSong(s.id); setEditSongData({ title: s.title, artist: s.artist, url: s.url }) }} style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', padding: '6px 10px', fontSize: '0.75rem' }}>✎</button>
                      <button onClick={() => del('songs', s.id, setSongs)} style={{ background: 'transparent', border: 'none', color: '#4a2a2a', cursor: 'pointer', padding: '6px 10px', fontSize: '0.75rem' }}>✕</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TARGETS ─── */}
      {tab === 'targets' && (
        <div>
          {sectionTitle('Targets & Milestones')}
          <form onSubmit={e => { e.preventDefault(); add('targets', targetForm, setTargets, () => setTargetForm({ title: '', description: '', due_date: '' })) }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 24, padding: 20, background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 4 }}>
            {[{ label: 'Target *', key: 'title' }, { label: 'Description', key: 'description' }].map(f => (
              <div key={f.key}>
                <label style={labelS}>{f.label}</label>
                <input className="input-dark" value={(targetForm as any)[f.key]} onChange={e => setTargetForm(frm => ({ ...frm, [f.key]: e.target.value }))} required={f.key === 'title'} style={{ width: '100%', padding: '9px 12px', borderRadius: 2 }} />
              </div>
            ))}
            <div>
              <label style={labelS}>Due Date</label>
              <input type="date" className="input-dark" value={targetForm.due_date} onChange={e => setTargetForm(f => ({ ...f, due_date: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 2 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '10px', border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: '0.65rem' }}>Add Target</button>
            </div>
          </form>

          {/* Progress bar */}
          {targets.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.55rem', letterSpacing: '0.15em', color: '#555', textTransform: 'uppercase' }}>Progress</span>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.55rem', color: '#888' }}>{targets.filter(t => t.completed).length} / {targets.length}</span>
              </div>
              <div style={{ height: 3, background: '#1a1a1a', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#c0c0c0', width: `${(targets.filter(t => t.completed).length / targets.length) * 100}%`, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {targets.length === 0 && <p style={{ fontFamily: "'EB Garamond', serif", color: '#444', fontStyle: 'italic' }}>No targets yet.</p>}
            {targets.map(t => (
              <div key={t.id} className="card-hover" style={{ background: '#111', borderRadius: 4, overflow: 'hidden', opacity: t.completed ? 0.6 : 1 }}>
                {editingTarget === t.id ? (
                  <div style={{ padding: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                    {[{ l: 'Title', k: 'title' }, { l: 'Description', k: 'description' }].map(f => (
                      <div key={f.k}>
                        <label style={{ ...labelS, fontSize: '0.45rem' }}>{f.l}</label>
                        <input className="input-dark" value={editTargetData[f.k] ?? ''} onChange={e => setEditTargetData((d: any) => ({ ...d, [f.k]: e.target.value }))} style={{ width: '100%', padding: '7px 10px', borderRadius: 2 }} />
                      </div>
                    ))}
                    <div>
                      <label style={{ ...labelS, fontSize: '0.45rem' }}>Due Date</label>
                      <input type="date" className="input-dark" value={editTargetData.due_date ?? ''} onChange={e => setEditTargetData((d: any) => ({ ...d, due_date: e.target.value }))} style={{ width: '100%', padding: '7px 10px', borderRadius: 2 }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                      <button onClick={async () => { await supabase.from('targets').update(editTargetData).eq('id', t.id); setTargets(p => p.map(x => x.id === t.id ? { ...x, ...editTargetData } : x)); setEditingTarget(null) }} className="btn-primary" style={{ flex: 1, padding: '7px', border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: '0.6rem' }}>Save</button>
                      <button onClick={() => setEditingTarget(null)} className="btn-ghost" style={{ flex: 1, padding: '7px', borderRadius: 2, cursor: 'pointer', fontSize: '0.6rem' }}>✕</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px' }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <button onClick={() => toggleTarget(t)} style={{ background: 'none', border: `1px solid ${t.completed ? '#c0c0c0' : '#333'}`, width: 20, height: 20, borderRadius: 2, cursor: 'pointer', color: '#c0c0c0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', flexShrink: 0, marginTop: 2 }}>{t.completed ? '✓' : ''}</button>
                      <div>
                        <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.85rem', color: '#c0c0c0', textDecoration: t.completed ? 'line-through' : 'none', letterSpacing: '0.04em' }}>{t.title}</p>
                        {t.description && <p style={{ fontFamily: "'EB Garamond', serif", color: '#555', fontSize: '0.85rem', marginTop: 3 }}>{t.description}</p>}
                        {t.due_date && <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.5rem', letterSpacing: '0.15em', color: '#444', textTransform: 'uppercase', marginTop: 4 }}>Due: {new Date(t.due_date).toLocaleDateString()}</p>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => { setEditingTarget(t.id); setEditTargetData({ title: t.title, description: t.description, due_date: t.due_date }) }} style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', padding: '6px 10px', fontSize: '0.75rem' }}>✎</button>
                      <button onClick={() => del('targets', t.id, setTargets)} style={{ background: 'transparent', border: 'none', color: '#4a2a2a', cursor: 'pointer', padding: '6px 10px', fontSize: '0.75rem' }}>✕</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── ARTS ─── */}
      {tab === 'arts' && (
        <div>
          {sectionTitle('Arts & Images')}
          <form onSubmit={uploadArt} style={{ marginBottom: 24, padding: 20, background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 4 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={labelS}>Title (optional)</label>
                <input className="input-dark" value={artTitle} onChange={e => setArtTitle(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 2 }} />
              </div>
              <div>
                <label style={labelS}>Image File *</label>
                <input ref={fileRef} type="file" accept="image/*" onChange={e => setArtFile(e.target.files?.[0] ?? null)} required
                  style={{ padding: '9px 12px', background: '#111', border: '1px solid #2a2a2a', color: '#888', borderRadius: 2, fontFamily: "'EB Garamond', serif", cursor: 'pointer', width: '100%' }} />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading || !artFile}
              style={{ padding: '9px 24px', border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: '0.65rem' }}>
              {loading ? 'Uploading...' : 'Upload Image'}
            </button>
          </form>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {arts.length === 0 && <p style={{ fontFamily: "'EB Garamond', serif", color: '#444', fontStyle: 'italic' }}>No images yet.</p>}
            {arts.map(a => (
              <div key={a.id} className="card-hover" style={{ background: '#111', borderRadius: 4, overflow: 'hidden' }}>
                <img src={a.url} alt={a.title} style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
                <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontFamily: "'EB Garamond', serif", color: '#888', fontSize: '0.85rem' }}>{a.title}</p>
                  <button onClick={() => del('arts', a.id, setArts)} style={{ background: 'none', border: 'none', color: '#4a2a2a', cursor: 'pointer', fontSize: '0.9rem' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}