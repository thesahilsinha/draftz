'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const CATEGORIES = ['character', 'location', 'prop', 'vehicle', 'theme', 'other']
const CAT_COLORS: Record<string, string> = {
  character: '#58a6ff', location: '#6aab7a', prop: '#d4af6a',
  vehicle: '#a88c5a', theme: '#b07ab8', other: '#888888',
}

interface Props { screenplayId: string }

export default function VariablesPanel({ screenplayId }: Props) {
  const [vars, setVars] = useState<any[]>([])
  const [form, setForm] = useState({ name: '', category: 'character', description: '' })
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<any>({})
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('screenplay_variables').select('*').eq('screenplay_id', screenplayId).order('category')
      setVars(data ?? [])
    }
    load()
  }, [screenplayId])

  const add = async (e: React.FormEvent) => {
    e.preventDefault(); if (!form.name.trim()) return; setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('screenplay_variables').insert({
      ...form, screenplay_id: screenplayId, user_id: user!.id
    }).select().single()
    if (data) { setVars(p => [...p, data]); setForm({ name: '', category: 'character', description: '' }) }
    setLoading(false)
  }

  const del = async (id: string) => {
    await supabase.from('screenplay_variables').delete().eq('id', id)
    setVars(p => p.filter(v => v.id !== id))
  }

  const saveEdit = async (id: string) => {
    await supabase.from('screenplay_variables').update(editData).eq('id', id)
    setVars(p => p.map(v => v.id === id ? { ...v, ...editData } : v))
    setEditingId(null)
  }

  const filtered = filter === 'all' ? vars : vars.filter(v => v.category === filter)
  const inputS: React.CSSProperties = {
    width: '100%', padding: '7px 10px', borderRadius: 3,
    background: 'var(--input-bg)', border: '1px solid var(--border)',
    color: 'var(--text)', fontFamily: "'EB Garamond', serif", fontSize: '0.9rem',
  }

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 6, overflow: 'hidden', marginBottom: 24,
    }}>
      {/* Header */}
      <button onClick={() => setOpen(o => !o)}
        style={{ width: '100%', padding: '12px 16px', background: 'var(--surface2)',
          border: 'none', borderBottom: open ? '1px solid var(--border)' : 'none',
          cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.62rem', letterSpacing: '0.2em',
            color: 'var(--text)', textTransform: 'uppercase', fontWeight: 700 }}>
            ◈ Script Variables
          </span>
          <span style={{ background: 'var(--surface3)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '1px 8px', fontFamily: "'Cinzel', serif",
            fontSize: '0.5rem', color: 'var(--text-muted)' }}>
            {vars.length}
          </span>
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem',
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
      </button>

      {open && (
        <div style={{ padding: 16 }}>
          {/* Add form */}
          <form onSubmit={add} style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <div>
                <label style={{ fontFamily: "'Cinzel', serif", fontSize: '0.5rem', letterSpacing: '0.18em',
                  color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Name *
                </label>
                <input style={inputS} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. ARVIND" />
              </div>
              <div>
                <label style={{ fontFamily: "'Cinzel', serif", fontSize: '0.5rem', letterSpacing: '0.18em',
                  color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Type
                </label>
                <select style={inputS} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontFamily: "'Cinzel', serif", fontSize: '0.5rem', letterSpacing: '0.18em',
                color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                Description
              </label>
              <input style={inputS} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief notes about this element…" />
            </div>
            <button type="submit" disabled={loading || !form.name.trim()}
              style={{ padding: '7px 20px', background: 'var(--silver)', color: 'var(--bg)',
                border: 'none', borderRadius: 3, cursor: 'pointer',
                fontFamily: "'Cinzel', serif", fontSize: '0.58rem', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                opacity: loading || !form.name.trim() ? 0.5 : 1 }}>
              + Add Variable
            </button>
          </form>

          {/* Filter pills */}
          {vars.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {['all', ...CATEGORIES.filter(c => vars.some(v => v.category === c))].map(c => (
                <button key={c} onClick={() => setFilter(c)}
                  style={{ padding: '3px 10px', borderRadius: 12,
                    background: filter === c ? 'var(--silver)' : 'var(--surface3)',
                    color: filter === c ? 'var(--bg)' : (CAT_COLORS[c] ?? 'var(--text-muted)'),
                    border: `1px solid ${filter === c ? 'var(--silver)' : 'var(--border)'}`,
                    cursor: 'pointer', fontFamily: "'Cinzel', serif",
                    fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                    transition: 'all 0.15s' }}>
                  {c}
                </button>
              ))}
            </div>
          )}

          {/* Variable list */}
          {vars.length === 0 && (
            <p style={{ fontFamily: "'EB Garamond', serif", color: 'var(--text-muted)',
              fontStyle: 'italic', fontSize: '0.9rem', textAlign: 'center', padding: '12px 0' }}>
              No variables yet. Add characters, locations, props…
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
            {filtered.map(v => (
              <div key={v.id} style={{ background: 'var(--surface2)', border: '1px solid var(--border)',
                borderLeft: `3px solid ${CAT_COLORS[v.category] ?? '#888'}`,
                borderRadius: 4, overflow: 'hidden' }}>
                {editingId === v.id ? (
                  <div style={{ padding: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
                      <input style={{ ...inputS, fontSize: '0.85rem' }} value={editData.name ?? ''} onChange={e => setEditData((d: any) => ({ ...d, name: e.target.value }))} />
                      <select style={{ ...inputS, fontSize: '0.85rem' }} value={editData.category ?? 'character'} onChange={e => setEditData((d: any) => ({ ...d, category: e.target.value }))}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <input style={{ ...inputS, fontSize: '0.85rem', marginBottom: 8 }} value={editData.description ?? ''} onChange={e => setEditData((d: any) => ({ ...d, description: e.target.value }))} placeholder="Description…" />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => saveEdit(v.id)} style={{ flex: 1, padding: '5px', background: 'var(--silver)', color: 'var(--bg)', border: 'none', borderRadius: 3, cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: '0.55rem', fontWeight: 700 }}>Save</button>
                      <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: '5px', background: 'transparent', color: 'var(--text-sub)', border: '1px solid var(--border)', borderRadius: 3, cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: '0.55rem' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.75rem',
                          color: 'var(--text)', fontWeight: 700, letterSpacing: '0.04em' }}>
                          {v.name}
                        </span>
                        <span style={{ fontSize: '0.5rem', padding: '1px 7px', borderRadius: 10,
                          fontFamily: "'Cinzel', serif", letterSpacing: '0.1em', textTransform: 'uppercase',
                          color: CAT_COLORS[v.category] ?? '#888',
                          border: `1px solid ${CAT_COLORS[v.category] ?? '#888'}` }}>
                          {v.category}
                        </span>
                      </div>
                      {v.description && (
                        <p style={{ fontFamily: "'EB Garamond', serif", color: 'var(--text-sub)',
                          fontSize: '0.82rem', marginTop: 2, fontStyle: 'italic' }}>
                          {v.description}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexShrink: 0 }}>
                      <button onClick={() => { setEditingId(v.id); setEditData({ name: v.name, category: v.category, description: v.description }) }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px', fontSize: '0.8rem' }}>✎</button>
                      <button onClick={() => del(v.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: '4px 8px', fontSize: '0.8rem', transition: 'color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>✕</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}