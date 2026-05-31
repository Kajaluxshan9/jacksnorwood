import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../../components/seo/SEO';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { galleryAPI, heroImageAPI, resolveImageUrl } from '../../services/api';
import PageHero from '../../components/ui/PageHero';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { FALLBACK_GALLERY, FALLBACK_HERO } from '../../config/constants';

const CATEGORIES = ['all', 'food', 'drinks', 'events', 'interior'];

export default function GalleryPage() {
  const [images,          setImages]         = useState([]);
  const [activeCategory,  setActiveCategory] = useState('all');
  const [loading,         setLoading]        = useState(true);
  const [lightbox,        setLightbox]       = useState(null);
  const [heroImages,      setHeroImages]     = useState([]);

  useEffect(() => {
    galleryAPI.getAll().then((r) => setImages(r.data)).catch(console.error).finally(() => setLoading(false));
    heroImageAPI.getActive().then((r) => setHeroImages(r.data)).catch(() => {});
  }, []);

  const filtered = activeCategory === 'all' ? images : images.filter((img) => img.category === activeCategory);

  const closeLightbox = () => setLightbox(null);
  const prevImage     = () => setLightbox((l) => (l - 1 + filtered.length) % filtered.length);
  const nextImage     = () => setLightbox((l) => (l + 1) % filtered.length);

  useEffect(() => {
    const handler = (e) => {
      if (lightbox === null) return;
      if (e.key === 'Escape')      closeLightbox();
      if (e.key === 'ArrowLeft')   prevImage();
      if (e.key === 'ArrowRight')  nextImage();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox, filtered.length]);

  const heroImg = heroImages[0]?.imageUrl ? resolveImageUrl(heroImages[0].imageUrl) : FALLBACK_HERO;

  return (
    <div className="min-h-screen">
      <SEO
        title="Photo Gallery"
        description="Photos of food, drinks, events, and atmosphere at Jack's Norwood Pub and Restaurant in Norwood, Ontario."
        canonical="/gallery"
      />

      <PageHero
        subtitle="Our Gallery"
        title="A Glimpse Inside"
        description="Food, drinks, atmosphere, and the people who make Jack's what it is."
        image={heroImg}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

        {/* Category filter - underline tab style */}
        <div className="flex gap-1 mb-14 border-b border-stone-200 overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-5 py-3 text-xs font-semibold tracking-[0.15em] uppercase transition-all duration-200 border-b-2 -mb-px ${
                activeCategory === cat
                  ? 'border-pub-gold text-pub-gold'
                  : 'border-transparent text-stone-500 hover:text-pub-gold'
              }`}
            >
              {cat === 'all' ? 'All Photos' : cat}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
            className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3"
          >
            {filtered.map((img, idx) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(idx * 0.04, 0.3) }}
                className="break-inside-avoid cursor-pointer group relative overflow-hidden"
                style={{ borderRadius: '2px' }}
                onClick={() => setLightbox(idx)}
              >
                <img
                  src={resolveImageUrl(img.imageUrl, FALLBACK_GALLERY)}
                  alt={img.caption || 'Gallery image'}
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-108"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => { e.target.src = FALLBACK_GALLERY; }}
                />
                <div className="absolute inset-0 bg-pub-dark/0 group-hover:bg-pub-dark/55 transition-all duration-300 flex items-end p-4">
                  <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 leading-tight line-clamp-2">
                    {img.caption || ''}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/96 flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close */}
            <button
              onClick={closeLightbox}
              className="absolute top-5 right-5 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/50 z-10 transition-all duration-200"
              aria-label="Close lightbox"
            >
              <FaTimes size={16} />
            </button>

            {/* Prev */}
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/50 z-10 transition-all duration-200"
              aria-label="Previous image"
            >
              <FaChevronLeft size={16} />
            </button>

            {/* Next */}
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/50 z-10 transition-all duration-200"
              aria-label="Next image"
            >
              <FaChevronRight size={16} />
            </button>

            {/* Image */}
            <motion.img
              key={lightbox}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1,    opacity: 1 }}
              transition={{ duration: 0.2 }}
              src={resolveImageUrl(filtered[lightbox]?.imageUrl, FALLBACK_GALLERY)}
              alt={filtered[lightbox]?.caption || ''}
              decoding="async"
              className="max-w-5xl max-h-[88vh] object-contain"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => { e.target.src = FALLBACK_GALLERY; }}
            />

            {/* Caption + counter */}
            <div className="absolute bottom-6 left-0 right-0 flex items-center justify-between px-6">
              <span className="text-white/50 text-xs">
                {filtered[lightbox]?.caption || ''}
              </span>
              <span className="text-white/30 text-xs tabular-nums">
                {lightbox + 1} / {filtered.length}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
