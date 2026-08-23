import { Link } from 'react-router';
import { useEffect, useRef, useState } from 'react';
import { useInView } from '../hooks/useInView';
import { useCounter } from '../hooks/useCounter';
import { projects, posts, testimonials } from '../data';

/* ── Helpers ───────────────────────────────────────────────── */

function ScrollReveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={`section-reveal ${inView ? 'in-view' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function GradientBlob({ style }: { style: React.CSSProperties }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none blob-drift"
      style={{ ...style }}
    />
  );
}

/* ── Sections ─────────────────────────────────────────────── */

interface TechItem {
  name: string;
  slug: string;
  color: string;
}

const TECH_STACK: TechItem[] = [
  { name: 'React',       slug: 'react',       color: '#61DAFB' },
  { name: 'TypeScript',  slug: 'typescript',  color: '#3178C6' },
  { name: 'Next.js',     slug: 'nextdotjs',   color: '#FFFFFF' },
  { name: 'Tailwind',    slug: 'tailwindcss', color: '#06B6D4' },
  { name: 'Python',      slug: 'python',      color: '#3776AB' },
  { name: 'FastAPI',     slug: 'fastapi',     color: '#009688' },
  { name: 'Docker',      slug: 'docker',      color: '#2496ED' },
  { name: 'PostgreSQL',  slug: 'postgresql',  color: '#4169E1' },
  { name: 'Linux',       slug: 'linux',       color: '#FCC624' },
  { name: 'OpenAI',      slug: 'openai',      color: '#10A37F' },
  { name: 'Redis',       slug: 'redis',       color: '#FF4438' },
  { name: 'Celery',      slug: 'celery',      color: '#37814A' },
];

/* Float durations and delays give each icon an independent orbit */
const FLOAT_PARAMS = [
  { dur: '3.1s', delay: '0s'    },
  { dur: '3.8s', delay: '0.4s'  },
  { dur: '2.9s', delay: '0.8s'  },
  { dur: '3.5s', delay: '0.2s'  },
  { dur: '4.0s', delay: '1.0s'  },
  { dur: '3.3s', delay: '0.6s'  },
  { dur: '2.7s', delay: '1.4s'  },
  { dur: '3.6s', delay: '0.3s'  },
  { dur: '3.2s', delay: '1.1s'  },
  { dur: '4.1s', delay: '0.7s'  },
  { dur: '3.0s', delay: '1.3s'  },
  { dur: '2.8s', delay: '0.5s'  },
];

function HeroTechVisualizer() {
  return (
    <div className="mt-12 pt-8" style={{ borderTop: '1px solid rgba(15,191,122,0.12)' }}>
      {/* Label row */}
      <div className="flex items-center gap-2 mb-7">
        <span className="w-1.5 h-1.5 rounded-full bg-[#0FBF7A] animate-pulse flex-shrink-0" />
        <span className="text-[11px] font-mono uppercase tracking-widest" style={{ color: '#7C8B84' }}>
          Tech Stack
        </span>
        <span className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(15,191,122,0.15), transparent)' }} />
        <span className="text-[11px] font-mono" style={{ color: '#7C8B84' }}>{TECH_STACK.length} tools</span>
      </div>

      {/* Icon grid */}
      <div className="flex flex-wrap gap-3">
        {TECH_STACK.map((tech, idx) => {
          const fp = FLOAT_PARAMS[idx];
          return (
            <div
              key={tech.name}
              className="tech-tile group"
              style={{
                '--float-dur': fp.dur,
                '--float-delay': fp.delay,
              } as React.CSSProperties}
            >
              {/* Ambient brand glow — grows on hover */}
              <div
                className="absolute inset-0 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `radial-gradient(circle at center, ${tech.color}30 0%, transparent 70%)`,
                  filter: 'blur(12px)',
                  transform: 'scale(1.6)',
                }}
              />

              {/* Tile card */}
              <div
                className="relative w-[58px] h-[58px] rounded-xl flex items-center justify-center cursor-pointer group-hover:scale-[1.12] group-hover:-translate-y-1.5"
                style={{
                  background: 'rgba(17,25,22,0.85)',
                  border: '1px solid rgba(15,191,122,0.1)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
                  transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = tech.color + '50';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 22px ${tech.color}1A, inset 0 1px 0 rgba(255,255,255,0.06)`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(15,191,122,0.1)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.03)';
                }}
              >
                <img
                  src={`https://cdn.simpleicons.org/${tech.slug}/${tech.color.replace('#', '')}`}
                  alt={tech.name}
                  className="w-7 h-7 object-contain"
                  loading="lazy"
                />
              </div>

              {/* Tooltip */}
              <div
                className="absolute -bottom-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg text-[11px] font-mono whitespace-nowrap pointer-events-none z-30 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200"
                style={{
                  background: '#0A0E0C',
                  color: tech.color,
                  border: `1px solid ${tech.color}35`,
                  boxShadow: `0 4px 16px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,0,0,0.2)`,
                }}
              >
                {tech.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Hero() {
  const [mounted, setMounted] = useState(false);
  const [cursor, setCursor] = useState({ x: -100, y: -100 });
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 100); return () => clearTimeout(t); }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    setCursor({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const words = ['systems', 'that', 'do', 'the', 'work', 'for', 'you.'];

  return (
    <section
      ref={heroRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-16"
    >
      {/* Cursor-following glow */}
      <div
        className="pointer-events-none absolute w-96 h-96 rounded-full transition-opacity duration-500 hidden md:block"
        style={{
          left: `${cursor.x - 192}px`,
          top: `${cursor.y - 192}px`,
          background: 'radial-gradient(circle, rgba(15,191,122,0.12) 0%, rgba(15,191,122,0) 70%)',
          filter: 'blur(30px)',
        }}
      />
      {/* Gradient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <GradientBlob style={{
          top: '-15%', left: '-5%', width: '55%', height: '70%',
          background: 'radial-gradient(ellipse, rgba(15,191,122,0.10) 0%, transparent 70%)',
          filter: 'blur(90px)',
        }} />
        <GradientBlob style={{
          bottom: '-10%', right: '5%', width: '45%', height: '60%',
          background: 'radial-gradient(ellipse, rgba(11,92,78,0.14) 0%, transparent 70%)',
          filter: 'blur(100px)',
          animationDelay: '-5s',
        }} />
        <GradientBlob style={{
          top: '40%', left: '40%', width: '30%', height: '40%',
          background: 'radial-gradient(ellipse, rgba(15,191,122,0.06) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animationDelay: '-9s',
        }} />
      </div>

      {/* Grid texture */}
      <div className="absolute inset-0 grid-texture opacity-40 pointer-events-none" />

      <div className="relative max-w-[1440px] mx-auto px-6 lg:px-10 py-20">
        {/* Eyebrow */}
        <div
          className={`eyebrow mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '100ms' }}
        >
          Software Engineer · AI &amp; Automation
        </div>

        {/* Headline */}
        <h1
          className="font-display font-bold leading-none mb-6"
          style={{ fontSize: 'clamp(52px, 6.5vw, 96px)', letterSpacing: '-0.03em', maxWidth: '900px' }}
        >
          <span
            className={`block transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            style={{ transitionDelay: '200ms' }}
          >
            I build
          </span>
          <span className="flex flex-wrap gap-x-4">
            {words.map((word, i) => (
              <span
                key={word + i}
                className={`transition-all duration-700 ${i < 2 ? 'gradient-text' : ''} ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${300 + i * 60}ms` }}
              >
                {word}
              </span>
            ))}
          </span>
        </h1>

        {/* CTAs */}
        <div
          className={`flex flex-wrap gap-4 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '750ms' }}
        >
          <Link to="/contact?type=hire" className="btn-primary">
            <span className="relative z-10">Work with me</span>
            <svg className="relative z-10 w-4 h-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2">
              <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        {/* Hero Tech Visualizer */}
        <div
          className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '1050ms' }}
        >
          <HeroTechVisualizer />
        </div>

        {/* Scroll hint */}
        <div className="mt-16 flex items-center gap-3" style={{ color: '#7C8B84' }}>
          <div className="bounce-y">
            <svg width="16" height="20" viewBox="0 0 16 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="1" width="14" height="18" rx="7" />
              <line x1="8" y1="5" x2="8" y2="9" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-xs font-mono">Scroll to explore</span>
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const doubled = [...TECH_STACK, ...TECH_STACK];
  return (
    <div
      className="overflow-hidden py-4 border-y"
      style={{
        borderColor: 'rgba(15,191,122,0.08)',
        background: 'rgba(15,191,122,0.025)',
      }}
    >
      <div className="marquee-track flex items-center gap-8 whitespace-nowrap">
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-8">
            <span className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/5 transition-colors">
              <img
                src={`https://cdn.simpleicons.org/${item.slug}/${item.color.replace('#', '')}`}
                alt={item.name}
                width="16"
                height="16"
                className="flex-shrink-0 object-contain"
              />
              <span className="font-mono text-xs font-medium" style={{ color: '#EAF2ED' }}>{item.name}</span>
            </span>
            <span style={{ color: 'rgba(15,191,122,0.2)', fontSize: '8px' }}>◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Capabilities() {
  const caps = [
    {
      title: 'AI Solutions',
      promise: 'Turn unstructured data and manual judgment into automated pipelines.',
      outcomes: [
        'Document extraction that runs 24/7 without human review',
        'Custom RAG systems built on your own data',
        'AI workflows that integrate with your existing tools',
      ],
      nodes: [
        { cx: 30, cy: 30, label: 'Document' },
        { cx: 120, cy: 30, label: 'OCR & Chunk' },
        { cx: 210, cy: 30, label: 'GPT-4o' },
        { cx: 300, cy: 30, label: 'DMS Sync' },
      ],
      icon: (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="20" cy="20" r="4" />
          <circle cx="8" cy="8" r="2.5" />
          <circle cx="32" cy="8" r="2.5" />
          <circle cx="8" cy="32" r="2.5" />
          <circle cx="32" cy="32" r="2.5" />
          <line x1="10.5" y1="10.5" x2="17.2" y2="17.2" />
          <line x1="29.5" y1="10.5" x2="22.8" y2="17.2" />
          <line x1="10.5" y1="29.5" x2="17.2" y2="22.8" />
          <line x1="29.5" y1="29.5" x2="22.8" y2="22.8" />
        </svg>
      ),
    },
    {
      title: 'Automation',
      promise: 'Replace repetitive human work with systems that run without babysitting.',
      outcomes: [
        'Multi-step workflows that trigger, execute, and report automatically',
        'Scheduling, routing, and assignment engines',
        'Integration glue between tools your team already uses',
      ],
      nodes: [
        { cx: 30, cy: 30, label: 'Event' },
        { cx: 120, cy: 30, label: 'Rules' },
        { cx: 210, cy: 30, label: 'Queue' },
        { cx: 300, cy: 30, label: 'Output' },
      ],
      icon: (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6v6M20 28v6M6 20h6M28 20h6" />
          <path d="M11.5 11.5l4.2 4.2M24.3 24.3l4.2 4.2M28.5 11.5l-4.2 4.2M15.7 24.3l-4.2 4.2" />
          <circle cx="20" cy="20" r="5" />
        </svg>
      ),
    },
    {
      title: 'Software Systems',
      promise: 'Production-ready applications built to last, not just to demo.',
      outcomes: [
        'SaaS products from schema to deployment',
        'Internal tools that teams actually adopt',
        'APIs and platforms that handle real scale',
      ],
      nodes: [
        { cx: 30, cy: 30, label: 'Client' },
        { cx: 120, cy: 30, label: 'FastAPI' },
        { cx: 210, cy: 30, label: 'Postgres' },
        { cx: 300, cy: 30, label: 'Redis' },
      ],
      icon: (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="10" width="28" height="20" rx="3" />
          <path d="M13 17l4 4-4 4M21 25h6" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-28 px-6 lg:px-10">
      <div className="max-w-[1440px] mx-auto">
        <ScrollReveal>
          <div className="eyebrow mb-4">What I do</div>
          <h2 className="font-display font-bold mb-16" style={{ fontSize: 'clamp(32px, 3vw, 48px)', letterSpacing: '-0.02em', maxWidth: '500px' }}>
            Three things, done well.
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {caps.map((cap, i) => (
            <ScrollReveal key={cap.title} delay={i * 100}>
              <div className="glass-card p-8 h-full flex flex-col group">
                <div className="mb-6 flex items-center justify-between" style={{ color: '#0FBF7A' }}>
                  {cap.icon}
                  <span className="font-mono text-xs opacity-50">0{i + 1}</span>
                </div>
                <h3 className="font-display font-semibold text-xl mb-3">{cap.title}</h3>
                <p className="text-sm mb-6 flex-shrink-0" style={{ color: '#7C8B84', lineHeight: 1.7 }}>{cap.promise}</p>

                {/* Animated system node network */}
                <div className="my-4 p-4 rounded-xl" style={{ background: 'rgba(10,14,12,0.8)', border: '1px solid rgba(15,191,122,0.1)' }}>
                  <div className="text-[10px] font-mono mb-2" style={{ color: '#7C8B84' }}>CONNECTED PIPELINE</div>
                  <div className="relative h-12 flex items-center justify-between">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                      <line x1="10%" y1="50%" x2="36%" y2="50%" stroke="rgba(15,191,122,0.25)" strokeDasharray="3 3" strokeWidth="1.5" />
                      <line x1="36%" y1="50%" x2="63%" y2="50%" stroke="rgba(15,191,122,0.25)" strokeDasharray="3 3" strokeWidth="1.5" />
                      <line x1="63%" y1="50%" x2="90%" y2="50%" stroke="rgba(15,191,122,0.25)" strokeDasharray="3 3" strokeWidth="1.5" />
                      {/* Animated pulse packet */}
                      <circle r="3" fill="#7CE86A">
                        <animate attributeName="cx" values="10%;90%" dur={`${3 + i}s`} repeatCount="indefinite" />
                        <animate attributeName="cy" values="50%;50%" dur={`${3 + i}s`} repeatCount="indefinite" />
                      </circle>
                    </svg>
                    {cap.nodes.map((node, nIdx) => (
                      <div key={nIdx} className="relative z-10 flex flex-col items-center">
                        <div
                          className="w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-mono"
                          style={{ borderColor: '#0FBF7A', background: '#0A0E0C', color: '#0FBF7A' }}
                        >
                          {nIdx + 1}
                        </div>
                        <span className="text-[10px] font-mono mt-1" style={{ color: '#7C8B84' }}>{node.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <ul className="flex flex-col gap-3 mt-auto pt-2">
                  {cap.outcomes.map((o) => (
                    <li key={o} className="flex items-start gap-3 text-sm" style={{ color: '#EAF2ED', lineHeight: 1.6 }}>
                      <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#0FBF7A' }} />
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function SelectedWork() {
  return (
    <section className="py-28 px-6 lg:px-10 relative overflow-hidden">
      {/* Subtle background blob */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute blob-drift-slow"
          style={{
            top: '20%', right: '-10%', width: '50%', height: '60%',
            background: 'radial-gradient(ellipse, rgba(11,92,78,0.08) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
      </div>

      <div className="relative max-w-[1440px] mx-auto">
        <ScrollReveal className="flex items-end justify-between mb-16 flex-wrap gap-6">
          <div>
            <div className="eyebrow mb-4">Selected Work</div>
            <h2 className="font-display font-bold" style={{ fontSize: 'clamp(32px, 3vw, 48px)', letterSpacing: '-0.02em' }}>
              Real problems. Shipped solutions.
            </h2>
          </div>
          <Link to="/work" className="btn-ghost text-sm" style={{ padding: '10px 20px' }}>
            View all projects →
          </Link>
        </ScrollReveal>

        <div className="flex flex-col gap-6">
          {projects.slice(0, 3).map((project, i) => (
            <ScrollReveal key={project.slug} delay={i * 80}>
              <Link
                to={`/work/${project.slug}`}
                className="project-card glass-card-no-hover block overflow-hidden"
                style={{ border: '1px solid rgba(15,191,122,0.1)', borderRadius: '16px' }}
              >
                <div className={`flex flex-col ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                  {/* Image */}
                  <div className="lg:w-[55%] overflow-hidden" style={{ background: '#0F1410', minHeight: '280px' }}>
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover project-img"
                      style={{ minHeight: '280px' }}
                    />
                  </div>

                  {/* Content */}
                  <div className="lg:w-[45%] p-8 lg:p-10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        {project.category.map((c) => (
                          <span key={c} className="tag-chip">{c}</span>
                        ))}
                      </div>
                      <h3 className="font-display font-bold text-2xl mb-3" style={{ letterSpacing: '-0.02em' }}>
                        {project.title}
                      </h3>
                      <p className="text-sm mb-6" style={{ color: '#7C8B84', lineHeight: 1.7 }}>
                        {project.problem}
                      </p>

                      {/* Outcome metric */}
                      <div
                        className="inline-flex flex-col mb-6 px-4 py-3 rounded-lg"
                        style={{ background: 'rgba(15,191,122,0.07)', border: '1px solid rgba(15,191,122,0.15)' }}
                      >
                        <span className="font-display font-bold text-2xl gradient-text">{project.metric}</span>
                        <span className="text-xs font-mono mt-0.5" style={{ color: '#7C8B84' }}>{project.metricLabel}</span>
                      </div>

                      {/* Stack tags */}
                      <div className="flex flex-wrap gap-2">
                        {project.stack.slice(0, 4).map((s) => (
                          <span key={s} className="tag-chip">{s}</span>
                        ))}
                        {project.stack.length > 4 && (
                          <span className="tag-chip">+{project.stack.length - 4}</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-8 flex items-center gap-2 text-sm font-medium" style={{ color: '#0FBF7A' }}>
                      View case study
                      <svg className="w-4 h-4 project-arrow" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2">
                        <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCard({ target, suffix, label, inView }: { target: number; suffix: string; label: string; inView: boolean }) {
  const count = useCounter(target, 1800, inView);
  return (
    <div className="text-center">
      <div className="font-display font-bold gradient-text" style={{ fontSize: 'clamp(40px, 4vw, 64px)', lineHeight: 1, letterSpacing: '-0.03em' }}>
        {count}{suffix}
      </div>
      <div className="mt-2 text-sm font-mono" style={{ color: '#7C8B84' }}>{label}</div>
    </div>
  );
}

function ImpactStrip() {
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  const stats = [
    { target: 24, suffix: '+', label: 'projects shipped' },
    { target: 18, suffix: '+', label: 'clients & teams' },
    { target: 92, suffix: '%', label: 'avg. time saved' },
    { target: 5, suffix: '+', label: 'years building' },
  ];

  return (
    <div
      ref={ref}
      className="py-20 px-6 lg:px-10 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(11,92,78,0.25) 0%, rgba(15,191,122,0.08) 50%, rgba(11,92,78,0.15) 100%)',
        borderTop: '1px solid rgba(15,191,122,0.1)',
        borderBottom: '1px solid rgba(15,191,122,0.1)',
      }}
    >
      {/* Dot matrix texture */}
      <div className="absolute inset-0 dot-matrix opacity-30 pointer-events-none" />

      <div className="relative max-w-[1440px] mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} inView={inView} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Experience() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const roles = [
    {
      title: 'Senior Software Engineer',
      company: 'Meridian AI',
      period: '2022 — Present',
      type: 'Full-time',
      shipped: [
        'Built document intelligence pipeline processing 12,000+ contracts/month',
        'Reduced infrastructure costs 40% by migrating batch jobs to async Celery workers',
        'Led migration from monolith to modular FastAPI services without a single outage',
        'Introduced LLM-based classification layer, replacing a 3,000-line rules engine',
      ],
    },
    {
      title: 'Software Engineer',
      company: 'Fieldworks SaaS',
      period: '2020 — 2022',
      type: 'Full-time',
      shipped: [
        'Built scheduling engine for 10,000+ weekly shift assignments across 50+ clients',
        'Designed real-time WebSocket event system for field operations dashboard',
        'Shipped public REST API used by 8 third-party integrations',
        'Mentored two junior engineers, both promoted within 12 months',
      ],
    },
    {
      title: 'Backend Engineer',
      company: 'Pulse Agency',
      period: '2019 — 2020',
      type: 'Full-time',
      shipped: [
        'Delivered 6 client projects across fintech, retail, and logistics verticals',
        'Built a shared API gateway used across all agency products',
        'Introduced automated testing — coverage went from 0% to 74%',
      ],
    },
    {
      title: 'Freelance / Consulting',
      company: 'Independent',
      period: '2023 — Present',
      type: 'Ongoing',
      shipped: [
        'AI document processing for legal tech firm (DocFlow AI)',
        'Constraint-solving scheduler for staffing agency (AutoSchedule)',
        'Inventory tracking platform for retail chain (InventoryPulse)',
        'Deployment automation for SaaS startup (PipelineOS)',
      ],
    },
  ];

  return (
    <section className="py-28 px-6 lg:px-10">
      <div className="max-w-[1440px] mx-auto">
        <ScrollReveal>
          <div className="eyebrow mb-4">Experience</div>
          <h2 className="font-display font-bold mb-16" style={{ fontSize: 'clamp(32px, 3vw, 48px)', letterSpacing: '-0.02em' }}>
            Where I've built.
          </h2>
        </ScrollReveal>

        <div className="relative flex flex-col gap-0">
          {/* Vertical timeline line */}
          <div
            className="hidden lg:block absolute left-[11px] top-2 bottom-2 w-[2px]"
            style={{ background: 'linear-gradient(to bottom, #0FBF7A, rgba(15,191,122,0.1))' }}
          />

          {roles.map((role, i) => (
            <ScrollReveal key={i} delay={i * 80}>
              <div className="lg:pl-10 relative">
                {/* Timeline dot */}
                <div
                  className="hidden lg:flex absolute left-0 top-5 w-6 h-6 rounded-full border-2 items-center justify-center"
                  style={{
                    borderColor: openIdx === i ? '#0FBF7A' : 'rgba(15,191,122,0.3)',
                    background: openIdx === i ? 'rgba(15,191,122,0.15)' : '#0A0E0C',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#0FBF7A' }} />
                </div>

                <button
                  onClick={() => setOpenIdx(openIdx === i ? null : i)}
                  className="w-full text-left py-6 border-b flex items-start justify-between gap-6 group"
                  style={{ borderColor: 'rgba(15,191,122,0.08)' }}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3 mb-1">
                      <span className="font-display font-semibold text-lg">{role.title}</span>
                      <span className="tag-chip">{role.type}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm" style={{ color: '#7C8B84' }}>
                      <span>{role.company}</span>
                      <span>·</span>
                      <span className="font-mono text-xs">{role.period}</span>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 flex-shrink-0 mt-1 transition-transform"
                    style={{ color: '#0FBF7A', transform: openIdx === i ? 'rotate(180deg)' : '' }}
                    fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="2"
                  >
                    <path d="M5 7.5l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {openIdx === i && (
                  <div className="py-6">
                    <div className="eyebrow mb-4 opacity-70">What I shipped</div>
                    <ul className="flex flex-col gap-3">
                      {role.shipped.map((item, j) => (
                        <li key={j} className="flex items-start gap-3 text-sm" style={{ color: '#EAF2ED', lineHeight: 1.7 }}>
                          <span className="mt-2 w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#0FBF7A' }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Process() {
  const steps = [
    { n: '01', title: 'Understand', desc: 'One or two calls to understand the actual problem, not the stated one. I ask about what breaks, who complains, and what tried-and-failed looks like.' },
    { n: '02', title: 'Design', desc: 'A written proposal: system design, tech choices, scope boundaries, and timeline. No guessing, no surprises.' },
    { n: '03', title: 'Build', desc: 'Working in short cycles with regular check-ins. You see real progress, not a black box.' },
    { n: '04', title: 'Ship & Measure', desc: 'Deploy to production with monitoring in place. We agree upfront on what success looks like — and then we check.' },
  ];

  return (
    <section className="py-28 px-6 lg:px-10 relative overflow-hidden">
      <div className="absolute inset-0 grid-texture opacity-30 pointer-events-none" />

      <div className="relative max-w-[1440px] mx-auto">
        <ScrollReveal>
          <div className="eyebrow mb-4">How I work</div>
          <h2 className="font-display font-bold mb-16" style={{ fontSize: 'clamp(32px, 3vw, 48px)', letterSpacing: '-0.02em' }}>
            Process that doesn't waste your time.
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, i) => (
            <ScrollReveal key={step.n} delay={i * 80}>
              <div className="glass-card p-7 h-full">
                <div className="font-mono text-xs mb-6" style={{ color: '#0FBF7A' }}>{step.n}</div>
                {/* Connector bar */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-[calc(50%-1px)] left-full w-5 h-px process-connector" />
                )}
                <h3 className="font-display font-bold text-xl mb-4">{step.title}</h3>
                <p className="text-sm" style={{ color: '#7C8B84', lineHeight: 1.75 }}>{step.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function WritingPreview() {
  const preview = posts.filter(p => p.type === 'article').slice(0, 2);
  const til = posts.filter(p => p.type === 'til').slice(0, 1);

  return (
    <section className="py-28 px-6 lg:px-10">
      <div className="max-w-[1440px] mx-auto">
        <ScrollReveal className="flex items-end justify-between mb-16 flex-wrap gap-6">
          <div>
            <div className="eyebrow mb-4">Writing</div>
            <h2 className="font-display font-bold" style={{ fontSize: 'clamp(32px, 3vw, 48px)', letterSpacing: '-0.02em' }}>
              Things worth writing down.
            </h2>
          </div>
          <Link to="/writing" className="btn-ghost text-sm" style={{ padding: '10px 20px' }}>
            All posts →
          </Link>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main articles */}
          {preview.map((post, i) => (
            <ScrollReveal key={post.slug} delay={i * 80}>
              <Link to={`/writing/${post.slug}`} className="glass-card block p-7 h-full group">
                <div className="flex items-center gap-2 mb-5">
                  {post.tags.map(t => <span key={t} className="tag-chip">{t}</span>)}
                </div>
                <h3 className="font-display font-semibold text-lg mb-3 group-hover:text-emerald transition-colors" style={{ lineHeight: 1.35, letterSpacing: '-0.01em' }}>
                  {post.title}
                </h3>
                <p className="text-sm mb-6" style={{ color: '#7C8B84', lineHeight: 1.7 }}>{post.excerpt}</p>
                <div className="flex items-center justify-between mt-auto pt-4" style={{ borderTop: '1px solid rgba(15,191,122,0.08)' }}>
                  <span className="text-xs font-mono" style={{ color: '#7C8B84' }}>{post.date}</span>
                  <span className="text-xs font-mono" style={{ color: '#7C8B84' }}>{post.readTime}</span>
                </div>
              </Link>
            </ScrollReveal>
          ))}

          {/* TIL note */}
          {til.map((post) => (
            <ScrollReveal key={post.slug} delay={160}>
              <Link
                to={`/writing/${post.slug}`}
                className="glass-card block p-7 h-full group"
                style={{ borderColor: 'rgba(245,165,36,0.15)' }}
              >
                <div className="flex items-center gap-2 mb-5">
                  <span
                    className="text-xs font-mono px-2 py-0.5 rounded"
                    style={{ background: 'rgba(245,165,36,0.08)', border: '1px solid rgba(245,165,36,0.2)', color: '#F5A524' }}
                  >
                    TIL
                  </span>
                  {post.tags.map(t => <span key={t} className="tag-chip">{t}</span>)}
                </div>
                <h3 className="font-display font-semibold text-lg mb-3" style={{ lineHeight: 1.35, letterSpacing: '-0.01em' }}>
                  {post.title}
                </h3>
                <p className="text-sm mb-6" style={{ color: '#7C8B84', lineHeight: 1.7 }}>{post.excerpt}</p>
                <div className="flex items-center justify-between mt-auto pt-4" style={{ borderTop: '1px solid rgba(15,191,122,0.08)' }}>
                  <span className="text-xs font-mono" style={{ color: '#7C8B84' }}>{post.date}</span>
                  <span className="text-xs font-mono" style={{ color: '#7C8B84' }}>{post.readTime}</span>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="py-28 px-6 lg:px-10 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute blob-drift"
          style={{
            top: '10%', left: '20%', width: '60%', height: '80%',
            background: 'radial-gradient(ellipse, rgba(11,92,78,0.07) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
        />
      </div>

      <div className="relative max-w-[1440px] mx-auto">
        <ScrollReveal>
          <div className="eyebrow mb-4">Testimonials</div>
          <h2 className="font-display font-bold mb-16" style={{ fontSize: 'clamp(32px, 3vw, 48px)', letterSpacing: '-0.02em' }}>
            From people I've built for.
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <ScrollReveal key={t.name} delay={i * 80}>
              <div className="glass-card p-8 h-full flex flex-col">
                <div className="mb-6 text-2xl" style={{ color: 'rgba(15,191,122,0.4)', fontFamily: 'Georgia, serif' }}>"</div>
                <p className="text-sm flex-1 italic" style={{ color: '#EAF2ED', lineHeight: 1.8 }}>
                  {t.quote}
                </p>
                <div className="mt-8 flex items-center gap-3 pt-6" style={{ borderTop: '1px solid rgba(15,191,122,0.08)' }}>
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold font-mono flex-shrink-0"
                    style={{ background: 'rgba(15,191,122,0.12)', color: '#0FBF7A', border: '1px solid rgba(15,191,122,0.2)' }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs font-mono" style={{ color: '#7C8B84' }}>{t.title} · {t.company}</div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTABand() {
  return (
    <section className="py-32 px-6 lg:px-10 relative overflow-hidden">
      <div
        className="relative max-w-[1440px] mx-auto rounded-2xl p-12 lg:p-20 overflow-hidden text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(11,92,78,0.4) 0%, rgba(15,191,122,0.08) 50%, rgba(11,92,78,0.3) 100%)',
          border: '1px solid rgba(15,191,122,0.18)',
        }}
      >
        <div className="absolute inset-0 dot-matrix opacity-20 pointer-events-none" />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[2px]"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(15,191,122,0.5), transparent)' }}
        />

        <div className="relative">
          <div className="eyebrow mb-6 text-center">Ready to start?</div>
          <h2
            className="font-display font-bold mb-6 mx-auto"
            style={{ fontSize: 'clamp(36px, 4vw, 64px)', letterSpacing: '-0.03em', maxWidth: '700px', lineHeight: 1.1 }}
          >
            Have a problem worth automating?
          </h2>
          <p className="mb-10 mx-auto" style={{ color: '#7C8B84', maxWidth: '480px', lineHeight: 1.7 }}>
            Whether you need a full-time engineer or someone to build a specific system — let's figure out if we're a fit.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/contact" className="btn-primary" style={{ fontSize: '16px', padding: '16px 32px' }}>
              Let's talk
              <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2">
                <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <a href="/wasik-ahmed-cv.pdf" className="btn-ghost" style={{ fontSize: '16px', padding: '15px 31px' }}>
              Download CV
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Page ─────────────────────────────────────────────────── */

export default function Home() {
  return (
    <>
      <Hero />
      <Capabilities />
      <SelectedWork />
      <ImpactStrip />
      <Experience />
      <Process />
      <WritingPreview />
      <Testimonials />
      <CTABand />
    </>
  );
}
