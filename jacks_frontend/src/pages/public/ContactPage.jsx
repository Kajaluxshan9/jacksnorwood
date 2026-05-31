import { useRef, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import SEO from '../../components/seo/SEO';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock, FaUpload, FaCheckCircle } from 'react-icons/fa';
import { contactAPI, uploadAPI, heroImageAPI, resolveImageUrl } from '../../services/api';
import PageHero from '../../components/ui/PageHero';
import { FALLBACK_HERO, RESTAURANT_ADDRESS, RESTAURANT_PHONE, RESTAURANT_EMAIL, OPENING_HOURS } from '../../config/constants';

const SUBJECTS = ['General', 'Feedback', 'Career'];

export default function ContactPage() {
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm();
  const [cvFile,      setCvFile]      = useState(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [cvUrl,       setCvUrl]       = useState('');
  const [heroImages,  setHeroImages]  = useState([]);
  const fileRef = useRef(null);

  useEffect(() => {
    heroImageAPI.getActive().then((r) => setHeroImages(r.data)).catch(() => {});
  }, []);

  const subject  = watch('subject', 'General');
  const isCareer = subject === 'Career';

  const handleCvChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCvFile(file);
    setCvUploading(true);
    try {
      const res = await uploadAPI.upload(file);
      setCvUrl(res.data.url);
    } catch {
      toast.error('CV upload failed. Please try again.');
      setCvFile(null);
    } finally {
      setCvUploading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      await contactAPI.send({ ...data, cvUrl: cvUrl || undefined });
      toast.success("Message sent! We'll get back to you soon.");
      reset();
      setCvFile(null);
      setCvUrl('');
    } catch {
      toast.error('Failed to send message. Please try again.');
    }
  };

  const inputCls = 'w-full bg-white border border-stone-200 text-pub-text placeholder-stone-400 px-4 py-3.5 focus:outline-none focus:border-pub-gold transition-colors duration-200 text-sm';
  const labelCls = 'text-stone-400 text-xs tracking-[0.18em] uppercase mb-1.5 block font-medium';
  const errorCls = 'text-red-500 text-xs mt-1';

  const heroImg = heroImages[0]?.imageUrl ? resolveImageUrl(heroImages[0].imageUrl) : FALLBACK_HERO;

  return (
    <div className="min-h-screen">
      <SEO
        title="Contact and Find Us"
        description="Contact Jack's Norwood. Find us at 4327 Highway 7, Norwood, ON K0L 2V0. Call +1 (705) 639-0399 or email us."
        canonical="/contact"
      />

      <PageHero
        subtitle="Get in Touch"
        title="Contact Us"
        description="We'd love to hear from you. For enquiries, feedback, or career opportunities."
        image={heroImg}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">

          {/* ── Form ─────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-3"
          >
            <h2 className="font-display text-pub-text text-2xl font-bold mb-8" style={{ letterSpacing: '-0.02em' }}>
              Send Us a Message
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className={labelCls}>Full Name *</label>
                <input {...register('name', { required: 'Name is required' })} placeholder="Jane Smith" className={inputCls} />
                {errors.name && <p className={errorCls}>{errors.name.message}</p>}
              </div>

              <div>
                <label className={labelCls}>Email Address *</label>
                <input
                  {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })}
                  placeholder="jane@example.com"
                  className={inputCls}
                />
                {errors.email && <p className={errorCls}>{errors.email.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Phone</label>
                  <input {...register('phone')} placeholder="(705) 000-0000" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Subject</label>
                  <select {...register('subject')} className={inputCls}>
                    {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {isCareer && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleCvChange} />
                  {cvFile && cvUrl ? (
                    <div className="flex items-center gap-3 bg-green-50 border border-green-200 px-4 py-3">
                      <FaCheckCircle className="text-green-500 flex-shrink-0" />
                      <span className="text-green-700 text-sm font-medium truncate">{cvFile.name}</span>
                      <button
                        type="button"
                        onClick={() => { setCvFile(null); setCvUrl(''); if (fileRef.current) fileRef.current.value = ''; }}
                        className="ml-auto text-stone-400 hover:text-red-500 text-xs transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={cvUploading}
                      className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-stone-300 hover:border-pub-gold text-stone-400 hover:text-pub-gold px-4 py-4 text-sm font-medium transition-all duration-200 disabled:opacity-50"
                    >
                      <FaUpload size={14} />
                      {cvUploading ? 'Uploading CV…' : 'Attach CV / Resume (PDF, DOC)'}
                    </button>
                  )}
                </motion.div>
              )}

              <div>
                <label className={labelCls}>{isCareer ? 'Cover Letter / Notes *' : 'Message *'}</label>
                <textarea
                  {...register('message', { required: 'Message is required', minLength: { value: 10, message: 'Message too short' } })}
                  placeholder={isCareer ? 'Tell us about yourself and why you\'d like to join the team…' : 'How can we help you?'}
                  rows={6}
                  className={inputCls + ' resize-none'}
                />
                {errors.message && <p className={errorCls}>{errors.message.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || cvUploading}
                className="btn-primary w-full disabled:opacity-50"
              >
                {isSubmitting ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          </motion.div>

          {/* ── Info ─────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:col-span-2"
          >
            <h2 className="font-display text-pub-text text-2xl font-bold mb-8" style={{ letterSpacing: '-0.02em' }}>
              Restaurant Info
            </h2>

            <div className="space-y-6 mb-10">
              {[
                { icon: FaMapMarkerAlt, label: 'Address', content: RESTAURANT_ADDRESS },
                { icon: FaPhone,        label: 'Phone',   content: RESTAURANT_PHONE,   href: `tel:${RESTAURANT_PHONE}` },
                { icon: FaEnvelope,     label: 'Email',   content: RESTAURANT_EMAIL,   href: `mailto:${RESTAURANT_EMAIL}` },
              ].map(({ icon: Icon, label, content, href }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="w-9 h-9 border border-pub-gold/30 flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(176,122,26,0.07)' }}>
                    <Icon className="text-pub-gold" size={14} />
                  </div>
                  <div>
                    <p className="text-stone-400 text-xs tracking-[0.18em] uppercase mb-1">{label}</p>
                    {href ? (
                      <a href={href} className="text-pub-text hover:text-pub-gold transition-colors text-sm">{content}</a>
                    ) : (
                      <p className="text-pub-text text-sm">{content}</p>
                    )}
                  </div>
                </div>
              ))}

              <div className="flex items-start gap-4">
                <div className="w-9 h-9 border border-pub-gold/30 flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(176,122,26,0.07)' }}>
                  <FaClock className="text-pub-gold" size={14} />
                </div>
                <div className="flex-1">
                  <p className="text-stone-400 text-xs tracking-[0.18em] uppercase mb-3">Opening Hours</p>
                  <div className="space-y-2">
                    {OPENING_HOURS.map(({ day, time }) => (
                      <div key={day} className="flex justify-between border-b border-stone-100 pb-2 last:border-0 last:pb-0">
                        <span className="text-stone-500 text-xs">{day}</span>
                        <span className="text-pub-gold text-xs font-medium">{time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Map - Google Maps street view */}
            <div className="overflow-hidden border border-stone-200 h-56" style={{ borderRadius: '4px' }}>
              <iframe
                title="Jack's Norwood Location"
                src="https://maps.google.com/maps?q=4327+Highway+7,+Norwood,+ON+K0L+2V0&t=m&z=15&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
