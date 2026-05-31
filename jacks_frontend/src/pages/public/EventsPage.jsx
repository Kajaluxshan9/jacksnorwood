import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/seo/SEO';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaClock, FaTicketAlt } from 'react-icons/fa';
import { eventAPI, resolveImageUrl } from "../../services/api";
import SectionHeader from "../../components/ui/SectionHeader";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { FALLBACK_EVENT, FALLBACK_HERO } from "../../config/constants";

const FALLBACK = FALLBACK_EVENT;

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventAPI
      .getUpcoming()
      .then((r) => setEvents(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-AU", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "";
  const formatTime = (t) => (t ? t.slice(0, 5) : "");

  return (
    <div className="min-h-screen pt-20">
      <SEO
        title="Upcoming Events"
        description="Live music, trivia nights, and special events at Jack's Norwood Pub in Norwood, Ontario. Check out what's coming up."
        canonical="/events"
      />
      <div
        className="relative py-24 bg-cover bg-center"
        style={{
          backgroundImage: `url('${events[0]?.imageUrl ? resolveImageUrl(events[0].imageUrl) : FALLBACK_HERO}')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-pub-light/90" />
        <div className="relative z-10 text-center">
          <SectionHeader
            subtitle="What's On"
            title="Upcoming Events"
            description="Live music, trivia nights, sports events and more"
            light={true}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {loading ? (
          <LoadingSpinner />
        ) : events.length === 0 ? (
          <div className="text-center text-stone-400 py-20">
            <p className="text-xl">No upcoming events</p>
            <p className="text-sm mt-2">
              Stay tuned — something exciting is always in the works!
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {events.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-white border border-stone-200 rounded-xl overflow-hidden hover:border-pub-gold/40 hover:shadow-lg transition-all duration-300 group flex flex-col md:flex-row"
              >
                <div className="md:w-80 h-56 md:h-auto flex-shrink-0 overflow-hidden">
                  <img
                    src={resolveImageUrl(event.imageUrl, FALLBACK)}
                    alt={event.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.src = FALLBACK;
                    }}
                  />
                </div>
                <div className="p-8 flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex flex-wrap gap-4 mb-4">
                      {event.date && (
                        <div className="flex items-center gap-2 text-pub-gold text-sm">
                          <FaCalendarAlt size={14} />
                          <span>{formatDate(event.date)}</span>
                        </div>
                      )}
                      {event.time && (
                        <div className="flex items-center gap-2 text-pub-gold text-sm">
                          <FaClock size={14} />
                          <span>{formatTime(event.time)}</span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-display text-pub-text text-3xl font-bold mb-3">
                      {event.title}
                    </h3>
                    <p className="text-stone-500 leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                  {event.reservationLink && (
                    <div className="mt-6 flex gap-4">
                      <a
                        href={event.reservationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary flex items-center gap-2"
                      >
                        <FaTicketAlt /> Reserve Your Spot
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
