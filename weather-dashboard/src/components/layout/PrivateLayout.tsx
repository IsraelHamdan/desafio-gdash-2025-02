import { Outlet, Link } from 'react-router-dom'
import SidebarComponent from '../sidebar';

export function PrivateLayout() {

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      <SidebarComponent />

      {/* Linha vertical separadora */}
      <div className="w-px bg-slate-300" />

      <main className="flex-1 overflow-y-auto p-3">
        <Outlet />
      </main>
    </div>
  )
}
