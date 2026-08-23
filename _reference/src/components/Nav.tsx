import { Link, useLocation } from 'react-router';
import { useEffect, useState } from 'react';

const LINKS = [
  { label: 'Work', to: '/work' },
  { label: 'Writing', to: '/writing' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

export default function Nav() {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 32);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(10,14,12,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(15,191,122,0.07)' : 'none',
      }}
    >
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
          <div
            className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold font-display"
            style={{ background: 'linear-gradient(135deg,#0FBF7A,#7CE86A)', color: '#0A0E0C' }}
          >
            WA
          </div>
          <span
            className="font-display font-semibold text-sm hidden sm:block transition-colors"
            style={{ color: '#EAF2ED' }}
          >
            Wasik Ahmed
          </span>
        </Link>

        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm font-medium transition-colors duration-200 hover:text-text"
              style={{ color: pathname.startsWith(link.to) ? '#0FBF7A' : '#7C8B84' }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right: availability pill + mobile menu */}
        <div className="flex items-center gap-4">
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono"
            style={{
              background: 'rgba(15,191,122,0.07)',
              border: '1px solid rgba(15,191,122,0.2)',
              color: '#0FBF7A',
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald pulse-dot" />
            Available
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span className="block w-5 h-px bg-text transition-transform" style={{ transform: menuOpen ? 'translateY(4px) rotate(45deg)' : '' }} />
            <span className="block w-5 h-px bg-text transition-opacity" style={{ opacity: menuOpen ? 0 : 1 }} />
            <span className="block w-5 h-px bg-text transition-transform" style={{ transform: menuOpen ? 'translateY(-4px) rotate(-45deg)' : '' }} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden px-6 pb-6 flex flex-col gap-4"
          style={{ background: 'rgba(10,14,12,0.97)', borderBottom: '1px solid rgba(15,191,122,0.1)' }}
        >
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-base font-medium py-2"
              style={{ color: pathname.startsWith(link.to) ? '#0FBF7A' : '#EAF2ED' }}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex items-center gap-2 mt-2 text-xs font-mono" style={{ color: '#0FBF7A' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald pulse-dot" />
            Available for work
          </div>
        </div>
      )}
    </header>
  );
}
