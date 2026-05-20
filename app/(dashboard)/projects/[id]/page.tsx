'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type Tab = 'overview' | 'songs' | 'targets' | 'arts' | 'memos' | 'entities' | 'callsheet' | 'analytics'

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'overview',  icon: '◈', label: 'Overview'   },
  { id: 'memos',     icon: '✉', label: 'Memos'      },
  { id: 'entities',  icon: '◉', label: 'Entities'   },
  { id: 'callsheet', icon: '◷', label: 'Call Sheet' },
  { id: 'analytics', icon: '◎', label: 'Analytics'  },
  { id: 'songs',     icon: '♪', label: 'Songs'      },
  { id: 'targets',   icon: '◆', label: 'Targets'    },
  { id: 'arts',      icon: '✧', label: 'Arts'       },
]

// Hard-coded palette — no CSS variables so they always render
const C = {
  bg:        '#0a0a0a',
  surface:   '#161616',
  surface2:  '#1e1e1e',
  border:    '#2e2e2e',
  border2:   '#3a3a3a',
  text:      '#eeeeee',   // primary — near white
  textSub:   '#aaaaaa',   // secondary — light grey
  textMuted: '#777777',   // muted — mid grey
  textFaint: '#484848',   // faint — dark grey
  silver:    '#c8c8c8',
  accent:    '#d4af6a',   // gold
  danger:    '#c0544a',
  green:     '#6aab7a',
}

const inputS: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 2,
  background: C.surface2, border: `1px solid ${C.border}`,
  color: C.text, fontFamily: "'EB Garamond', serif", fontSize: '1rem',
}

const labelS: React.CSSProperties = {
  fontFamily: "'Cinzel', serif", fontSize: '0.55rem', letterSpacing: '0.18em',
  color: C.textMuted, textTransform: 'uppercase' as const, display: 'block', marginBottom: 6,
}

const cardS: React.CSSProperties = {
  background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4,
}

const sectionHead = (title: string) => (
  <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '0.62rem', letterSpacing: '0.28em',
    color: C.textMuted, textTransform: 'uppercase', marginBottom: 20,
    paddingBottom: 10, borderBottom: `1px solid ${C.border}` }}>
    {title}
  </h2>
)

