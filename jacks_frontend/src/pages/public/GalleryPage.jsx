import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { galleryAPI, resolveImageUrl } from '../../services/api';
import SectionHeader from '../../components/ui/SectionHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { FALLBACK_GALLERY, FALLBACK_HERO } from "../../config/constants";

const CATEGORIES = ["all", "food", "drinks", "events", "interior"];

export default function GalleryPage() {
  const [images, setImages] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    galleryAPI
      .getAll()
      .then((r) => setImages(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    activeCategory === "all"
      ? images
      : images.filter((img) => img.category === activeCategory);

  const openLightbox = (idx) => setLightbox(idx);
  const closeLightbox = () => setLightbox(null);
  const prevImage = () =>
    setLightbox((l) => (l - 1 + filtered.length) % filtered.length);
  const nextImage = () => setLightbox((l) => (l + 1) % filtered.length);

  useEffect(() => {
    const handler = (e) => {
      if (lightbox === null) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, filtered.length]);

  return (
    <div className="min-h-screen pt-20">
      <div
        className="relative py-24 bg-cover bg-center"
        style={{
          backgroundImage: `url('${images[0]?.imageUrl ? resolveImageUrl(images[0].imageUrl) : FALLBACK_HERO}')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-pub-light/90" />
        <div className="relative z-10 text-center">
          <SectionHeader
            subtitle="Our Gallery"
            title="Photo Gallery"
            description="A glimpse into the Jack's Norwood experience"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-full text-sm font-semibold uppercase tracking-wider transition-all duration-200 ${
                activeCategory === cat
                  ? "bg-pub-gold text-white"
                  : "bg-white border border-stone-200 text-stone-600 hover:bg-pub-gold/10 hover:border-pub-gold/40"
              }`}
            >
              {cat === "all" ? "All Photos" : cat}
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
            transition={{ duration: 0.4 }}
            className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4"
          >
            {filtered.map((img, idx) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="break-inside-avoid cursor-pointer group relative overflow-hidden rounded-lg"
                onClick={() => openLightbox(idx)}
              >
                <img
                  src={resolveImageUrl(img.imageUrl, FALLBACK_GALLERY)}
                  alt={img.caption || "Gallery image"}
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.target.src = FALLBACK_GALLERY;
                  }}
                />
                <div className="absolute inset-0 bg-pub-dark/0 group-hover:bg-pub-dark/60 transition-all duration-300 flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium">
                    {img.caption || "View"}
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
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 text-white/70 hover:text-white z-10"
            >
              <FaTimes size={28} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-6 text-white/70 hover:text-white z-10 bg-black/50 rounded-full p-3"
            >
              <FaChevronLeft size={22} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-6 text-white/70 hover:text-white z-10 bg-black/50 rounded-full p-3"
            >
              <FaChevronRight size={22} />
            </button>
            <motion.img
              key={lightbox}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={resolveImageUrl(
                filtered[lightbox]?.imageUrl,
                FALLBACK_GALLERY,
              )}
              alt={filtered[lightbox]?.caption}
              decoding="async"
              className="max-w-5xl max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                e.target.src = FALLBACK_GALLERY;
              }}
            />
            {filtered[lightbox]?.caption && (
              <div className="absolute bottom-8 text-white/80 text-sm bg-black/50 px-4 py-2 rounded">
                {filtered[lightbox].caption}
              </div>
            )}
            <div className="absolute bottom-4 right-6 text-white/40 text-xs">
              {lightbox + 1} / {filtered.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
