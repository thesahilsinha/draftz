import Link from 'next/link'

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', background: '#000', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', padding: '24px',
    }}>
      {/* Subtle grid */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.4,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
      }} />
      {/* Radial glow */}
      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: '60vw', height: '40vw', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(212,175,106,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      {/* Corner marks */}
      {[
        { top: 28, left: 28, borderTop: '1px solid #333', borderLeft: '1px solid #333' },
        { top: 28, right: 28, borderTop: '1px solid #333', borderRight: '1px solid #333' },
        { bottom: 28, left: 28, borderBottom: '1px solid #333', borderLeft: '1px solid #333' },
        { bottom: 28, right: 28, borderBottom: '1px solid #333', borderRight: '1px solid #333' },
      ].map((s, i) => <div key={i} style={{ position: 'absolute', width: 50, height: 50, ...s }} />)}

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.62rem', letterSpacing: '0.45em',
          color: 'var(--text-faint)', marginBottom: 20, textTransform: 'uppercase' }}>
          Prodigy Pictures Presents
        </p>
        <h1 style={{ fontFamily: "'Cinzel', serif",
          fontSize: 'clamp(4.5rem, 18vw, 11rem)', fontWeight: 900,
          color: 'var(--silver)', letterSpacing: '0.22em', lineHeight: 1,
          textShadow: '0 0 60px rgba(200,200,200,0.18), 0 0 120px rgba(200,200,200,0.06)',
        }}>
          DRAFTZ
        </h1>
        <div style={{ width: 100, height: 1,
          background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
          margin: '20px auto 28px',
        }} />
        <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.15rem',
          color: 'var(--text-muted)', marginBottom: 48,
          letterSpacing: '0.06em', fontStyle: 'italic' }}>
          Where Stories Begin
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/login" className="btn-primary"
            style={{ padding: '14px 52px', textDecoration: 'none', fontSize: '0.78rem', borderRadius: 2 }}>
            Enter
          </Link>
          <Link href="/register" className="btn-ghost"
            style={{ padding: '14px 52px', textDecoration: 'none', fontSize: '0.78rem', borderRadius: 2 }}>
            Register
          </Link>
        </div>
        <p style={{ marginTop: 44, fontFamily: "'Cinzel', serif", fontSize: '0.52rem',
          letterSpacing: '0.3em', color: 'var(--text-faint)', textTransform: 'uppercase' }}>
          © Prodigy Pictures — All Rights Reserved
        </p>
      </div>
    </main>
  )
}