import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaFacebook, FaInstagram } from 'react-icons/fa';
import { FaTiktok } from 'react-icons/fa6';
import logoImg from '../../assets/images/JN L 2.png';
import { settingsAPI, newsletterAPI } from '../../services/api';
import {
  ONLINE_ORDER_URL,
  RESTAURANT_ADDRESS,
  RESTAURANT_PHONE,
  RESTAURANT_EMAIL,
  OPENING_HOURS,
} from '../../config/constants';

const quickLinks = [
  { to: '/menu',       label: 'Our Menu' },
  { to: '/promotions', label: 'Daily Specials' },
  { to: '/events',     label: 'Events' },
  { href: ONLINE_ORDER_URL, label: 'Order Online' },
  { to: '/gallery',    label: 'Gallery' },
  { to: '/about',      label: 'About Us' },
  { to: '/contact',    label: 'Contact' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [social, setSocial] = useState({ facebook: '', instagram: '', tiktok: '' });
  const [nlSubmitting, setNlSubmitting] = useState(false);

  useEffect(() => {
    settingsAPI
      .getAll()
      .then((r) =>
        setSocial({
          facebook:  r.data['social.facebook']  || '',
          instagram: r.data['social.instagram'] || '',
          tiktok:    r.data['social.tiktok']    || '',
        }),
      )
      .catch(() => {});
  }, []);

  const handleNewsletter = async (e) => {
    e.preventDefault();
    const email = e.target.elements.email.value.trim();
    if (!email) return;
    setNlSubmitting(true);
    try {
      await newsletterAPI.subscribe(email, '');
      toast.success("You're on the list!");
      e.target.reset();
    } catch {
      toast.error('Subscription failed. Please try again.');
    } finally {
      setNlSubmitting(false);
    }
  };

  const socialLinks = [
    { href: social.facebook,  Icon: FaFacebook,  label: 'Facebook' },
    { href: social.instagram, Icon: FaInstagram, label: 'Instagram' },
    { href: social.tiktok,    Icon: FaTiktok,    label: 'TikTok' },
  ];

  return (
    <footer className="bg-pub-dark relative z-10">
      {/* Top gold accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-pub-gold/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 py-16">

          {/* Brand column */}
          <div>
            <img
              src={logoImg}
              alt="Jack's Norwood"
              loading="lazy"
              decoding="async"
              className="h-14 w-auto object-contain mb-6"
              style={{ opacity: 0.88 }}
            />
            <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.38)' }}>
              Your neighbourhood pub and restaurant in Norwood, Ontario. Great food,
              cold drinks, and a warm welcome every day.
            </p>
            <div className="flex gap-3">
              {socialLinks.map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href || '#'}
                  target={href ? '_blank' : undefined}
                  rel={href ? 'noopener noreferrer' : undefined}
                  onClick={!href ? (e) => e.preventDefault() : undefined}
                  aria-label={label}
                  title={href ? label : `${label} - add URL in Admin Settings`}
                  className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-200 ${
                    href
                      ? 'border-white/15 text-white/40 hover:border-pub-gold hover:text-pub-gold cursor-pointer'
                      : 'border-white/8 text-white/20 cursor-not-allowed'
                  }`}
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Explore links */}
          <div>
            <h3 className="text-white text-xs font-semibold tracking-[0.22em] uppercase mb-6">
              Explore
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href || link.to}>
                  {link.href ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm transition-colors duration-200 hover:text-pub-gold"
                      style={{ color: 'rgba(255,255,255,0.38)' }}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      to={link.to}
                      className="text-sm transition-colors duration-200 hover:text-pub-gold"
                      style={{ color: 'rgba(255,255,255,0.38)' }}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Hours */}
          <div>
            <h3 className="text-white text-xs font-semibold tracking-[0.22em] uppercase mb-6">
              Find Us
            </h3>
            <div className="space-y-3 mb-8">
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>
                {RESTAURANT_ADDRESS}
              </p>
              <a
                href={`tel:${RESTAURANT_PHONE.replace(/[^+\d]/g, '')}`}
                className="block text-sm transition-colors duration-200 hover:text-pub-gold"
                style={{ color: 'rgba(255,255,255,0.38)' }}
              >
                {RESTAURANT_PHONE}
              </a>
              <a
                href={`mailto:${RESTAURANT_EMAIL}`}
                className="block text-sm transition-colors duration-200 hover:text-pub-gold"
                style={{ color: 'rgba(255,255,255,0.38)' }}
              >
                {RESTAURANT_EMAIL}
              </a>
            </div>

            <h4 className="text-white/50 text-xs font-semibold tracking-[0.22em] uppercase mb-3">Hours</h4>
            <div className="space-y-2">
              {OPENING_HOURS.map(({ day, time }) => (
                <div key={day} className="flex justify-between gap-4">
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>{day}</span>
                  <span className="text-pub-gold text-xs font-medium">{time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-white text-xs font-semibold tracking-[0.22em] uppercase mb-6">
              Stay Updated
            </h3>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.38)' }}>
              Specials, events and news. Straight to your inbox, no spam ever.
            </p>
            <form onSubmit={handleNewsletter} className="space-y-3">
              <input
                type="email"
                name="email"
                required
                placeholder="your@email.com"
                className="w-full text-white placeholder-white/25 px-4 py-3 text-sm focus:outline-none transition-colors duration-200"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(176,122,26,0.6)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
              <button
                type="submit"
                disabled={nlSubmitting}
                className="btn-primary w-full text-center disabled:opacity-40"
              >
                {nlSubmitting ? 'Subscribing…' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="py-6 flex flex-col md:flex-row justify-between items-center gap-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.22)' }}>
            © {currentYear} Jack's Norwood. All rights reserved.
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.18)' }}>
            Please drink responsibly. Must be 19+ to consume alcohol.
          </p>
        </div>
      </div>
    </footer>
  );
}
