// Food particles that rise slowly from the bottom with a gentle sway
const FOOD_PARTICLES = [
  { emoji: '🍔', size: 28, left: '3%',  delay: 0,   dur: 22 },
  { emoji: '🍺', size: 26, left: '9%',  delay: 5,   dur: 18 },
  { emoji: '🥩', size: 24, left: '16%', delay: 11,  dur: 25 },
  { emoji: '🍕', size: 28, left: '23%', delay: 2,   dur: 20 },
  { emoji: '🍰', size: 22, left: '30%', delay: 14,  dur: 27 },
  { emoji: '🥂', size: 24, left: '38%', delay: 7,   dur: 21 },
  { emoji: '🍷', size: 26, left: '46%', delay: 3,   dur: 19 },
  { emoji: '🍻', size: 28, left: '54%', delay: 9,   dur: 23 },
  { emoji: '🌮', size: 24, left: '61%', delay: 15,  dur: 26 },
  { emoji: '🍟', size: 22, left: '68%', delay: 1,   dur: 20 },
  { emoji: '🥗', size: 24, left: '75%', delay: 6,   dur: 24 },
  { emoji: '🍗', size: 26, left: '82%', delay: 12,  dur: 22 },
  { emoji: '🧁', size: 22, left: '89%', delay: 4,   dur: 18 },
  { emoji: '🍴', size: 20, left: '95%', delay: 8,   dur: 21 },
  { emoji: '⭐', size: 18, left: '13%', delay: 17,  dur: 16 },
  { emoji: '🥞', size: 22, left: '35%', delay: 19,  dur: 28 },
  { emoji: '☕', size: 24, left: '57%', delay: 10,  dur: 19 },
  { emoji: '🍖', size: 24, left: '78%', delay: 16,  dur: 23 },
];

export default function AnimatedBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {/* Large ambient colour blobs */}
      <div className="anim-blob anim-blob-1" />
      <div className="anim-blob anim-blob-2" />
      <div className="anim-blob anim-blob-3" />
      <div className="anim-blob anim-blob-4" />
      <div className="anim-blob anim-blob-5" />
      <div className="anim-blob anim-blob-6" />
      <div className="anim-blob anim-blob-7" />
      <div className="anim-blob anim-blob-8" />

      {/* Floating decorative rings */}
      <div className="anim-ring anim-ring-1" />
      <div className="anim-ring anim-ring-2" />
      <div className="anim-ring anim-ring-3" />

      {/* Rising food particles */}
      {FOOD_PARTICLES.map(({ emoji, size, left, delay, dur }) => (
        <span
          key={`${emoji}-${left}`}
          style={{
            position: 'absolute',
            bottom: '-60px',
            left,
            fontSize: `${size}px`,
            lineHeight: 1,
            animationName: 'foodRise',
            animationDuration: `${dur}s`,
            animationDelay: `${delay}s`,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationFillMode: 'both',
            filter: 'saturate(0.9)',
            userSelect: 'none',
          }}
        >
          {emoji}
        </span>
      ))}
    </div>
  );
}
