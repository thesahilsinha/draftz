
'use client'
import VariablesPanel from '@/components/screenplay/VariablesPanel'
import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'


type BlockType = 'scene-heading' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition' | 'note'
type Block = { id: string; type: BlockType; text: string }

const BLOCK_META: Record<BlockType, { label: string; placeholder: string; shortcut: string }> = {
  'scene-heading': { label: 'Scene Heading', placeholder: 'INT. LOCATION — DAY', shortcut: 'S' },
  'action':        { label: 'Action',        placeholder: 'Describe what we see...', shortcut: 'A' },
  'character':     { label: 'Character',     placeholder: 'CHARACTER NAME', shortcut: 'C' },
  'dialogue':      { label: 'Dialogue',      placeholder: 'Character speaks...', shortcut: 'D' },
  'parenthetical': { label: 'Parenthetical', placeholder: '(beat)', shortcut: 'P' },
  'transition':    { label: 'Transition',    placeholder: 'CUT TO:', shortcut: 'T' },
  'note':          { label: 'Note',          placeholder: '// Writer note...', shortcut: 'N' },
}

const QUICK_SCENE_HEADINGS = [
  'INT. ', 'EXT. ', 'INT./EXT. ',
  'INT. LOCATION — DAY', 'INT. LOCATION — NIGHT',
  'EXT. LOCATION — DAY', 'EXT. LOCATION — NIGHT',
]
const QUICK_TRANSITIONS = [
  'CUT TO:', 'SMASH CUT TO:', 'DISSOLVE TO:',
  'FADE OUT.', 'FADE IN:', 'MATCH CUT TO:',
  'INTERCUT WITH:', 'FLASHBACK:', 'END FLASHBACK.',
]

function uid() { return Math.random().toString(36).slice(2, 9) }

// A4 at 96dpi ≈ 794px wide, 1123px tall. With 1in margins screenplay style.
const A4_HEIGHT = 1056 // px — standard script page
const LINE_HEIGHT = 19.2 // 12pt * 1.6

function getBlockCSS(type: BlockType): React.CSSProperties {
  const base: React.CSSProperties = {
    width: '100%', border: 'none', background: 'transparent',
    fontFamily: "'Courier Prime', 'Courier New', monospace",
    fontSize: '12pt', lineHeight: '1.6', resize: 'none',
    outline: 'none', overflow: 'hidden', minHeight: `${LINE_HEIGHT}px`,
    color: '#111', display: 'block', padding: 0,
  }
  switch (type) {
    case 'scene-heading':  return { ...base, fontWeight: 'bold', textTransform: 'uppercase', textDecoration: 'underline' }
    case 'action':         return { ...base }
    case 'character':      return { ...base, fontWeight: 'bold', textTransform: 'uppercase', marginLeft: '37%', width: '26%', minWidth: 160 }
    case 'dialogue':       return { ...base, marginLeft: '20%', width: '60%', minWidth: 200 }
    case 'parenthetical':  return { ...base, marginLeft: '28%', width: '44%', minWidth: 160 }
    case 'transition':     return { ...base, fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'right' }
    case 'note':           return { ...base, color: '#888', fontStyle: 'italic', background: '#fffde7', padding: '2px 8px', borderRadius: 2 }
    default:               return base
  }
}

// What type usually follows each type
const NEXT_TYPE: Partial<Record<BlockType, BlockType>> = {
  'scene-heading': 'action',
  'action': 'action',
  'character': 'dialogue',
  'dialogue': 'character',
  'parenthetical': 'dialogue',
  'transition': 'scene-heading',
  'note': 'action',
}

