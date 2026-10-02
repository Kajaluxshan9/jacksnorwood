import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  FaTimes, FaChevronLeft, FaChevronRight, FaCalendarAlt, FaClock, FaArrowRight,
} from 'react-icons/fa';
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
 * Layout: the poster is the product. On desktop it gets its own tall column so
 * a portrait flyer reads at close to full size, with the details beside it
 * rather than squashed underneath. The two stack on mobile.
 *
 * Shows nothing at all when there is nothing on — an empty modal is worse than
 * no modal.
 */
export default function WhatsOnPopup() {
  const [slides, setSlides] = useState([]);
  const [visible, setVisible] = useState(false);
  const [[index, direction], setPosition] = useState([0, 0]);
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
    (delta) => setPosition(([i]) => [total ? (i + delta + total) % total : 0, delta]),
    [total],
  );
  const jumpTo = useCallback((i) => setPosition(([current]) => [i, i > current ? 1 : -1]), []);

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

  const panelMotion = useMemo(
    () =>
      reduceMotion
        ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
        : {
            initial: { opacity: 0, scale: 0.94, y: 28 },
            animate: { opacity: 1, scale: 1, y: 0 },
            exit: { opacity: 0, scale: 0.96, y: 18 },
            transition: { type: 'spring', stiffness: 240, damping: 26 },
          },
    [reduceMotion],
  );

  // Content travels in the direction you navigated, so the carousel reads as
  // one strip rather than a series of unrelated fades.
  const slideMotion = useMemo(
    () =>
      reduceMotion
        ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
        : {
            initial: (d) => ({ opacity: 0, x: d >= 0 ? 36 : -36 }),
            animate: { opacity: 1, x: 0 },
            exit: (d) => ({ opacity: 0, x: d >= 0 ? -36 : 36 }),
            transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
          },
    [reduceMotion],
  );

  if (!slide) return null;

  const openTarget = () => {
    close();
    navigate(slide.to);
  };

  const navButton =
    'grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/40 text-white/90 ' +
    'backdrop-blur-sm transition-all hover:border-pub-gold hover:bg-black/70 hover:text-white ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-pub-gold';

  /*
   * Rendered through a portal into <body>.
   *
   * The popup lives inside <main className="relative z-10">, which creates a
   * stacking context - so z-index alone can never lift it above the fixed
   * navbar (z-50) that sits outside that context, no matter how large the
   * value. The portal escapes the context so the overlay genuinely covers
   * everything, navbar included.
   */
  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
          onClick={close}
        >
          <div className="absolute inset-0 bg-[#140d07]/80 backdrop-blur-md" />

          <motion.div
            {...panelMotion}
            role="dialog"
            aria-modal="true"
            aria-labelledby="whats-on-title"
            onClick={(e) => e.stopPropagation()}
            className="relative flex w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-pub-dark shadow-[0_32px_90px_-20px_rgba(0,0,0,0.85)] ring-1 ring-white/10 md:max-w-5xl md:flex-row md:rounded-3xl lg:max-w-6xl"
            style={{ maxHeight: '92vh' }}
          >
            {/* Hairline of brand gold along the top edge */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-px bg-gradient-to-r from-transparent via-pub-gold/70 to-transparent" />

            <button
              ref={closeButtonRef}
              onClick={close}
              aria-label="Close"
              className="absolute right-3 top-3 z-40 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-black/50 text-white/80 backdrop-blur-sm transition-all hover:border-white/40 hover:bg-black/75 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-pub-gold"
            >
              <FaTimes size={14} />
            </button>

            {/* ── Poster ─────────────────────────────────────────────────── */}
            {/*
              object-contain, not object-cover. These are event flyers: the
              dates, prices and menu are printed on the image itself, so
              cropping to fill a box cuts the actual information off. On desktop
              the poster owns its own column so it can be read near full size.
            */}
            <div className="relative flex shrink-0 items-center justify-center overflow-hidden bg-[#120c06] p-3 md:w-[56%] md:p-6">
              <AnimatePresence initial={false} mode="wait" custom={direction}>
                <motion.img
                  key={slide.key}
                  custom={direction}
                  {...slideMotion}
                  src={resolveImageUrl(slide.imageUrl, slide.fallback)}
                  alt={slide.title}
                  /*
                   * Responsive cap, not an inline style: on a phone the poster
                   * and the details share one column, so an unbounded poster
                   * would push the title and buttons off the panel.
                   */
                  className="mx-auto block w-auto max-w-full rounded-lg object-contain shadow-2xl ring-1 ring-white/10 max-h-[36vh] md:max-h-[82vh]"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = slide.fallback;
                  }}
                />
              </AnimatePresence>

              {total > 1 && (
                <>
                  <button
                    onClick={() => go(-1)}
                    aria-label="Previous"
                    className={`absolute left-3 top-1/2 -translate-y-1/2 ${navButton}`}
                  >
                    <FaChevronLeft size={12} />
                  </button>
                  <button
                    onClick={() => go(1)}
                    aria-label="Next"
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${navButton}`}
                  >
                    <FaChevronRight size={12} />
                  </button>
                </>
              )}
            </div>

            {/* ── Details ────────────────────────────────────────────────── */}
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-pub-dark px-6 py-6 md:px-9 md:py-10">
              <AnimatePresence initial={false} mode="wait" custom={direction}>
                <motion.div
                  key={slide.key}
                  custom={direction}
                  {...slideMotion}
                  className="flex flex-1 flex-col justify-center"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <span className="block h-px w-7 bg-pub-gold/70" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-pub-gold">
                      {slide.badge}
                    </span>
                  </div>

                  <h2
                    id="whats-on-title"
                    className="font-display text-2xl font-bold leading-[1.12] text-white md:text-[2rem]"
                    style={{ letterSpacing: '-0.025em' }}
                  >
                    {slide.title}
                  </h2>

                  {(slide.date || slide.time) && (
                    <div className="mt-5 flex flex-wrap items-center gap-2.5">
                      {slide.date && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-pub-gold/30 bg-pub-gold/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-pub-gold">
                          <FaCalendarAlt size={11} /> {slide.date}
                        </span>
                      )}
                      {slide.time && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/70">
                          <FaClock size={11} /> {slide.time}
                        </span>
                      )}
                    </div>
                  )}

                  {slide.description && (
                    <p className="mt-5 text-[15px] leading-relaxed text-white/55 line-clamp-3 md:line-clamp-5">
                      {slide.description}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>

              {total > 1 && (
                <div className="mt-7 flex items-center gap-2 border-t border-white/10 pt-5">
                  {slides.map((s, i) => (
                    <button
                      key={s.key}
                      onClick={() => jumpTo(i)}
                      aria-label={`Show item ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === index ? 'w-7 bg-pub-gold' : 'w-1.5 bg-white/25 hover:bg-white/50'
                      }`}
                    />
                  ))}
                  <span className="ml-auto text-[11px] font-medium tabular-nums tracking-wider text-white/35">
                    {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
                  </span>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                <button
                  onClick={openTarget}
                  className="group inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-pub-gold px-6 py-3.5 text-[13px] font-bold uppercase tracking-[0.12em] text-white shadow-lg shadow-black/30 transition-all hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-pub-gold focus-visible:ring-offset-2 focus-visible:ring-offset-pub-dark"
                >
                  {slide.ctaLabel}
                  <FaArrowRight
                    size={11}
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </button>
                <button
                  onClick={close}
                  className="rounded-full border border-white/20 px-6 py-3.5 text-[13px] font-semibold uppercase tracking-[0.12em] text-white/60 transition-all hover:border-white/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
