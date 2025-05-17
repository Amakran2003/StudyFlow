import { Outlet } from 'react-router-dom'
import { Navbar } from '../shared/Navbar'

export function RootLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 antialiased">
      <Navbar />
      <Outlet />
    </div>
  )
}
