'use client'
import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SYSTEM_PROMPT = `You are DRAFTZ AI — an expert screenplay consultant for Prodigy Pictures. You help screenwriters with:
- Breaking scenes into proper script format (scene headings, action lines, dialogue, transitions)
- Grammar, spelling, and script formatting corrections
- Story structure, pacing, and scene analysis
- Character voice and dialogue tips
- How to translate a scene they're imagining into proper screenplay format
- Industry standard formatting rules

You are concise, practical, and speak like a seasoned script editor. When showing screenplay examples, format them clearly using ALL CAPS for scene headings and character names, indentation for dialogue.`

const SUGGESTIONS = [
  'How do I format a phone call scene?',
  'What\'s the difference between scene heading and action?',
  'How do I write a montage?',
  'Help me break this scene: two people argue at a dinner table',
  'How do I show vs tell in a screenplay?',
  'What are the rules for parentheticals?',
]

export default function GrokChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const send = async (text?: string) => {
    const content = text ?? input.trim()
    if (!content || loading) return
    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GROK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'grok-3-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...newMessages,
          ],
          max_tokens: 1024,
          temperature: 0.7,
        }),
      })
      const data = await res.json()
      const reply = data.choices?.[0]?.message?.content ?? 'Sorry, I could not get a response. Please try again.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Check your Grok API key in .env.local' }])
    }
    setLoading(false)
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 300,
          width: 52, height: 52, borderRadius: '50%',
          background: 'var(--silver)', color: 'var(--bg)',
          border: 'none', cursor: 'pointer',
          fontSize: '1.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          transition: 'all 0.2s',
          fontFamily: "'Cinzel', serif",
        }}
        title="DRAFTZ AI Assistant"
      >
        {open ? '✕' : '✦'}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 88, right: 24, zIndex: 299,
          width: 'min(420px, calc(100vw - 32px))',
          height: 'min(560px, calc(100vh - 120px))',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px', borderBottom: '1px solid var(--border)',
            background: 'var(--surface2)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.72rem', fontWeight: 700,
                letterSpacing: '0.15em', color: 'var(--text)', textTransform: 'uppercase' }}>
                ✦ DRAFTZ AI
              </p>
              <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '0.8rem',
                color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 1 }}>
                Screenplay consultant
              </p>
            </div>
            <button onClick={() => setMessages([])}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: '0.5rem',
                letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 8px' }}>
              Clear
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.length === 0 && (
              <div>
                <p style={{ fontFamily: "'EB Garamond', serif", color: 'var(--text-sub)',
                  fontSize: '0.95rem', fontStyle: 'italic', marginBottom: 16, lineHeight: 1.6 }}>
                  Ask me anything about screenwriting — formatting, structure, breaking a scene, grammar.
                </p>
                <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.52rem', letterSpacing: '0.18em',
                  color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>
                  Quick prompts
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => send(s)}
                      style={{ background: 'var(--surface3)', border: '1px solid var(--border)',
                        color: 'var(--text-sub)', padding: '8px 12px', borderRadius: 4,
                        cursor: 'pointer', fontFamily: "'EB Garamond', serif", fontSize: '0.88rem',
                        textAlign: 'left', lineHeight: 1.4, transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--silver)'; e.currentTarget.style.color = 'var(--text)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-sub)' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column',
                alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '88%',
                  padding: '10px 14px',
                  borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: m.role === 'user' ? 'var(--silver)' : 'var(--surface3)',
                  border: m.role === 'assistant' ? `1px solid var(--border)` : 'none',
                  color: m.role === 'user' ? 'var(--bg)' : 'var(--text)',
                  fontFamily: "'EB Garamond', serif",
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {m.content}
                </div>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.45rem',
                  letterSpacing: '0.1em', color: 'var(--text-faint)', marginTop: 3,
                  textTransform: 'uppercase' }}>
                  {m.role === 'user' ? 'You' : 'DRAFTZ AI'}
                </span>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ background: 'var(--surface3)', border: `1px solid var(--border)`,
                  borderRadius: '12px 12px 12px 2px', padding: '10px 16px' }}>
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: 'var(--text-muted)',
                        animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', background: 'var(--surface2)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about screenplay format, scene structure…"
                rows={1}
                style={{
                  flex: 1, background: 'var(--input-bg)', border: '1px solid var(--border)',
                  color: 'var(--text)', borderRadius: 6, padding: '9px 12px',
                  fontFamily: "'EB Garamond', serif", fontSize: '0.95rem',
                  resize: 'none', outline: 'none', lineHeight: 1.5,
                  maxHeight: 100, overflowY: 'auto',
                }}
                onInput={e => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 100) + 'px' }}
              />
              <button onClick={() => send()} disabled={!input.trim() || loading}
                style={{
                  width: 38, height: 38, borderRadius: 6, border: 'none',
                  background: input.trim() && !loading ? 'var(--silver)' : 'var(--surface3)',
                  color: input.trim() && !loading ? 'var(--bg)' : 'var(--text-faint)',
                  cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                  fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', flexShrink: 0,
                }}>
                ↑
              </button>
            </div>
            <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.42rem', letterSpacing: '0.1em',
              color: 'var(--text-faint)', textTransform: 'uppercase', marginTop: 6, textAlign: 'center' }}>
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </>
  )
}