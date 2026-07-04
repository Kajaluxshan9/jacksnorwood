import { FaFire, FaLeaf, FaStar } from 'react-icons/fa';
import { resolveImageUrl } from '../../services/api';
import { FALLBACK_IMAGE } from '../../config/constants';

// Match a dish to a transparent Jack's cut-out by keywords in its name.
// Order matters — most specific first (e.g. "butter chicken" before generic).
const DISH_IMAGE_RULES = [
  [/butter chicken/i,                   '/images/dishes/butter-chicken.webp'],
  [/fish\s*&?\s*chips|fish and chips/i, '/images/dishes/fish-chips.webp'],
  [/burger/i,                           '/images/dishes/burger.webp'],
  [/nachos/i,                           '/images/dishes/nachos.webp'],
  [/bruschetta/i,                       '/images/dishes/bruschetta.webp'],
  [/ribs|wings/i,                       '/images/dishes/ribs-wings.webp'],
  [/pizza/i,                            '/images/dishes/pizza.webp'],
  [/reuben/i,                           '/images/dishes/reuben.webp'],
  [/caesar|greek salad|salad/i,         '/images/dishes/caesar-salad.webp'],
  [/schnitzel|parmigiana/i,             '/images/dishes/schnitzel.webp'],
];

const POPULAR_FALLBACK = '/images/dishes/burger.webp';

function dishImage(item) {
  if (item.imageUrl) return resolveImageUrl(item.imageUrl, POPULAR_FALLBACK);
  const match = DISH_IMAGE_RULES.find(([re]) => re.test(item.name || ''));
  return match ? match[1] : POPULAR_FALLBACK;
}

export default function MenuItemCard({ item }) {
  const hasSizes = item.sizes && item.sizes.length > 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-pub-gold/40">

      {/* Image — transparent dish floating on a warm panel */}
      <div className="relative h-56 flex items-center justify-center overflow-hidden bg-gradient-to-b from-amber-50 to-stone-100">
        {/* soft radial glow behind the plate */}
        <div className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(60% 55% at 50% 45%, rgba(255,255,255,0.9), rgba(255,255,255,0) 70%)' }} />

        <img
          src={dishImage(item)}
          alt={item.name}
          className="relative z-[1] max-h-full max-w-full object-contain p-5 transition-transform duration-500 group-hover:scale-[1.07]"
          style={{ filter: 'drop-shadow(0 14px 16px rgba(60,40,20,0.28))' }}
          loading="lazy"
          decoding="async"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
        />

        {/* Popular star */}
        {item.isPopular && (
          <span className="absolute top-3 left-3 z-[2] flex items-center gap-1 rounded-full bg-pub-gold/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
            <FaStar size={9} /> Popular
          </span>
        )}

        {/* Diet badges */}
        <div className="absolute top-3 right-3 z-[2] flex gap-1">
          {item.isSpicy && (
            <span className="flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white shadow-sm">
              <FaFire size={9} /> Spicy
            </span>
          )}
          {item.isVegan && (
            <span className="flex items-center gap-1 rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white shadow-sm">
              <FaLeaf size={9} /> Vegan
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        {item.categoryName && (
          <span className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-pub-gold/70">
            {item.categoryName}
          </span>
        )}

        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-bold leading-tight text-pub-text" style={{ letterSpacing: '-0.01em' }}>
            {item.name}
          </h3>
          {!hasSizes && item.price > 0 && (
            <span className="whitespace-nowrap rounded-full bg-pub-gold/10 px-2.5 py-1 text-sm font-bold text-pub-gold">
              ${parseFloat(item.price).toFixed(2)}
            </span>
          )}
        </div>

        {item.description && (
          <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-500 line-clamp-2">{item.description}</p>
        )}

        {hasSizes && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-stone-100 pt-3">
            {item.sizes.map((size, i) => (
              <span key={i} className="text-xs">
                <span className="text-stone-500">{size.name}:</span>{' '}
                <span className="font-semibold text-pub-gold">${parseFloat(size.price).toFixed(2)}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
