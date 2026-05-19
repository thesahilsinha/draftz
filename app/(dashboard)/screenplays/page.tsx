import { createServerSupabase } from '@/lib/supabaseServer'
import Link from 'next/link'

export default async function ScreenplaysPage() {
  const supabase = await createServerSupabase()
  const { data: screenplays } = await supabase.from('screenplays').select('*, projects(title)').order('updated_at', { ascending: false })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.6rem', letterSpacing: '0.3em', color: '#555', textTransform: 'uppercase', marginBottom: 6 }}>Prodigy Pictures</p>
          <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', color: '#c0c0c0', letterSpacing: '0.05em' }}>Screenplays</h1>
        </div>
        <Link href="/screenplays/new" className="btn-primary" style={{ padding: '12px 28px', textDecoration: 'none', fontSize: '0.7rem', borderRadius: 2 }}>
          + New Screenplay
        </Link>
      </div>

      {screenplays?.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: '1rem', color: '#333', letterSpacing: '0.1em' }}>No screenplays yet</p>
          <p style={{ fontFamily: "'EB Garamond', serif", color: '#444', fontStyle: 'italic', marginTop: 8 }}>Begin your first story</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {screenplays?.map(s => (
          <Link key={s.id} href={`/screenplays/${s.id}`} style={{ textDecoration: 'none' }}>
            <div className="card-hover" style={{ background: '#111', padding: '28px 24px', borderRadius: 4, height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span className="tag">{s.status}</span>
                <span style={{ color: '#333', fontSize: '1.2rem' }}>✦</span>
              </div>
              <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: '1rem', color: '#c0c0c0', letterSpacing: '0.05em', marginBottom: 8 }}>{s.title}</h3>
              {s.logline && <p style={{ fontFamily: "'EB Garamond', serif", color: '#666', fontSize: '0.9rem', fontStyle: 'italic', lineHeight: 1.5 }}>{s.logline}</p>}
              {s.projects && <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.55rem', letterSpacing: '0.15em', color: '#444', textTransform: 'uppercase', marginTop: 16 }}>◆ {(s.projects as any).title}</p>}
              <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '0.75rem', color: '#444', marginTop: 8 }}>{new Date(s.updated_at).toLocaleDateString()}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}