export default function ScreenplayEditorPage() {
  const { id } = useParams()
  const [screenplay, setScreenplay] = useState<any>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(true)
  const [activeIdx, setActiveIdx] = useState<number>(0)
  const [typePickerIdx, setTypePickerIdx] = useState<number | null>(null)
  const [quickPick, setQuickPick] = useState<string[] | null>(null)
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({})
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('screenplays').select('*').eq('id', id).single()
      if (data) {
        setScreenplay(data)
        const raw: Block[] = (data.content || []).map((b: any) => ({ ...b, id: b.id || uid() }))
        setBlocks(raw.length ? raw : [{ id: uid(), type: 'scene-heading', text: '' }])
      }
    }
    load()
  }, [id])

  const autoSave = useCallback((b: Block[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaving(true)
      await supabase.from('screenplays').update({ content: b, updated_at: new Date().toISOString() }).eq('id', id)
      setSaving(false); setSaved(true)
    }, 1200)
  }, [id])

  const updateBlock = (idx: number, text: string) => {
    setBlocks(prev => { const n = [...prev]; n[idx] = { ...n[idx], text }; autoSave(n); setSaved(false); return n })
  }

  const changeType = (idx: number, type: BlockType) => {
    setBlocks(prev => {
      const n = [...prev]; n[idx] = { ...n[idx], type }
      autoSave(n); return n
    })
    setTypePickerIdx(null); setQuickPick(null)
    setTimeout(() => textareaRefs.current[blocks[idx]?.id]?.focus(), 50)
  }

  const insertBlock = (afterIdx: number, type?: BlockType) => {
    const newType = type ?? NEXT_TYPE[blocks[afterIdx]?.type] ?? 'action'
    const newBlock: Block = { id: uid(), type: newType, text: '' }
    setBlocks(prev => {
      const n = [...prev]; n.splice(afterIdx + 1, 0, newBlock); autoSave(n); setSaved(false); return n
    })
    setActiveIdx(afterIdx + 1)
    setTimeout(() => textareaRefs.current[newBlock.id]?.focus(), 30)
  }

  const deleteBlock = (idx: number) => {
    if (blocks.length <= 1) return
    setBlocks(prev => { const n = [...prev]; n.splice(idx, 1); autoSave(n); setSaved(false); return n })
    const prevIdx = Math.max(0, idx - 1)
    setActiveIdx(prevIdx)
    setTimeout(() => {
      const prevBlock = blocks[prevIdx]
      if (prevBlock) textareaRefs.current[prevBlock.id]?.focus()
    }, 30)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, idx: number) => {
    const block = blocks[idx]
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      // Tab cycle for character → dialogue → character
      insertBlock(idx)
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      // cycle through common types
      const cycle: BlockType[] = ['action', 'character', 'dialogue', 'parenthetical', 'scene-heading', 'transition']
      const cur = cycle.indexOf(block.type)
      const next = cycle[(cur + 1) % cycle.length]
      changeType(idx, next)
    }
    if (e.key === 'Backspace' && block.text === '') {
      e.preventDefault(); deleteBlock(idx)
    }
    if (e.key === 'Escape') { setTypePickerIdx(null); setQuickPick(null) }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      if (saveTimer.current) clearTimeout(saveTimer.current)
      setSaving(true)
      supabase.from('screenplays').update({ content: blocks, updated_at: new Date().toISOString() }).eq('id', id)
        .then(() => { setSaving(false); setSaved(true) })
    }
  }

  const autoResize = (el: HTMLTextAreaElement | null) => {
    if (!el) return; el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'
  }

  // PDF export via print
  const handleExportPDF = () => {
    // Temporarily add a print-ready class to body
    document.body.classList.add('printing')
    document.documentElement.style.setProperty('background', '#ffffff', 'important')
    document.body.style.setProperty('background', '#ffffff', 'important')

    // Small delay so styles apply before dialog
    setTimeout(() => {
      window.print()
      setTimeout(() => {
        document.body.classList.remove('printing')
        document.documentElement.style.removeProperty('background')
        document.body.style.removeProperty('background')
      }, 500)
    }, 100)
  }

  // Quick pick options per type
  const getQuickOptions = (type: BlockType): string[] | null => {
    if (type === 'scene-heading') return QUICK_SCENE_HEADINGS
    if (type === 'transition') return QUICK_TRANSITIONS
    return null
  }

  const handleTypePickerOpen = (idx: number) => {
    setTypePickerIdx(typePickerIdx === idx ? null : idx)
    setQuickPick(getQuickOptions(blocks[idx].type))
  }

  if (!screenplay) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <p style={{ fontFamily: "'Cinzel', serif", color: '#333', letterSpacing: '0.2em' }}>Loading screenplay...</p>
    </div>
  )

  return (
    <>
      {/* Print styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');

        @media print {
          body * { visibility: hidden !important; }
          #screenplay-print-area, #screenplay-print-area * { visibility: visible !important; }
          #screenplay-print-area { position: fixed; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
        }
        @media (max-width: 768px) {
          .editor-toolbar { flex-wrap: wrap !important; gap: 8px !important; }
          .screenplay-page-wrap { padding: 0 !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', paddingBottom: 80 }}>
        {/* Toolbar */}
        <div className="editor-toolbar no-print" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 24, gap: 12, flexWrap: 'wrap',
          position: 'sticky', top: 0, background: '#000', zIndex: 90, padding: '16px 0',
          borderBottom: '1px solid #1a1a1a',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Link href="/screenplays" style={{ fontFamily: "'Cinzel', serif", fontSize: '0.6rem', letterSpacing: '0.2em', color: '#555', textDecoration: 'none', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              ← Back
            </Link>
            <div>
              <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(0.9rem, 2vw, 1.2rem)', color: '#c0c0c0', letterSpacing: '0.08em' }}>{screenplay.title}</h1>
              <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.5rem', letterSpacing: '0.2em', color: saving ? '#888' : saved ? '#4a7' : '#888', textTransform: 'uppercase', marginTop: 2 }}>
                {saving ? '● Saving...' : saved ? '✓ Saved' : '○ Unsaved'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={handleExportPDF} className="btn-ghost no-print"
              style={{ padding: '8px 18px', borderRadius: 2, cursor: 'pointer', fontSize: '0.6rem', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
              ⬇ Export PDF
            </button>
            <button onClick={() => { if (saveTimer.current) clearTimeout(saveTimer.current); setSaving(true); supabase.from('screenplays').update({ content: blocks, updated_at: new Date().toISOString() }).eq('id', id).then(() => { setSaving(false); setSaved(true) }) }}
              className="btn-primary"
              style={{ padding: '8px 20px', borderRadius: 2, border: 'none', cursor: 'pointer', fontSize: '0.6rem', letterSpacing: '0.1em' }}>
              Save
            </button>
          </div>
        </div>

        {/* Keyboard hints */}
        <div className="no-print" style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            ['Enter', 'New block'],
            ['Tab', 'Cycle type'],
            ['Backspace on empty', 'Delete'],
            ['Click badge', 'Change type'],
          ].map(([key, desc]) => (
            <span key={key} className="hint-key">
              <span className="hint-key-badge">{key}</span>
              <span className="hint-key-desc">{desc}</span>
            </span>
          ))}
        </div>
        
        {/* Variables Panel */}
        {screenplay && (
          <div className="no-print" style={{ maxWidth: 794, margin: '0 auto 20px' }}>
            <VariablesPanel screenplayId={screenplay.id} />
          </div>
        )}

        {/* A4 Page Area */}
        <div className="screenplay-page-wrap" style={{ padding: '0 0 40px' }} id="screenplay-print-area" ref={pageRef}>
          <div style={{
          background: '#fff',
          color: '#111',
          width: '100%',
          maxWidth: 794,
          margin: '0 auto',
          padding: 'clamp(24px, 5vw, 96px) clamp(16px, 8vw, 108px)',
          minHeight: 1056,
          boxShadow: '0 4px 60px rgba(0,0,0,0.7)',
          fontFamily: "'Courier Prime', 'Courier New', monospace",
          fontSize: '12pt',
          lineHeight: '1.6',
          position: 'relative',
        }}
          id="screenplay-print-area"
        >
            {/* Title block */}
            <div style={{ textAlign: 'center', marginBottom: 48, paddingBottom: 24, borderBottom: '1px solid #ddd' }}>
              <p style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '13pt' }}>{screenplay.title}</p>
              {screenplay.logline && <p style={{ fontStyle: 'italic', fontSize: '10pt', color: '#666', marginTop: 6 }}>{screenplay.logline}</p>}
              <p style={{ fontSize: '9pt', color: '#aaa', marginTop: 8 }}>A Prodigy Pictures Production</p>
            </div>

            {/* Blocks */}
            {blocks.map((block, idx) => (
              <div key={block.id} style={{ position: 'relative', marginBottom: 8 }}
                onClick={() => setActiveIdx(idx)}>

                {/* Inline type badge — only shown when active */}
                {activeIdx === idx && (
                  <div className="no-print" style={{ position: 'absolute', top: -22, left: 0, display: 'flex', gap: 4, zIndex: 10, flexWrap: 'wrap' }}>
                    <button
                      onClick={e => { e.stopPropagation(); handleTypePickerOpen(idx) }}
                      style={{
                        fontFamily: "'Cinzel', serif", fontSize: '0.5rem', letterSpacing: '0.15em',
                        textTransform: 'uppercase', background: '#1a1a1a', border: '1px solid #3a3a3a',
                        color: '#c0c0c0', padding: '2px 10px', borderRadius: 2, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                      {BLOCK_META[block.type].label} ▾
                    </button>
                  </div>
                )}

                {/* Type picker dropdown */}
                {typePickerIdx === idx && (
                  <div className="no-print" style={{
                    position: 'absolute', top: -2, left: 0, zIndex: 50,
                    background: '#111', border: '1px solid #3a3a3a', borderRadius: 4,
                    minWidth: 220, boxShadow: '0 8px 32px rgba(0,0,0,0.8)', overflow: 'hidden',
                  }}>
                    <div style={{ padding: '8px 0', borderBottom: '1px solid #2a2a2a' }}>
                      {(Object.keys(BLOCK_META) as BlockType[]).map(t => (
                        <button key={t} onClick={() => changeType(idx, t)}
                          style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            width: '100%', padding: '9px 16px', background: block.type === t ? 'rgba(192,192,192,0.1)' : 'transparent',
                            border: 'none', color: block.type === t ? '#e8e8e8' : '#888', cursor: 'pointer',
                            fontFamily: "'Cinzel', serif", fontSize: '0.6rem', letterSpacing: '0.12em',
                            textAlign: 'left', textTransform: 'uppercase',
                          }}>
                          {BLOCK_META[t].label}
                          <span style={{ color: '#444', fontSize: '0.55rem', border: '1px solid #2a2a2a', padding: '1px 6px', borderRadius: 2 }}>Tab</span>
                        </button>
                      ))}
                    </div>

                    {/* Quick inserts for scene heading / transition */}
                    {quickPick && (
                      <div style={{ padding: '4px 0' }}>
                        <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.45rem', letterSpacing: '0.2em', color: '#444', textTransform: 'uppercase', padding: '4px 16px' }}>Quick Insert</p>
                        {quickPick.map(q => (
                          <button key={q} onClick={() => {
                            updateBlock(idx, q)
                            setTypePickerIdx(null); setQuickPick(null)
                            setTimeout(() => {
                              const el = textareaRefs.current[block.id]
                              if (el) { el.focus(); el.setSelectionRange(q.length, q.length) }
                            }, 30)
                          }}
                            style={{
                              display: 'block', width: '100%', padding: '7px 16px', background: 'transparent',
                              border: 'none', color: '#666', cursor: 'pointer',
                              fontFamily: "'Courier New', monospace", fontSize: '0.65rem', textAlign: 'left',
                            }}>
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <textarea
                  ref={el => { textareaRefs.current[block.id] = el; if (el) autoResize(el) }}
                  value={block.text}
                  placeholder={activeIdx === idx ? BLOCK_META[block.type].placeholder : ''}
                  style={getBlockCSS(block.type)}
                  rows={1}
                  onFocus={() => { setActiveIdx(idx); setTypePickerIdx(null) }}
                  onChange={e => { updateBlock(idx, e.target.value); autoResize(e.target) }}
                  onKeyDown={e => handleKeyDown(e, idx)}
                />
              </div>
            ))}

            {/* Add block button */}
            <div className="no-print" style={{ marginTop: 24, textAlign: 'center' }}>
              <button onClick={() => insertBlock(blocks.length - 1)}
                style={{
                  background: 'transparent', border: '1px dashed #ddd', color: '#bbb',
                  fontFamily: "'Courier New', monospace", fontSize: '10pt', padding: '8px 24px',
                  cursor: 'pointer', borderRadius: 2, width: '100%',
                }}>
                + Add Block
              </button>
            </div>

            {/* Page footer */}
            <div style={{ position: 'absolute', bottom: 24, right: 'clamp(16px, 8vw, 108px)', fontFamily: "'Courier New', monospace", fontSize: '9pt', color: '#ccc' }}>
              1.
            </div>
          </div>
        </div>

        {/* Mobile floating type picker */}
        <div className="no-print" style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#0a0a0a', borderTop: '1px solid #1a1a1a',
          padding: '10px 12px', display: 'flex', gap: 6, overflowX: 'auto',
          zIndex: 80,
        }}>
          {(Object.keys(BLOCK_META) as BlockType[]).map(t => (
            <button key={t}
              onClick={() => { if (activeIdx !== null) changeType(activeIdx, t) }}
              style={{
                fontFamily: "'Cinzel', serif", fontSize: '0.5rem', letterSpacing: '0.1em',
                textTransform: 'uppercase', padding: '6px 12px', borderRadius: 2, cursor: 'pointer',
                whiteSpace: 'nowrap', border: '1px solid',
                background: blocks[activeIdx]?.type === t ? '#c0c0c0' : 'transparent',
                color: blocks[activeIdx]?.type === t ? '#000' : '#555',
                borderColor: blocks[activeIdx]?.type === t ? '#c0c0c0' : '#2a2a2a',
                flexShrink: 0,
              }}>
              {BLOCK_META[t].shortcut}: {BLOCK_META[t].label}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}