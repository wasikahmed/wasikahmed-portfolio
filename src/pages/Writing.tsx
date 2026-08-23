import { Link } from 'react-router';
import { useState } from 'react';
import { posts } from '../data';

export default function Writing() {
  const [filter, setFilter] = useState<'all' | 'article' | 'til'>('all');

  const filtered = filter === 'all' ? posts : posts.filter(p => p.type === filter);
  const articles = filtered.filter(p => p.type === 'article');
  const tils = filtered.filter(p => p.type === 'til');

  return (
    <div className="min-h-screen pt-32 pb-28 px-6 lg:px-10">
      <div className="max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="mb-16">
          <div className="eyebrow mb-4">Writing</div>
          <h1
            className="font-display font-bold mb-6"
            style={{ fontSize: 'clamp(40px, 5vw, 72px)', letterSpacing: '-0.03em', maxWidth: '700px' }}
          >
            Notes from the work.
          </h1>
          <p className="text-lg max-w-[500px]" style={{ color: '#7C8B84', lineHeight: 1.7 }}>
            Longer essays on architecture and engineering process, and short TIL notes when I find something worth writing down.
          </p>
        </div>

        {/* Filter */}
        <div className="flex gap-3 mb-12">
          {(['all', 'article', 'til'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-full text-sm font-mono capitalize transition-all duration-200"
              style={{
                background: filter === f ? 'rgba(15,191,122,0.12)' : 'rgba(17,25,22,0.6)',
                border: `1px solid ${filter === f ? 'rgba(15,191,122,0.4)' : 'rgba(15,191,122,0.1)'}`,
                color: filter === f ? '#0FBF7A' : '#7C8B84',
              }}
            >
              {f === 'til' ? 'TIL Notes' : f === 'all' ? 'All' : 'Articles'}
            </button>
          ))}
        </div>

        {/* Articles */}
        {articles.length > 0 && (
          <div className="mb-16">
            {filter === 'all' && <div className="eyebrow mb-6 opacity-70">Articles</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {articles.map(post => (
                <Link
                  key={post.slug}
                  to={`/writing/${post.slug}`}
                  className="glass-card block p-7 group"
                >
                  <div className="flex flex-wrap gap-2 mb-5">
                    {post.tags.map(t => <span key={t} className="tag-chip">{t}</span>)}
                  </div>
                  <h2
                    className="font-display font-semibold text-lg mb-3 group-hover:text-emerald transition-colors"
                    style={{ lineHeight: 1.35, letterSpacing: '-0.01em' }}
                  >
                    {post.title}
                  </h2>
                  <p className="text-sm mb-6" style={{ color: '#7C8B84', lineHeight: 1.7 }}>{post.excerpt}</p>
                  <div
                    className="flex items-center justify-between pt-4"
                    style={{ borderTop: '1px solid rgba(15,191,122,0.08)' }}
                  >
                    <span className="text-xs font-mono" style={{ color: '#7C8B84' }}>{post.date}</span>
                    <span className="text-xs font-mono" style={{ color: '#7C8B84' }}>{post.readTime}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* TIL Notes */}
        {tils.length > 0 && (
          <div>
            {filter === 'all' && <div className="eyebrow mb-6 opacity-70">TIL Notes</div>}
            <div className="flex flex-col gap-3">
              {tils.map(post => (
                <Link
                  key={post.slug}
                  to={`/writing/${post.slug}`}
                  className="group flex items-start gap-6 p-5 rounded-xl transition-all duration-200"
                  style={{
                    background: 'rgba(17,25,22,0.5)',
                    border: '1px solid rgba(15,191,122,0.08)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(15,191,122,0.22)'; e.currentTarget.style.background = 'rgba(17,25,22,0.8)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(15,191,122,0.08)'; e.currentTarget.style.background = 'rgba(17,25,22,0.5)'; }}
                >
                  <div className="flex-shrink-0 font-mono text-xs pt-1 w-24 text-right" style={{ color: '#7C8B84' }}>
                    {post.date}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-xs font-mono px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(245,165,36,0.08)', border: '1px solid rgba(245,165,36,0.2)', color: '#F5A524' }}
                      >
                        TIL
                      </span>
                      <h3 className="font-display font-semibold text-base group-hover:text-emerald transition-colors" style={{ letterSpacing: '-0.01em' }}>
                        {post.title}
                      </h3>
                    </div>
                    <p className="text-sm" style={{ color: '#7C8B84', lineHeight: 1.6 }}>{post.excerpt}</p>
                  </div>
                  <div className="flex-shrink-0 font-mono text-xs self-center" style={{ color: '#7C8B84' }}>
                    {post.readTime}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
