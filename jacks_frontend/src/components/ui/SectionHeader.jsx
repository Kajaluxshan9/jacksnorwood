export default function SectionHeader({ subtitle, title, description, light = false, center = true }) {
  return (
    <div className={`mb-14 ${center ? 'text-center' : ''}`}>
      {subtitle && (
        <div className={`inline-flex items-center gap-3 mb-5 ${center ? 'justify-center' : ''}`}>
          <span className={`block w-7 h-px ${light ? 'bg-white/40' : 'bg-pub-gold/60'}`} />
          <span className={`text-xs font-semibold tracking-[0.25em] uppercase ${light ? 'text-white/65' : 'text-pub-gold'}`}>
            {subtitle}
          </span>
          <span className={`block w-7 h-px ${light ? 'bg-white/40' : 'bg-pub-gold/60'}`} />
        </div>
      )}
      <h2
        className={`font-display text-3xl md:text-4xl lg:text-5xl font-bold ${light ? 'text-white' : 'text-pub-text'}`}
        style={{ lineHeight: 1.08, letterSpacing: '-0.025em' }}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-5 text-lg leading-relaxed max-w-2xl ${center ? 'mx-auto' : ''} ${light ? 'text-white/55' : 'text-stone-500'}`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
