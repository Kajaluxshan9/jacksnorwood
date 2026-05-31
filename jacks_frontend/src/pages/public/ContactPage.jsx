import { useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import SEO from '../../components/seo/SEO';
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaClock,
  FaUpload,
  FaCheckCircle,
} from "react-icons/fa";
import {
  contactAPI,
  uploadAPI,
  heroImageAPI,
  resolveImageUrl,
} from "../../services/api";
import SectionHeader from "../../components/ui/SectionHeader";
import {
  FALLBACK_HERO,
  RESTAURANT_ADDRESS,
  RESTAURANT_PHONE,
  RESTAURANT_EMAIL,
  OPENING_HOURS,
} from "../../config/constants";

const SUBJECTS = ["General", "Feedback", "Career"];

export default function ContactPage() {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();
  const [cvFile, setCvFile] = useState(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [cvUrl, setCvUrl] = useState("");
  const [heroImages, setHeroImages] = useState([]);

  useEffect(() => {
    heroImageAPI
      .getActive()
      .then((r) => setHeroImages(r.data))
      .catch(() => {});
  }, []);
  const fileRef = useRef(null);

  const subject = watch("subject", "General");
  const isCareer = subject === "Career";

  const handleCvChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCvFile(file);
    setCvUploading(true);
    try {
      const res = await uploadAPI.upload(file);
      setCvUrl(res.data.url);
    } catch {
      toast.error("CV upload failed. Please try again.");
      setCvFile(null);
    } finally {
      setCvUploading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      await contactAPI.send({ ...data, cvUrl: cvUrl || undefined });
      toast.success("Message sent! We'll get back to you soon.");
      reset();
      setCvFile(null);
      setCvUrl("");
    } catch {
      toast.error("Failed to send message. Please try again.");
    }
  };

  const inputCls =
    "w-full bg-white border border-stone-200 text-pub-text placeholder-stone-400 px-4 py-3 rounded-lg focus:outline-none focus:border-pub-gold transition-colors duration-200 shadow-sm";
  const errorCls = "text-red-500 text-xs mt-1";

  return (
    <div className="min-h-screen pt-20">
      <SEO
        title="Contact &amp; Find Us"
        description="Contact Jack's Norwood. Find us at 4327 Highway 7, Norwood, ON K0L 2V0. Call +1 (705) 639-0399 or email us."
        canonical="/contact"
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
            subtitle="Get in Touch"
            title="Contact Us"
            description="We'd love to hear from you"
            light={true}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-pub-text text-3xl font-bold mb-8">
              Send Us a Message
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Name */}
              <div>
                <input
                  {...register("name", { required: "Name is required" })}
                  placeholder="Your Name *"
                  className={inputCls}
                />
                {errors.name && (
                  <p className={errorCls}>{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <input
                  {...register("email", {
                    required: "Email is required",
                    pattern: { value: /^\S+@\S+$/i, message: "Invalid email" },
                  })}
                  placeholder="Email Address *"
                  className={inputCls}
                />
                {errors.email && (
                  <p className={errorCls}>{errors.email.message}</p>
                )}
              </div>

              {/* Phone + Subject (side by side) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    {...register("phone")}
                    placeholder="Phone Number"
                    className={inputCls}
                  />
                </div>
                <div>
                  <select {...register("subject")} className={inputCls}>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CV Upload — Career only (BEFORE message) */}
              {isCareer && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleCvChange}
                  />
                  {cvFile && cvUrl ? (
                    <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                      <FaCheckCircle className="text-green-500 flex-shrink-0" />
                      <span className="text-green-700 text-sm font-medium truncate">
                        {cvFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setCvFile(null);
                          setCvUrl("");
                          if (fileRef.current) fileRef.current.value = "";
                        }}
                        className="ml-auto text-stone-400 hover:text-red-500 text-xs transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={cvUploading}
                      className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-stone-300 hover:border-pub-gold text-stone-500 hover:text-pub-gold rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 disabled:opacity-50"
                    >
                      <FaUpload size={14} />
                      {cvUploading
                        ? "Uploading CV..."
                        : "Attach CV / Resume (PDF, DOC)"}
                    </button>
                  )}
                </motion.div>
              )}

              {/* Message (always shown, but after CV for career) */}
              <div>
                <textarea
                  {...register("message", {
                    required: "Message is required",
                    minLength: { value: 10, message: "Message too short" },
                  })}
                  placeholder={
                    isCareer
                      ? "Cover Letter / Additional Notes *"
                      : "Your Message *"
                  }
                  rows={6}
                  className={inputCls + " resize-none"}
                />
                {errors.message && (
                  <p className={errorCls}>{errors.message.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || cvUploading}
                className="btn-primary w-full disabled:opacity-50"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-pub-text text-3xl font-bold mb-8">
              Restaurant Info
            </h2>
            <div className="space-y-6 mb-10">
              {[
                {
                  icon: FaMapMarkerAlt,
                  title: "Address",
                  content: RESTAURANT_ADDRESS,
                },
                {
                  icon: FaPhone,
                  title: "Phone",
                  content: RESTAURANT_PHONE,
                  href: `tel:${RESTAURANT_PHONE}`,
                },
                {
                  icon: FaEnvelope,
                  title: "Email",
                  content: RESTAURANT_EMAIL,
                  href: `mailto:${RESTAURANT_EMAIL}`,
                },
              ].map(({ icon: Icon, title, content, href }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-pub-gold/10 border border-pub-gold/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="text-pub-gold" size={16} />
                  </div>
                  <div>
                    <p className="text-stone-400 text-xs uppercase tracking-wider mb-1">
                      {title}
                    </p>
                    {href ? (
                      <a
                        href={href}
                        className="text-pub-text hover:text-pub-gold transition-colors"
                      >
                        {content}
                      </a>
                    ) : (
                      <p className="text-pub-text">{content}</p>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-pub-gold/10 border border-pub-gold/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FaClock className="text-pub-gold" size={16} />
                </div>
                <div>
                  <p className="text-stone-400 text-xs uppercase tracking-wider mb-2">
                    Opening Hours
                  </p>
                  <div className="space-y-1 text-sm">
                    {OPENING_HOURS.map(({ day, time }) => (
                      <div key={day} className="flex justify-between gap-6">
                        <span className="text-stone-500">{day}</span>
                        <span className="text-pub-gold font-medium">
                          {time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {import.meta.env.VITE_GOOGLE_MAPS_EMBED_URL?.trim() ? (
              <div className="rounded-xl overflow-hidden border border-stone-200 h-60 shadow-sm">
                <iframe
                  title="Jack's Norwood Location"
                  src={import.meta.env.VITE_GOOGLE_MAPS_EMBED_URL.trim()}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allow="fullscreen"
                />
              </div>
            ) : (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(RESTAURANT_ADDRESS)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 h-60 rounded-xl border border-stone-200 bg-stone-50 text-stone-400 hover:text-pub-gold hover:border-pub-gold/30 transition-all duration-200 text-sm shadow-sm"
              >
                <FaMapMarkerAlt className="text-pub-gold" size={20} />
                View on Google Maps
              </a>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
