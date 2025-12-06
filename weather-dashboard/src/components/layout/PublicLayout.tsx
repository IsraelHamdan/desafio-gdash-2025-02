import { Outlet } from 'react-router-dom'
import { HoleBackground } from '../animate-ui/components/backgrounds/hole';

export function PublicLayout() {
  return (
 

      <div className="relative z-10 flex min-h-screen items-center justify-center">
        <Outlet />
      </div>
    
  )
}