import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/seo/SEO';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaMapMarkerAlt,
  FaPhone,
  FaClock,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import {
  menuAPI,
  promotionAPI,
  heroImageAPI,
  galleryAPI,
  resolveImageUrl,
} from "../../services/api";
import MenuItemCard from "../../components/ui/MenuItemCard";
import SectionHeader from "../../components/ui/SectionHeader";
import SpecialsPopup from "../../components/ui/SpecialsPopup";
import {
  FALLBACK_HERO,
  FALLBACK_PROMOTION,
  FALLBACK_GALLERY,
  RESTAURANT_PHONE,
  RESTAURANT_ADDRESS,
  OPENING_HOURS,
} from "../../config/constants";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
};

export default function HomePage() {
  const [popularItems, setPopularItems] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [heroImages, setHeroImages] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    Promise.all([
      menuAPI.getPopular().then((r) => setPopularItems(r.data.slice(0, 6))),
      promotionAPI.getActive().then((r) => setPromotions(r.data.slice(0, 3))),
      heroImageAPI.getActive().then((r) => setHeroImages(r.data)),
      galleryAPI.getAll().then((r) => setGalleryImages(r.data)),
    ])
      .catch(console.error)
      .finally(() => setLoadingMenu(false));
  }, []);

  // Auto-advance hero slideshow every 10 seconds
  useEffect(() => {
    if (heroImages.length <= 1) return;
    timerRef.current = setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroImages.length);
    }, 10000);
    return () => clearInterval(timerRef.current);
  }, [heroImages]);

  const heroPrev = () => {
    clearInterval(timerRef.current);
    setHeroIndex((i) => (i - 1 + heroImages.length) % heroImages.length);
  };
  const heroNext = () => {
    clearInterval(timerRef.current);
    setHeroIndex((i) => (i + 1) % heroImages.length);
  };

  const heroBg =
    heroImages.length > 0
      ? resolveImageUrl(heroImages[heroIndex].imageUrl)
      : import.meta.env.VITE_HERO_IMAGE_URL || FALLBACK_HERO;

  return (
    <div>
      <SEO
        description="Jack's Norwood is your neighbourhood pub and restaurant in Norwood, Ontario. Great food, cold drinks, daily specials, and live events. Open 7 days a week."
        canonical="/"
      />
      {/* Specials popup — shows once per session */}
      <SpecialsPopup />

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Slideshow background */}
        <AnimatePresence mode="sync">
          <motion.div
            key={heroIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${heroBg}')` }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-pub-light/95" />

        {/* Prev / Next buttons — only when multiple images */}
        {heroImages.length > 1 && (
          <>
            <button
              onClick={heroPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/55 text-white rounded-full p-3 transition-colors"
            >
              <FaChevronLeft size={18} />
            </button>
            <button
              onClick={heroNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/55 text-white rounded-full p-3 transition-colors"
            >
              <FaChevronRight size={18} />
            </button>
            {/* Dot indicators */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {heroImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    clearInterval(timerRef.current);
                    setHeroIndex(i);
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${i === heroIndex ? "bg-pub-gold w-6" : "bg-white/50"}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Floating decorative circles */}
        <motion.div
          animate={{ y: [0, -18, 0], opacity: [0.2, 0.45, 0.2] }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          className="absolute top-1/4 left-16 w-24 h-24 rounded-full border border-pub-gold/30 hidden lg:block pointer-events-none"
        />
        <motion.div
          animate={{ y: [0, 14, 0], opacity: [0.15, 0.35, 0.15] }}
          transition={{
            repeat: Infinity,
            duration: 7,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute bottom-1/3 right-20 w-16 h-16 rounded-full bg-pub-gold/15 hidden lg:block pointer-events-none"
        />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="section-subtitle"
          >
            Welcome to
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-display text-5xl md:text-7xl lg:text-8xl text-white font-bold leading-tight mb-4 drop-shadow-lg"
          >
            Jack's <span className="text-gradient">Norwood</span>
          </motion.h1>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "4rem" }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="h-0.5 bg-pub-gold mx-auto mb-6"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-white/90 text-xl md:text-2xl font-light mb-10 drop-shadow"
          >
            Your Neighbourhood Pub &amp; Restaurant
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/menu" className="btn-primary">
              View Our Menu
            </Link>
            <Link to="/promotions" className="btn-outline">
              View Specials
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/60 text-xs uppercase tracking-widest"
        >
          <span>Scroll</span>
          <div className="w-px h-10 bg-gradient-to-b from-white/60 to-transparent" />
        </motion.div>
      </section>

      {/* TODAY'S SPECIALS — poster-only grid */}
      {promotions.length > 0 && (
        <section className="py-20 bg-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              subtitle="Limited Time"
              title="Today's Specials"
              description="Take advantage of our exclusive deals"
            />
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
            >
              {promotions.map((promo) => (
                <motion.div
                  key={promo.id}
                  variants={fadeUp}
                  whileHover={{ y: -6 }}
                >
                  <Link to="/promotions" className="block group">
                    <div className="rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 aspect-[3/4]">
                      <img
                        src={resolveImageUrl(
                          promo.imageUrl,
                          FALLBACK_PROMOTION,
                        )}
                        alt={promo.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src = FALLBACK_PROMOTION;
                        }}
                      />
                    </div>
                    <p className="text-center text-pub-text font-semibold mt-2 group-hover:text-pub-gold transition-colors">
                      {promo.title}
                    </p>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
            <div className="text-center mt-8">
              <Link to="/promotions" className="btn-outline">
                View All Specials
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* POPULAR MENU */}
      <section className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            subtitle="Our Favourites"
            title="Popular Menu Items"
            description="Crowd-pleasing dishes that keep our guests coming back"
          />
          {loadingMenu ? (
            <div className="text-center text-stone-400 py-10">
              Loading menu...
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
          <div className="text-center mt-10">
            <Link to="/menu" className="btn-outline">
              View Full Menu
            </Link>
          </div>
        </div>
      </section>

      {/* ABOUT SNIPPET */}
      <section className="py-20 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <p className="section-subtitle">Our Story</p>
              <h2 className="section-title">A True Norwood Landmark</h2>
              <div className="gold-divider ml-0"></div>
              <p className="text-stone-600 text-lg leading-relaxed mb-6">
                Jack's Norwood has been the heart of the community since the day
                we opened our doors. We believe in good food, honest drinks, and
                a warm welcome for everyone who walks through our door.
              </p>
              <p className="text-stone-500 leading-relaxed mb-8">
                Whether you're stopping in for a cold one after work,
                celebrating a special occasion, or bringing the family for
                Sunday lunch — Jack's is your home away from home.
              </p>
              <Link to="/about" className="btn-outline">
                Our Story
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { alt: "Bar", cls: "" },
                { alt: "Food", cls: "mt-6" },
                { alt: "Drinks", cls: "-mt-6" },
                { alt: "Atmosphere", cls: "" },
              ].map(({ alt, cls }, i) => {
                const img = galleryImages[i];
                const src = img?.imageUrl
                  ? resolveImageUrl(img.imageUrl, FALLBACK_GALLERY)
                  : FALLBACK_GALLERY;
                return (
                  <motion.img
                    key={alt}
                    whileHover={{ scale: 1.04 }}
                    src={src}
                    alt={alt}
                    loading="lazy"
                    decoding="async"
                    className={`rounded-xl h-48 w-full object-cover shadow-md ${cls}`}
                    onError={(e) => {
                      e.target.src = FALLBACK_GALLERY;
                    }}
                  />
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* LOCATION */}
      <section className="py-20 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader subtitle="Find Us" title="Location and Hours" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* Map */}
            <div className="rounded-xl overflow-hidden border border-stone-200 h-80 lg:h-96 shadow-sm">
              {import.meta.env.VITE_GOOGLE_MAPS_EMBED_URL?.trim() ? (
                <iframe
                  title="Jack's Norwood Location"
                  src={import.meta.env.VITE_GOOGLE_MAPS_EMBED_URL.trim()}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allow="fullscreen"
                />
              ) : (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(RESTAURANT_ADDRESS)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full h-full bg-stone-50 text-stone-400 hover:text-pub-gold transition-colors text-sm"
                >
                  View on Google Maps
                </a>
              )}
            </div>
            {/* Info */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-pub-gold/10 border border-pub-gold/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FaMapMarkerAlt className="text-pub-gold" />
                </div>
                <div>
                  <h4 className="text-pub-text font-semibold mb-1">Address</h4>
                  <p className="text-stone-500">{RESTAURANT_ADDRESS}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-pub-gold/10 border border-pub-gold/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FaPhone className="text-pub-gold" />
                </div>
                <div>
                  <h4 className="text-pub-text font-semibold mb-1">Phone</h4>
                  <a
                    href={`tel:${RESTAURANT_PHONE.replace(/[^+\d]/g, "")}`}
                    className="text-stone-500 hover:text-pub-gold transition-colors"
                  >
                    {RESTAURANT_PHONE}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-pub-gold/10 border border-pub-gold/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FaClock className="text-pub-gold" />
                </div>
                <div>
                  <h4 className="text-pub-text font-semibold mb-3">
                    Opening Hours
                  </h4>
                  <div className="space-y-2 text-sm">
                    {OPENING_HOURS.map(({ day, time }) => (
                      <div key={day} className="flex justify-between gap-8">
                        <span className="text-stone-500">{day}</span>
                        <span className="text-pub-gold font-medium">
                          {time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
