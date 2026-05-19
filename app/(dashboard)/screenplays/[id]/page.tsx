'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type Block = { type: string; text: string }

const BLOCK_TYPES = ['scene-heading', 'action', 'character', 'dialogue', 'parenthetical', 'transition', 'note']
const BLOCK_LABELS: Record<string, string> = {
  'scene-heading': 'SCENE HEADING',
  'action': 'Action',
  'character': 'CHARACTER',
  'dialogue': 'Dialogue',
  'parenthetical': '(Parenthetical)',
  'transition': 'TRANSITION',
  'note': '// Note',
}

const blockStyle = (type: string): React.CSSProperties => {
  const base: React.CSSProperties = { width: '100%', border: 'none', background: 'transparent', fontFamily: "'Courier New', monospace", fontSize: '12pt', resize: 'none', outline: 'none', lineHeight: 1.6, color: '#111', overflow: 'hidden', minHeight: '1.6em' }
  switch (type) {
    case 'scene-heading': return { ...base, fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #ddd', paddingBottom: 4 }
    case 'character': return { ...base, fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center', paddingLeft: '40%', paddingRight: '40%' }
    case 'dialogue': return { ...base, paddingLeft: '20%', paddingRight: '20%' }
    case 'parenthetical': return { ...base, paddingLeft: '30%', paddingRight: '30%', fontStyle: 'italic', color: '#555' }
    case 'transition': return { ...base, textAlign: 'right', fontWeight: 'bold', textTransform: 'uppercase' }
    case 'note': return { ...base, color: '#888', fontStyle: 'italic', background: '#fffde7' }
    default: return base
  }
}

export default function ScreenplayEditorPage() {
  const { id } = useParams()
  const router = useRouter()
  const [screenplay, setScreenplay] = useState<any>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(true)
  const [activeBlock, setActiveBlock] = useState(0)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('screenplays').select('*').eq('id', id).single()
      if (data) { setScreenplay(data); setBlocks(data.content || []) }
    }
    load()
  }, [id])

  const save = async (b?: Block[]) => {
    setSaving(true)
    await supabase.from('screenplays').update({ content: b ?? blocks, updated_at: new Date().toISOString() }).eq('id', id)
    setSaving(false); setSaved(true)
  }

  const updateBlock = (i: number, text: string) => {
    const nb = [...blocks]; nb[i] = { ...nb[i], text }; setBlocks(nb); setSaved(false)
  }

  const changeType = (i: number, type: string) => {
    const nb = [...blocks]; nb[i] = { ...nb[i], type }; setBlocks(nb); setSaved(false)
  }

  const addBlock = (i: number, type = 'action') => {
    const nb = [...blocks]; nb.splice(i + 1, 0, { type, text: '' }); setBlocks(nb); setActiveBlock(i + 1); setSaved(false)
  }

  const removeBlock = (i: number) => {
    if (blocks.length <= 1) return
    const nb = [...blocks]; nb.splice(i, 1); setBlocks(nb); setSaved(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent, i: number) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addBlock(i) }
    if (e.key === 'Backspace' && blocks[i].text === '') { e.preventDefault(); removeBlock(i); setActiveBlock(Math.max(0, i - 1)) }
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); save() }
  }

  if (!screenplay) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <p style={{ fontFamily: "'Cinzel', serif", color: '#333', letterSpacing: '0.2em' }}>Loading...</p>
    </div>
  )

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Link href="/screenplays" style={{ fontFamily: "'Cinzel', serif", fontSize: '0.6rem', letterSpacing: '0.2em', color: '#555', textDecoration: 'none', textTransform: 'uppercase' }}>← Screenplays</Link>
          <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: '1.4rem', color: '#c0c0c0', marginTop: 8, letterSpacing: '0.05em' }}>{screenplay.title}</h1>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* Block type selector */}
          <select value={blocks[activeBlock]?.type || 'action'}
            onChange={e => changeType(activeBlock, e.target.value)}
            style={{ background: '#111', border: '1px solid #2a2a2a', color: '#888', fontFamily: "'Cinzel', serif", fontSize: '0.6rem', letterSpacing: '0.1em', padding: '8px 12px', borderRadius: 2, cursor: 'pointer' }}>
            {BLOCK_TYPES.map(t => <option key={t} value={t}>{BLOCK_LABELS[t]}</option>)}
          </select>
          <button onClick={() => save()} className="btn-primary"
            style={{ padding: '10px 24px', borderRadius: 2, border: 'none', cursor: 'pointer', fontSize: '0.65rem' }}>
            {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save'}
          </button>
        </div>
      </div>

      {/* Screenplay Page */}
      <div className="screenplay-page">
        <div style={{ textAlign: 'center', marginBottom: 48, paddingBottom: 24, borderBottom: '1px solid #eee' }}>
          <p style={{ fontFamily: "'Courier New', monospace", fontWeight: 'bold', fontSize: '12pt', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{screenplay.title}</p>
          {screenplay.logline && <p style={{ fontFamily: "'Courier New', monospace", fontStyle: 'italic', fontSize: '10pt', color: '#666', marginTop: 8 }}>{screenplay.logline}</p>}
          <p style={{ fontFamily: "'Courier New', monospace", fontSize: '9pt', color: '#999', marginTop: 12 }}>Written by — Prodigy Pictures</p>
        </div>

        {blocks.map((block, i) => (
          <div key={i} onClick={() => setActiveBlock(i)}
            style={{ position: 'relative', marginBottom: 12, padding: '4px 0',
              background: activeBlock === i ? 'rgba(0,0,0,0.03)' : 'transparent',
              borderRadius: 2 }}>
            {activeBlock === i && (
              <span style={{ position: 'absolute', left: -20, top: 4, fontSize: '0.6rem', color: '#ccc', fontFamily: "'Cinzel', serif" }}>▶</span>
            )}
            <textarea
              value={block.text}
              onChange={e => { updateBlock(i, e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
              onKeyDown={e => handleKeyDown(e, i)}
              onFocus={() => setActiveBlock(i)}
              style={blockStyle(block.type)}
              rows={1}
              placeholder={BLOCK_LABELS[block.type]}
            />
          </div>
        ))}

        <button onClick={() => addBlock(blocks.length - 1)}
          style={{ marginTop: 16, background: 'transparent', border: '1px dashed #ddd', color: '#bbb', fontFamily: "'Courier New', monospace", fontSize: '10pt', padding: '8px 16px', cursor: 'pointer', borderRadius: 2, width: '100%' }}>
          + Add Block
        </button>
      </div>

      <p style={{ textAlign: 'center', fontFamily: "'Cinzel', serif", fontSize: '0.55rem', letterSpacing: '0.2em', color: '#333', marginTop: 24 }}>
        Enter = New Block · Backspace on empty = Delete · Ctrl+S = Save
      </p>
    </div>
  )
}