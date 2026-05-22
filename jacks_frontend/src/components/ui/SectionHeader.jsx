export default function SectionHeader({ subtitle, title, description, light = false, center = true }) {
  return (
    <div className={`mb-12 ${center ? 'text-center' : ''}`}>
      {subtitle && (
        <p className="section-subtitle">{subtitle}</p>
      )}
      <h2 className={`section-title ${light ? 'text-white' : 'text-pub-text'}`}>{title}</h2>
      <div className={`h-0.5 w-16 bg-pub-gold my-4 ${center ? 'mx-auto' : ''}`}></div>
      {description && (
        <p className={`${light ? 'text-white/60' : 'text-stone-500'} max-w-2xl ${center ? 'mx-auto' : ''} text-lg leading-relaxed`}>
          {description}
        </p>
      )}
    </div>
  );
}
