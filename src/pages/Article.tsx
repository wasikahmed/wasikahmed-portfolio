import { useParams, Link } from 'react-router';
import { useEffect, useState } from 'react';
import { posts } from '../data';

export default function Article() {
  const { slug } = useParams<{ slug: string }>();
  const post = posts.find(p => p.slug === slug) ?? posts[0];
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const el = document.getElementById('article-body');
    if (!el) return;
    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight;
      const read = Math.max(0, -rect.top);
      setScrollProgress(Math.min((read / total) * 100, 100));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const nextPost = posts[(posts.indexOf(post) + 1) % posts.length];

  return (
    <div className="min-h-screen">
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 h-[2px] z-50" style={{ background: 'rgba(15,191,122,0.1)' }}>
        <div
          className="h-full"
          style={{
            width: `${scrollProgress}%`,
            background: 'linear-gradient(90deg, #0FBF7A, #7CE86A)',
            transition: 'width 0.1s linear',
          }}
        />
      </div>

      {/* Article header */}
      <div
        className="pt-32 pb-16 px-6 lg:px-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, rgba(11,92,78,0.12) 0%, transparent 100%)' }}
      >
        <div className="absolute inset-0 grid-texture opacity-25 pointer-events-none" />
        <div className="relative max-w-[720px] mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Link to="/writing" className="text-xs font-mono hover:text-emerald transition-colors" style={{ color: '#7C8B84' }}>
              ← Writing
            </Link>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {post.type === 'til' && (
              <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(245,165,36,0.08)', border: '1px solid rgba(245,165,36,0.2)', color: '#F5A524' }}>
                TIL
              </span>
            )}
            {post.tags.map(t => <span key={t} className="tag-chip">{t}</span>)}
          </div>

          <h1
            className="font-display font-bold mb-6"
            style={{ fontSize: 'clamp(28px, 3.5vw, 48px)', letterSpacing: '-0.02em', lineHeight: 1.15 }}
          >
            {post.title}
          </h1>

          <div className="flex items-center gap-6 text-xs font-mono" style={{ color: '#7C8B84' }}>
            <span>Wasik Ahmed</span>
            <span>·</span>
            <span>{post.date}</span>
            <span>·</span>
            <span>{post.readTime}</span>
          </div>
        </div>
      </div>

      {/* Article body */}
      <div id="article-body" className="px-6 lg:px-10 pb-28">
        <div className="max-w-[720px] mx-auto">
          <div className="prose-content" style={{ color: '#EAF2ED', lineHeight: 1.85, fontSize: '17px' }}>
            <p className="mb-6" style={{ color: '#7C8B84', fontSize: '20px', lineHeight: 1.7, fontStyle: 'italic' }}>
              {post.excerpt}
            </p>

            <p className="mb-6">
              There's a pattern I keep seeing in client projects. Someone's team is doing something time-consuming and error-prone. They've been doing it the same way for years. It's not that they haven't thought about fixing it — it's that the people who could fix it are the same people doing the work, and there's never a good moment to stop.
            </p>

            <h2 className="font-display font-bold text-2xl mt-12 mb-5" style={{ letterSpacing: '-0.02em' }}>
              The actual question
            </h2>

            <p className="mb-6">
              When someone asks me "should we build or buy?", they're usually asking the wrong question. The right question is: "what does this actually cost us right now, and what are we willing to pay to fix it?" The build vs. buy decision follows from that — it doesn't precede it.
            </p>

            {/* Pull quote */}
            <blockquote
              className="my-10 py-1 pl-6"
              style={{ borderLeft: '3px solid #0FBF7A' }}
            >
              <p className="text-xl italic font-display" style={{ color: '#EAF2ED', lineHeight: 1.55 }}>
                "The build vs. buy decision follows from understanding the cost. It doesn't precede it."
              </p>
            </blockquote>

            <p className="mb-6">
              Generic AI tools are good at generic problems. If your problem is generic — writing copy, summarising meetings, translating text — buy a SaaS product and move on. If your problem involves your specific data, your specific workflow, or your specific constraints, the off-the-shelf solution will get you 80% of the way and then stop.
            </p>

            <h2 className="font-display font-bold text-2xl mt-12 mb-5" style={{ letterSpacing: '-0.02em' }}>
              The 80% trap
            </h2>

            <p className="mb-6">
              The 80% trap is real and expensive. A team adopts a tool, routes their workflow through it, and then discovers that the last 20% — the edge cases, the integrations, the format variations — requires either painful workarounds or an entirely different approach. By then, switching costs are high.
            </p>

            <div className="code-block my-8">
              <div className="text-xs mb-4 pb-3 flex items-center justify-between" style={{ color: '#7C8B84', borderBottom: '1px solid rgba(15,191,122,0.1)' }}>
                <span>decision_matrix.py — simplified scoring</span>
                <span className="font-mono text-[10px] text-emerald opacity-70">Python 3.11</span>
              </div>
              <pre className="font-mono text-xs leading-relaxed" style={{ color: '#EAF2ED', overflow: 'auto' }}>
                <span className="code-cmt"># Rough scoring model for build vs. buy</span><br />
                <span className="code-kw">def</span> <span className="code-fn">should_build</span>(problem):<br />
                {'    '}score = <span className="code-num">0</span><br /><br />
                {'    '}<span className="code-kw">if</span> problem.involves_proprietary_data:<br />
                {'        '}score += <span className="code-num">30</span><br />
                {'    '}<span className="code-kw">if</span> problem.requires_custom_integrations:<br />
                {'        '}score += <span className="code-num">25</span><br />
                {'    '}<span className="code-kw">if</span> problem.is_core_to_operations:<br />
                {'        '}score += <span className="code-num">20</span><br />
                {'    '}<span className="code-kw">if</span> problem.volume_is_high:<br />
                {'        '}score += <span className="code-num">15</span><br />
                {'    '}<span className="code-kw">if</span> problem.existing_saas_covers_80pct:<br />
                {'        '}score -= <span className="code-num">20</span><br /><br />
                {'    '}<span className="code-kw">return</span> score &gt; <span className="code-num">40</span>
              </pre>
            </div>

            <p className="mb-6">
              None of this is novel. But I find that writing it out — even in pseudocode — forces the conversation into concrete terms. "Involves proprietary data" stops being a vague concern and becomes something you can actually evaluate.
            </p>

            <h2 className="font-display font-bold text-2xl mt-12 mb-5" style={{ letterSpacing: '-0.02em' }}>
              When custom is obviously right
            </h2>

            <p className="mb-6">
              There are cases where the answer is clear without the scoring model. If your process relies on data that lives behind your firewall, custom AI is almost always the right call. If the process is core to your business model — the thing that makes your service differentiated — handing it off to an off-the-shelf tool is a strategic risk.
            </p>

            <p className="mb-6">
              Conversely, if the problem is generic and the volume is low, the math rarely works in favour of custom development. The build cost doesn't change based on volume; the operational savings do.
            </p>
          </div>

          {/* Tags */}
          <div className="mt-16 pt-8 flex flex-wrap gap-2" style={{ borderTop: '1px solid rgba(15,191,122,0.08)' }}>
            {post.tags.map(t => <span key={t} className="tag-chip">{t}</span>)}
          </div>

          {/* Next post */}
          <div
            className="mt-12 p-6 rounded-xl flex items-center justify-between gap-4"
            style={{ background: 'rgba(17,25,22,0.6)', border: '1px solid rgba(15,191,122,0.1)' }}
          >
            <div>
              <div className="eyebrow mb-1 opacity-60">Up next</div>
              <div className="font-display font-semibold">{nextPost.title}</div>
            </div>
            <Link to={`/writing/${nextPost.slug}`} className="btn-ghost flex-shrink-0" style={{ padding: '10px 20px' }}>
              Read →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
