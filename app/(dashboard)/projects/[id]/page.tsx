'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type Tab = 'songs' | 'targets' | 'arts'

export default function ProjectDetailPage() {
  const { id } = useParams()
  const [project, setProject] = useState<any>(null)
  const [tab, setTab] = useState<Tab>('songs')
  const [songs, setSongs] = useState<any[]>([])
  const [targets, setTargets] = useState<any[]>([])
  const [arts, setArts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Forms
  const [songTitle, setSongTitle] = useState(''); const [songArtist, setSongArtist] = useState(''); const [songUrl, setSongUrl] = useState('')
  const [targetTitle, setTargetTitle] = useState(''); const [targetDesc, setTargetDesc] = useState(''); const [targetDate, setTargetDate] = useState('')
  const [artTitle, setArtTitle] = useState(''); const [artFile, setArtFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const load = async () => {
      const { data: p } = await supabase.from('projects').select('*').eq('id', id).single()
      setProject(p)
      const [s, t, a] = await Promise.all([
        supabase.from('songs').select('*').eq('project_id', id).order('created_at', { ascending: false }),
        supabase.from('targets').select('*').eq('project_id', id).order('created_at', { ascending: false }),
        supabase.from('arts').select('*').eq('project_id', id).order('created_at', { ascending: false }),
      ])
      setSongs(s.data ?? []); setTargets(t.data ?? []); setArts(a.data ?? [])
    }
    load()
  }, [id])

  const { data: { user } } = { data: { user: null } } // placeholder

  const getUser = async () => { const { data: { user } } = await supabase.auth.getUser(); return user }

  const addSong = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    const user = await getUser()
    const { data } = await supabase.from('songs').insert({ title: songTitle, artist: songArtist, url: songUrl, project_id: id, user_id: user!.id }).select().single()
    if (data) { setSongs(p => [data, ...p]); setSongTitle(''); setSongArtist(''); setSongUrl('') }
    setLoading(false)
  }

  const addTarget = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    const user = await getUser()
    const { data } = await supabase.from('targets').insert({ title: targetTitle, description: targetDesc, due_date: targetDate || null, project_id: id, user_id: user!.id }).select().single()
    if (data) { setTargets(p => [data, ...p]); setTargetTitle(''); setTargetDesc(''); setTargetDate('') }
    setLoading(false)
  }

  const toggleTarget = async (t: any) => {
    await supabase.from('targets').update({ completed: !t.completed }).eq('id', t.id)
    setTargets(prev => prev.map(x => x.id === t.id ? { ...x, completed: !x.completed } : x))
  }

  const uploadArt = async (e: React.FormEvent) => {
    e.preventDefault(); if (!artFile) return; setLoading(true)
    const user = await getUser()
    const ext = artFile.name.split('.').pop()
    const path = `${user!.id}/${id}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('project-assets').upload(path, artFile)
    if (!upErr) {
      const { data: { publicUrl } } = supabase.storage.from('project-assets').getPublicUrl(path)
      const { data } = await supabase.from('arts').insert({ title: artTitle || artFile.name, url: publicUrl, project_id: id, user_id: user!.id }).select().single()
      if (data) { setArts(prev => [data, ...prev]); setArtTitle(''); setArtFile(null); if (fileRef.current) fileRef.current.value = '' }
    }
    setLoading(false)
  }

  const deleteItem = async (table: string, itemId: string, setState: Function) => {
    await supabase.from(table).delete().eq('id', itemId)
    setState((prev: any[]) => prev.filter(x => x.id !== itemId))
  }

  if (!project) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><p style={{ fontFamily: "'Cinzel', serif", color: '#333', letterSpacing: '0.2em' }}>Loading...</p></div>

  const tabStyle = (t: Tab): React.CSSProperties => ({
    fontFamily: "'Cinzel', serif", fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase',
    padding: '10px 20px', cursor: 'pointer', border: 'none', borderRadius: '2px 2px 0 0',
    background: tab === t ? '#111' : 'transparent',
    color: tab === t ? '#c0c0c0' : '#555',
    borderBottom: tab === t ? '2px solid #c0c0c0' : '2px solid transparent',
    transition: 'all 0.2s',
  })

  const inputS: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 2 }

  return (
    <div>
      <Link href="/projects" style={{ fontFamily: "'Cinzel', serif", fontSize: '0.6rem', letterSpacing: '0.2em', color: '#555', textDecoration: 'none', textTransform: 'uppercase' }}>← Projects</Link>

      <div style={{ marginTop: 24, marginBottom: 40 }}>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.55rem', letterSpacing: '0.15em', color: '#555', textTransform: 'uppercase', border: '1px solid #2a2a2a', padding: '2px 10px', borderRadius: 2 }}>{project.status}</span>
        <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', color: '#c0c0c0', marginTop: 12, letterSpacing: '0.05em' }}>{project.title}</h1>
        {project.genre && <p style={{ fontFamily: "'EB Garamond', serif", color: '#666', fontStyle: 'italic', marginTop: 4 }}>{project.genre}</p>}
        {project.description && <p style={{ fontFamily: "'EB Garamond', serif", color: '#555', marginTop: 8, maxWidth: 600, lineHeight: 1.6 }}>{project.description}</p>}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a1a', marginBottom: 32, flexWrap: 'wrap' }}>
        <button style={tabStyle('songs')} onClick={() => setTab('songs')}>♪ Songs</button>
        <button style={tabStyle('targets')} onClick={() => setTab('targets')}>◎ Targets</button>
        <button style={tabStyle('arts')} onClick={() => setTab('arts')}>✧ Arts & Images</button>
      </div>

      {/* Songs Tab */}
      {tab === 'songs' && (
        <div>
          <form onSubmit={addSong} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 32, padding: 20, background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 4 }}>
            <input className="input-dark" value={songTitle} onChange={e => setSongTitle(e.target.value)} placeholder="Song title *" required style={inputS} />
            <input className="input-dark" value={songArtist} onChange={e => setSongArtist(e.target.value)} placeholder="Artist" style={inputS} />
            <input className="input-dark" value={songUrl} onChange={e => setSongUrl(e.target.value)} placeholder="URL / Spotify link" style={inputS} />
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '10px', border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: '0.7rem' }}>Add Song</button>
          </form>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {songs.length === 0 && <p style={{ fontFamily: "'EB Garamond', serif", color: '#444', fontStyle: 'italic' }}>No songs added yet.</p>}
            {songs.map(s => (
              <div key={s.id} className="card-hover" style={{ background: '#111', padding: '16px 20px', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1rem', color: '#c0c0c0' }}>♪ {s.title}</p>
                  {s.artist && <p style={{ fontFamily: "'EB Garamond', serif", color: '#555', fontSize: '0.85rem' }}>{s.artist}</p>}
                  {s.url && <a href={s.url} target="_blank" rel="noreferrer" style={{ color: '#888', fontSize: '0.75rem', fontFamily: "'Cinzel', serif", letterSpacing: '0.1em' }}>→ Open</a>}
                </div>
                <button onClick={() => deleteItem('songs', s.id, setSongs)} style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: '1rem', padding: 8 }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Targets Tab */}
      {tab === 'targets' && (
        <div>
          <form onSubmit={addTarget} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 32, padding: 20, background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 4 }}>
            <input className="input-dark" value={targetTitle} onChange={e => setTargetTitle(e.target.value)} placeholder="Target title *" required style={inputS} />
            <input className="input-dark" value={targetDesc} onChange={e => setTargetDesc(e.target.value)} placeholder="Description" style={inputS} />
            <input className="input-dark" type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} style={inputS} />
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '10px', border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: '0.7rem' }}>Add Target</button>
          </form>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {targets.length === 0 && <p style={{ fontFamily: "'EB Garamond', serif", color: '#444', fontStyle: 'italic' }}>No targets set yet.</p>}
            {targets.map(t => (
              <div key={t.id} className="card-hover" style={{ background: '#111', padding: '16px 20px', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: t.completed ? 0.5 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <button onClick={() => toggleTarget(t)} style={{ background: 'none', border: `1px solid ${t.completed ? '#c0c0c0' : '#333'}`, width: 20, height: 20, borderRadius: 2, cursor: 'pointer', color: '#c0c0c0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', flexShrink: 0, marginTop: 2 }}>
                    {t.completed ? '✓' : ''}
                  </button>
                  <div>
                    <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.85rem', color: '#c0c0c0', textDecoration: t.completed ? 'line-through' : 'none', letterSpacing: '0.05em' }}>{t.title}</p>
                    {t.description && <p style={{ fontFamily: "'EB Garamond', serif", color: '#555', fontSize: '0.85rem', marginTop: 4 }}>{t.description}</p>}
                    {t.due_date && <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.55rem', letterSpacing: '0.15em', color: '#444', textTransform: 'uppercase', marginTop: 4 }}>Due: {new Date(t.due_date).toLocaleDateString()}</p>}
                  </div>
                </div>
                <button onClick={() => deleteItem('targets', t.id, setTargets)} style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: '1rem', padding: 8 }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Arts Tab */}
      {tab === 'arts' && (
        <div>
          <form onSubmit={uploadArt} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32, padding: 20, background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 4 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <input className="input-dark" value={artTitle} onChange={e => setArtTitle(e.target.value)} placeholder="Title (optional)" style={inputS} />
              <input ref={fileRef} type="file" accept="image/*" onChange={e => setArtFile(e.target.files?.[0] ?? null)} required
                style={{ padding: '10px 14px', background: '#111', border: '1px solid #2a2a2a', color: '#888', borderRadius: 2, fontFamily: "'EB Garamond', serif", cursor: 'pointer' }} />
            </div>
            <button type="submit" className="btn-primary" disabled={loading || !artFile}
              style={{ padding: '10px 24px', border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: '0.7rem', alignSelf: 'flex-start' }}>
              {loading ? 'Uploading...' : 'Upload Image'}
            </button>
          </form>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {arts.length === 0 && <p style={{ fontFamily: "'EB Garamond', serif", color: '#444', fontStyle: 'italic' }}>No images uploaded yet.</p>}
            {arts.map(a => (
              <div key={a.id} className="card-hover" style={{ background: '#111', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                <img src={a.url} alt={a.title} style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
                <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontFamily: "'EB Garamond', serif", color: '#888', fontSize: '0.85rem' }}>{a.title}</p>
                  <button onClick={() => deleteItem('arts', a.id, setArts)} style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: '0.9rem' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}