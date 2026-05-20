import { createServerSupabase } from '@/lib/supabaseServer'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: screenplays } = await supabase.from('screenplays').select('*').order('updated_at', { ascending: false }).limit(5)
  const { data: projects } = await supabase.from('projects').select('*').order('updated_at', { ascending: false }).limit(5)
  const { count: sc } = await supabase.from('screenplays').select('*', { count: 'exact', head: true })
  const { count: pc } = await supabase.from('projects').select('*', { count: 'exact', head: true })

  return (
    <div>
      <div style={{ marginBottom: 48 }}>
        <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.58rem', letterSpacing: '0.35em',
          color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: 10 }}>
          Prodigy Pictures — Studio
        </p>
        <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
          The Studio
        </h1>
        <div style={{ width: 56, height: 2, background: 'var(--accent)', marginTop: 14, borderRadius: 1 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 48 }}>
        {[
          { label: 'Screenplays', value: sc ?? 0, icon: '✦', href: '/screenplays' },
          { label: 'Projects',    value: pc ?? 0, icon: '◆', href: '/projects'    },
        ].map(stat => (
          <Link key={stat.label} href={stat.href} style={{ textDecoration: 'none' }}>
            <div className="card-hover" style={{ padding: '24px 26px', borderRadius: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.58rem', letterSpacing: '0.2em',
                    color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>
                    {stat.label}
                  </p>
                  <p style={{ fontFamily: "'Cinzel', serif", fontSize: '2.8rem',
                    fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                    {stat.value}
                  </p>
                </div>
                <span style={{ color: 'var(--border-light)', fontSize: '1.3rem', marginTop: 2 }}>{stat.icon}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 48, flexWrap: 'wrap' }}>
        <Link href="/screenplays/new" className="btn-primary"
          style={{ padding: '12px 28px', textDecoration: 'none', borderRadius: 2 }}>
          + New Screenplay
        </Link>
        <Link href="/projects" className="btn-ghost"
          style={{ padding: '12px 28px', textDecoration: 'none', borderRadius: 2 }}>
          + New Project
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 36 }}>
        {[
          { title: 'Recent Screenplays', items: screenplays, href: '/screenplays', linkBase: '/screenplays' },
          { title: 'Recent Projects',    items: projects,    href: '/projects',    linkBase: '/projects'    },
        ].map(section => (
          <div key={section.title}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '0.62rem', letterSpacing: '0.24em',
                color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {section.title}
              </h2>
              <Link href={section.href}
                style={{ fontFamily: "'Cinzel', serif", fontSize: '0.55rem', letterSpacing: '0.14em',
                  color: 'var(--silver)', textDecoration: 'none', textTransform: 'uppercase' }}>
                View All →
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {!section.items?.length && (
                <p style={{ color: 'var(--text-faint)', fontStyle: 'italic', fontSize: '0.95rem' }}>None yet.</p>
              )}
              {section.items?.map((item: any) => (
                <Link key={item.id} href={`${section.linkBase}/${item.id}`} style={{ textDecoration: 'none' }}>
                  <div className="card-hover" style={{ padding: '14px 18px', borderRadius: 4 }}>
                    <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.88rem',
                      color: 'var(--text-primary)', letterSpacing: '0.04em', marginBottom: 4 }}>
                      {item.title}
                    </p>
                    <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {item.status} · {new Date(item.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}