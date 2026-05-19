'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import ProjectModal from '@/components/projects/ProjectModal'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('projects').select('*').order('updated_at', { ascending: false })
      setProjects(data ?? [])
    }
    load()
  }, [])

  const statusColor: Record<string, string> = {
    'development': '#555', 'pre-production': '#8a7', 'production': '#7a8', 'post-production': '#68a', 'completed': '#c0c0c0'
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: '0.6rem', letterSpacing: '0.3em', color: '#555', textTransform: 'uppercase', marginBottom: 6 }}>Prodigy Pictures</p>
          <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', color: '#c0c0c0', letterSpacing: '0.05em' }}>Projects</h1>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary"
          style={{ padding: '12px 28px', fontSize: '0.7rem', borderRadius: 2, border: 'none', cursor: 'pointer' }}>
          + New Project
        </button>
      </div>

      {projects.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: '1rem', color: '#333', letterSpacing: '0.1em' }}>No projects yet</p>
          <p style={{ fontFamily: "'EB Garamond', serif", color: '#444', fontStyle: 'italic', marginTop: 8 }}>Create your first production</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {projects.map(p => (
          <Link key={p.id} href={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
            <div className="card-hover" style={{ background: '#111', padding: '28px 24px', borderRadius: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: statusColor[p.status] ?? '#555', border: '1px solid currentColor', padding: '2px 8px', borderRadius: 2 }}>{p.status}</span>
                <span style={{ color: '#2a2a2a', fontSize: '1.2rem' }}>◆</span>
              </div>
              <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: '1rem', color: '#c0c0c0', letterSpacing: '0.05em', marginBottom: 8 }}>{p.title}</h3>
              {p.genre && <p style={{ fontFamily: "'EB Garamond', serif", color: '#555', fontSize: '0.85rem', fontStyle: 'italic' }}>{p.genre}</p>}
              {p.description && <p style={{ fontFamily: "'EB Garamond', serif", color: '#555', fontSize: '0.85rem', marginTop: 8, lineHeight: 1.5 }}>{p.description.slice(0, 80)}{p.description.length > 80 ? '...' : ''}</p>}
              <p style={{ fontFamily: "'EB Garamond', serif", fontSize: '0.75rem', color: '#333', marginTop: 16 }}>{new Date(p.created_at).toLocaleDateString()}</p>
            </div>
          </Link>
        ))}
      </div>

      {showModal && <ProjectModal onClose={() => setShowModal(false)} onCreated={p => setProjects(prev => [p, ...prev])} />}
    </div>
  )
}