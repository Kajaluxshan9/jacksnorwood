import { useForm } from 'react-hook-form';
import { useState, useEffect } from "react";
import SEO from '../../components/seo/SEO';
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FaCalendarCheck,
  FaUsers,
  FaClock,
  FaInfoCircle,
} from "react-icons/fa";
import {
  reservationAPI,
  heroImageAPI,
  resolveImageUrl,
} from "../../services/api";
import SectionHeader from "../../components/ui/SectionHeader";
import { FALLBACK_HERO, RESTAURANT_PHONE } from "../../config/constants";

const TIMES = [
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
];

export default function ReservationPage() {
  const [heroImages, setHeroImages] = useState([]);

  useEffect(() => {
    heroImageAPI
      .getActive()
      .then((r) => setHeroImages(r.data))
      .catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      await reservationAPI.create({ ...data, guests: parseInt(data.guests) });
      toast.success("Reservation submitted! We will confirm shortly.");
      reset();
    } catch {
      toast.error("Failed to submit reservation. Please try again or call us.");
    }
  };

  const inputCls =
    "w-full bg-white border border-stone-200 text-pub-text placeholder-stone-400 px-4 py-3 rounded-lg focus:outline-none focus:border-pub-gold transition-colors duration-200 shadow-sm";
  const errorCls = "text-red-500 text-xs mt-1";
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen pt-20">
      <SEO
        title="Book a Table"
        description="Reserve your table at Jack's Norwood Pub &amp; Restaurant in Norwood, Ontario. Easy online bookings for any occasion."
        canonical="/reservation"
      />
      <div
        className="relative py-24 bg-cover bg-center"
        style={{
          backgroundImage: `url('${heroImages[0]?.imageUrl ? resolveImageUrl(heroImages[0].imageUrl) : FALLBACK_HERO}')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-pub-light/90" />
        <div className="relative z-10 text-center">
          <SectionHeader
            subtitle="Reserve a Table"
            title="Book Your Visit"
            description="Secure your spot at Jack's Norwood"
            light={true}
          />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2"
          >
            <div className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm">
              <h2 className="font-display text-pub-text text-2xl font-bold mb-6">
                Reservation Details
              </h2>

              {isSubmitSuccessful ? (
                <div className="text-center py-10">
                  <FaCalendarCheck className="text-pub-gold text-6xl mx-auto mb-4" />
                  <h3 className="font-display text-pub-text text-2xl font-bold mb-3">
                    Booking Received!
                  </h3>
                  <p className="text-stone-500 mb-6">
                    We'll confirm your reservation via email shortly. See you
                    soon!
                  </p>
                  <button onClick={() => reset()} className="btn-outline">
                    Make Another Booking
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-stone-500 text-xs uppercase tracking-wider mb-1 block">
                        Full Name *
                      </label>
                      <input
                        {...register("name", { required: "Name is required" })}
                        placeholder="John Smith"
                        className={inputCls}
                      />
                      {errors.name && (
                        <p className={errorCls}>{errors.name.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-stone-500 text-xs uppercase tracking-wider mb-1 block">
                        Email *
                      </label>
                      <input
                        {...register("email", {
                          required: "Email required",
                          pattern: {
                            value: /^\S+@\S+$/i,
                            message: "Invalid email",
                          },
                        })}
                        placeholder="john@example.com"
                        className={inputCls}
                      />
                      {errors.email && (
                        <p className={errorCls}>{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-stone-500 text-xs uppercase tracking-wider mb-1 block">
                        Phone *
                      </label>
                      <input
                        {...register("phone", { required: "Phone required" })}
                        placeholder="0412 345 678"
                        className={inputCls}
                      />
                      {errors.phone && (
                        <p className={errorCls}>{errors.phone.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-stone-500 text-xs uppercase tracking-wider mb-1 block">
                        Guests *
                      </label>
                      <select
                        {...register("guests", {
                          required: "Select number of guests",
                        })}
                        className={inputCls}
                      >
                        <option value="">Select guests</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <option key={n} value={n}>
                            {n} {n === 1 ? "guest" : "guests"}
                          </option>
                        ))}
                        <option value="11">11+ guests (call us)</option>
                      </select>
                      {errors.guests && (
                        <p className={errorCls}>{errors.guests.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-stone-500 text-xs uppercase tracking-wider mb-1 block">
                        Date *
                      </label>
                      <input
                        type="date"
                        min={today}
                        {...register("date", { required: "Date required" })}
                        className={inputCls}
                      />
                      {errors.date && (
                        <p className={errorCls}>{errors.date.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-stone-500 text-xs uppercase tracking-wider mb-1 block">
                        Time *
                      </label>
                      <select
                        {...register("time", { required: "Time required" })}
                        className={inputCls}
                      >
                        <option value="">Select time</option>
                        {TIMES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      {errors.time && (
                        <p className={errorCls}>{errors.time.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-stone-500 text-xs uppercase tracking-wider mb-1 block">
                      Special Requests
                    </label>
                    <textarea
                      {...register("notes")}
                      placeholder="Dietary requirements, special occasion, seating preferences..."
                      rows={4}
                      className={inputCls + " resize-none"}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full text-base py-4 disabled:opacity-50"
                  >
                    {isSubmitting ? "Submitting..." : "Confirm Reservation"}
                  </button>
                </form>
              )}
            </div>
          </motion.div>

          {/* Info Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-display text-pub-gold text-lg font-semibold mb-4 flex items-center gap-2">
                <FaClock /> Opening Hours
              </h3>
              <div className="space-y-2 text-sm">
                {[
                  ["Mon – Thu", "11am – 10pm"],
                  ["Fri – Sat", "11am – 12am"],
                  ["Sunday", "12pm – 9pm"],
                ].map(([d, t]) => (
                  <div key={d} className="flex justify-between">
                    <span className="text-stone-500">{d}</span>
                    <span className="text-pub-text font-medium">{t}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-display text-pub-gold text-lg font-semibold mb-4 flex items-center gap-2">
                <FaInfoCircle /> Good to Know
              </h3>
              <ul className="space-y-2 text-sm text-stone-500">
                <li>• Reservations held for 15 minutes</li>
                <li>• Large groups (10+) please call us</li>
                <li>• We accommodate dietary requirements</li>
                <li>• Kids menu available</li>
                <li>• Outdoor seating available (weather permitting)</li>
              </ul>
            </div>

            <div className="bg-pub-gold/10 border border-pub-gold/30 rounded-2xl p-6">
              <h3 className="font-display text-pub-gold text-lg font-semibold mb-2 flex items-center gap-2">
                <FaUsers /> Large Groups?
              </h3>
              <p className="text-stone-500 text-sm mb-4">
                For groups of 10 or more, give us a call to arrange a function
                booking.
              </p>
              <a
                href={`tel:${RESTAURANT_PHONE}`}
                className="btn-primary text-sm py-2.5 block text-center"
              >
                {RESTAURANT_PHONE}
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
