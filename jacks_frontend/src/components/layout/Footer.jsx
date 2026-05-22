import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaFacebook, FaInstagram, FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock } from 'react-icons/fa';
import { FaTiktok } from 'react-icons/fa6';
import logoImg from '../../assets/images/JN L 2.png';
import { settingsAPI, newsletterAPI } from '../../services/api';
import {
  ONLINE_ORDER_URL,
  RESTAURANT_ADDRESS,
  RESTAURANT_PHONE,
  RESTAURANT_EMAIL,
  OPENING_HOURS,
} from "../../config/constants";

const quickLinks = [
  { to: "/menu", label: "Menu" },
  { to: "/promotions", label: "Specials" },
  { to: "/events", label: "Events" },
  { href: ONLINE_ORDER_URL, label: "Online Order" },
  { to: "/gallery", label: "Gallery" },
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact" },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [social, setSocial] = useState({
    facebook: "",
    instagram: "",
    tiktok: "",
  });

  useEffect(() => {
    settingsAPI
      .getAll()
      .then((r) =>
        setSocial({
          facebook: r.data["social.facebook"] || "",
          instagram: r.data["social.instagram"] || "",
          tiktok: r.data["social.tiktok"] || "",
        }),
      )
      .catch(() => {});
  }, []);

  const [nlSubmitting, setNlSubmitting] = useState(false);

  const handleNewsletter = async (e) => {
    e.preventDefault();
    const email = e.target.elements.email.value.trim();
    if (!email) return;
    setNlSubmitting(true);
    try {
      await newsletterAPI.subscribe(email, "");
      toast.success("Subscribed successfully!");
      e.target.reset();
    } catch {
      toast.error("Subscription failed. Please try again.");
    } finally {
      setNlSubmitting(false);
    }
  };

  return (
    <footer className="bg-stone-100 border-t border-stone-200 relative z-10">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <img
              src={logoImg}
              alt="Jack's Norwood"
              loading="lazy"
              decoding="async"
              className="h-20 w-auto object-contain mb-4"
            />
            <p className="text-stone-500 text-sm leading-relaxed mb-6">
              Your neighbourhood pub &amp; restaurant in Norwood. Great food, cold
              drinks, live entertainment and warm hospitality.
            </p>
            <div className="flex gap-3">
              {[
                {
                  href: social.facebook,
                  Icon: FaFacebook,
                  label: "Facebook",
                  color: "bg-[#1877F2] hover:bg-[#0e63d0]",
                },
                {
                  href: social.instagram,
                  Icon: FaInstagram,
                  label: "Instagram",
                  color: "bg-[#E1306C] hover:bg-[#c42460]",
                },
                {
                  href: social.tiktok,
                  Icon: FaTiktok,
                  label: "TikTok",
                  color: "bg-[#111111] hover:bg-[#333333]",
                },
              ].map(({ href, Icon, label, color }) => (
                <a
                  key={label}
                  href={href || "#"}
                  target={href ? "_blank" : undefined}
                  rel={href ? "noopener noreferrer" : undefined}
                  onClick={!href ? (e) => e.preventDefault() : undefined}
                  aria-label={label}
                  title={
                    href ? label : `${label} - add URL in Admin -> Settings`
                  }
                  className={`w-10 h-10 ${color} rounded-full flex items-center justify-center text-white shadow-sm transition-all duration-300 ${!href ? "opacity-50 cursor-not-allowed" : "hover:scale-110 hover:shadow-md cursor-pointer"}`}
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display text-pub-gold text-lg font-semibold mb-5">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href || link.to}>
                  {link.href ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-stone-500 text-sm hover:text-pub-gold transition-colors duration-200 flex items-center gap-2"
                    >
                      <span className="w-1 h-1 bg-pub-gold rounded-full"></span>
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      to={link.to}
                      className="text-stone-500 text-sm hover:text-pub-gold transition-colors duration-200 flex items-center gap-2"
                    >
                      <span className="w-1 h-1 bg-pub-gold rounded-full"></span>
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display text-pub-gold text-lg font-semibold mb-5">
              Contact Us
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-stone-500 text-sm">
                <FaMapMarkerAlt className="text-pub-gold mt-0.5 flex-shrink-0" />
                <span>{RESTAURANT_ADDRESS}</span>
              </li>
              <li className="flex items-center gap-3 text-stone-500 text-sm">
                <FaPhone className="text-pub-gold flex-shrink-0" />
                <a
                  href={`tel:${RESTAURANT_PHONE}`}
                  className="hover:text-pub-gold transition-colors"
                >
                  {RESTAURANT_PHONE}
                </a>
              </li>
              <li className="flex items-center gap-3 text-stone-500 text-sm">
                <FaEnvelope className="text-pub-gold flex-shrink-0" />
                <a
                  href={`mailto:${RESTAURANT_EMAIL}`}
                  className="hover:text-pub-gold transition-colors"
                >
                  {RESTAURANT_EMAIL}
                </a>
              </li>
            </ul>

            <h3 className="font-display text-pub-gold text-lg font-semibold mt-6 mb-4">
              Opening Hours
            </h3>
            <ul className="space-y-2">
              {OPENING_HOURS.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <FaClock
                    className="text-pub-gold mt-0.5 flex-shrink-0"
                    size={12}
                  />
                  <div>
                    <span className="text-stone-600 block">{h.day}</span>
                    <span className="text-pub-gold">{h.time}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-display text-pub-gold text-lg font-semibold mb-5">
              Newsletter
            </h3>
            <p className="text-stone-500 text-sm mb-4">
              Subscribe to stay updated on our specials and latest news.
            </p>
            <form onSubmit={handleNewsletter} className="space-y-3">
              <input
                type="email"
                name="email"
                required
                placeholder="Your email address"
                className="w-full bg-white border border-stone-200 text-pub-text placeholder-stone-400 px-4 py-3 text-sm focus:outline-none focus:border-pub-gold rounded-sm transition-colors"
              />
              <button
                type="submit"
                disabled={nlSubmitting}
                className="btn-primary w-full text-center text-xs disabled:opacity-50"
              >
                {nlSubmitting ? "Subscribing..." : "Subscribe"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-stone-200 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-stone-400 text-sm">
            &copy; {currentYear} Jack's Norwood. All rights reserved.
          </p>
          <p className="text-stone-400 text-xs">
            Please drink responsibly. Must be 18+ to consume alcohol.
          </p>
        </div>
      </div>
    </footer>
  );
}
