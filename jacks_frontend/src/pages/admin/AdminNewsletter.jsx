import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { newsletterAPI } from '../../services/api';
import { HiMail } from 'react-icons/hi';
import { FaPaperPlane } from 'react-icons/fa';
import ImageUpload from '../../components/ui/ImageUpload';

const TOPICS = [
  {
    key: 'specials',
    label: 'Specials',
    icon: '🔥',
    hasImage: true,
    subject: "This Week's Specials at Jack's Norwood",
    body: `Hi there,\n\nWe're excited to share this week's specials with you!\n\n[Describe your specials here — e.g., Monday Steak Night, Wednesday Wing Deal, etc.]\n\nCome visit us and enjoy these amazing deals. We look forward to seeing you!\n\nCheers,\nThe Jack's Norwood Team`,
  },
  {
    key: 'new_menu',
    label: 'New Menu Items',
    icon: '🍽️',
    hasImage: true,
    subject: "New Items on Our Menu — Jack's Norwood",
    body: `Hi there,\n\nWe've just added some exciting new dishes to our menu!\n\n[List new items here]\n\nCome in and give them a try — we think you'll love them.\n\nCheers,\nThe Jack's Norwood Team`,
  },
  {
    key: 'event',
    label: 'Event',
    icon: '🎉',
    hasImage: true,
    subject: "Upcoming Event at Jack's Norwood",
    body: `Hi there,\n\nWe have an exciting event coming up at Jack's Norwood!\n\nEvent: [Event Name]\nDate: [Date]\nTime: [Time]\n\n[Describe the event here — entertainment, food, special offers, etc.]\n\nWe hope to see you there!\n\nThe Jack's Norwood Team`,
  },
  {
    key: 'festival',
    label: 'Festival Wishes',
    icon: '🎊',
    hasImage: true,
    subject: "Festive Greetings from Jack's Norwood",
    body: `Hi there,\n\n[Festival Name] greetings from all of us at Jack's Norwood!\n\nWishing you and your loved ones a wonderful celebration.\n\nJoin us for [special offer / event during the festival].\n\nWarm regards,\nThe Jack's Norwood Team`,
  },
  {
    key: 'holiday',
    label: 'Holiday Notice',
    icon: '🏖️',
    hasImage: false,
    subject: "Holiday Hours — Jack's Norwood",
    body: `Hi there,\n\nWe'd like to let you know about our upcoming holiday trading hours:\n\n[Date]: [Hours or Closed]\n[Date]: [Hours or Closed]\n\nWe apologise for any inconvenience and look forward to serving you!\n\nThe Jack's Norwood Team`,
  },
  {
    key: 'closure',
    label: 'Closure Notice',
    icon: '⚠️',
    hasImage: false,
    subject: "Temporary Closure Notice — Jack's Norwood",
    body: `Hi there,\n\nWe'd like to inform you that Jack's Norwood will be temporarily closed:\n\nFrom: [Date]\nTo: [Date]\nReason: [e.g., private event / renovations / maintenance]\n\nWe apologise for any inconvenience and look forward to welcoming you back!\n\nThe Jack's Norwood Team`,
  },
  {
    key: 'general',
    label: 'General',
    icon: '📢',
    hasImage: false,
    subject: '',
    body: '',
  },
];

const inputCls = 'w-full bg-gray-800 border border-white/20 text-white placeholder-white/40 px-3 py-2 rounded-lg focus:outline-none focus:border-pub-gold text-sm';

