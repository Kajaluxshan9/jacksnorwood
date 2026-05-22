import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { contactAPI } from '../../services/api';
import { HiMail, HiMailOpen, HiPhone } from 'react-icons/hi';
import { FaEnvelope } from 'react-icons/fa';

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');

  const load = () => contactAPI.getAll().then(r => setMessages(r.data)).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    try {
      await contactAPI.markRead(id);
      load();
    } catch { toast.error('Failed to update'); }
  };

  const openMessage = (msg) => {
    setSelected(msg);
    if (!msg.isRead) markRead(msg.id);
  };

  const filtered = filter === 'all' ? messages : filter === 'unread' ? messages.filter(m => !m.isRead) : messages.filter(m => m.isRead);
  const unreadCount = messages.filter(m => !m.isRead).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-white font-display text-3xl font-bold">Messages</h1>
        <p className="text-white/40 text-sm mt-1">{unreadCount} unread of {messages.length} total</p>
      </div>

      <div className="flex gap-2 mb-6">
        {[['all', 'All'], ['unread', `Unread (${unreadCount})`], ['read', 'Read']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${filter === v ? 'bg-pub-gold text-pub-dark' : 'bg-gray-800 text-white/60 hover:bg-gray-700'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* List */}
        <div className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden">
          {loading ? (
            <div className="text-white/50 text-center py-10">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-white/40 text-center py-10">No messages</div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map(msg => (
                <div
                  key={msg.id}
                  onClick={() => openMessage(msg)}
                  className={`p-4 cursor-pointer hover:bg-white/5 transition-colors flex items-start gap-3 ${selected?.id === msg.id ? 'bg-pub-gold/10 border-l-2 border-pub-gold' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${msg.isRead ? 'bg-gray-700' : 'bg-pub-gold/20'}`}>
                    {msg.isRead ? <HiMailOpen size={16} className="text-white/40" /> : <HiMail size={16} className="text-pub-gold" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className={`font-medium text-sm ${msg.isRead ? 'text-white/70' : 'text-white'}`}>{msg.name}</p>
                      <p className="text-white/30 text-xs whitespace-nowrap ml-2">{msg.createdAt?.split('T')[0]}</p>
                    </div>
                    <p className="text-white/40 text-xs">{msg.email}</p>
                    <p className="text-white/50 text-xs mt-1 truncate">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="bg-gray-900 border border-white/10 rounded-xl p-6">
          {selected ? (
            <div>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-white font-display text-xl font-bold">{selected.name}</h2>
                  <div className="flex flex-col gap-1 mt-2">
                    <a href={`mailto:${selected.email}`} className="text-pub-gold text-sm flex items-center gap-2 hover:underline">
                      <FaEnvelope size={12} />{selected.email}
                    </a>
                    {selected.phone && (
                      <a href={`tel:${selected.phone}`} className="text-white/50 text-sm flex items-center gap-2 hover:text-white transition-colors">
                        <HiPhone size={12} />{selected.phone}
                      </a>
                    )}
                  </div>
                </div>
                <span className="text-white/30 text-xs">{selected.createdAt?.replace('T', ' ').slice(0,16)}</span>
              </div>
              <div className="bg-gray-800 rounded-xl p-5 mb-6">
                <p className="text-white/80 leading-relaxed text-sm whitespace-pre-wrap">{selected.message}</p>
              </div>
              <a
                href={`mailto:${selected.email}?subject=Re: Your message to Jack's Norwood`}
                className="btn-primary flex items-center justify-center gap-2 text-sm"
              >
                <FaEnvelope /> Reply via Email
              </a>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-white/30">
              <HiMail size={40} className="mb-3 opacity-30" />
              <p>Select a message to read</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
