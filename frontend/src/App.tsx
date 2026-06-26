import { Outlet } from 'react-router-dom'

function App() {
  return (
    <div className="min-h-screen bg-brand-ivory font-sans text-brand-navy">
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Inter,system-ui,sans-serif' font-size='48' font-weight='700' letter-spacing='8' fill='%230D1B2A' fill-opacity='0.04' transform='rotate(-30 200 150)'%3EFikirBiz%3C/text%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />
      <Outlet />
    </div>
  )
}

export default App
