import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FaTimes, FaChevronLeft, FaChevronRight, FaCalendarAlt, FaClock } from 'react-icons/fa';
import { eventAPI, promotionAPI, resolveImageUrl } from '../../services/api';
import { buildSlides, seenThisSession, markSeen, OPEN_DELAY_MS } from './whatsOnSlides';

/**
 * "What's On" — the welcome panel shown once per visit on the home page.
 *
 * Replaces the earlier specials-only popup. Events were never surfaced here, so
 * anything the pub put in the Events admin page went unseen unless a visitor
 * thought to open /events.
 *
 * Deliberately ONE panel rather than a second modal beside the specials one:
 * two dialogs opening together would stack, trap focus against each other and
 * read as spam. Upcoming events lead (they are time-sensitive and happen once),
 * then today's daily specials.
 *
 * Shows nothing at all when there is nothing on — an empty modal is worse than
 * no modal.
 */

export default function WhatsOnPopup() {
  const [slides, setSlides] = useState([]);
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const closeButtonRef = useRef(null);
  const previouslyFocused = useRef(null);
  const openTimer = useRef(null);

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (seenThisSession()) return undefined;

    let cancelled = false;

    // allSettled: a failure on one endpoint must not hide the other's content.
    Promise.allSettled([eventAPI.getUpcoming(), promotionAPI.getActive()])
      .then(([eventsRes, promosRes]) => {
        if (cancelled) return;
        const events = eventsRes.status === 'fulfilled' ? eventsRes.value.data : [];
        const promos = promosRes.status === 'fulfilled' ? promosRes.value.data : [];
        const next = buildSlides(events, promos);
        if (next.length === 0) return;

        setSlides(next);
        openTimer.current = setTimeout(() => {
          setVisible(true);
          // Marked on appearance, not on close: otherwise navigating away
          // without dismissing re-triggered it on the next visit to the page.
          markSeen();
        }, OPEN_DELAY_MS);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      clearTimeout(openTimer.current);
    };
  }, []);

  const close = useCallback(() => setVisible(false), []);

  const total = slides.length;
  const go = useCallback(
    (delta) => setIndex((i) => (total ? (i + delta + total) % total : 0)),
    [total],
  );

  // ── Dialog behaviour: scroll lock, focus, keyboard ────────────────────────
  useEffect(() => {
    if (!visible) return undefined;

    previouslyFocused.current = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') close();
      if (total > 1 && e.key === 'ArrowLeft') go(-1);
      if (total > 1 && e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      // Hand focus back to whatever the visitor was on before we interrupted.
      if (previouslyFocused.current instanceof HTMLElement) {
        previouslyFocused.current.focus();
      }
    };
  }, [visible, close, go, total]);

  const slide = slides[index];
  const motionProps = useMemo(
    () =>
      reduceMotion
        ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
        : {
            initial: { opacity: 0, scale: 0.92, y: 24 },
            animate: { opacity: 1, scale: 1, y: 0 },
            exit: { opacity: 0, scale: 0.94, y: 16 },
            transition: { type: 'spring', stiffness: 260, damping: 24 },
          },
    [reduceMotion],
  );

  if (!slide) return null;

  const openTarget = () => {
    close();
    navigate(slide.to);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6"
          onClick={close}
        >
          <div className="absolute inset-0 bg-pub-dark/70 backdrop-blur-sm" />

          <motion.div
            {...motionProps}
            role="dialog"
            aria-modal="true"
            aria-labelledby="whats-on-title"
            onClick={(e) => e.stopPropagation()}
            className="relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            style={{ maxHeight: '90vh' }}
          >
            <button
              ref={closeButtonRef}
              onClick={close}
              aria-label="Close"
              className="absolute right-3 top-3 z-20 rounded-full bg-black/35 p-2 text-white transition-colors hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <FaTimes size={15} />
            </button>

            {/* ── Poster ─────────────────────────────────────────────────── */}
            <div className="relative flex-shrink-0 overflow-hidden" style={{ maxHeight: '52vh' }}>
              <button
                type="button"
                onClick={openTarget}
                className="block w-full cursor-pointer"
                tabIndex={-1}
                aria-hidden="true"
              >
                <img
                  key={slide.key}
                  src={resolveImageUrl(slide.imageUrl, slide.fallback)}
                  alt={slide.title}
                  className="h-full w-full object-cover"
                  style={{ aspectRatio: '4 / 3' }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = slide.fallback;
                  }}
                />
              </button>

              <span className="absolute left-4 top-4 rounded-full bg-pub-gold px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-sm">
                {slide.badge}
              </span>

              {total > 1 && (
                <>
                  <button
                    onClick={() => go(-1)}
                    aria-label="Previous"
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-white/25 bg-black/30 p-2 text-white transition-colors hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <FaChevronLeft size={13} />
                  </button>
                  <button
                    onClick={() => go(1)}
                    aria-label="Next"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-white/25 bg-black/30 p-2 text-white transition-colors hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <FaChevronRight size={13} />
                  </button>
                </>
              )}
            </div>

            {/* ── Details ────────────────────────────────────────────────── */}
            <div className="flex min-h-0 flex-col overflow-y-auto px-6 pb-6 pt-5">
              <h2
                id="whats-on-title"
                className="font-display text-xl font-bold leading-tight text-pub-text"
                style={{ letterSpacing: '-0.02em' }}
              >
                {slide.title}
              </h2>

              {(slide.date || slide.time) && (
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                  {slide.date && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-pub-gold">
                      <FaCalendarAlt size={11} /> {slide.date}
                    </span>
                  )}
                  {slide.time && (
                    <span className="flex items-center gap-1.5 text-xs text-stone-500">
                      <FaClock size={11} /> {slide.time}
                    </span>
                  )}
                </div>
              )}

              {slide.description && (
                <p className="mt-3 text-sm leading-relaxed text-stone-500 line-clamp-3">
                  {slide.description}
                </p>
              )}

              {total > 1 && (
                <div className="mt-4 flex items-center gap-1.5" aria-hidden="true">
                  {slides.map((s, i) => (
                    <button
                      key={s.key}
                      onClick={() => setIndex(i)}
                      aria-label={`Show item ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === index ? 'w-5 bg-pub-gold' : 'w-1.5 bg-stone-300 hover:bg-stone-400'
                      }`}
                    />
                  ))}
                  <span className="ml-auto text-[11px] tabular-nums text-stone-400">
                    {index + 1} / {total}
                  </span>
                </div>
              )}

              <div className="mt-5 flex gap-3">
                <button onClick={openTarget} className="btn-primary flex-1 text-center text-sm">
                  {slide.ctaLabel}
                </button>
                <button
                  onClick={close}
                  className="flex-1 rounded-sm border-2 border-stone-300 px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-stone-600 transition-all hover:bg-stone-100"
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
