import { useAuth } from '@/contexts/authContext';
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, SunMedium, UsersRound } from 'lucide-react';
import { Activity } from 'react';

export default function SidebarComponent() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  const quit = async () => {
    await logout()
    navigate("/")
  }

  return (
    <aside className="
        h-screen w-20 bg-slate-100 border-r border-slate-300
        flex flex-col items-center py-6 gap-8
        text-gray-800
    ">
      <Activity mode={user?.name ? "visible" : "hidden"}>
        <div className="text-center px-2">
          <span className="block text-sm font-semibold leading-tight">
            {user!.name}
          </span>
        </div>
      </Activity>

      <nav className="flex-1 px-2 py-4 space-y-1">
       <SidebarButton
          icon={<UsersRound size={24} />}
          label="Perfil"
          to="/app/profile"
          active={location.pathname === 'app/profile'}
        />
        <SidebarButton
          icon={<SunMedium size={24} />}
          label="Dashboard"
          to="/app"
          active={location.pathname === "/app/dashboad"}
        />
      </nav>

      <button
        onClick={quit}
        className="
          mt-auto flex items-center gap-2 py-2 px-3 rounded-md 
          hover:bg-slate-200 text-gray-700 font-medium
        "
      >
        <LogOut size={18} />
        Sair
      </button>
    </aside>
  )
}

type SidebarButtonProps = {
  to: string
  icon: React.ReactNode
  label: string
  active?: boolean
}


function SidebarButton({ to, icon, label, active }: SidebarButtonProps) {
  return (
    <Link
      to={to}
      className={`
        flex flex-col items-center justify-center gap-1
        w-full py-3 text-xs font-medium
        ${active ? "bg-slate-200 text-slate-900" : "text-gray-700"}
        hover:bg-slate-200
      `}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}