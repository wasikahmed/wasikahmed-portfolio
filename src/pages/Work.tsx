import { Link } from 'react-router';
import { useState } from 'react';
import { projects } from '../data';

const FILTERS = ['All', 'AI', 'Automation', 'Systems', 'Web'];

export default function Work() {
  const [active, setActive] = useState('All');

  const filtered = active === 'All'
    ? projects
    : projects.filter(p => p.category.includes(active));

  return (
    <div className="min-h-screen pt-32 pb-28 px-6 lg:px-10">
      <div className="max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="mb-16">
          <div className="eyebrow mb-4">Work</div>
          <h1
            className="font-display font-bold mb-6"
            style={{ fontSize: 'clamp(40px, 5vw, 72px)', letterSpacing: '-0.03em' }}
          >
            Projects that shipped.
          </h1>
          <p className="text-lg max-w-[520px]" style={{ color: '#7C8B84', lineHeight: 1.7 }}>
            Every project here is framed around the problem it solved, not the technology it used. The tech is a detail.
          </p>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-3 mb-12">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className="px-4 py-2 rounded-full text-sm font-mono transition-all duration-200"
              style={{
                background: active === f ? 'rgba(15,191,122,0.12)' : 'rgba(17,25,22,0.6)',
                border: `1px solid ${active === f ? 'rgba(15,191,122,0.4)' : 'rgba(15,191,122,0.1)'}`,
                color: active === f ? '#0FBF7A' : '#7C8B84',
                transform: active === f ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Project grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((project) => (
            <Link
              key={project.slug}
              to={`/work/${project.slug}`}
              className="project-card block overflow-hidden rounded-2xl group"
              style={{
                background: 'rgba(17,25,22,0.65)',
                border: '1px solid rgba(15,191,122,0.1)',
                backdropFilter: 'blur(16px)',
              }}
            >
              {/* Image */}
              <div className="overflow-hidden" style={{ height: '220px', background: '#0F1410' }}>
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover project-img"
                />
              </div>

              {/* Content */}
              <div className="p-7">
                <div className="flex items-center gap-2 mb-4">
                  {project.category.map(c => <span key={c} className="tag-chip">{c}</span>)}
                </div>
                <h2 className="font-display font-bold text-xl mb-2" style={{ letterSpacing: '-0.02em' }}>
                  {project.title}
                </h2>
                <p className="text-sm mb-5" style={{ color: '#7C8B84', lineHeight: 1.7 }}>
                  {project.problem}
                </p>

                <div className="flex items-end justify-between">
                  <div>
                    <div className="gradient-text font-display font-bold text-2xl">{project.metric}</div>
                    <div className="text-xs font-mono mt-0.5" style={{ color: '#7C8B84' }}>{project.metricLabel}</div>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#0FBF7A' }}>
                    Case study
                    <svg className="w-4 h-4 project-arrow" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2">
                      <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-24" style={{ color: '#7C8B84' }}>
            <p className="font-mono text-sm">No projects in this category yet.</p>
          </div>
        )}

        {/* Hire CTA */}
        <div
          className="mt-20 p-8 lg:p-12 rounded-2xl text-center"
          style={{ background: 'rgba(15,191,122,0.04)', border: '1px solid rgba(15,191,122,0.1)' }}
        >
          <p className="font-mono text-xs mb-3" style={{ color: '#7C8B84' }}>Have a problem worth solving?</p>
          <h2 className="font-display font-bold text-2xl mb-6" style={{ letterSpacing: '-0.02em' }}>
            Let's make it the next case study.
          </h2>
          <Link to="/contact" className="btn-primary">
            Start a conversation
            <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2">
              <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
