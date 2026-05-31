/**
 * PageHero — dark editorial strip used on all inner pages.
 * Replaces the generic "full-bleed image + black gradient overlay" pattern
 * that appeared identically on every page. Image (if provided) becomes a
 * subtle 20%-opacity texture on the right half rather than the main visual.
 */
export default function PageHero({ subtitle, title, description, image }) {
  return (
    <section className="relative bg-pub-dark overflow-hidden" style={{ paddingTop: 'calc(4rem + 72px)', paddingBottom: '5rem' }}>
      {/* Background image — texture only, not hero */}
      {image && (
        <div className="absolute inset-0 pointer-events-none select-none">
          <img
            src={image}
            alt=""
            aria-hidden="true"
            className="absolute right-0 top-0 h-full w-1/2 object-cover object-center"
            style={{ opacity: 0.18 }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-pub-dark via-pub-dark/75 to-pub-dark/20" />
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Eyebrow label */}
        {subtitle && (
          <div className="flex items-center gap-3 mb-6">
            <span className="block w-8 h-px bg-pub-gold opacity-70" />
            <span className="text-pub-gold text-xs font-semibold tracking-[0.25em] uppercase">
              {subtitle}
            </span>
          </div>
        )}

        {/* Page title */}
        <h1
          className="font-display text-white font-bold"
          style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', lineHeight: 1.05, letterSpacing: '-0.03em' }}
        >
          {title}
        </h1>

        {/* Optional descriptor */}
        {description && (
          <p className="mt-5 text-white/45 text-lg max-w-xl leading-relaxed">
            {description}
          </p>
        )}

        {/* Bottom accent rule */}
        <div className="mt-10 w-16 h-px bg-pub-gold opacity-50" />
      </div>
    </section>
  );
}
