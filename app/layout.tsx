'use client'
import Sidebar from '@/components/ui/Sidebar'
import GrokChat from '@/components/ui/GrokChat'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        .dashboard-wrap { display: flex; min-height: 100vh; background: var(--bg); }
        .dashboard-main {
          margin-left: 220px; flex: 1; padding: 40px 36px;
          min-height: 100vh; max-width: 100%; overflow-x: hidden; box-sizing: border-box;
        }
        @media (max-width: 768px) {
          .dashboard-main { margin-left: 0 !important; padding: 72px 16px 120px !important; width: 100% !important; }
        }
      `}</style>
      <div className="dashboard-wrap">
        <Sidebar />
        <main className="dashboard-main">{children}</main>
        <GrokChat />
      </div>
    </>
  )
}