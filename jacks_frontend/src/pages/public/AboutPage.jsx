import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
  { icon: FaAward, value: "10+", label: "Years Serving Norwood" },
  { icon: FaUsers, value: "50k+", label: "Happy Customers" },
  { icon: FaBeer, value: "40+", label: "Beers on Tap" },
  { icon: FaHeart, value: "100%", label: "Local & Proud" },
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
              <p className="section-subtitle">Est. 2014</p>
              <h2 className="section-title text-3xl">A Decade of Good Times</h2>
              <div className="gold-divider ml-0"></div>
              <div className="space-y-4 text-stone-600 leading-relaxed">
                <p>
                  Jack's Norwood started with a simple idea: create a place
                  where everyone feels welcome. A neighbourhood pub with honest
                  food, cold drinks, and a genuine community spirit.
                </p>
                <p>
                  When Jack Morrison opened the doors on The Parade back in
                  2014, he had a clear vision — bring back the classic
                  Australian pub experience with a modern twist. Fresh,
                  locally-sourced ingredients, craft beers from South Australian
                  breweries, and a calendar packed with live entertainment.
                </p>
                <p>
                  Today, Jack's Norwood is more than just a pub — it's a
                  community hub. From Friday night footy to Sunday family
                  lunches, from live music to trivia nights, there's always
                  something happening here.
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
                  <p className="text-3xl font-bold">10+</p>
                  <p className="text-sm font-semibold">Years of Excellence</p>
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
                title: "Quality First",
                desc: "Every ingredient is carefully selected from local South Australian suppliers. We believe fresh produce makes better food.",
              },
              {
                title: "Community Focus",
                desc: "We're not just a pub — we're a community gathering place. From local sports teams to charity events, we give back.",
              },
              {
                title: "Great Value",
                desc: "Exceptional food and drinks at honest prices. We believe a great night out shouldn't break the bank.",
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
          <h2 className="section-title mb-4">Come Visit Us</h2>
          <p className="text-stone-500 text-lg mb-8">
            We'd love to have you. Just walk in or get in touch — you're always
            welcome at Jack's.
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
