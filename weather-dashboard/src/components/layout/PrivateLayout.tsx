import { useAuth } from '@/contexts/authContext';
import { Outlet, Link } from 'react-router-dom'

export function PrivateLayout() {
  const { user, logout } = useAuth()

  return (
    <div>
      <header>
        <nav>
          <Link to="/">Dashboard</Link>
          {/* outras rotas */}
          <div style={{ float: 'right' }}>
            {user?.email}
            <button onClick={logout}>Sair</button>
          </div>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  )
}
