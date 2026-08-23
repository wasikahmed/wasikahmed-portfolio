import { Link } from 'react-router';
import { useInView } from '../hooks/useInView';

function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} className={`section-reveal ${inView ? 'in-view' : ''}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

const skills = [
  {
    category: 'Languages',
    items: ['Python', 'TypeScript', 'JavaScript', 'SQL', 'Bash'],
  },
  {
    category: 'Backend & APIs',
    items: ['FastAPI', 'Node.js', 'Express', 'PostgreSQL', 'Redis', 'Celery'],
  },
  {
    category: 'Frontend',
    items: ['React', 'Next.js', 'Tailwind CSS', 'WebSockets'],
  },
  {
    category: 'AI & ML',
    items: ['OpenAI API', 'LangChain', 'LlamaIndex', 'Embeddings', 'OR-Tools'],
  },
  {
    category: 'Infrastructure',
    items: ['Docker', 'Terraform', 'GitHub Actions', 'AWS', 'Vercel'],
  },
  {
    category: 'Automation',
    items: ['n8n', 'Zapier (for prototyping)', 'Webhooks', 'Cron & task queues'],
  },
];

const tools = ['VS Code', 'Cursor', 'Postico', 'TablePlus', 'Insomnia', 'Linear', 'Notion', 'Figma (reading designs)'];

export default function About() {
  return (
    <div className="min-h-screen pt-32 pb-28">
      {/* Hero area */}
      <div className="px-6 lg:px-10 mb-24">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Photo */}
            <ScrollReveal>
              <div className="relative">
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ height: 'clamp(380px, 50vw, 600px)', border: '1px solid rgba(15,191,122,0.12)' }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&h=700&fit=crop&auto=format&faceindex=1"
                    alt="Wasik Ahmed"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Floating badge */}
                <div
                  className="absolute bottom-6 left-6 px-4 py-3 rounded-xl flex items-center gap-3"
                  style={{ background: 'rgba(10,14,12,0.9)', border: '1px solid rgba(15,191,122,0.2)', backdropFilter: 'blur(12px)' }}
                >
                  <div className="w-2 h-2 rounded-full bg-emerald pulse-dot" />
                  <span className="text-xs font-mono" style={{ color: '#0FBF7A' }}>Open to work · Toronto, CA</span>
                </div>
              </div>
            </ScrollReveal>

            {/* Story */}
            <ScrollReveal delay={100}>
              <div className="eyebrow mb-5">About</div>
              <h1
                className="font-display font-bold mb-8"
                style={{ fontSize: 'clamp(36px, 3.5vw, 56px)', letterSpacing: '-0.03em', lineHeight: 1.1 }}
              >
                I'm Wasik. I build software that solves real problems.
              </h1>

              <div className="flex flex-col gap-5 text-base" style={{ color: '#EAF2ED', lineHeight: 1.85 }}>
                <p>
                  I started writing code in university because it was the fastest way to make things that actually worked. Computer science gave me the theory; working at agencies, startups, and mid-sized product companies gave me the rest.
                </p>
                <p>
                  Most of my career has been in the gap between "we have a problem" and "we have software that fixes it." I've learned that the hardest part is rarely the code — it's understanding the problem precisely enough to know what to build.
                </p>
                <p>
                  For the past few years, that work has increasingly involved AI and automation. Not because they're fashionable, but because they're often the right tool when you need to eliminate manual work at scale.
                </p>
                <p>
                  I work as a senior engineer on product teams, and I take on consulting projects for clients who need a specific system built. Both modes of work inform the other — product work teaches you what teams actually need; consulting keeps you honest about real-world constraints.
                </p>
                <p style={{ color: '#7C8B84' }}>
                  When I'm not writing code, I'm usually cooking something elaborate, going down Wikipedia rabbit holes, or watching football. Not necessarily in that order.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 mt-10">
                <Link to="/contact" className="btn-primary">Let's work together</Link>
                <a href="/wasik-ahmed-cv.pdf" className="btn-ghost">Download CV</a>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div
        className="py-24 px-6 lg:px-10 relative overflow-hidden"
        style={{ borderTop: '1px solid rgba(15,191,122,0.07)', borderBottom: '1px solid rgba(15,191,122,0.07)' }}
      >
        <div className="absolute inset-0 grid-texture opacity-30 pointer-events-none" />
        <div className="relative max-w-[1440px] mx-auto">
          <ScrollReveal>
            <div className="eyebrow mb-4">Skills</div>
            <h2 className="font-display font-bold mb-14" style={{ fontSize: 'clamp(28px, 3vw, 42px)', letterSpacing: '-0.02em' }}>
              Things I'm fluent in.
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((group, i) => (
              <ScrollReveal key={group.category} delay={i * 60}>
                <div className="glass-card-no-hover p-6">
                  <div className="eyebrow mb-4 opacity-70">{group.category}</div>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map(item => (
                      <span key={item} className="tag-chip">{item}</span>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>

      {/* Education + Tools */}
      <div className="py-24 px-6 lg:px-10">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Education */}
            <ScrollReveal>
              <div className="eyebrow mb-6">Education</div>
              <div className="glass-card-no-hover p-7">
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center font-bold font-display text-sm flex-shrink-0"
                    style={{ background: 'rgba(15,191,122,0.1)', color: '#0FBF7A', border: '1px solid rgba(15,191,122,0.2)' }}
                  >
                    CS
                  </div>
                  <div>
                    <div className="font-display font-semibold text-lg mb-1">BSc, Computer Science</div>
                    <div className="text-sm" style={{ color: '#7C8B84' }}>University of Toronto · 2015 — 2019</div>
                    <div className="mt-4 text-sm" style={{ color: '#EAF2ED', lineHeight: 1.7 }}>
                      Focus on algorithms, distributed systems, and software engineering. Undergraduate thesis on constraint satisfaction in scheduling problems.
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Tools */}
            <ScrollReveal delay={80}>
              <div className="eyebrow mb-6">Tools</div>
              <div className="glass-card-no-hover p-7">
                <p className="text-sm mb-5" style={{ color: '#7C8B84', lineHeight: 1.7 }}>
                  What's actually open on my machine on a typical day.
                </p>
                <div className="flex flex-wrap gap-2">
                  {tools.map(t => (
                    <span key={t} className="tag-chip">{t}</span>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>

      {/* Personal note */}
      <div className="px-6 lg:px-10 pb-8">
        <div className="max-w-[1440px] mx-auto">
          <div
            className="rounded-2xl p-10 relative overflow-hidden"
            style={{ background: 'rgba(15,191,122,0.04)', border: '1px solid rgba(15,191,122,0.1)' }}
          >
            <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(15,191,122,0.3), transparent)' }} />
            <div className="text-2xl mb-4" style={{ color: 'rgba(15,191,122,0.3)', fontFamily: 'Georgia, serif' }}>"</div>
            <p className="text-xl font-display font-medium max-w-[640px]" style={{ lineHeight: 1.55, letterSpacing: '-0.01em' }}>
              I care more about whether a system works reliably in production than whether it looks impressive in a demo. Good engineering is mostly boring — and that's a feature.
            </p>
            <div className="mt-6 text-sm font-mono" style={{ color: '#7C8B84' }}>— Wasik</div>
          </div>
        </div>
      </div>
    </div>
  );
}
