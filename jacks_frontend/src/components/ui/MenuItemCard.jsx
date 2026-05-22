import { motion } from 'framer-motion';
import { FaFire, FaLeaf } from 'react-icons/fa';
import { resolveImageUrl } from "../../services/api";
import { FALLBACK_IMAGE } from "../../config/constants";

const FALLBACK = FALLBACK_IMAGE;

export default function MenuItemCard({ item }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white border border-stone-200 rounded-xl overflow-hidden flex flex-col hover:border-pub-gold/40 hover:shadow-lg transition-all duration-300"
    >
      <div className="relative h-52 overflow-hidden">
        <img
          src={resolveImageUrl(item.imageUrl, FALLBACK)}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.target.src = FALLBACK;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-pub-dark/60 to-transparent" />
        <div className="absolute top-3 right-3 flex gap-1">
          {item.isSpicy && (
            <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded font-bold flex items-center gap-1">
              <FaFire size={10} /> Spicy
            </span>
          )}
          {item.isVegan && (
            <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded font-bold flex items-center gap-1">
              <FaLeaf size={10} /> Vegan
            </span>
          )}
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-display text-pub-text font-semibold text-lg leading-tight">
            {item.name}
          </h3>
          <span className="text-pub-gold font-bold text-lg ml-2 whitespace-nowrap">
            ${parseFloat(item.price).toFixed(2)}
          </span>
        </div>
        {item.categoryName && (
          <span className="text-pub-gold/60 text-xs uppercase tracking-wider mb-2">
            {item.categoryName}
          </span>
        )}
        <p className="text-stone-500 text-sm leading-relaxed flex-1">
          {item.description}
        </p>
      </div>
    </motion.div>
  );
}
