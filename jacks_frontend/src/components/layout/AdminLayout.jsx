import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HiMenuAlt2, HiTag, HiCalendar, HiPhotograph,
  HiClipboardList, HiLogout, HiMenu, HiChartBar, HiCog, HiNewspaper, HiUserGroup, HiMail
} from 'react-icons/hi';
import logoImg from '../../assets/images/JN L 2.png';

const sidebarLinks = [
  { to: '/admin', label: 'Dashboard', icon: HiChartBar, end: true },
  { to: '/admin/menu', label: 'Menu', icon: HiMenuAlt2 },
  { to: '/admin/promotions', label: 'Promotions', icon: HiTag },
  { to: '/admin/events', label: 'Events', icon: HiCalendar },
  { to: '/admin/gallery', label: 'Gallery', icon: HiPhotograph },
  { to: '/admin/reservations', label: 'Reservations', icon: HiClipboardList },
  { to: '/admin/newsletter', label: 'Newsletter', icon: HiNewspaper },
  { to: '/admin/hero', label: 'Hero Images', icon: HiPhotograph },
  { to: '/admin/team', label: 'Team', icon: HiUserGroup },
  { to: '/admin/messages', label: 'Messages', icon: HiMail },
  { to: '/admin/settings', label: 'Settings', icon: HiCog },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/10">
        <img src={logoImg} alt="Jack's Norwood" className="h-14 w-auto object-contain" />
        <p className="text-white/40 text-xs mt-2 uppercase tracking-wider">Admin Panel</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {sidebarLinks.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-pub-gold text-pub-dark'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }
            onClick={() => setSidebarOpen(false)}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="px-4 py-2 mb-2">
          <p className="text-white/40 text-xs">Logged in as</p>
          <p className="text-pub-gold text-sm font-semibold">{user?.username}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <HiLogout size={18} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 bg-pub-brown border-r border-white/10 flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-pub-brown border-r border-white/10 flex flex-col z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-pub-brown/50 border-b border-white/10 px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-white/70 hover:text-white"
          >
            <HiMenu size={24} />
          </button>
          <h1 className="text-white font-display text-xl">Jack's Norwood Admin</h1>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
