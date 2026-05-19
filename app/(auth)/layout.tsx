export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#000', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '24px',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(192,192,192,0.04) 0%, transparent 70%)',
    }}>
      {children}
    </div>
  )
}