import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import SEO from '../../components/seo/SEO';
import SectionHeader from '../../components/ui/SectionHeader';
import PageHero from '../../components/ui/PageHero';
import { Link } from 'react-router-dom';
import { teamAPI, heroImageAPI, resolveImageUrl } from '../../services/api';
import { FALLBACK_HERO, FALLBACK_TEAM, FALLBACK_RESTAURANT } from '../../config/constants';

const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const pillars = [
  {
    number: '01',
    title: 'Quality Ingredients',
    desc: 'From prime cut steaks to chef-curated creations, every dish is crafted with care, including gluten-free and vegetarian options.',
  },
  {
    number: '02',
    title: 'A Gathering Place',
    desc: 'More than a restaurant. A place where stories are shared, milestones celebrated, and the community comes together.',
  },
  {
    number: '03',
    title: 'Community First',
    desc: 'Built on the same values that made the Brooklin Pub a cornerstone since 2014: quality, passion, and genuine hospitality.',
  },
];

const highlights = [
  { value: '2026', label: 'Jack\'s Norwood Est.' },
  { value: '2014', label: 'Brooklin Pub Est.' },
  { value: 'Hwy 7', label: 'Norwood, Ontario' },
  { value: '100%', label: 'Community Focused' },
];

export default function AboutPage() {
  const [team,       setTeam]       = useState([]);
  const [heroImages, setHeroImages] = useState([]);

  useEffect(() => {
    teamAPI.getAll().then((r) => setTeam(r.data)).catch(() => {});
    heroImageAPI.getActive().then((r) => setHeroImages(r.data)).catch(() => {});
  }, []);

  const heroImg = heroImages[0]?.imageUrl ? resolveImageUrl(heroImages[0].imageUrl) : FALLBACK_HERO;

  return (
    <div className="min-h-screen">
      <SEO
        title="About Us"
        description="The story behind Jack's Norwood, a community-focused pub and restaurant on Highway 7 in Norwood, Ontario."
        canonical="/about"
      />

      <PageHero
        subtitle="Our Story"
        title={`About\nJack's Norwood`}
        description="A neighbourhood landmark rooted in community, quality, and genuine hospitality."
        image={heroImg}
      />

      {/* ── Story ──────────────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <p className="section-subtitle mb-4">Est. 2026, Norwood, Ontario</p>
              <h2 className="section-title mb-6">Our Story</h2>
              <div className="space-y-4 text-stone-500 leading-relaxed">
                <p>
                  Located in the heart of Norwood, Ontario, Jack's Norwood Family Restaurant
                  sits among the area's winding country roads and beautiful farmland,
                  conveniently on Hwy 7.
                </p>
                <p>
                  Jack's Norwood was founded in 2026 by the team behind the highly successful
                  Brooklin Pub, which opened in Brooklin, Ontario in 2014 and has become a true
                  cornerstone of the community. We built Jack's Norwood with the same vision:
                  quality, passion, and the hospitality that Brooklin has long been known for.
                </p>
                <p>
                  Indulge in classics and chef-curated creations made with quality ingredients.
                  Our extensive menu spans prime cut steaks, fish and chips, pastas, wings,
                  burgers, sandwiches, salads, and breakfast, with gluten-free and vegetarian
                  options throughout.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <img
                src={heroImages[1]?.imageUrl ? resolveImageUrl(heroImages[1].imageUrl) : (heroImages[0]?.imageUrl ? resolveImageUrl(heroImages[0].imageUrl) : FALLBACK_RESTAURANT)}
                alt="Restaurant interior"
                loading="lazy"
                decoding="async"
                className="w-full object-cover h-[26rem] rounded-lg shadow-lg"
                onError={(e) => { e.target.src = FALLBACK_RESTAURANT; }}
              />
              {/* Est. badge */}
              <div className="absolute -bottom-6 -left-6 bg-pub-gold text-white px-6 py-5 shadow-xl hidden lg:block">
                <p className="font-display text-3xl font-bold leading-none">Est.</p>
                <p className="text-xs font-semibold tracking-widest uppercase mt-1 opacity-80">2026 · Norwood, ON</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Highlights strip - large editorial numbers, no icons ──────────── */}
      <section className="bg-pub-dark py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-white/8">
            {highlights.map(({ value, label }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="px-8 py-6 first:pl-0 last:pr-0"
              >
                <p
                  className="font-display text-white font-bold leading-none mb-2"
                  style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', letterSpacing: '-0.03em' }}
                >
                  {value}
                </p>
                <p className="text-white/35 text-xs tracking-[0.18em] uppercase">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Philosophy - numbered pillars, not cookie-cutter cards ─────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader subtitle="Our Philosophy" title="What We Stand For" center={false} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-4">
            {pillars.map(({ number, title, desc }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
              >
                <span
                  className="font-display text-pub-gold font-bold block mb-4 leading-none"
                  style={{ fontSize: '3rem', opacity: 0.25, letterSpacing: '-0.04em' }}
                  aria-hidden="true"
                >
                  {number}
                </span>
                <div className="w-8 h-px bg-pub-gold mb-5" />
                <h3 className="font-display text-pub-text text-xl font-bold mb-3" style={{ letterSpacing: '-0.02em' }}>
                  {title}
                </h3>
                <p className="text-stone-500 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ───────────────────────────────────────────────────────────── */}
      {team.length > 0 && (
        <section className="py-24" style={{ background: 'rgba(255,255,255,0.55)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              subtitle="Meet the Crew"
              title="Our Team"
              description="The passionate people behind every great meal and memorable evening."
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 mt-4">
              {team.map((member, i) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="group text-center"
                >
                  <div className="relative w-28 h-28 mx-auto mb-4 overflow-hidden rounded-full border border-stone-200 group-hover:border-pub-gold/60 transition-colors duration-300">
                    <img
                      src={resolveImageUrl(member.imageUrl, FALLBACK_TEAM)}
                      alt={member.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                      onError={(e) => { e.target.src = FALLBACK_TEAM; }}
                    />
                  </div>
                  <h3 className="font-display text-pub-text font-semibold text-base" style={{ letterSpacing: '-0.01em' }}>
                    {member.name}
                  </h3>
                  <p className="text-pub-gold text-xs tracking-[0.12em] uppercase mt-1">{member.position}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="bg-pub-dark py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-pub-gold text-xs font-semibold tracking-[0.25em] uppercase mb-4">You're always welcome</p>
          <h2
            className="font-display text-white font-bold mb-6"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', letterSpacing: '-0.025em', lineHeight: 1.1 }}
          >
            See you at Jack's Norwood.
          </h2>
          <p className="text-white/40 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Join us for breakfast, lunch, dinner, or drinks. Dine inside or out on the patio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/menu"    className="btn-primary">View Our Menu</Link>
            <Link to="/contact" className="btn-outline" style={{ borderColor: 'rgba(255,255,255,0.25)', color: '#fff' }}>
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
