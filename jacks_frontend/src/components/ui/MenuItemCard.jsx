import { FaFire, FaLeaf } from 'react-icons/fa';
import { resolveImageUrl } from '../../services/api';
import { FALLBACK_IMAGE } from '../../config/constants';

export default function MenuItemCard({ item }) {
  const hasSizes = item.sizes && item.sizes.length > 0;

  return (
    <div className="group bg-white border border-stone-200 overflow-hidden flex flex-col hover:border-pub-gold/40 hover:shadow-md transition-all duration-300"
      style={{ borderRadius: '4px' }}>

      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={resolveImageUrl(item.imageUrl, FALLBACK_IMAGE)}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
          onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-pub-dark/55 to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 right-3 flex gap-1">
          {item.isSpicy && (
            <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 font-bold flex items-center gap-1 tracking-wide">
              <FaFire size={9} /> Spicy
            </span>
          )}
          {item.isVegan && (
            <span className="bg-green-600 text-white text-[10px] px-2 py-0.5 font-bold flex items-center gap-1 tracking-wide">
              <FaLeaf size={9} /> Vegan
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2 gap-3">
          <h3 className="font-display text-pub-text font-bold text-lg leading-tight" style={{ letterSpacing: '-0.01em' }}>
            {item.name}
          </h3>
          {!hasSizes && item.price > 0 && (
            <span className="text-pub-gold font-bold text-base whitespace-nowrap flex-shrink-0">
              ${parseFloat(item.price).toFixed(2)}
            </span>
          )}
        </div>

        {item.categoryName && (
          <span className="text-pub-gold/55 text-xs tracking-[0.15em] uppercase mb-2">
            {item.categoryName}
          </span>
        )}

        {item.description && (
          <p className="text-stone-500 text-sm leading-relaxed flex-1 line-clamp-3">{item.description}</p>
        )}

        {hasSizes && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-stone-100 pt-3">
            {item.sizes.map((size, i) => (
              <span key={i} className="text-xs">
                <span className="text-stone-500">{size.name}:</span>{' '}
                <span className="text-pub-gold font-semibold">${parseFloat(size.price).toFixed(2)}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
