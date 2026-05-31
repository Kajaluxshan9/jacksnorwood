import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import SEO from '../../components/seo/SEO';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FaCalendarCheck, FaUsers, FaClock, FaInfoCircle } from 'react-icons/fa';
import { reservationAPI, heroImageAPI, resolveImageUrl } from '../../services/api';
import PageHero from '../../components/ui/PageHero';
import { FALLBACK_HERO, RESTAURANT_PHONE, OPENING_HOURS } from '../../config/constants';

const TIMES = [
  '11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30',
  '15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30',
  '19:00','19:30','20:00','20:30','21:00',
];

export default function ReservationPage() {
  const [heroImages, setHeroImages] = useState([]);

  useEffect(() => {
    heroImageAPI.getActive().then((r) => setHeroImages(r.data)).catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      await reservationAPI.create({ ...data, guests: parseInt(data.guests) });
      toast.success('Reservation submitted! We will confirm shortly.');
      reset();
    } catch {
      toast.error('Failed to submit. Please try again or call us directly.');
    }
  };

  const inputCls   = 'w-full bg-white border border-stone-200 text-pub-text placeholder-stone-400 px-4 py-3.5 focus:outline-none focus:border-pub-gold transition-colors duration-200 text-sm';
  const labelCls   = 'text-stone-400 text-xs tracking-[0.18em] uppercase mb-1.5 block font-medium';
  const errorCls   = 'text-red-500 text-xs mt-1';
  const today      = new Date().toISOString().split('T')[0];
  const heroImg    = heroImages[0]?.imageUrl ? resolveImageUrl(heroImages[0].imageUrl) : FALLBACK_HERO;

  return (
    <div className="min-h-screen">
      <SEO
        title="Book a Table"
        description="Reserve your table at Jack's Norwood Pub and Restaurant in Norwood, Ontario. Easy online bookings for any occasion."
        canonical="/reservation"
      />

      <PageHero
        subtitle="Reserve a Table"
        title="Book Your Visit"
        description="Secure your spot online. We'll confirm your reservation by email."
        image={heroImg}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* ── Form ──────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2"
          >
            <div className="bg-white border border-stone-200 p-8 lg:p-10" style={{ borderRadius: '4px' }}>
              <div className="flex items-center gap-3 mb-8">
                <span className="block w-7 h-px bg-pub-gold opacity-60" />
                <h2 className="font-display text-pub-text text-2xl font-bold" style={{ letterSpacing: '-0.02em' }}>
                  Reservation Details
                </h2>
              </div>

              {isSubmitSuccessful ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 bg-pub-gold/10 border border-pub-gold/30 flex items-center justify-center mx-auto mb-5">
                    <FaCalendarCheck className="text-pub-gold" size={28} />
                  </div>
                  <h3 className="font-display text-pub-text text-2xl font-bold mb-3" style={{ letterSpacing: '-0.02em' }}>
                    Booking Received!
                  </h3>
                  <p className="text-stone-400 mb-8 max-w-sm mx-auto leading-relaxed">
                    We'll confirm your reservation by email shortly. Looking forward to seeing you!
                  </p>
                  <button onClick={() => reset()} className="btn-outline">
                    Make Another Booking
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className={labelCls}>Full Name *</label>
                      <input {...register('name', { required: 'Name is required' })} placeholder="John Smith" className={inputCls} />
                      {errors.name && <p className={errorCls}>{errors.name.message}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Email *</label>
                      <input
                        {...register('email', { required: 'Email required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })}
                        placeholder="john@example.com"
                        className={inputCls}
                      />
                      {errors.email && <p className={errorCls}>{errors.email.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className={labelCls}>Phone *</label>
                      <input {...register('phone', { required: 'Phone required' })} placeholder="(705) 000-0000" className={inputCls} />
                      {errors.phone && <p className={errorCls}>{errors.phone.message}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Party Size *</label>
                      <select {...register('guests', { required: 'Select number of guests' })} className={inputCls}>
                        <option value="">Select guests</option>
                        {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                          <option key={n} value={n}>{n} {n === 1 ? 'guest' : 'guests'}</option>
                        ))}
                        <option value="11">11+ guests (call us)</option>
                      </select>
                      {errors.guests && <p className={errorCls}>{errors.guests.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className={labelCls}>Date *</label>
                      <input type="date" min={today} {...register('date', { required: 'Date required' })} className={inputCls} />
                      {errors.date && <p className={errorCls}>{errors.date.message}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Time *</label>
                      <select {...register('time', { required: 'Time required' })} className={inputCls}>
                        <option value="">Select time</option>
                        {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      {errors.time && <p className={errorCls}>{errors.time.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Special Requests</label>
                    <textarea
                      {...register('notes')}
                      placeholder="Dietary requirements, special occasion, seating preferences…"
                      rows={4}
                      className={inputCls + ' resize-none'}
                    />
                  </div>

                  <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-4 disabled:opacity-50">
                    {isSubmitting ? 'Submitting…' : 'Confirm Reservation'}
                  </button>
                </form>
              )}
            </div>
          </motion.div>

          {/* ── Sidebar ───────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="space-y-5"
          >
            {/* Hours */}
            <div className="bg-white border border-stone-200 p-6" style={{ borderRadius: '4px' }}>
              <div className="flex items-center gap-2 mb-5">
                <FaClock className="text-pub-gold" size={14} />
                <h3 className="font-display text-pub-gold font-semibold text-base">Opening Hours</h3>
              </div>
              <div className="space-y-2">
                {OPENING_HOURS.map(({ day, time }) => (
                  <div key={day} className="flex justify-between border-b border-stone-100 pb-2 last:border-0 last:pb-0">
                    <span className="text-stone-500 text-xs">{day}</span>
                    <span className="text-pub-text font-medium text-xs">{time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Good to know */}
            <div className="bg-white border border-stone-200 p-6" style={{ borderRadius: '4px' }}>
              <div className="flex items-center gap-2 mb-5">
                <FaInfoCircle className="text-pub-gold" size={14} />
                <h3 className="font-display text-pub-gold font-semibold text-base">Good to Know</h3>
              </div>
              <ul className="space-y-2.5 text-stone-500 text-xs leading-relaxed">
                {[
                  'Reservations held for 15 minutes',
                  'Large groups (10+) please call us',
                  'We accommodate dietary requirements',
                  'Kids menu available',
                  'Outdoor seating available (weather permitting)',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-pub-gold flex-shrink-0 mt-1.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Large groups */}
            <div className="bg-pub-dark p-6" style={{ borderRadius: '4px' }}>
              <div className="flex items-center gap-2 mb-3">
                <FaUsers className="text-pub-gold" size={14} />
                <h3 className="font-display text-white font-semibold text-base">Large Groups?</h3>
              </div>
              <p className="text-white/45 text-xs mb-5 leading-relaxed">
                For parties of 10 or more, give us a call to arrange a function booking.
              </p>
              <a href={`tel:${RESTAURANT_PHONE}`} className="btn-primary block text-center text-xs">
                {RESTAURANT_PHONE}
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
