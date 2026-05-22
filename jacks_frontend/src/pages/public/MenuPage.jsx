import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaFire, FaLeaf } from 'react-icons/fa';
import { menuAPI, resolveImageUrl } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { FALLBACK_IMAGE } from "../../config/constants";
import { toSlug } from '../../utils/slug';

const FALLBACK = FALLBACK_IMAGE;
const FALLBACK_BANNER = FALLBACK_IMAGE;


// ── Single item card ──────────────────────────────────────────────────────────
function ItemCard({ item }) {
  const hasSizes = item.sizes && item.sizes.length > 0;
  return (
    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden hover:border-pub-gold/40 hover:shadow-md transition-all duration-200 flex gap-4 p-4">
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-display text-pub-text font-semibold text-base leading-tight">{item.name}</h3>
          {!hasSizes && item.price > 0 && (
            <span className="text-pub-gold font-bold text-base whitespace-nowrap flex-shrink-0">
              ${parseFloat(item.price).toFixed(2)}
            </span>
          )}
        </div>
        {item.description && (
          <p className="text-stone-500 text-sm leading-relaxed mt-1 line-clamp-2">{item.description}</p>
        )}
        {hasSizes && (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {item.sizes.map((size, i) => (
              <span key={i} className="text-sm">
                <span className="text-stone-600">{size.name}:</span>{' '}
                <span className="text-pub-gold font-semibold">${parseFloat(size.price).toFixed(2)}</span>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-1 mt-2 flex-wrap">
          {item.isSpicy && (
            <span className="bg-red-50 text-red-500 border border-red-100 text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
              <FaFire size={9} /> Spicy
            </span>
          )}
          {item.isVegan && (
            <span className="bg-green-50 text-green-600 border border-green-100 text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
              <FaLeaf size={9} /> Vegan
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function MenuPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySlug = searchParams.get('category');
  const normalizedCategorySlug = toSlug(categorySlug || '');

  const [categories, setCategories]     = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [items, setItems]               = useState([]);
  const [, setCatLoading]               = useState(true);
  const [loading, setLoading]           = useState(false);
  const [activeSection, setActiveSection] = useState(null);

  // ── 1. Load all categories once ───────────────────────────────────────────
  useEffect(() => {
    menuAPI.getCategories()
      .then(r => setCategories(r.data))
      .catch(console.error)
      .finally(() => setCatLoading(false));
  }, []);

  // ── 2. Derive the active category from the URL slug ───────────────────────
  const activeCategory = useMemo(() => {
    if (!categories.length) return null;
    return categories.find(c =>
      String(c.id) === categorySlug || toSlug(c.name) === normalizedCategorySlug
    ) || categories[0];
  }, [categories, categorySlug, normalizedCategorySlug]);

  // ── 3. If no slug in URL, write the default (first category) ─────────────
  useEffect(() => {
    if (!activeCategory) return;
    const activeSlug = toSlug(activeCategory.name);
    if (activeSlug !== normalizedCategorySlug) {
      setSearchParams({ category: activeSlug }, { replace: true });
    }
  }, [activeCategory, normalizedCategorySlug, setSearchParams]);

  // ── 4. Load items + subcategories for the active category ────────────────
  useEffect(() => {
    if (!activeCategory) return;
    setLoading(true);
    setItems([]);
    setSubcategories([]);
    setActiveSection(null);
    Promise.all([
      menuAPI.getByCategory(activeCategory.id),
      menuAPI.getSubcategoriesByCategory(activeCategory.id),
    ])
      .then(([itemsRes, subcatsRes]) => {
        setItems(itemsRes.data);
        setSubcategories(subcatsRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeCategory?.id]);

  // ── 5. Build content sections ─────────────────────────────────────────────
  //    - One section per subcategory that has items (in displayOrder from API)
  //    - One extra section for items with no subcategory (if any)
  const sections = useMemo(() => {
    const result = [];
    subcategories.forEach(sc => {
      const scItems = items.filter(i => i.subcategoryId === sc.id);
      if (scItems.length > 0) {
        result.push({ id: `sc-${sc.id}`, name: sc.name, imageUrl: sc.imageUrl, items: scItems });
      }
    });
    const noSub = items.filter(i => !i.subcategoryId);
    if (noSub.length > 0) {
      result.push({
        id: 'sc-none',
        name: activeCategory?.name || 'Items',
        imageUrl: noSub.find(i => i.imageUrl)?.imageUrl || null,
        items: noSub,
      });
    }
    return result;
  }, [items, subcategories, activeCategory]);

  // ── 6. Set initial active section ─────────────────────────────────────────
  useEffect(() => {
    if (sections.length > 0) setActiveSection(sections[0].id);
  }, [sections]);

  // ── 7. IntersectionObserver — highlight active sidebar item ───────────────
  useEffect(() => {
    if (!sections.length) return;
    const observers = [];
    sections.forEach(sec => {
      const el = document.getElementById(sec.id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(sec.id); },
        { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, [sections]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); setActiveSection(id); }
  };

  const hasSubcategories = subcategories.length > 0;
  const selectCategory = (category) => {
    setSearchParams({ category: toSlug(category.name) });
  };

  // ── Sidebar button style ───────────────────────────────────────────────────
  const sideBtnCls = (id) =>
    `w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 ${
      activeSection === id
        ? 'bg-pub-gold text-white shadow-md'
        : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200 hover:border-pub-gold/30'
    }`;

  return (
    <div className="min-h-screen pt-20">

      {/* ── Mobile sticky subcategory bar ───────────────────────────────────── */}
      {hasSubcategories && !loading && sections.length > 0 && (
        <div className="md:hidden sticky top-20 z-40 bg-white/95 backdrop-blur-sm border-b border-stone-200 shadow-sm">
          <div
            className="flex overflow-x-auto gap-2 px-4 py-3"
            style={{ scrollbarWidth: 'none' }}
          >
            {sections.map(sec => (
              <button
                key={sec.id}
                onClick={() => scrollTo(sec.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                  activeSection === sec.id
                    ? 'bg-pub-gold text-white border-pub-gold'
                    : 'bg-white text-stone-600 border-stone-200'
                }`}
              >
                {sec.imageUrl && (
                  <img src={resolveImageUrl(sec.imageUrl)} alt={sec.name}
                    className="w-5 h-5 rounded-full object-cover"
                    decoding="async"
                    onError={e => { e.target.src = FALLBACK; }} />
                )}
                {sec.name}
              </button>
            ))}
          </div>
        </div>
      )}

{/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {categories.length > 1 && (
          <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => {
              const isActive = activeCategory?.id === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => selectCategory(category)}
                  className={`flex-shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-pub-gold border-pub-gold text-white'
                      : 'bg-white border-stone-200 text-stone-600 hover:border-pub-gold/40 hover:text-pub-gold'
                  }`}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : sections.length === 0 ? (
          <div className="text-center text-stone-400 py-24">
            <p className="text-xl font-display">No items in this category yet</p>
          </div>
        ) : (
          <>

            <div className="flex gap-8 items-start">

              {/* ── Left sidebar — sticks to viewport, scrolls independently ── */}
              {hasSubcategories && (
                <aside
                  className="hidden md:flex flex-col w-56 flex-shrink-0 self-start"
                  style={{ position: 'sticky', top: '96px', height: 'calc(100vh - 112px)' }}
                >
                  {/* Header */}
                  <p className="text-xs font-bold uppercase tracking-widest text-stone-400 px-1 pb-2 border-b border-stone-200 mb-2 flex-shrink-0">
                    {activeCategory?.name}
                  </p>

                  {/* Scrollable subcategory list */}
                  <div
                    className="flex-1 overflow-y-auto space-y-1.5 pr-1"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#d97706 #f5f5f4' }}
                  >
                    {sections.map(sec => (
                      <button
                        key={sec.id}
                        onClick={() => scrollTo(sec.id)}
                        className={sideBtnCls(sec.id)}
                      >
                        {sec.imageUrl ? (
                          <img
                            src={resolveImageUrl(sec.imageUrl)}
                            alt={sec.name}
                            decoding="async"
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            onError={e => { e.target.src = FALLBACK; }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-stone-100 flex-shrink-0" />
                        )}
                        <span className="font-semibold text-sm leading-tight">{sec.name}</span>
                      </button>
                    ))}
                  </div>
                </aside>
              )}

              {/* ── Scrollable item sections ──────────────────────────────── */}
              <main className="flex-1 min-w-0 space-y-14">
                {sections.map((sec, index) => (
                  <motion.div
                    key={sec.id}
                    id={sec.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-8%' }}
                    transition={{ duration: 0.4, delay: Math.min(index * 0.06, 0.3) }}
                  >
                    {/* Section banner with subcategory image + heading */}
                    {sec.imageUrl ? (
                      <div className="relative h-44 sm:h-52 rounded-2xl overflow-hidden mb-6 shadow-sm">
                        <img
                          src={resolveImageUrl(sec.imageUrl)}
                          alt={sec.name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                          onError={e => { e.target.src = FALLBACK_BANNER; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-5">
                          <h2 className="font-display text-white text-3xl font-bold drop-shadow">
                            {sec.name}
                          </h2>
                          <p className="text-white/65 text-sm mt-1">
                            {sec.items.length} {sec.items.length === 1 ? 'item' : 'items'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-6 pb-4 border-b-2 border-stone-100">
                        <h2 className="font-display text-pub-text text-2xl font-bold">{sec.name}</h2>
                        <p className="text-stone-400 text-sm mt-1">
                          {sec.items.length} {sec.items.length === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                    )}

                    {/* Items grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sec.items.map(item => (
                        <ItemCard key={item.id} item={item} />
                      ))}
                    </div>
                  </motion.div>
                ))}
              </main>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
