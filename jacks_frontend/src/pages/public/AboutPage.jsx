import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import SEO from '../../components/seo/SEO';
import { FaHeart, FaUsers, FaAward, FaBeer } from 'react-icons/fa';
import SectionHeader from '../../components/ui/SectionHeader';
import { Link } from 'react-router-dom';
import { teamAPI, heroImageAPI, resolveImageUrl } from "../../services/api";
import {
  FALLBACK_IMAGE,
  FALLBACK_HERO,
  FALLBACK_TEAM,
  FALLBACK_RESTAURANT,
} from "../../config/constants";

const FALLBACK = FALLBACK_TEAM;

const stats = [
  { icon: FaAward, value: "2026", label: "Founded in Norwood" },
  { icon: FaUsers, value: "2014", label: "Brooklin Pub Est." },
  { icon: FaBeer, value: "Hwy 7", label: "Conveniently Located" },
  { icon: FaHeart, value: "100%", label: "Community Focused" },
];

export default function AboutPage() {
  const [team, setTeam] = useState([]);
  const [heroImages, setHeroImages] = useState([]);

  useEffect(() => {
    teamAPI
      .getAll()
      .then((r) => setTeam(r.data))
      .catch(() => {});
    heroImageAPI
      .getActive()
      .then((r) => setHeroImages(r.data))
      .catch(() => {});
  }, []);
  return (
    <div className="min-h-screen pt-20">
      <SEO
        title="About Us"
        description="The story behind Jack's Norwood — a community-focused pub and restaurant on Highway 7 in Norwood, Ontario."
        canonical="/about"
      />
      {/* Hero */}
      <div
        className="relative py-32 bg-cover bg-center"
        style={{
          backgroundImage: `url('${heroImages[0]?.imageUrl ? resolveImageUrl(heroImages[0].imageUrl) : FALLBACK_HERO}')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-pub-light/90" />
        <div className="relative z-10 text-center">
          <SectionHeader
            subtitle="Our Story"
            title="About Jack's Norwood"
            light={true}
          />
        </div>
      </div>

      {/* Story */}
      <section className="py-20 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <p className="section-subtitle">Est. 2026 — Norwood, Ontario</p>
              <h2 className="section-title text-3xl">Our Story</h2>
              <div className="gold-divider ml-0"></div>
              <div className="space-y-4 text-stone-600 leading-relaxed">
                <p>
                  Located in the heart of Norwood, Ontario, Jack's Norwood Family
                  Restaurant sits among the area's winding country roads and
                  beautiful farmland, conveniently located on Hwy 7.
                </p>
                <p>
                  Jack's Norwood was founded in 2026 by the team behind the highly
                  successful Brooklin Pub, which opened in Brooklin, Ontario in 2014
                  and has become a true cornerstone of the community. Jack's Norwood
                  Family Restaurant was established with the same vision and dedication
                  to quality, passion, and hospitality that has long made the Brooklin
                  Pub a local gathering place.
                </p>
                <p>
                  At Jack's Norwood, indulge yourself in classics and chef-curated
                  creations made with quality ingredients. We offer an extensive menu
                  ranging from prime cut steaks, fish and chips, pastas, wings,
                  burgers, sandwiches, salads, and breakfast items, with gluten-free
                  and vegetarian options. Pair your meal with our signature cocktails,
                  beer, and wine.
                </p>
                <p>
                  Join us for breakfast, lunch, dinner, or drinks — dine inside our
                  restaurant or on our patio. Don't miss our daily feature specials.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="relative">
                <img
                  src={
                    heroImages[1]?.imageUrl
                      ? resolveImageUrl(heroImages[1].imageUrl)
                      : heroImages[0]?.imageUrl
                        ? resolveImageUrl(heroImages[0].imageUrl)
                        : FALLBACK_RESTAURANT
                  }
                  alt="Restaurant interior"
                  loading="lazy"
                  decoding="async"
                  className="rounded-xl w-full object-cover h-96 shadow-md"
                  onError={(e) => {
                    e.target.src = FALLBACK_RESTAURANT;
                  }}
                />
                <div className="absolute -bottom-6 -right-6 bg-pub-gold text-white p-6 rounded-xl font-display shadow-lg">
                  <p className="text-3xl font-bold">Est.</p>
                  <p className="text-sm font-semibold">2026 · Norwood, ON</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map(({ icon: Icon, value, label }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <Icon className="text-pub-gold text-4xl mx-auto mb-4" />
                <p className="font-display text-5xl font-bold text-pub-text mb-2">
                  {value}
                </p>
                <p className="text-stone-500 text-sm uppercase tracking-wider">
                  {label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-20 bg-transparent">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <SectionHeader subtitle="Our Philosophy" title="What We Stand For" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Quality Ingredients",
                desc: "From prime cut steaks to chef-curated creations — every dish is crafted with quality ingredients, including gluten-free and vegetarian options.",
              },
              {
                title: "A Gathering Place",
                desc: "We're more than just a restaurant — we're a gathering place where stories are shared, memories are made, and celebrations come to life.",
              },
              {
                title: "Community First",
                desc: "Built on the same values that made the Brooklin Pub a cornerstone since 2014 — quality, passion, and genuine hospitality.",
              },
            ].map(({ title, desc }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-white border border-stone-200 rounded-xl p-8 hover:border-pub-gold/40 hover:shadow-md transition-all duration-300"
              >
                <div className="w-12 h-0.5 bg-pub-gold mb-4 mx-auto"></div>
                <h3 className="font-display text-pub-text text-xl font-semibold mb-3">
                  {title}
                </h3>
                <p className="text-stone-500 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      {team.length > 0 && (
        <section className="py-20 bg-white/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              subtitle="Meet the Crew"
              title="Our Team"
              description="The passionate people behind every great meal and memorable evening"
            />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, i) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center group"
                >
                  <div className="relative w-36 h-36 mx-auto mb-4 overflow-hidden rounded-full border-2 border-pub-gold/30 group-hover:border-pub-gold transition-all duration-300 shadow-sm">
                    <img
                      src={resolveImageUrl(member.imageUrl, FALLBACK)}
                      alt={member.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = FALLBACK;
                      }}
                    />
                  </div>
                  <h3 className="font-display text-pub-text text-lg font-semibold">
                    {member.name}
                  </h3>
                  <p className="text-pub-gold text-sm mt-1">
                    {member.position}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 bg-white/70 border-y border-stone-200">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="section-title mb-4">See You at Jack's Norwood!</h2>
          <p className="text-stone-500 text-lg mb-8">
            Join us for breakfast, lunch, dinner, or drinks — dine inside our
            restaurant or on our patio. We'd love to have you. You're always
            welcome at Jack's Norwood.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact" className="btn-primary">
              Get in Touch
            </Link>
            <Link to="/menu" className="btn-outline">
              View Our Menu
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
