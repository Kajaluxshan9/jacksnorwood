import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/seo/SEO';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaClock, FaTicketAlt } from 'react-icons/fa';
import { eventAPI, heroImageAPI, resolveImageUrl } from '../../services/api';
import PageHero from '../../components/ui/PageHero';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { FALLBACK_EVENT, FALLBACK_HERO } from '../../config/constants';

export default function EventsPage() {
  const [events,     setEvents]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [heroImages, setHeroImages] = useState([]);

  useEffect(() => {
    eventAPI.getUpcoming().then((r) => setEvents(r.data)).catch(console.error).finally(() => setLoading(false));
    heroImageAPI.getActive().then((r) => setHeroImages(r.data)).catch(() => {});
  }, []);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-CA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const formatTime = (t) => (t ? t.slice(0, 5) : '');

  const heroImg = heroImages[0]?.imageUrl ? resolveImageUrl(heroImages[0].imageUrl) : FALLBACK_HERO;

  return (
    <div className="min-h-screen">
      <SEO
        title="Upcoming Events"
        description="Live music, trivia nights, and special events at Jack's Norwood Pub in Norwood, Ontario. Check out what's coming up."
        canonical="/events"
      />

      <PageHero
        subtitle="What's On"
        title="Upcoming Events"
        description="Live music, trivia nights, sports events and more. There's always something on at Jack's."
        image={heroImg}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {loading ? (
          <LoadingSpinner />
        ) : events.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-display text-pub-text text-2xl font-bold mb-3" style={{ letterSpacing: '-0.02em' }}>
              No upcoming events
            </p>
            <p className="text-stone-400 text-sm">
              Stay tuned. Something exciting is always in the works.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {events.map((event, i) => (
              <motion.article
                key={event.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: Math.min(i * 0.07, 0.28) }}
                className="group bg-white border border-stone-200 hover:border-pub-gold/40 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col md:flex-row"
                style={{ borderRadius: '4px' }}
              >
                {/* Image */}
                <div className="md:w-72 lg:w-80 h-56 md:h-auto flex-shrink-0 overflow-hidden">
                  <img
                    src={resolveImageUrl(event.imageUrl, FALLBACK_EVENT)}
                    alt={event.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600"
                    onError={(e) => { e.target.src = FALLBACK_EVENT; }}
                  />
                </div>

                {/* Content */}
                <div className="flex flex-col justify-between flex-1 p-8">
                  <div>
                    {/* Date / time row */}
                    <div className="flex flex-wrap items-center gap-5 mb-4">
                      {event.date && (
                        <span className="flex items-center gap-2 text-pub-gold text-xs font-semibold tracking-[0.12em] uppercase">
                          <FaCalendarAlt size={11} /> {formatDate(event.date)}
                        </span>
                      )}
                      {event.time && (
                        <span className="flex items-center gap-2 text-stone-400 text-xs tracking-wide">
                          <FaClock size={11} /> {formatTime(event.time)}
                        </span>
                      )}
                    </div>

                    <h3
                      className="font-display text-pub-text font-bold mb-3 group-hover:text-pub-gold transition-colors duration-200"
                      style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', letterSpacing: '-0.025em', lineHeight: 1.1 }}
                    >
                      {event.title}
                    </h3>
                    <p className="text-stone-500 leading-relaxed text-sm max-w-2xl">{event.description}</p>
                  </div>

                  {event.reservationLink && (
                    <div className="mt-7">
                      <a
                        href={event.reservationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary inline-flex items-center gap-2"
                      >
                        <FaTicketAlt size={12} /> Reserve Your Spot
                      </a>
                    </div>
                  )}
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
