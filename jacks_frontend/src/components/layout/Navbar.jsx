import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiMenu, HiX, HiChevronDown } from 'react-icons/hi';
import { FaSun, FaStar } from 'react-icons/fa';
import logoImg from '../../assets/images/JN L 2.png';
import { menuAPI } from '../../services/api';
import { ONLINE_ORDER_URL } from '../../config/constants';
import { toSlug } from '../../utils/slug';

const FALLBACK_MENU_CATEGORY_NAMES = [
  'Breakfast Menu',
  'Appetizers',
  'Poutines',
  'Nachos',
  'Soups & Salads',
  'Burgers',
  'Pastas',
  'Pizza',
  'Sandwiches',
  'Wraps',
  "Jack's Favourites",
  'Rice Bowls',
  'Norwood Entrees',
  'Ribs & Wings',
];

const SPECIALS_ITEMS = [
  { icon: FaSun,  to: '/promotions?type=DAILY',   label: 'Daily Specials' },
  { icon: FaStar, to: '/promotions?type=SPECIAL', label: 'Featured Specials' },
];

const toMenuLink = (name) => ({
  label: name,
  to: `/menu?category=${encodeURIComponent(toSlug(name))}`,
});

const FALLBACK_MENU_CATEGORIES = FALLBACK_MENU_CATEGORY_NAMES.map(toMenuLink);

