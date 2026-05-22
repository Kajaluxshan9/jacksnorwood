import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { reservationAPI } from '../../services/api';
import { HiCheck, HiX, HiClock } from 'react-icons/hi';

const STATUS_COLORS = {
  PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  CONFIRMED: 'bg-green-500/20 text-green-400 border-green-500/30',
  CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function AdminReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = () => reservationAPI.getAll().then(r => setReservations(r.data)).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    try {
      await reservationAPI.updateStatus(id, status);
      toast.success(`Reservation ${status.toLowerCase()}`);
      load();
    } catch { toast.error('Failed to update status'); }
  };

  const filtered = filter === 'all' ? reservations : reservations.filter(r => r.status === filter);

  const counts = reservations.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-white font-display text-3xl font-bold">Reservations</h1>
        <p className="text-white/40 text-sm mt-1">{reservations.length} total reservations</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[['PENDING', 'Pending', 'text-yellow-400'], ['CONFIRMED', 'Confirmed', 'text-green-400'], ['CANCELLED', 'Cancelled', 'text-red-400']].map(([s, label, color]) => (
          <div key={s} className="bg-gray-900 border border-white/10 rounded-xl p-4 text-center">
            <p className={`font-display text-3xl font-bold ${color}`}>{counts[s] || 0}</p>
            <p className="text-white/40 text-xs uppercase tracking-wider mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {['all', 'PENDING', 'CONFIRMED', 'CANCELLED'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${filter === s ? 'bg-pub-gold text-pub-dark' : 'bg-gray-800 text-white/60 hover:bg-gray-700'}`}>
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {loading ? <div className="text-white/50 text-center py-10">Loading...</div> : (
        <div className="bg-gray-900 rounded-xl border border-white/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/60 border-b border-white/10">
              <tr>
                {['Name', 'Contact', 'Date & Time', 'Guests', 'Status', 'Notes', 'Actions'].map(h => (
                  <th key={h} className="text-left text-white/50 uppercase tracking-wider px-4 py-3 text-xs whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{r.name}</p>
                    <p className="text-white/40 text-xs">{r.createdAt?.split('T')[0]}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white/70 text-xs">{r.email}</p>
                    <p className="text-white/50 text-xs">{r.phone}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-white text-xs">{r.date}</p>
                    <p className="text-pub-gold text-xs">{r.time?.slice(0,5)}</p>
                  </td>
                  <td className="px-4 py-3 text-white/70 text-xs">{r.guests} guests</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white/40 text-xs max-w-32 truncate">{r.notes || '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {r.status !== 'CONFIRMED' && (
                        <button onClick={() => updateStatus(r.id, 'CONFIRMED')} title="Confirm"
                          className="p-1.5 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors">
                          <HiCheck size={14} />
                        </button>
                      )}
                      {r.status !== 'CANCELLED' && (
                        <button onClick={() => updateStatus(r.id, 'CANCELLED')} title="Cancel"
                          className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                          <HiX size={14} />
                        </button>
                      )}
                      {r.status !== 'PENDING' && (
                        <button onClick={() => updateStatus(r.id, 'PENDING')} title="Mark Pending"
                          className="p-1.5 rounded bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-colors">
                          <HiClock size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center text-white/40 py-10">No reservations found</div>}
        </div>
      )}
    </div>
  );
}
