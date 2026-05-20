import Sidebar from '@/components/ui/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#000' }}>
      <Sidebar />
      <main style={{ marginLeft: 220, flex: 1, padding: '40px 32px', minHeight: '100vh' }}
        className="dashboard-main">
        {children}
      </main>
      <style>{`
        @media (max-width: 768px) {
          .dashboard-main { margin-left: 0 !important; padding: 72px 16px 32px !important; }
        }
      `}</style>
    </div>
  )
}