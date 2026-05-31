import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SEO from '../../components/seo/SEO';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaSun, FaStar } from 'react-icons/fa';
import { promotionAPI, heroImageAPI, resolveImageUrl } from '../../services/api';
import PageHero from '../../components/ui/PageHero';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { FALLBACK_PROMOTION, FALLBACK_HERO } from '../../config/constants';

const TABS = [
  { key: 'DAILY',   label: 'Daily Specials',   icon: FaSun  },
  { key: 'SPECIAL', label: 'Featured Specials', icon: FaStar },
];

function PromoCard({ promo, index }) {
  const isDaily = promo.promotionType === 'DAILY';

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      className="group flex flex-col"
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-[3/4]">
        {/* Editorial number */}
        <span
          className="absolute top-3 left-4 z-10 font-display font-bold leading-none select-none pointer-events-none"
          style={{ fontSize: '4.5rem', color: 'rgba(255,255,255,0.1)', lineHeight: 1 }}
          aria-hidden="true"
        >
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Type badge */}
        <span
          className={`absolute top-4 right-4 z-10 text-[10px] font-bold px-2.5 py-1 tracking-[0.12em] uppercase ${
            isDaily ? 'bg-pub-gold text-white' : 'bg-pub-dark text-white'
          }`}
        >
          {isDaily ? promo.dayOfWeek || 'Daily' : 'Special'}
        </span>

        <img
          src={resolveImageUrl(promo.imageUrl, FALLBACK_PROMOTION)}
          alt={promo.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          onError={(e) => { e.target.src = FALLBACK_PROMOTION; }}
        />
      </div>

      {/* Card body */}
      <div className="flex-1 pt-5 pb-6">
        <h3
          className="font-display text-pub-text font-bold mb-2 group-hover:text-pub-gold transition-colors duration-200"
          style={{ fontSize: '1.2rem', letterSpacing: '-0.02em', lineHeight: 1.15 }}
        >
          {promo.title}
        </h3>
        {promo.description && (
          <p className="text-stone-500 text-sm leading-relaxed line-clamp-3">{promo.description}</p>
        )}
        {!isDaily && promo.endDateTime && (
          <div className="flex items-center gap-2 text-stone-400 text-xs mt-3">
            <FaCalendarAlt className="text-pub-gold" size={11} />
            <span>
              Valid until{' '}
              {new Date(promo.endDateTime).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </div>
        )}
      </div>

      {/* Bottom rule */}
      <div className="h-px bg-stone-200 w-full group-hover:bg-pub-gold/40 transition-colors duration-300" />
    </motion.div>
  );
}

export default function PromotionsPage() {
  const [promotions,  setPromotions]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [heroImages,  setHeroImages]  = useState([]);
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type');

  const [activeTab, setActiveTab] = useState(
    typeParam && ['DAILY', 'SPECIAL'].includes(typeParam) ? typeParam : 'DAILY',
  );

  useEffect(() => {
    if (typeParam && ['DAILY', 'SPECIAL'].includes(typeParam)) setActiveTab(typeParam);
    else if (!typeParam) setActiveTab('DAILY');
  }, [typeParam]);

  useEffect(() => {
    promotionAPI.getActive().then((r) => setPromotions(r.data)).catch(console.error).finally(() => setLoading(false));
    heroImageAPI.getActive().then((r) => setHeroImages(r.data)).catch(() => {});
  }, []);

  const filtered = promotions.filter((p) => p.promotionType === activeTab);
  const heroImg  = heroImages[0]?.imageUrl ? resolveImageUrl(heroImages[0].imageUrl) : FALLBACK_HERO;

  return (
    <div className="min-h-screen">
      <SEO
        title="Daily Specials and Promotions"
        description="Check out our daily specials and featured promotions at Jack's Norwood Pub in Norwood, Ontario. Great value food and drinks every day."
        canonical="/promotions"
      />

      <PageHero
        subtitle="Deals and Offers"
        title="Our Specials"
        description="Daily features and exclusive offers. Fresh deals, every day of the week."
        image={heroImg}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

        {/* Tabs */}
        <div className="flex gap-2 mb-14 border-b border-stone-200">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-6 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase transition-all duration-200 border-b-2 -mb-px ${
                activeTab === key
                  ? 'border-pub-gold text-pub-gold'
                  : 'border-transparent text-stone-500 hover:text-pub-gold'
              }`}
            >
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-display text-pub-text text-xl font-bold mb-3" style={{ letterSpacing: '-0.02em' }}>
              No {activeTab === 'DAILY' ? 'daily specials' : 'featured specials'} right now
            </p>
            <p className="text-stone-400 text-sm">Check back soon. Something good is always coming.</p>
          </div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.28 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12"
          >
            {filtered.map((promo, i) => (
              <PromoCard key={promo.id} promo={promo} index={i} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
