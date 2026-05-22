import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';
import { HiClipboardList, HiMenuAlt2, HiTag, HiCalendar, HiMail, HiClock } from 'react-icons/hi';

const StatCard = ({ icon: Icon, label, value, color, to }) => (
  <Link to={to} className={`bg-gray-900 border ${color} rounded-xl p-6 flex items-center gap-5 hover:scale-105 transition-transform duration-200 cursor-pointer`}>
    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${color.replace('border-', 'bg-').replace('/30', '/20')}`}>
      <Icon size={28} className={color.replace('border-', 'text-').replace('/30', '')} />
    </div>
    <div>
      <p className="text-white/50 text-sm uppercase tracking-wider">{label}</p>
      <p className="text-white text-3xl font-bold font-display mt-1">{value ?? '—'}</p>
    </div>
  </Link>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getStats()
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-white font-display text-3xl font-bold">Dashboard</h1>
        <p className="text-white/40 text-sm mt-1">Welcome back to Jack's Norwood admin panel</p>
      </div>

      {loading ? (
        <div className="text-white/50 text-center py-20">Loading stats...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          <StatCard icon={HiClipboardList} label="Total Reservations" value={stats?.totalReservations} color="border-blue-500/30" to="/admin/reservations" />
          <StatCard icon={HiClock} label="Pending Reservations" value={stats?.pendingReservations} color="border-yellow-500/30" to="/admin/reservations" />
          <StatCard icon={HiMenuAlt2} label="Menu Items" value={stats?.totalMenuItems} color="border-green-500/30" to="/admin/menu" />
          <StatCard icon={HiTag} label="Active Promotions" value={stats?.activePromotions} color="border-pub-gold/30" to="/admin/promotions" />
          <StatCard icon={HiCalendar} label="Upcoming Events" value={stats?.upcomingEvents} color="border-purple-500/30" to="/admin/events" />
          <StatCard icon={HiMail} label="Unread Messages" value={stats?.unreadMessages} color="border-red-500/30" to="/admin/messages" />
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-12">
        <h2 className="text-white font-display text-xl font-bold mb-5">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { to: '/admin/menu', label: 'Add Menu Item', color: 'bg-green-600 hover:bg-green-500' },
            { to: '/admin/promotions', label: 'New Promotion', color: 'bg-pub-gold hover:bg-yellow-400 text-pub-dark' },
            { to: '/admin/events', label: 'Create Event', color: 'bg-purple-600 hover:bg-purple-500' },
            { to: '/admin/reservations', label: 'View Bookings', color: 'bg-blue-600 hover:bg-blue-500' },
          ].map(({ to, label, color }) => (
            <Link key={to} to={to}
              className={`${color} text-white font-semibold text-sm uppercase tracking-wider px-4 py-3 rounded-lg text-center transition-colors duration-200`}>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
