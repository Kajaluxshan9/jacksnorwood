import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FaFacebook, FaInstagram } from 'react-icons/fa';
import { FaTiktok } from 'react-icons/fa6';
import { settingsAPI } from '../../services/api';

const SOCIAL_FIELDS = [
  { key: 'social.facebook',  label: 'Facebook URL',  icon: FaFacebook,  placeholder: 'https://facebook.com/yourpage', color: 'text-blue-400' },
  { key: 'social.instagram', label: 'Instagram URL', icon: FaInstagram, placeholder: 'https://instagram.com/yourhandle', color: 'text-pink-400' },
{ key: 'social.tiktok',   label: 'TikTok URL',      icon: FaTiktok,   placeholder: 'https://tiktok.com/@yourhandle',  color: 'text-white' },
];

export default function AdminSettings() {
  const { register, handleSubmit, reset, formState: { isSubmitting, isDirty } } = useForm();

  useEffect(() => {
    settingsAPI.getAll()
      .then(r => {
        const data = r.data;
        reset({
          social: {
            facebook: data['social.facebook']  || '',
            instagram: data['social.instagram'] || '',
            tiktok:   data['social.tiktok']    || '',
          },
        });
      })
      .catch(() => toast.error('Failed to load settings'));
  }, []);

  const onSubmit = async (data) => {
    try {
      // react-hook-form converts dotted names to nested objects — flatten manually
      const payload = {};
      SOCIAL_FIELDS.forEach(({ key }) => {
        const parts = key.split('.');
        payload[key] = parts.reduce((obj, k) => obj?.[k], data) || '';
      });
      await settingsAPI.updateAll(payload);
      toast.success('Settings saved!');
      reset(data); // Mark form as clean
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const inputCls = 'flex-1 bg-gray-800 border border-white/20 text-white placeholder-white/30 px-4 py-3 rounded-lg focus:outline-none focus:border-pub-gold transition-colors text-sm';

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-white font-display text-3xl font-bold">Site Settings</h1>
        <p className="text-white/40 text-sm mt-1">Manage social media links shown in the website footer</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 space-y-5">
          <h2 className="text-pub-gold font-display text-lg font-semibold border-b border-white/10 pb-4">
            Social Media Links
          </h2>

          {SOCIAL_FIELDS.map(({ key, label, icon: Icon, placeholder, color }) => (
            <div key={key}>
              <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block">{label}</label>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon size={18} />
                </div>
                <input
                  {...register(key)}
                  type="url"
                  placeholder={placeholder}
                  className={inputCls}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="btn-primary disabled:opacity-50 px-8"
          >
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </button>
          {!isDirty && (
            <span className="text-white/30 text-sm">All changes saved</span>
          )}
        </div>
      </form>
    </div>
  );
}
