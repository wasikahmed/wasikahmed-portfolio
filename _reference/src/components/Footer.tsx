import { Link } from 'react-router';

export default function Footer() {
  return (
    <footer
      className="relative pt-20 pb-10 px-6 lg:px-10"
      style={{ borderTop: '1px solid rgba(15,191,122,0.07)', background: '#0A0E0C' }}
    >
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-12 mb-16">
          {/* Ghost wordmark */}
          <div className="relative select-none flex-shrink-0">
            <div
              className="text-[80px] lg:text-[112px] font-display font-bold leading-none"
              style={{ color: 'rgba(15,191,122,0.04)', letterSpacing: '-0.04em', lineHeight: 1 }}
            >
              WASIK
            </div>
            <div className="mt-3 text-xs font-mono" style={{ color: '#7C8B84' }}>
              © {new Date().getFullYear()} Wasik Ahmed — Building systems that ship.
            </div>
          </div>

          <div className="flex flex-wrap gap-12">
            {/* Navigate */}
            <div>
              <div className="eyebrow mb-5 opacity-60">Navigate</div>
              <div className="flex flex-col gap-2.5">
                {[
                  { label: 'Work', to: '/work' },
                  { label: 'Writing', to: '/writing' },
                  { label: 'About', to: '/about' },
                  { label: 'Contact', to: '/contact' },
                  { label: 'Design System', to: '/design-system' },
                ].map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    className="text-sm transition-colors hover:text-text"
                    style={{ color: '#7C8B84' }}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Connect */}
            <div>
              <div className="eyebrow mb-5 opacity-60">Connect</div>
              <div className="flex flex-col gap-2.5">
                {[
                  { label: 'wasik@example.com', href: 'mailto:wasik@example.com' },
                  { label: 'GitHub', href: '#' },
                  { label: 'LinkedIn', href: '#' },
                  { label: 'X / Twitter', href: '#' },
                ].map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    className="text-sm transition-colors"
                    style={{ color: '#7C8B84' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#0FBF7A')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#7C8B84')}
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Status line */}
        <div
          className="flex flex-wrap gap-x-6 gap-y-2 items-center text-xs font-mono pt-6"
          style={{ borderTop: '1px solid rgba(15,191,122,0.06)', color: '#7C8B84' }}
        >
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald pulse-dot" />
            Status: Open to full-time roles &amp; contract projects
          </span>
          <span>·</span>
          <span>Response time: &lt; 24h</span>
          <span>·</span>
          <span>Based in: Toronto, CA</span>
          <span>·</span>
          <span>Timezone: EST / UTC-5</span>
        </div>
      </div>
    </footer>
  );
}