const ENTITY_CATEGORIES = ['cast', 'crew', 'vendor', 'location', 'executive', 'other']
const LOG_TYPES = ['update', 'shoot-day', 'budget', 'milestone', 'issue', 'note']
const statusColor: Record<string, string> = {
  'development': '#7a8fa6', 'pre-production': '#6aab7a',
  'production': '#a88c5a', 'post-production': '#8a7ab8', 'completed': '#c8c8c8',
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const [project, setProject]       = useState<any>(null)
  const [tab, setTab]               = useState<Tab>('overview')
  const [songs, setSongs]           = useState<any[]>([])
  const [targets, setTargets]       = useState<any[]>([])
  const [arts, setArts]             = useState<any[]>([])
  const [memos, setMemos]           = useState<any[]>([])
  const [entities, setEntities]     = useState<any[]>([])
  const [callSheets, setCallSheets] = useState<any[]>([])
  const [logs, setLogs]             = useState<any[]>([])
  const [loading, setLoading]       = useState(false)
  const [editingProject, setEditingProject] = useState(false)
  const [projEdit, setProjEdit]     = useState<any>({})
  const fileRef = useRef<HTMLInputElement>(null)

  const [songForm,   setSongForm]   = useState({ title: '', artist: '', url: '' })
  const [targetForm, setTargetForm] = useState({ title: '', description: '', due_date: '' })
  const [artTitle,   setArtTitle]   = useState('')
  const [artFile,    setArtFile]    = useState<File | null>(null)
  const [memoForm,   setMemoForm]   = useState({ title: '', content: '', color: '#1a1a1a', pinned: false })
  const [entityForm, setEntityForm] = useState({ name: '', role: '', category: 'cast', email: '', phone: '', notes: '' })
  const [csForm,     setCsForm]     = useState({ title: '', shoot_date: '', location: '', general_call_time: '', notes: '' })
  const [logForm,    setLogForm]    = useState({ title: '', log_type: 'update', value: '', unit: '', notes: '' })

  const [editingMemo,   setEditingMemo]   = useState<string | null>(null)
  const [editMemoData,  setEditMemoData]  = useState<any>({})
  const [editingEntity, setEditingEntity] = useState<string | null>(null)
  const [editEntityData,setEditEntityData]= useState<any>({})
  const [editingTarget, setEditingTarget] = useState<string | null>(null)
  const [editTargetData,setEditTargetData]= useState<any>({})
  const [editingSong,   setEditingSong]   = useState<string | null>(null)
  const [editSongData,  setEditSongData]  = useState<any>({})

  const getUser = async () => { const { data: { user } } = await supabase.auth.getUser(); return user }

  useEffect(() => {
    const load = async () => {
      const { data: p } = await supabase.from('projects').select('*').eq('id', id).single()
      setProject(p)
      setProjEdit({ title: p.title, genre: p.genre ?? '', status: p.status, description: p.description ?? '' })
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

  if (!project) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <p style={{ fontFamily: "'Cinzel', serif", color: C.textMuted, letterSpacing: '0.2em', fontSize: '0.8rem' }}>Loading...</p>
    </div>
  )

  const tabBtnStyle = (t: Tab): React.CSSProperties => ({
    fontFamily: "'Cinzel', serif", fontSize: '0.58rem', letterSpacing: '0.12em',
    textTransform: 'uppercase', padding: '10px 16px', cursor: 'pointer', border: 'none',
    background: tab === t ? C.surface : 'transparent',
    color: tab === t ? C.text : C.textMuted,
    borderBottom: tab === t ? `2px solid ${C.silver}` : '2px solid transparent',
    transition: 'all 0.2s', whiteSpace: 'nowrap' as const, flexShrink: 0,
  })

  const editBtn = (onClick: () => void) => (
    <button onClick={onClick} style={{ background: 'transparent', border: 'none',
      color: C.textMuted, cursor: 'pointer', padding: '6px 10px', fontSize: '0.85rem',
      transition: 'color 0.2s' }}
      onMouseEnter={e => (e.currentTarget.style.color = C.silver)}
      onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}>
      ✎
    </button>
  )

  const delBtn = (onClick: () => void) => (
    <button onClick={onClick} style={{ background: 'transparent', border: 'none',
      color: C.textFaint, cursor: 'pointer', padding: '6px 10px', fontSize: '0.85rem',
      transition: 'color 0.2s' }}
      onMouseEnter={e => (e.currentTarget.style.color = C.danger)}
      onMouseLeave={e => (e.currentTarget.style.color = C.textFaint)}>
      ✕
    </button>
  )

  const saveCancelRow = (onSave: () => void, onCancel: () => void) => (
    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
      <button onClick={onSave} style={{ flex: 1, padding: '8px', background: C.silver,
        color: '#000', border: 'none', borderRadius: 2, cursor: 'pointer',
        fontFamily: "'Cinzel', serif", fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em' }}>
        Save
      </button>
      <button onClick={onCancel} style={{ flex: 1, padding: '8px', background: 'transparent',
        color: C.textSub, border: `1px solid ${C.border}`, borderRadius: 2, cursor: 'pointer',
        fontFamily: "'Cinzel', serif", fontSize: '0.6rem', letterSpacing: '0.1em' }}>
        Cancel
      </button>
    </div>
  )

  return (
    <div style={{ color: C.text }}>
      {/* ── Project Header ── */}
      <div style={{ marginBottom: 32 }}>
        <Link href="/projects" style={{ fontFamily: "'Cinzel', serif", fontSize: '0.58rem',
          letterSpacing: '0.2em', color: C.textMuted, textDecoration: 'none',
          textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          ← Projects
        </Link>

        {editingProject ? (
          <div style={{ marginTop: 16, ...cardS, padding: 24, maxWidth: 600 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              {[{ label: 'Title', key: 'title' }, { label: 'Genre', key: 'genre' }].map(f => (
                <div key={f.key}>
                  <label style={labelS}>{f.label}</label>
                  <input value={projEdit[f.key]} onChange={e => setProjEdit((d: any) => ({ ...d, [f.key]: e.target.value }))} style={inputS} />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelS}>Status</label>
              <select value={projEdit.status} onChange={e => setProjEdit((d: any) => ({ ...d, status: e.target.value }))} style={inputS}>
                {['development','pre-production','production','post-production','completed'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelS}>Description</label>
              <textarea value={projEdit.description} onChange={e => setProjEdit((d: any) => ({ ...d, description: e.target.value }))} rows={2} style={{ ...inputS, resize: 'vertical' }} />
            </div>
            {saveCancelRow(saveProjectEdit, () => setEditingProject(false))}
          </div>
        ) : (
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.55rem', letterSpacing: '0.15em',
                textTransform: 'uppercase', color: statusColor[project.status] ?? C.textMuted,
                border: `1px solid ${statusColor[project.status] ?? C.border}`,
                padding: '3px 12px', borderRadius: 2, display: 'inline-block' }}>
                {project.status}
              </span>
              <h1 style={{ fontFamily: "'Cinzel', serif",
                fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', color: C.text,
                marginTop: 12, letterSpacing: '0.04em', fontWeight: 700 }}>
                {project.title}
              </h1>
              {project.genre && (
                <p style={{ fontFamily: "'EB Garamond', serif", color: C.textSub,
                  fontStyle: 'italic', marginTop: 4, fontSize: '1.05rem' }}>
                  {project.genre}
                </p>
              )}
              {project.description && (
                <p style={{ fontFamily: "'EB Garamond', serif", color: C.textSub,
                  marginTop: 8, maxWidth: 600, lineHeight: 1.65, fontSize: '1rem' }}>
                  {project.description}
                </p>
              )}
            </div>
            <button onClick={() => setEditingProject(true)}
              style={{ padding: '9px 20px', background: 'transparent',
                border: `1px solid ${C.border}`, color: C.textSub, cursor: 'pointer',
                fontFamily: "'Cinzel', serif", fontSize: '0.6rem', letterSpacing: '0.1em',
                borderRadius: 2, textTransform: 'uppercase', transition: 'all 0.2s' }}>
              ✎ Edit Project
            </button>
          </div>
        )}
      </div>

      {/* ── Tab Bar ── */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`,
        marginBottom: 32, overflowX: 'auto' }}>
        {TABS.map(t => <button key={t.id} style={tabBtnStyle(t.id)} onClick={() => setTab(t.id)}>{t.icon} {t.label}</button>)}
      </div>

      {/* ══ OVERVIEW ══ */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          {[
            { label: 'Songs',       value: songs.length,   icon: '♪' },
            { label: 'Targets',     value: `${targets.filter(t=>t.completed).length} / ${targets.length}`, icon: '◆' },
            { label: 'Entities',    value: entities.length, icon: '◉' },
            { label: 'Call Sheets', value: callSheets.length, icon: '◷' },
            { label: 'Log Entries', value: logs.length,    icon: '◎' },
            { label: 'Memos',       value: memos.length,   icon: '✉' },
            { label: 'Arts',        value: arts.length,    icon: '✧' },
          ].map(stat => (
            <div key={stat.label} style={{ ...cardS, padding: '20px 22px', borderRadius: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.52rem',
                    letterSpacing: '0.2em', color: C.textMuted, textTransform: 'uppercase', marginBottom: 8 }}>
                    {stat.label}
                  </p>
                  <p style={{ fontFamily: "'Cinzel', serif", fontSize: '2rem',
                    fontWeight: 700, color: C.text, lineHeight: 1 }}>
                    {stat.value}
                  </p>
                </div>
                <span style={{ color: C.border2, fontSize: '1.2rem' }}>{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ MEMOS ══ */}
      {tab === 'memos' && (
        <div>
          {sectionHead('Memos')}
          <div style={{ ...cardS, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelS}>Title *</label>
                <input style={inputS} value={memoForm.title} onChange={e => setMemoForm(f => ({ ...f, title: e.target.value }))} placeholder="Memo title..." />
              </div>
              <div>
                <label style={labelS}>Color Tag</label>
                <select style={inputS} value={memoForm.color} onChange={e => setMemoForm(f => ({ ...f, color: e.target.value }))}>
                  {[['#161616','Default'],['#0f1f14','Green'],['#1f0f0f','Red'],['#0f0f1f','Blue'],['#1f1c0f','Amber'],['#1a0f1f','Purple']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelS}>Content</label>
              <textarea style={{ ...inputS, resize: 'vertical' }} rows={3} value={memoForm.content} onChange={e => setMemoForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your memo..." />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <label style={{ ...labelS, marginBottom: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={memoForm.pinned} onChange={e => setMemoForm(f => ({ ...f, pinned: e.target.checked }))} style={{ accentColor: C.silver }} />
                <span style={{ color: C.textSub }}>Pin to top</span>
              </label>
              <button disabled={!memoForm.title || loading} onClick={() => add('memos', memoForm, setMemos, () => setMemoForm({ title: '', content: '', color: '#161616', pinned: false }))}
                style={{ padding: '9px 24px', background: C.silver, color: '#000', border: 'none', borderRadius: 2,
                  cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em' }}>
                Add Memo
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {memos.length === 0 && <p style={{ color: C.textMuted, fontStyle: 'italic' }}>No memos yet.</p>}
            {memos.map(m => (
              <div key={m.id} style={{ background: m.color, border: `1px solid ${C.border}`, borderRadius: 4, overflow: 'hidden' }}>
                {editingMemo === m.id ? (
                  <div style={{ padding: 16 }}>
                    <input style={{ ...inputS, marginBottom: 8 }} value={editMemoData.title} onChange={e => setEditMemoData((d: any) => ({ ...d, title: e.target.value }))} />
                    <textarea style={{ ...inputS, resize: 'none', marginBottom: 8 }} rows={3} value={editMemoData.content} onChange={e => setEditMemoData((d: any) => ({ ...d, content: e.target.value }))} />
                    {saveCancelRow(async () => { await supabase.from('memos').update(editMemoData).eq('id', m.id); setMemos(p => p.map(x => x.id === m.id ? { ...x, ...editMemoData } : x)); setEditingMemo(null) }, () => setEditingMemo(null))}
                  </div>
                ) : (
                  <>
                    <div style={{ padding: '18px 18px 12px' }}>
                      <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.85rem', color: C.text, letterSpacing: '0.04em', marginBottom: 8 }}>
                        {m.pinned ? '📌 ' : ''}{m.title}
                      </p>
                      {m.content && <p style={{ fontFamily: "'EB Garamond', serif", color: C.textSub, fontSize: '1rem', lineHeight: 1.6 }}>{m.content}</p>}
                      <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '0.78rem', color: C.textMuted, marginTop: 10 }}>{new Date(m.created_at).toLocaleDateString()}</p>
                    </div>
                    <div style={{ borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end' }}>
                      {editBtn(() => { setEditingMemo(m.id); setEditMemoData({ title: m.title, content: m.content }) })}
                      {delBtn(() => del('memos', m.id, setMemos))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ ENTITIES ══ */}
      {tab === 'entities' && (
        <div>
          {sectionHead('Cast, Crew & Connections')}
          <div style={{ ...cardS, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 10 }}>
              {[{ l: 'Name *', k: 'name' },{ l: 'Role / Title', k: 'role' },{ l: 'Email', k: 'email' },{ l: 'Phone', k: 'phone' }].map(f => (
                <div key={f.k}>
                  <label style={labelS}>{f.l}</label>
                  <input style={inputS} value={(entityForm as any)[f.k]} onChange={e => setEntityForm(fr => ({ ...fr, [f.k]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label style={labelS}>Category</label>
                <select style={inputS} value={entityForm.category} onChange={e => setEntityForm(f => ({ ...f, category: e.target.value }))}>
                  {ENTITY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelS}>Notes</label>
                <input style={inputS} value={entityForm.notes} onChange={e => setEntityForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <button onClick={() => add('entities', entityForm, setEntities, () => setEntityForm({ name: '', role: '', category: 'cast', email: '', phone: '', notes: '' }))}
              disabled={!entityForm.name || loading}
              style={{ padding: '9px 24px', background: C.silver, color: '#000', border: 'none', borderRadius: 2, cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em' }}>
              Add Entity
            </button>
          </div>

          {ENTITY_CATEGORIES.map(cat => {
            const group = entities.filter(e => e.category === cat)
            if (!group.length) return null
            return (
              <div key={cat} style={{ marginBottom: 28 }}>
                <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.56rem', letterSpacing: '0.22em',
                  color: C.textMuted, textTransform: 'uppercase', marginBottom: 10,
                  borderBottom: `1px solid ${C.border}`, paddingBottom: 6 }}>
                  {cat}
                </p>
                {group.map(e => (
                  <div key={e.id} style={{ ...cardS, marginBottom: 6, borderRadius: 4, overflow: 'hidden' }}>
                    {editingEntity === e.id ? (
                      <div style={{ padding: 14 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 8 }}>
                          {[{ l: 'Name', k: 'name' },{ l: 'Role', k: 'role' },{ l: 'Email', k: 'email' },{ l: 'Phone', k: 'phone' }].map(f => (
                            <div key={f.k}>
                              <label style={{ ...labelS, fontSize: '0.48rem' }}>{f.l}</label>
                              <input style={inputS} value={editEntityData[f.k] ?? ''} onChange={ev => setEditEntityData((d: any) => ({ ...d, [f.k]: ev.target.value }))} />
                            </div>
                          ))}
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <label style={{ ...labelS, fontSize: '0.48rem' }}>Notes</label>
                          <input style={inputS} value={editEntityData.notes ?? ''} onChange={ev => setEditEntityData((d: any) => ({ ...d, notes: ev.target.value }))} />
                        </div>
                        {saveCancelRow(async () => { await supabase.from('entities').update(editEntityData).eq('id', e.id); setEntities(p => p.map(x => x.id === e.id ? { ...x, ...editEntityData } : x)); setEditingEntity(null) }, () => setEditingEntity(null))}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px' }}>
                        <div>
                          <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.85rem', color: C.text, letterSpacing: '0.04em' }}>{e.name}</p>
                          {e.role && <p style={{ fontFamily: "'EB Garamond', serif", color: C.textSub, fontSize: '0.92rem', fontStyle: 'italic' }}>{e.role}</p>}
                          <div style={{ display: 'flex', gap: 16, marginTop: 4, flexWrap: 'wrap' }}>
                            {e.email && <a href={`mailto:${e.email}`} style={{ fontFamily: "'EB Garamond', serif", color: C.textMuted, fontSize: '0.88rem', textDecoration: 'none' }}>✉ {e.email}</a>}
                            {e.phone && <span style={{ fontFamily: "'EB Garamond', serif", color: C.textMuted, fontSize: '0.88rem' }}>✆ {e.phone}</span>}
                            {e.notes && <span style={{ fontFamily: "'EB Garamond', serif", color: C.textFaint, fontSize: '0.85rem', fontStyle: 'italic' }}>{e.notes}</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex' }}>{editBtn(() => { setEditingEntity(e.id); setEditEntityData({ name: e.name, role: e.role, email: e.email, phone: e.phone, notes: e.notes }) })}{delBtn(() => del('entities', e.id, setEntities))}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          })}
          {entities.length === 0 && <p style={{ color: C.textMuted, fontStyle: 'italic' }}>No entities added yet.</p>}
        </div>
      )}

      {/* ══ CALL SHEET ══ */}
      {tab === 'callsheet' && (
        <div>
          {sectionHead('Call Sheets')}
          <div style={{ ...cardS, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 10 }}>
              {[{ l: 'Sheet Title *', k: 'title', t: 'text' },{ l: 'Shoot Date', k: 'shoot_date', t: 'date' },{ l: 'Location', k: 'location', t: 'text' },{ l: 'Call Time', k: 'general_call_time', t: 'time' }].map(f => (
                <div key={f.k}>
                  <label style={labelS}>{f.l}</label>
                  <input type={f.t} style={inputS} value={(csForm as any)[f.k]} onChange={e => setCsForm(fr => ({ ...fr, [f.k]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelS}>Notes</label>
              <textarea style={{ ...inputS, resize: 'none' }} rows={2} value={csForm.notes} onChange={e => setCsForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <button onClick={() => add('call_sheets', csForm, setCallSheets, () => setCsForm({ title: '', shoot_date: '', location: '', general_call_time: '', notes: '' }))}
              disabled={!csForm.title || loading}
              style={{ padding: '9px 24px', background: C.silver, color: '#000', border: 'none', borderRadius: 2, cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em' }}>
              Create Call Sheet
            </button>
          </div>
          {callSheets.length === 0 && <p style={{ color: C.textMuted, fontStyle: 'italic' }}>No call sheets yet.</p>}
          {callSheets.map(cs => (
            <div key={cs.id} style={{ ...cardS, borderRadius: 4, marginBottom: 12, overflow: 'hidden' }}>
              <div style={{ padding: '20px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.95rem', color: C.text, letterSpacing: '0.05em', marginBottom: 8 }}>{cs.title}</p>
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    {cs.shoot_date && <span style={{ fontFamily: "'EB Garamond', serif", color: C.textSub, fontSize: '0.95rem' }}>📅 {new Date(cs.shoot_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>}
                    {cs.general_call_time && <span style={{ fontFamily: "'EB Garamond', serif", color: C.textSub, fontSize: '0.95rem' }}>⏰ Call: {cs.general_call_time}</span>}
                    {cs.location && <span style={{ fontFamily: "'EB Garamond', serif", color: C.textSub, fontSize: '0.95rem' }}>📍 {cs.location}</span>}
                  </div>
                  {cs.notes && <p style={{ fontFamily: "'EB Garamond', serif", color: C.textMuted, fontSize: '0.9rem', marginTop: 8, fontStyle: 'italic' }}>{cs.notes}</p>}
                </div>
                {delBtn(() => del('call_sheets', cs.id, setCallSheets))}
              </div>
              {entities.filter(e => e.category === 'cast' || e.category === 'crew').length > 0 && (
                <div style={{ borderTop: `1px solid ${C.border}`, padding: '12px 22px' }}>
                  <p style={{ ...labelS, marginBottom: 8 }}>Cast & Crew</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {entities.filter(e => e.category === 'cast' || e.category === 'crew').map(e => (
                      <span key={e.id} style={{ fontFamily: "'EB Garamond', serif", fontSize: '0.88rem',
                        color: C.textSub, background: C.surface2, padding: '3px 12px',
                        borderRadius: 2, border: `1px solid ${C.border}` }}>
                        {e.name}{e.role ? ` — ${e.role}` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ══ ANALYTICS ══ */}
      {tab === 'analytics' && (
        <div>
          {sectionHead('Production Log & Analytics')}
          <div style={{ ...cardS, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={labelS}>Entry Title *</label>
                <input style={inputS} value={logForm.title} onChange={e => setLogForm(f => ({ ...f, title: e.target.value }))} placeholder="What happened?" />
              </div>
              <div>
                <label style={labelS}>Type</label>
                <select style={inputS} value={logForm.log_type} onChange={e => setLogForm(f => ({ ...f, log_type: e.target.value }))}>
                  {LOG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelS}>Value</label>
                <input type="number" style={inputS} value={logForm.value} onChange={e => setLogForm(f => ({ ...f, value: e.target.value }))} placeholder="0" />
              </div>
              <div>
                <label style={labelS}>Unit</label>
                <input style={inputS} value={logForm.unit} placeholder="hrs, ₹, days…" onChange={e => setLogForm(f => ({ ...f, unit: e.target.value }))} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelS}>Notes</label>
              <input style={inputS} value={logForm.notes} onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional context…" />
            </div>
            <button onClick={() => add('production_logs', { ...logForm, value: logForm.value ? parseFloat(logForm.value) : null, logged_at: new Date().toISOString() }, setLogs, () => setLogForm({ title: '', log_type: 'update', value: '', unit: '', notes: '' }))}
              disabled={!logForm.title || loading}
              style={{ padding: '9px 24px', background: C.silver, color: '#000', border: 'none', borderRadius: 2, cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em' }}>
              Log Entry
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
            {LOG_TYPES.map(lt => {
              const group = logs.filter(l => l.log_type === lt)
              if (!group.length) return null
              const total = group.reduce((s: number, l: any) => s + (l.value ?? 0), 0)
              return (
                <div key={lt} style={{ ...cardS, padding: '16px 20px', borderRadius: 4 }}>
                  <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.5rem', letterSpacing: '0.18em', color: C.textMuted, textTransform: 'uppercase', marginBottom: 6 }}>{lt}</p>
                  <p style={{ fontFamily: "'Cinzel', serif", fontSize: '1.8rem', color: C.text, fontWeight: 700 }}>{group.length}</p>
                  {total > 0 && <p style={{ fontFamily: "'EB Garamond', serif", color: C.textSub, fontSize: '0.85rem', marginTop: 2 }}>Total: {total} {group[0].unit}</p>}
                </div>
              )
            })}
          </div>

          {logs.length === 0 && <p style={{ color: C.textMuted, fontStyle: 'italic' }}>No log entries yet.</p>}
          {logs.map(l => (
            <div key={l.id} style={{ ...cardS, padding: '14px 20px', borderRadius: 4, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.5rem', letterSpacing: '0.12em',
                    color: C.textMuted, textTransform: 'uppercase', border: `1px solid ${C.border}`,
                    padding: '2px 8px', borderRadius: 2 }}>
                    {l.log_type}
                  </span>
                  {l.value != null && <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.7rem', color: C.textSub }}>{l.value} {l.unit}</span>}
                </div>
                <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.85rem', color: C.text, letterSpacing: '0.03em' }}>{l.title}</p>
                {l.notes && <p style={{ fontFamily: "'EB Garamond', serif", color: C.textMuted, fontSize: '0.88rem', fontStyle: 'italic', marginTop: 3 }}>{l.notes}</p>}
                <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '0.75rem', color: C.textFaint, marginTop: 4 }}>{new Date(l.logged_at).toLocaleString()}</p>
              </div>
              {delBtn(() => del('production_logs', l.id, setLogs))}
            </div>
          ))}
        </div>
      )}

      {/* ══ SONGS ══ */}
      {tab === 'songs' && (
        <div>
          {sectionHead('Songs & Music')}
          <div style={{ ...cardS, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
              {[{ l: 'Song Title *', k: 'title' },{ l: 'Artist', k: 'artist' },{ l: 'URL / Link', k: 'url' }].map(f => (
                <div key={f.k}>
                  <label style={labelS}>{f.l}</label>
                  <input style={inputS} value={(songForm as any)[f.k]} onChange={e => setSongForm(fr => ({ ...fr, [f.k]: e.target.value }))} />
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button onClick={() => add('songs', songForm, setSongs, () => setSongForm({ title: '', artist: '', url: '' }))}
                  disabled={!songForm.title || loading}
                  style={{ width: '100%', padding: '10px', background: C.silver, color: '#000', border: 'none', borderRadius: 2, cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em' }}>
                  Add Song
                </button>
              </div>
            </div>
          </div>
          {songs.length === 0 && <p style={{ color: C.textMuted, fontStyle: 'italic' }}>No songs added yet.</p>}
          {songs.map(s => (
            <div key={s.id} style={{ ...cardS, borderRadius: 4, marginBottom: 8, overflow: 'hidden' }}>
              {editingSong === s.id ? (
                <div style={{ padding: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 8 }}>
                    {[{ l: 'Title', k: 'title' },{ l: 'Artist', k: 'artist' },{ l: 'URL', k: 'url' }].map(f => (
                      <div key={f.k}>
                        <label style={{ ...labelS, fontSize: '0.48rem' }}>{f.l}</label>
                        <input style={inputS} value={editSongData[f.k] ?? ''} onChange={e => setEditSongData((d: any) => ({ ...d, [f.k]: e.target.value }))} />
                      </div>
                    ))}
                  </div>
                  {saveCancelRow(async () => { await supabase.from('songs').update(editSongData).eq('id', s.id); setSongs(p => p.map(x => x.id === s.id ? { ...x, ...editSongData } : x)); setEditingSong(null) }, () => setEditingSong(null))}
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px' }}>
                  <div>
                    <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.05rem', color: C.text }}>♪ {s.title}</p>
                    {s.artist && <p style={{ fontFamily: "'EB Garamond', serif", color: C.textSub, fontSize: '0.9rem' }}>{s.artist}</p>}
                    {s.url && <a href={s.url} target="_blank" rel="noreferrer" style={{ fontFamily: "'Cinzel', serif", color: C.textMuted, fontSize: '0.6rem', letterSpacing: '0.1em' }}>→ Open Link</a>}
                  </div>
                  <div style={{ display: 'flex' }}>{editBtn(() => { setEditingSong(s.id); setEditSongData({ title: s.title, artist: s.artist, url: s.url }) })}{delBtn(() => del('songs', s.id, setSongs))}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ══ TARGETS ══ */}
      {tab === 'targets' && (
        <div>
          {sectionHead('Targets & Milestones')}
          <div style={{ ...cardS, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
              {[{ l: 'Target *', k: 'title' },{ l: 'Description', k: 'description' }].map(f => (
                <div key={f.k}>
                  <label style={labelS}>{f.l}</label>
                  <input style={inputS} value={(targetForm as any)[f.k]} onChange={e => setTargetForm(fr => ({ ...fr, [f.k]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label style={labelS}>Due Date</label>
                <input type="date" style={inputS} value={targetForm.due_date} onChange={e => setTargetForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button onClick={() => add('targets', targetForm, setTargets, () => setTargetForm({ title: '', description: '', due_date: '' }))}
                  disabled={!targetForm.title || loading}
                  style={{ width: '100%', padding: '10px', background: C.silver, color: '#000', border: 'none', borderRadius: 2, cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em' }}>
                  Add Target
                </button>
              </div>
            </div>
          </div>

          {targets.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.55rem', letterSpacing: '0.15em', color: C.textMuted, textTransform: 'uppercase' }}>Progress</span>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.6rem', color: C.textSub }}>{targets.filter(t => t.completed).length} / {targets.length} complete</span>
              </div>
              <div style={{ height: 3, background: C.border, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: C.silver, borderRadius: 2,
                  width: `${targets.length ? (targets.filter(t => t.completed).length / targets.length) * 100 : 0}%`,
                  transition: 'width 0.4s ease' }} />
              </div>
            </div>
          )}

          {targets.length === 0 && <p style={{ color: C.textMuted, fontStyle: 'italic' }}>No targets yet.</p>}
          {targets.map(t => (
            <div key={t.id} style={{ ...cardS, borderRadius: 4, marginBottom: 8, overflow: 'hidden', opacity: t.completed ? 0.55 : 1 }}>
              {editingTarget === t.id ? (
                <div style={{ padding: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 8 }}>
                    {[{ l: 'Title', k: 'title' },{ l: 'Description', k: 'description' }].map(f => (
                      <div key={f.k}>
                        <label style={{ ...labelS, fontSize: '0.48rem' }}>{f.l}</label>
                        <input style={inputS} value={editTargetData[f.k] ?? ''} onChange={e => setEditTargetData((d: any) => ({ ...d, [f.k]: e.target.value }))} />
                      </div>
                    ))}
                    <div>
                      <label style={{ ...labelS, fontSize: '0.48rem' }}>Due Date</label>
                      <input type="date" style={inputS} value={editTargetData.due_date ?? ''} onChange={e => setEditTargetData((d: any) => ({ ...d, due_date: e.target.value }))} />
                    </div>
                  </div>
                  {saveCancelRow(async () => { await supabase.from('targets').update(editTargetData).eq('id', t.id); setTargets(p => p.map(x => x.id === t.id ? { ...x, ...editTargetData } : x)); setEditingTarget(null) }, () => setEditingTarget(null))}
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px' }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <button onClick={() => toggleTarget(t)}
                      style={{ width: 20, height: 20, flexShrink: 0, marginTop: 3,
                        background: t.completed ? C.silver : 'transparent',
                        border: `1px solid ${t.completed ? C.silver : C.border2}`,
                        borderRadius: 2, cursor: 'pointer', color: '#000',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', transition: 'all 0.2s' }}>
                      {t.completed ? '✓' : ''}
                    </button>
                    <div>
                      <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.85rem', color: C.text, letterSpacing: '0.03em',
                        textDecoration: t.completed ? 'line-through' : 'none' }}>
                        {t.title}
                      </p>
                      {t.description && <p style={{ fontFamily: "'EB Garamond', serif", color: C.textSub, fontSize: '0.92rem', marginTop: 3 }}>{t.description}</p>}
                      {t.due_date && <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.5rem', letterSpacing: '0.15em', color: C.textMuted, textTransform: 'uppercase', marginTop: 4 }}>Due: {new Date(t.due_date).toLocaleDateString()}</p>}
                    </div>
                  </div>
                  <div style={{ display: 'flex' }}>{editBtn(() => { setEditingTarget(t.id); setEditTargetData({ title: t.title, description: t.description, due_date: t.due_date }) })}{delBtn(() => del('targets', t.id, setTargets))}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ══ ARTS ══ */}
      {tab === 'arts' && (
        <div>
          {sectionHead('Arts & Images')}
          <form onSubmit={uploadArt} style={{ ...cardS, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={labelS}>Title (optional)</label>
                <input style={inputS} value={artTitle} onChange={e => setArtTitle(e.target.value)} placeholder="Image title..." />
              </div>
              <div>
                <label style={labelS}>Image File *</label>
                <input ref={fileRef} type="file" accept="image/*" required onChange={e => setArtFile(e.target.files?.[0] ?? null)}
                  style={{ ...inputS, cursor: 'pointer', fontFamily: "'EB Garamond', serif" }} />
              </div>
            </div>
            <button type="submit" disabled={loading || !artFile}
              style={{ padding: '9px 24px', background: C.silver, color: '#000', border: 'none', borderRadius: 2,
                cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em',
                opacity: loading || !artFile ? 0.5 : 1 }}>
              {loading ? 'Uploading…' : 'Upload Image'}
            </button>
          </form>
          {arts.length === 0 && <p style={{ color: C.textMuted, fontStyle: 'italic' }}>No images yet.</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {arts.map(a => (
              <div key={a.id} style={{ ...cardS, borderRadius: 4, overflow: 'hidden' }}>
                <img src={a.url} alt={a.title} style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
                <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontFamily: "'EB Garamond', serif", color: C.textSub, fontSize: '0.9rem' }}>{a.title}</p>
                  {delBtn(() => del('arts', a.id, setArts))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}