export default function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('send');

  // Compose state
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sending, setSending] = useState(false);

  const load = () =>
    newsletterAPI.getSubscribers()
      .then(r => setSubscribers(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const selectTopic = (topic) => {
    setSelectedTopic(topic.key);
    setSubject(topic.subject);
    setBody(topic.body);
    if (!topic.hasImage) setImageUrl('');
  };

  const activeTopic = TOPICS.find(t => t.key === selectedTopic);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) { toast.error('Subject and message are required'); return; }
    if (subscribers.length === 0) { toast.error('No subscribers to send to'); return; }
    if (!confirm(`Send newsletter to ${subscribers.length} subscriber${subscribers.length !== 1 ? 's' : ''}?`)) return;

    setSending(true);
    try {
      await newsletterAPI.send(subject, body, imageUrl || null);
      toast.success(`Newsletter sent to ${subscribers.length} subscribers!`);
      setSubject('');
      setBody('');
      setImageUrl('');
      setSelectedTopic(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send newsletter');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-white font-display text-3xl font-bold">Newsletter</h1>
          <p className="text-white/40 text-sm mt-1">{subscribers.length} subscribers</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        {[
          { key: 'send', label: 'Send Newsletter', icon: FaPaperPlane },
          { key: 'subscribers', label: 'Subscribers', icon: HiMail },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
              tab === key ? 'bg-pub-gold text-pub-dark' : 'bg-gray-800 text-white/60 hover:bg-gray-700'
            }`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === 'send' && (
        <div className="max-w-2xl">
          {/* Topic selector */}
          <div className="mb-6">
            <p className="text-white/50 text-xs uppercase tracking-wider mb-3">Select Topic</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TOPICS.map(topic => (
                <button
                  key={topic.key}
                  type="button"
                  onClick={() => selectTopic(topic)}
                  className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-sm font-semibold transition-all ${
                    selectedTopic === topic.key
                      ? 'bg-pub-gold/20 border-pub-gold text-pub-gold'
                      : 'bg-gray-800 border-white/10 text-white/60 hover:border-white/30 hover:text-white'
                  }`}
                >
                  <span className="text-xl">{topic.icon}</span>
                  <span className="text-xs leading-tight text-center">{topic.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Compose form — shown once topic selected */}
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6">
            <h2 className="text-white font-display text-xl font-semibold mb-6">
              {activeTopic ? `${activeTopic.icon} ${activeTopic.label}` : 'Compose Newsletter'}
            </h2>
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wider mb-1 block">Subject *</label>
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Email subject line"
                  className={inputCls}
                />
              </div>

              {/* Image upload — only for topics that support it */}
              {activeTopic?.hasImage && (
                <ImageUpload
                  value={imageUrl}
                  onChange={setImageUrl}
                  label="Image (optional — will appear in the email)"
                  inputCls={inputCls}
                />
              )}

              <div>
                <label className="text-white/50 text-xs uppercase tracking-wider mb-1 block">Message *</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={12}
                  placeholder={selectedTopic ? 'Edit the template above...' : 'Select a topic above or write your message here...'}
                  className={inputCls + ' resize-none'}
                />
              </div>

              <div className="bg-gray-800/50 rounded-lg px-4 py-3 text-white/50 text-sm flex items-center gap-2">
                <HiMail size={16} />
                Will be sent to <span className="text-pub-gold font-semibold">{subscribers.length}</span> subscriber{subscribers.length !== 1 ? 's' : ''}
              </div>

              <button
                type="submit"
                disabled={sending || subscribers.length === 0}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FaPaperPlane size={14} />
                {sending ? 'Sending...' : 'Send Newsletter'}
              </button>
            </form>
          </div>
        </div>
      )}

      {tab === 'subscribers' && (
        <div className="bg-gray-900 border border-white/10 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="text-white/50 text-center py-10">Loading...</div>
          ) : subscribers.length === 0 ? (
            <div className="text-center text-white/40 py-16">
              <HiMail size={40} className="mx-auto mb-3 opacity-40" />
              <p>No subscribers yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-800/60 border-b border-white/10">
                <tr>
                  <th className="text-left text-white/50 uppercase tracking-wider px-4 py-3 text-xs">#</th>
                  <th className="text-left text-white/50 uppercase tracking-wider px-4 py-3 text-xs">Email</th>
                  <th className="text-left text-white/50 uppercase tracking-wider px-4 py-3 text-xs hidden sm:table-cell">Name</th>
                  <th className="text-left text-white/50 uppercase tracking-wider px-4 py-3 text-xs hidden md:table-cell">Subscribed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {subscribers.map((s, i) => (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-white/30 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 text-white">{s.email}</td>
                    <td className="px-4 py-3 text-white/50 hidden sm:table-cell">{s.name || '—'}</td>
                    <td className="px-4 py-3 text-white/30 text-xs hidden md:table-cell">
                      {s.subscribedAt ? new Date(s.subscribedAt).toLocaleDateString('en-AU') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
