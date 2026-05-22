import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaSun, FaStar } from 'react-icons/fa';
import { promotionAPI, resolveImageUrl } from '../../services/api';
import SectionHeader from '../../components/ui/SectionHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { FALLBACK_PROMOTION, FALLBACK_HERO } from "../../config/constants";

const FALLBACK = FALLBACK_PROMOTION;

const TABS = [
  { key: "DAILY", label: "Daily Specials", icon: FaSun },
  { key: "SPECIAL", label: "Featured Specials", icon: FaStar },
];

function PromoCard({ promo, index }) {
  const isDaily = promo.promotionType === "DAILY";

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="bg-white border border-stone-200 rounded-xl overflow-hidden hover:border-pub-gold/40 hover:shadow-lg transition-all duration-300 group flex flex-col"
    >
      {/* Poster image — portrait aspect ratio */}
      <div className="relative overflow-hidden aspect-[3/4]">
        <img
          src={resolveImageUrl(promo.imageUrl, FALLBACK)}
          alt={promo.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = FALLBACK;
          }}
        />
        <div
          className={`absolute top-4 left-4 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
            isDaily
              ? "bg-blue-500/90 text-white"
              : "bg-purple-500/90 text-white"
          }`}
        >
          {isDaily ? <FaSun size={10} /> : <FaStar size={10} />}
          {isDaily ? promo.dayOfWeek || "Daily" : "Special"}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-display text-pub-text text-xl font-bold mb-2">
          {promo.title}
        </h3>
        {promo.description && (
          <p className="text-stone-500 text-sm leading-relaxed flex-1">
            {promo.description}
          </p>
        )}
        {!isDaily && promo.endDateTime && (
          <div className="flex items-center gap-2 text-stone-400 text-xs mt-3">
            <FaCalendarAlt className="text-pub-gold" />
            <span>
              Valid until{" "}
              {new Date(promo.endDateTime).toLocaleString("en-AU", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get("type");
  const [activeTab, setActiveTab] = useState(
    typeParam && ["DAILY", "SPECIAL"].includes(typeParam) ? typeParam : "DAILY",
  );

  useEffect(() => {
    if (typeParam && ["DAILY", "SPECIAL"].includes(typeParam))
      setActiveTab(typeParam);
    else if (!typeParam) setActiveTab("DAILY");
  }, [typeParam]);

  useEffect(() => {
    promotionAPI
      .getActive()
      .then((r) => setPromotions(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = promotions.filter((p) => p.promotionType === activeTab);

  return (
    <div className="min-h-screen pt-20">
      <div
        className="relative py-24 bg-cover bg-center"
        style={{
          backgroundImage: `url('${promotions[0]?.imageUrl ? resolveImageUrl(promotions[0].imageUrl) : FALLBACK_HERO}')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-pub-light/90" />
        <div className="relative z-10 text-center">
          <SectionHeader
            subtitle="Deals & Offers"
            title="Our Specials"
            description="Take advantage of our exclusive offers"
            light={true}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Tabs — Daily / Featured only (no "All") */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold uppercase tracking-wider transition-all duration-200 ${
                activeTab === key
                  ? "bg-pub-gold text-white"
                  : "bg-white text-stone-600 hover:bg-pub-gold/10 border border-stone-200"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <div className="text-center text-stone-400 py-20">
            <p className="text-xl">
              No{" "}
              {activeTab === "DAILY" ? "daily specials" : "featured specials"}{" "}
              at the moment
            </p>
            <p className="text-sm mt-2">Check back soon!</p>
          </div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
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
