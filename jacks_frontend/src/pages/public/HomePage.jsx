import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/seo/SEO';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMapMarkerAlt, FaPhone, FaClock, FaChevronLeft, FaChevronRight, FaArrowRight } from 'react-icons/fa';
import { menuAPI, promotionAPI, heroImageAPI, galleryAPI, resolveImageUrl } from '../../services/api';
import MenuItemCard from '../../components/ui/MenuItemCard';
import SectionHeader from '../../components/ui/SectionHeader';
import SpecialsPopup from '../../components/ui/SpecialsPopup';
import { FALLBACK_HERO, FALLBACK_PROMOTION, FALLBACK_GALLERY, RESTAURANT_PHONE, RESTAURANT_ADDRESS, OPENING_HOURS } from '../../config/constants';

const fadeUp = {
  hidden:  { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

export default function HomePage() {
  const [popularItems,  setPopularItems]  = useState([]);
  const [promotions,    setPromotions]    = useState([]);
  const [loadingMenu,   setLoadingMenu]   = useState(true);
  const [heroImages,    setHeroImages]    = useState([]);
  const [heroIndex,     setHeroIndex]     = useState(0);
  const [galleryImages, setGalleryImages] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    Promise.all([
      menuAPI.getPopular().then((r)       => setPopularItems(r.data.slice(0, 6))),
      promotionAPI.getActive().then((r)   => setPromotions(r.data.slice(0, 3))),
      heroImageAPI.getActive().then((r)   => setHeroImages(r.data)),
      galleryAPI.getAll().then((r)        => setGalleryImages(r.data)),
    ])
      .catch(console.error)
      .finally(() => setLoadingMenu(false));
  }, []);

  useEffect(() => {
    if (heroImages.length <= 1) return;
    timerRef.current = setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroImages.length);
    }, 9000);
    return () => clearInterval(timerRef.current);
  }, [heroImages]);

  const heroPrev = () => { clearInterval(timerRef.current); setHeroIndex((i) => (i - 1 + heroImages.length) % heroImages.length); };
  const heroNext = () => { clearInterval(timerRef.current); setHeroIndex((i) => (i + 1) % heroImages.length); };

  const heroBg = heroImages.length > 0
    ? resolveImageUrl(heroImages[heroIndex].imageUrl)
    : import.meta.env.VITE_HERO_IMAGE_URL || FALLBACK_HERO;

  return (
    <div>
      <SEO
        description="Jack's Norwood is your neighbourhood pub and restaurant in Norwood, Ontario. Great food, cold drinks, daily specials, and live events. Open 7 days a week."
        canonical="/"
      />
      <SpecialsPopup />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-end overflow-hidden">
        {/* Background slideshow */}
        <AnimatePresence mode="sync">
          <motion.div
            key={heroIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4 }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${heroBg}')` }}
          />
        </AnimatePresence>

        {/* Gradient - heavier at bottom for text legibility, lighter at top */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/15" />
        {/* Subtle left edge vignette */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

        {/* Prev / Next */}
        {heroImages.length > 1 && (
          <>
            <button onClick={heroPrev} aria-label="Previous image"
              className="absolute left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full border border-white/25 bg-black/20 hover:bg-black/50 text-white flex items-center justify-center transition-all duration-200">
              <FaChevronLeft size={14} />
            </button>
            <button onClick={heroNext} aria-label="Next image"
              className="absolute right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full border border-white/25 bg-black/20 hover:bg-black/50 text-white flex items-center justify-center transition-all duration-200">
              <FaChevronRight size={14} />
            </button>
            {/* Dot indicators */}
            <div className="absolute bottom-8 right-8 z-20 flex gap-1.5">
              {heroImages.map((_, i) => (
                <button key={i} onClick={() => { clearInterval(timerRef.current); setHeroIndex(i); }}
                  className={`rounded-full transition-all duration-300 ${i === heroIndex ? 'bg-pub-gold w-5 h-1.5' : 'bg-white/30 w-1.5 h-1.5'}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Hero content - bottom-left aligned */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 lg:pb-28">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="flex items-center gap-3 mb-5"
          >
            <span className="block w-8 h-px bg-pub-gold" />
            <span className="text-white/65 text-xs font-semibold tracking-[0.28em] uppercase">
              Norwood, Ontario
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="font-display text-white font-bold leading-none mb-6"
            style={{ fontSize: 'clamp(3rem, 9vw, 7rem)', letterSpacing: '-0.03em' }}
          >
            Jack's<br />
            <span className="text-gradient">Norwood</span>
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.65, delay: 0.4 }}
            className="text-white/60 text-lg md:text-xl font-light mb-10 max-w-md leading-relaxed"
          >
            Great food, cold drinks, and a warm welcome every day.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.55 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Link to="/menu"       className="btn-primary">Explore the Menu</Link>
            <Link to="/promotions" className="btn-outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.45)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
              View Specials
            </Link>
          </motion.div>
        </div>

        {/* Scroll cue - vertical line */}
        <div className="absolute left-8 bottom-12 hidden lg:flex flex-col items-center gap-3 z-20">
          <span className="text-white/30 text-xs tracking-[0.2em] uppercase" style={{ writingMode: 'vertical-rl' }}>Scroll</span>
          <span className="hero-scroll-line" />
        </div>
      </section>

      {/* ── TODAY'S SPECIALS ─────────────────────────────────────────────────── */}
      {promotions.length > 0 && (
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <SectionHeader
                subtitle="Limited Time"
                title="Today's Specials"
                center={false}
              />
              <Link to="/promotions" className="btn-ghost hidden sm:inline-flex shrink-0 mb-14">
                View All <FaArrowRight size={10} />
              </Link>
            </div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
            >
              {promotions.map((promo, i) => (
                <motion.div key={promo.id} variants={fadeUp}>
                  <Link to="/promotions" className="block group">
                    {/* Numbered editorial card */}
                    <div className="relative overflow-hidden aspect-[3/4]">
                      {/* Large editorial number */}
                      <span
                        className="absolute top-4 left-4 z-10 font-display font-bold leading-none select-none pointer-events-none"
                        style={{ fontSize: '5rem', color: 'rgba(255,255,255,0.12)', lineHeight: 1 }}
                        aria-hidden="true"
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <img
                        src={resolveImageUrl(promo.imageUrl, FALLBACK_PROMOTION)}
                        alt={promo.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        onError={(e) => { e.target.src = FALLBACK_PROMOTION; }}
                      />
                      {/* Reveal overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-pub-dark/85 via-pub-dark/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-350" />
                      <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <p className="text-white font-display text-lg font-bold leading-tight">{promo.title}</p>
                        <span className="text-pub-gold text-xs tracking-[0.2em] uppercase mt-2 block">View Special →</span>
                      </div>
                    </div>
                    <p className="text-pub-text font-semibold text-sm mt-3 group-hover:text-pub-gold transition-colors duration-200 font-display">
                      {promo.title}
                    </p>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            <div className="text-center mt-10 sm:hidden">
              <Link to="/promotions" className="btn-outline">View All Specials</Link>
            </div>
          </div>
        </section>
      )}

      {/* ── POPULAR MENU ─────────────────────────────────────────────────────── */}
      <section className="py-24" style={{ background: 'rgba(255,255,255,0.55)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <SectionHeader
              subtitle="Our Favourites"
              title="Popular Dishes"
              center={false}
            />
            <Link to="/menu" className="btn-ghost hidden sm:inline-flex shrink-0 mb-14">
              Full Menu <FaArrowRight size={10} />
            </Link>
          </div>

          {loadingMenu ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-xl bg-stone-100 animate-pulse h-72" />
              ))}
            </div>
          ) : (
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {popularItems.map((item) => (
                <motion.div key={item.id} variants={fadeUp}>
                  <MenuItemCard item={item} />
                </motion.div>
              ))}
            </motion.div>
          )}

          <div className="text-center mt-12 sm:hidden">
            <Link to="/menu" className="btn-outline">View Full Menu</Link>
          </div>
        </div>
      </section>

      {/* ── ABOUT SNIPPET ────────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Editorial pull quote */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-20 max-w-4xl"
          >
            <span className="block w-8 h-px bg-pub-gold mb-6" />
            <blockquote
              className="font-display text-pub-text font-bold leading-tight mb-6"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', letterSpacing: '-0.02em' }}
            >
              "Good food, honest drinks, and a warm welcome. That's all we've ever promised."
            </blockquote>
            <cite className="not-italic text-stone-400 text-xs tracking-[0.22em] uppercase">
              Jack's Norwood
            </cite>
          </motion.div>

          {/* Story + images */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <p className="section-subtitle mb-4">Our Story</p>
              <h2 className="section-title mb-6">A True Norwood Landmark</h2>
              <p className="text-stone-500 text-lg leading-relaxed mb-5">
                Jack's Norwood sits in the heart of Ontario's countryside, conveniently on Hwy 7.
                Founded by the team behind the beloved Brooklin Pub, we brought the same
                dedication to quality, passion, and genuine hospitality that has made Brooklin
                a community cornerstone since 2014.
              </p>
              <p className="text-stone-400 leading-relaxed mb-10">
                Whether you're stopping in after work, celebrating a milestone, or bringing
                the whole family for Sunday lunch. You're always welcome here.
              </p>
              <Link to="/about" className="btn-outline">Our Story</Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { alt: 'Bar', offsetClass: '' },
                { alt: 'Food', offsetClass: 'mt-8' },
                { alt: 'Drinks', offsetClass: '-mt-8' },
                { alt: 'Atmosphere', offsetClass: '' },
              ].map(({ alt, offsetClass }, i) => {
                const img = galleryImages[i];
                const src = img?.imageUrl ? resolveImageUrl(img.imageUrl, FALLBACK_GALLERY) : FALLBACK_GALLERY;
                return (
                  <motion.div
                    key={alt}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                    className={`overflow-hidden rounded-lg h-48 w-full shadow ${offsetClass}`}
                  >
                    <img
                      src={src}
                      alt={alt}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.target.src = FALLBACK_GALLERY; }}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── LOCATION & HOURS ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section heading */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-3 mb-5">
              <span className="block w-7 h-px bg-pub-gold opacity-60" />
              <span className="text-pub-gold text-xs font-semibold tracking-[0.25em] uppercase">Find Us</span>
              <span className="block w-7 h-px bg-pub-gold opacity-60" />
            </div>
            <h2 className="font-display text-pub-text font-bold"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.08, letterSpacing: '-0.025em' }}>
              Location and Hours
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

            {/* Map */}
            <div className="overflow-hidden border border-stone-200 h-80 lg:h-full min-h-80" style={{ borderRadius: '4px' }}>
              <iframe
                title="Jack's Norwood Location"
                src="https://maps.google.com/maps?q=4327+Highway+7,+Norwood,+ON+K0L+2V0&t=m&z=15&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '320px' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            {/* Info cards */}
            <div className="space-y-6">

              {/* Address */}
              <div className="border border-stone-200 p-6" style={{ borderRadius: '4px' }}>
                <p className="text-pub-gold text-xs font-semibold tracking-[0.22em] uppercase mb-2 flex items-center gap-2">
                  <FaMapMarkerAlt size={11} /> Address
                </p>
                <p className="text-pub-text font-medium text-base">{RESTAURANT_ADDRESS}</p>
              </div>

              {/* Phone */}
              <div className="border border-stone-200 p-6" style={{ borderRadius: '4px' }}>
                <p className="text-pub-gold text-xs font-semibold tracking-[0.22em] uppercase mb-2 flex items-center gap-2">
                  <FaPhone size={11} /> Phone
                </p>
                <a
                  href={`tel:${RESTAURANT_PHONE.replace(/[^+\d]/g, '')}`}
                  className="text-pub-text font-medium text-base hover:text-pub-gold transition-colors duration-200"
                >
                  {RESTAURANT_PHONE}
                </a>
              </div>

              {/* Opening Hours */}
              <div className="border border-stone-200 p-6" style={{ borderRadius: '4px' }}>
                <p className="text-pub-gold text-xs font-semibold tracking-[0.22em] uppercase mb-4 flex items-center gap-2">
                  <FaClock size={11} /> Opening Hours
                </p>
                <div className="space-y-3">
                  {OPENING_HOURS.map(({ day, time }) => (
                    <div key={day} className="flex items-start justify-between gap-4 pb-3 border-b border-stone-100 last:border-0 last:pb-0">
                      <span className="text-pub-text font-medium text-sm">{day}</span>
                      <span className="text-pub-gold font-semibold text-sm whitespace-nowrap">{time}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