function DropdownNav({ label, to, items }) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const ref = useRef(null);
  const location = useLocation();
  const isOpen = open || pinned;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setPinned(false);
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, []);

  useEffect(() => { setPinned(false); setOpen(false); }, [location]);

  const isActive = location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setPinned(p => !p)}
        aria-expanded={isOpen}
        className={`group flex items-center gap-1 text-sm font-semibold tracking-wide uppercase transition-colors duration-200 ${
          isActive ? 'text-pub-gold' : 'text-stone-600 hover:text-pub-gold'
        }`}
      >
        <span className="relative">
          {label}
          <span className={`absolute -bottom-0.5 left-0 h-[2px] bg-pub-gold rounded-full transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
        </span>
        <HiChevronDown
          size={13}
          className={`transition-transform duration-200 mt-px ${isOpen ? 'rotate-180 text-pub-gold' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-56 max-h-[70vh] overflow-y-auto bg-white border border-stone-100 rounded-2xl shadow-xl shadow-amber-900/10 z-50"
          >
            {/* Gold top accent bar */}
            <div className="h-0.5 bg-gradient-to-r from-pub-gold/60 via-pub-gold to-pub-gold/60" />
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 px-4 py-3 text-stone-600 hover:text-pub-gold hover:bg-amber-50 text-sm font-medium transition-all duration-150 border-b border-stone-100 last:border-b-0"
              >
                {item.icon && <item.icon size={12} className="text-pub-gold/70 flex-shrink-0" />}
                {item.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(null);
  const [menuItems, setMenuItems] = useState(FALLBACK_MENU_CATEGORIES);
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    menuAPI
      .getCategories()
      .then((r) => {
        if (cancelled || !Array.isArray(r.data) || r.data.length === 0) return;
        setMenuItems(r.data.map((category) => toMenuLink(category.name)));
      })
      .catch(() => {
        if (!cancelled) setMenuItems(FALLBACK_MENU_CATEGORIES);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setMobileMenu(null);
  }, [location]);

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex flex-col items-center px-4">
      {/* Floating pill */}
      <nav className={`w-full max-w-5xl transition-all duration-500 rounded-full border bg-white ${
        scrolled
          ? 'border-pub-gold/25 shadow-lg shadow-amber-900/10'
          : 'border-pub-gold/15 shadow-md shadow-amber-900/8'
      }`}>
        <div className="flex items-center px-4 h-[68px] gap-3">

          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0 pl-1">
            <img src={logoImg} alt="Jack's Norwood" className="h-11 w-auto object-contain" />
          </Link>

          {/* Divider */}
          <div className="hidden lg:block h-7 w-px bg-stone-200 mx-1 flex-shrink-0" />

          {/* Desktop Nav — centered */}
          <div className="hidden lg:flex flex-1 items-center justify-center gap-6">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `group relative whitespace-nowrap text-sm font-semibold tracking-wide uppercase transition-colors duration-200 ${
                  isActive ? 'text-pub-gold' : 'text-stone-600 hover:text-pub-gold'
                }`
              }
            >
              {({ isActive }) => (
                <span className="relative">
                  Home
                  <span className={`absolute -bottom-0.5 left-0 h-[2px] bg-pub-gold rounded-full transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                </span>
              )}
            </NavLink>

            <DropdownNav label="Menu" to="/menu" items={menuItems} />
            <DropdownNav label="Specials" to="/promotions" items={SPECIALS_ITEMS} />

            {[
              { to: '/events',  label: 'Events' },
              { to: '/gallery', label: 'Gallery' },
              { to: '/about',   label: 'About' },
              { to: '/contact', label: 'Contact' },
            ].map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `group relative whitespace-nowrap text-sm font-semibold tracking-wide uppercase transition-colors duration-200 ${
                    isActive ? 'text-pub-gold' : 'text-stone-600 hover:text-pub-gold'
                  }`
                }
              >
                {({ isActive }) => (
                  <span className="relative">
                    {link.label}
                    <span className={`absolute -bottom-0.5 left-0 h-[2px] bg-pub-gold rounded-full transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          {/* Online order CTA */}
          <a
            href={ONLINE_ORDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-flex items-center flex-shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full bg-pub-gold text-white text-sm font-bold tracking-wide uppercase shadow-sm shadow-pub-gold/40 hover:bg-amber-700 hover:shadow-md hover:shadow-pub-gold/30 active:scale-95 transition-all duration-200 ml-1 mr-1"
          >
            Online Order
          </a>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden ml-auto flex items-center justify-center w-9 h-9 rounded-full hover:bg-stone-100 text-stone-700 transition-colors duration-200"
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <HiX size={20} /> : <HiMenu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden w-full max-w-5xl mt-2 bg-white border border-pub-gold/20 rounded-3xl shadow-xl shadow-amber-900/10 overflow-hidden"
          >
            {/* Gold top accent */}
            <div className="h-0.5 bg-gradient-to-r from-transparent via-pub-gold to-transparent" />
            <div className="px-6 py-5 flex flex-col gap-1">
              <NavLink to="/" end className={({ isActive }) => mobileLinkCls(isActive)}>Home</NavLink>

              {/* Menu accordion */}
              <MobileAccordion
                label="Menu"
                id="menu"
                active={mobileMenu}
                onToggle={(id) => setMobileMenu(mobileMenu === id ? null : id)}
              >
                {menuItems.map(item => (
                  <Link key={item.to} to={item.to} className="text-sm text-stone-500 hover:text-pub-gold py-2 border-b border-stone-100 last:border-b-0">
                    {item.label}
                  </Link>
                ))}
              </MobileAccordion>

              {/* Specials accordion */}
              <MobileAccordion
                label="Specials"
                id="specials"
                active={mobileMenu}
                onToggle={(id) => setMobileMenu(mobileMenu === id ? null : id)}
              >
                {SPECIALS_ITEMS.map(item => (
                  <Link key={item.to} to={item.to} className="flex items-center gap-2 text-sm text-stone-500 hover:text-pub-gold py-2 border-b border-stone-100 last:border-b-0">
                    <item.icon size={12} className="text-pub-gold/70" />
                    {item.label}
                  </Link>
                ))}
              </MobileAccordion>

              {[
                { to: '/events',  label: 'Events' },
                { to: '/gallery', label: 'Gallery' },
                { to: '/about',   label: 'About' },
                { to: '/contact', label: 'Contact' },
              ].map((link) => (
                <NavLink key={link.to} to={link.to} className={({ isActive }) => mobileLinkCls(isActive)}>
                  {link.label}
                </NavLink>
              ))}

              {/* Mobile CTA */}
              <a
                href={ONLINE_ORDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center px-5 py-3 rounded-full bg-pub-gold text-white text-sm font-bold tracking-wide uppercase shadow-sm shadow-pub-gold/30 hover:bg-amber-700 transition-colors duration-200"
              >
                Online Order
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileAccordion({ label, id, active, onToggle, children }) {
  return (
    <div>
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={active === id}
        className="w-full flex items-center justify-between text-sm font-semibold uppercase tracking-wide py-2.5 border-b border-stone-200 text-stone-700"
      >
        {label}
        <HiChevronDown
          size={16}
          className={`transition-transform duration-200 ${active === id ? 'rotate-180 text-pub-gold' : ''}`}
        />
      </button>
      <AnimatePresence>
        {active === id && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pl-4 flex flex-col overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function mobileLinkCls(isActive) {
  return `text-sm font-semibold uppercase tracking-wide py-2.5 border-b border-stone-200 transition-colors duration-200 ${
    isActive ? 'text-pub-gold' : 'text-stone-700 hover:text-pub-gold'
  }`;
}
