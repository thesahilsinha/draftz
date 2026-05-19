import Link from 'next/link'

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(192,192,192,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(192,192,192,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />
      {/* Corner ornaments */}
      <div style={{ position: 'absolute', top: 32, left: 32, width: 60, height: 60, borderTop: '1px solid #2a2a2a', borderLeft: '1px solid #2a2a2a' }} />
      <div style={{ position: 'absolute', top: 32, right: 32, width: 60, height: 60, borderTop: '1px solid #2a2a2a', borderRight: '1px solid #2a2a2a' }} />
      <div style={{ position: 'absolute', bottom: 32, left: 32, width: 60, height: 60, borderBottom: '1px solid #2a2a2a', borderLeft: '1px solid #2a2a2a' }} />
      <div style={{ position: 'absolute', bottom: 32, right: 32, width: 60, height: 60, borderBottom: '1px solid #2a2a2a', borderRight: '1px solid #2a2a2a' }} />

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, padding: '0 24px' }}>
        <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.7rem', letterSpacing: '0.4em', color: '#888', marginBottom: 24, textTransform: 'uppercase' }}>
          Prodigy Pictures Presents
        </p>
        <h1 style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 'clamp(4rem, 15vw, 10rem)',
          fontWeight: 900,
          color: '#c0c0c0',
          letterSpacing: '0.2em',
          lineHeight: 1,
          textShadow: '0 0 40px rgba(192,192,192,0.2), 0 0 80px rgba(192,192,192,0.05)',
          marginBottom: 8,
        }}>
          DRAFTZ
        </h1>
        <div style={{ width: 120, height: 1, background: 'linear-gradient(90deg, transparent, #c0c0c0, transparent)', margin: '0 auto 32px' }} />
        <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.2rem', color: '#888', marginBottom: 48, letterSpacing: '0.05em', fontStyle: 'italic' }}>
          Where Stories Begin
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/login" className="btn-primary" style={{
            padding: '14px 48px', textDecoration: 'none', fontSize: '0.8rem', display: 'inline-block', borderRadius: 2,
          }}>
            Enter
          </Link>
          <Link href="/register" className="btn-ghost" style={{
            padding: '14px 48px', textDecoration: 'none', fontSize: '0.8rem', display: 'inline-block', borderRadius: 2,
          }}>
            Register
          </Link>
        </div>
        <p style={{ marginTop: 32, fontFamily: "'Cinzel', serif", fontSize: '0.55rem', letterSpacing: '0.3em', color: '#333', textTransform: 'uppercase' }}>
          © Prodigy Pictures — All Rights Reserved
        </p>
      </div>
    </main>
  )
}