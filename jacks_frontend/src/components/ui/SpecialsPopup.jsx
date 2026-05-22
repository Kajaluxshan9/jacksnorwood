import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import { promotionAPI, resolveImageUrl } from "../../services/api";
import { FALLBACK_PROMOTION } from "../../config/constants";

const FALLBACK = FALLBACK_PROMOTION;

export default function SpecialsPopup() {
  const [visible, setVisible] = useState(false);
  const [dailySpecials, setDailySpecials] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem("specials_popup_shown")) return;

    promotionAPI
      .getActive()
      .then((r) => {
        // Show only today's DAILY type promotions in the popup
        const today = new Date().toLocaleDateString("en-US", {
          weekday: "long",
        });
        const daily = r.data.filter(
          (p) =>
            p.promotionType === "DAILY" &&
            (!p.dayOfWeek || p.dayOfWeek === today),
        );
        if (daily.length > 0) {
          setDailySpecials(daily);
          setTimeout(() => setVisible(true), 800);
        }
      })
      .catch(() => {});
  }, []);

  const close = () => {
    setVisible(false);
    sessionStorage.setItem("specials_popup_shown", "1");
  };

  const goToSpecials = () => {
    close();
    navigate("/promotions?type=DAILY");
  };

  // Single special shown at a time — use the first one, or show a poster grid
  const featured = dailySpecials[0];

  return (
    <AnimatePresence>
      {visible && featured && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          onClick={close}
        >
          <div className="absolute inset-0 bg-pub-dark/65 backdrop-blur-sm" />

          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col"
            style={{ maxHeight: "90vh" }}
          >
            {/* Close button */}
            <button
              onClick={close}
              className="absolute top-3 right-3 z-10 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 transition-colors"
            >
              <FaTimes size={16} />
            </button>

            {/* Poster image */}
            <div
              className="cursor-pointer overflow-hidden flex-shrink-0"
              style={{ maxHeight: "60vh" }}
              onClick={goToSpecials}
            >
              <img
                src={resolveImageUrl(featured.imageUrl, FALLBACK)}
                alt={featured.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = FALLBACK;
                }}
              />
            </div>

            {/* Footer */}
            <div className="px-6 py-5">
              <h2 className="font-display text-pub-text text-xl font-bold mb-1">
                {featured.title}
              </h2>
              {dailySpecials.length > 1 && (
                <p className="text-stone-400 text-xs mb-4">
                  {dailySpecials.length} daily specials available
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={goToSpecials}
                  className="flex-1 btn-primary text-center text-sm"
                >
                  View Specials
                </button>
                <button
                  onClick={close}
                  className="flex-1 border-2 border-stone-300 text-stone-600 font-semibold px-4 py-2.5 rounded-sm hover:bg-stone-100 transition-all text-sm uppercase tracking-wider"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
