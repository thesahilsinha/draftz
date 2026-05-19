import { createServerSupabase } from '@/lib/supabaseServer'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: screenplays } = await supabase.from('screenplays').select('*').order('updated_at', { ascending: false }).limit(5)
  const { data: projects } = await supabase.from('projects').select('*').order('updated_at', { ascending: false }).limit(5)
  const { count: screenplayCount } = await supabase.from('screenplays').select('*', { count: 'exact', head: true })
  const { count: projectCount } = await supabase.from('projects').select('*', { count: 'exact', head: true })

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 48 }}>
        <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.6rem', letterSpacing: '0.3em', color: '#555', textTransform: 'uppercase', marginBottom: 8 }}>Welcome Back</p>
        <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 700, color: '#c0c0c0', letterSpacing: '0.05em' }}>
          The Studio
        </h1>
        <div style={{ width: 60, height: 1, background: 'linear-gradient(90deg, #c0c0c0, transparent)', marginTop: 12 }} />
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 48 }}>
        {[
          { label: 'Screenplays', value: screenplayCount ?? 0, icon: '✦' },
          { label: 'Projects', value: projectCount ?? 0, icon: '◆' },
        ].map(stat => (
          <div key={stat.label} className="card-hover" style={{ background: '#111', padding: '24px', borderRadius: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.55rem', letterSpacing: '0.2em', color: '#555', textTransform: 'uppercase', marginBottom: 8 }}>{stat.label}</p>
                <p style={{ fontFamily: "'Cinzel', serif", fontSize: '2.5rem', fontWeight: 700, color: '#c0c0c0' }}>{stat.value}</p>
              </div>
              <span style={{ color: '#2a2a2a', fontSize: '1.5rem' }}>{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 48, flexWrap: 'wrap' }}>
        <Link href="/screenplays/new" className="btn-primary" style={{ padding: '12px 28px', textDecoration: 'none', fontSize: '0.7rem', borderRadius: 2 }}>
          + New Screenplay
        </Link>
        <Link href="/projects" className="btn-ghost" style={{ padding: '12px 28px', textDecoration: 'none', fontSize: '0.7rem', borderRadius: 2 }}>
          + New Project
        </Link>
      </div>

      {/* Recent */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
        {/* Recent Screenplays */}
        <div>
          <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '0.65rem', letterSpacing: '0.25em', color: '#666', textTransform: 'uppercase', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Recent Screenplays
            <Link href="/screenplays" style={{ color: '#c0c0c0', textDecoration: 'none', fontSize: '0.55rem' }}>View All →</Link>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {screenplays?.length === 0 && <p style={{ fontFamily: "'EB Garamond', serif", color: '#444', fontStyle: 'italic' }}>No screenplays yet.</p>}
            {screenplays?.map(s => (
              <Link key={s.id} href={`/screenplays/${s.id}`} style={{ textDecoration: 'none' }}>
                <div className="card-hover" style={{ background: '#0d0d0d', padding: '16px', borderRadius: 4 }}>
                  <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.8rem', color: '#c0c0c0', letterSpacing: '0.05em' }}>{s.title}</p>
                  <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '0.8rem', color: '#555', marginTop: 4 }}>{s.status} · {new Date(s.updated_at).toLocaleDateString()}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Projects */}
        <div>
          <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '0.65rem', letterSpacing: '0.25em', color: '#666', textTransform: 'uppercase', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Recent Projects
            <Link href="/projects" style={{ color: '#c0c0c0', textDecoration: 'none', fontSize: '0.55rem' }}>View All →</Link>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {projects?.length === 0 && <p style={{ fontFamily: "'EB Garamond', serif", color: '#444', fontStyle: 'italic' }}>No projects yet.</p>}
            {projects?.map(p => (
              <Link key={p.id} href={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                <div className="card-hover" style={{ background: '#0d0d0d', padding: '16px', borderRadius: 4 }}>
                  <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.8rem', color: '#c0c0c0', letterSpacing: '0.05em' }}>{p.title}</p>
                  <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '0.8rem', color: '#555', marginTop: 4 }}>{p.genre ?? 'No genre'} · {p.status}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}