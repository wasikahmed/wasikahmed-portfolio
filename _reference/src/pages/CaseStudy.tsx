import { useParams, Link } from 'react-router';
import { useEffect, useState } from 'react';
import { projects } from '../data';

function StickyTOC({ sections }: { sections: string[] }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      sections.forEach((_, i) => {
        const el = document.getElementById(`section-${i}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top < 200) setActive(i);
        }
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  return (
    <div className="hidden xl:block sticky top-24 self-start">
      <div className="eyebrow mb-5 opacity-60">Contents</div>
      <div className="flex flex-col gap-1">
        {sections.map((s, i) => (
          <a
            key={s}
            href={`#section-${i}`}
            className="text-sm py-1.5 px-3 rounded transition-all duration-200 font-mono text-xs"
            style={{
              color: active === i ? '#0FBF7A' : '#7C8B84',
              background: active === i ? 'rgba(15,191,122,0.07)' : 'transparent',
              borderLeft: `2px solid ${active === i ? '#0FBF7A' : 'transparent'}`,
            }}
          >
            {s}
          </a>
        ))}
      </div>
    </div>
  );
}

export default function CaseStudy() {
  const { slug } = useParams<{ slug: string }>();
  const project = projects.find(p => p.slug === slug) ?? projects[0];
  const nextProject = projects[(projects.indexOf(project) + 1) % projects.length];

  const sections = ['The Problem', 'Constraints', 'Approach', 'Build Details', 'Challenges', 'Results', "What's Next"];

  const constraints = [
    'No disruption to existing workflows',
    'Must integrate with legacy DMS system',
    '< 2s response time per document',
    'On-premises data requirement (no cloud storage)',
    'Budget under $8k/month infrastructure',
  ];

  const challenges = [
    {
      problem: 'OCR quality was inconsistent across scanned documents',
      solution: 'Added a pre-processing pipeline with adaptive thresholding and deskewing before LLM extraction, which dropped error rate from 18% to 1.4%.',
    },
    {
      problem: 'LLM hallucinated clause data on long contracts (100+ pages)',
      solution: 'Switched from single-pass extraction to chunk-and-verify: extract per-section, then reconcile with a separate validation pass. Slower but accurate.',
    },
    {
      problem: 'Users didn\'t trust the automated output',
      solution: 'Built a confidence-score overlay showing exactly which fields were extracted vs. inferred. High-confidence fields auto-fill; low-confidence ones prompt review.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div
        className="relative pt-32 pb-20 px-6 lg:px-10 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, rgba(11,92,78,0.15) 0%, transparent 100%)' }}
      >
        <div className="absolute inset-0 grid-texture opacity-30 pointer-events-none" />
        <div className="relative max-w-[1440px] mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Link to="/work" className="text-xs font-mono transition-colors hover:text-emerald" style={{ color: '#7C8B84' }}>
              ← Work
            </Link>
            <span style={{ color: '#7C8B84' }}>/</span>
            <span className="text-xs font-mono" style={{ color: '#0FBF7A' }}>{project.title}</span>
          </div>

          <h1
            className="font-display font-bold mb-8"
            style={{ fontSize: 'clamp(40px, 5vw, 72px)', letterSpacing: '-0.03em', maxWidth: '800px' }}
          >
            {project.title}
          </h1>

          <div className="flex flex-wrap gap-6 mb-12">
            {[
              { label: 'Role', value: project.role },
              { label: 'Timeline', value: project.timeline },
              { label: 'Outcome', value: project.outcome },
            ].map(m => (
              <div key={m.label}>
                <div className="eyebrow mb-1 opacity-60">{m.label}</div>
                <div className="text-sm font-medium">{m.value}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {project.stack.map(s => <span key={s} className="tag-chip">{s}</span>)}
          </div>
        </div>
      </div>

      {/* Hero image */}
      <div className="px-6 lg:px-10 mb-20">
        <div className="max-w-[1440px] mx-auto">
          <div className="rounded-2xl overflow-hidden" style={{ height: 'clamp(300px, 45vw, 560px)', border: '1px solid rgba(15,191,122,0.12)' }}>
            <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 lg:px-10 pb-28">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex gap-12 xl:gap-20">
            {/* TOC */}
            <div className="w-44 flex-shrink-0">
              <StickyTOC sections={sections} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 max-w-[720px]">

              {/* Problem */}
              <section id="section-0" className="mb-16">
                <h2 className="font-display font-bold text-2xl mb-6" style={{ letterSpacing: '-0.02em' }}>The Problem</h2>
                <p className="text-base mb-6" style={{ color: '#EAF2ED', lineHeight: 1.85 }}>
                  {project.problem}
                </p>
                <blockquote
                  className="pl-5 py-1"
                  style={{ borderLeft: '3px solid #0FBF7A' }}
                >
                  <p className="text-lg italic" style={{ color: '#EAF2ED', lineHeight: 1.7 }}>
                    "We're paying lawyers to do data entry. That can't be right."
                  </p>
                  <cite className="text-xs font-mono mt-3 block" style={{ color: '#7C8B84', fontStyle: 'normal' }}>
                    — Client, initial discovery call
                  </cite>
                </blockquote>
              </section>

              {/* Constraints */}
              <section id="section-1" className="mb-16">
                <h2 className="font-display font-bold text-2xl mb-6" style={{ letterSpacing: '-0.02em' }}>Constraints</h2>
                <div className="flex flex-wrap gap-2">
                  {constraints.map(c => (
                    <span
                      key={c}
                      className="px-4 py-2 rounded-full text-sm"
                      style={{ background: 'rgba(17,25,22,0.8)', border: '1px solid rgba(15,191,122,0.12)', color: '#EAF2ED' }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </section>

              {/* Approach */}
              <section id="section-2" className="mb-16">
                <h2 className="font-display font-bold text-2xl mb-6" style={{ letterSpacing: '-0.02em' }}>The Approach</h2>
                <p className="text-base mb-6" style={{ color: '#EAF2ED', lineHeight: 1.85 }}>
                  The core idea was straightforward: instead of teaching a model to understand legal documents from scratch, we decompose each document into its natural sections, extract structured data from each section independently, then reconcile and validate the results.
                </p>
                <p className="text-base mb-8" style={{ color: '#EAF2ED', lineHeight: 1.85 }}>
                  This chunked approach is more robust to document length and format variation. It also lets us assign confidence scores per-field, which turned out to be critical for user adoption.
                </p>

                {/* Architecture diagram (emerald line style) */}
                <div
                  className="rounded-xl p-6 lg:p-8"
                  style={{ background: 'rgba(10,14,12,0.9)', border: '1px solid rgba(15,191,122,0.15)' }}
                >
                  <div className="eyebrow mb-6 opacity-70">System Architecture</div>
                  <div className="flex flex-col gap-0">
                    {[
                      { icon: '📄', label: 'Document Intake', desc: 'PDF/TIFF/DOCX → pre-processing queue' },
                      { icon: '⚙️', label: 'Pre-processing', desc: 'OCR, deskew, text normalization' },
                      { icon: '✂️', label: 'Chunking', desc: 'Section-aware document splitting' },
                      { icon: '🤖', label: 'LLM Extraction', desc: 'Parallel GPT-4o extraction per chunk' },
                      { icon: '✅', label: 'Validation', desc: 'Cross-chunk reconciliation + confidence scoring' },
                      { icon: '🗄️', label: 'DMS Integration', desc: 'Structured data → existing document management system' },
                    ].map((step, i, arr) => (
                      <div key={step.label} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                            style={{ background: 'rgba(15,191,122,0.1)', border: '1px solid rgba(15,191,122,0.2)' }}
                          >
                            {step.icon}
                          </div>
                          {i < arr.length - 1 && (
                            <div className="w-px flex-1 my-1" style={{ background: 'rgba(15,191,122,0.2)', minHeight: '20px' }} />
                          )}
                        </div>
                        <div className="pb-4">
                          <div className="font-mono text-xs font-semibold" style={{ color: '#0FBF7A' }}>{step.label}</div>
                          <div className="text-sm mt-0.5" style={{ color: '#7C8B84' }}>{step.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Build Details */}
              <section id="section-3" className="mb-16">
                <h2 className="font-display font-bold text-2xl mb-6" style={{ letterSpacing: '-0.02em' }}>Build Details</h2>
                <p className="text-base mb-8" style={{ color: '#EAF2ED', lineHeight: 1.85 }}>
                  The extraction prompt was the hardest part to get right. Generic prompts hallucinated; over-specified prompts broke on format variants. The winning approach: schema-first prompting with strict JSON mode, plus a few-shot example in each request.
                </p>

                <div className="code-block mb-6">
                  <div className="text-xs mb-4 pb-3 flex items-center justify-between" style={{ color: '#7C8B84', borderBottom: '1px solid rgba(15,191,122,0.1)' }}>
                    <span>extraction_prompt.py</span>
                    <span className="font-mono text-[10px] text-emerald opacity-70">Python 3.11</span>
                  </div>
                  <pre className="font-mono text-xs leading-relaxed" style={{ color: '#EAF2ED' }}>
                    <span className="code-kw">def</span> <span className="code-fn">build_extraction_prompt</span>(section: <span className="code-kw">str</span>, schema: <span className="code-kw">dict</span>) -&gt; <span className="code-kw">str</span>:<br />
                    {'    '}<span className="code-kw">return</span> <span className="code-str">f"""</span><br />
                    <span className="code-str">    Extract the following fields from this contract section.</span><br />
                    <span className="code-str">    Respond ONLY with valid JSON matching the schema.</span><br />
                    <span className="code-str">    If a field is absent, return null — do not infer.</span><br /><br />
                    <span className="code-str">    Schema: &#123;json.dumps(schema, indent=2)&#125;</span><br /><br />
                    <span className="code-str">    Section:</span><br />
                    <span className="code-str">    &#123;section&#125;</span><br /><br />
                    <span className="code-str">    Examples:</span><br />
                    <span className="code-str">    &#123;load_few_shot_examples(schema['type'])&#125;</span><br />
                    <span className="code-str">    """</span>
                  </pre>
                </div>

                <p className="text-base mb-4" style={{ color: '#EAF2ED', lineHeight: 1.85 }}>
                  Celery workers handle parallel extraction, with Redis as the broker. Each document fans out to N workers (one per section), and a final reconciliation step merges the results.
                </p>
              </section>

              {/* Challenges */}
              <section id="section-4" className="mb-16">
                <h2 className="font-display font-bold text-2xl mb-6" style={{ letterSpacing: '-0.02em' }}>Challenges & What Broke</h2>
                <div className="flex flex-col gap-5">
                  {challenges.map((c, i) => (
                    <div
                      key={i}
                      className="rounded-xl p-6"
                      style={{ background: 'rgba(17,25,22,0.6)', border: '1px solid rgba(15,191,122,0.1)' }}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-xs font-mono px-2 py-0.5 rounded mt-0.5" style={{ background: 'rgba(245,165,36,0.08)', border: '1px solid rgba(245,165,36,0.2)', color: '#F5A524', whiteSpace: 'nowrap' }}>
                          Problem
                        </span>
                        <p className="text-sm font-medium" style={{ lineHeight: 1.6 }}>{c.problem}</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-mono px-2 py-0.5 rounded mt-0.5" style={{ background: 'rgba(15,191,122,0.07)', border: '1px solid rgba(15,191,122,0.18)', color: '#0FBF7A', whiteSpace: 'nowrap' }}>
                          Fix
                        </span>
                        <p className="text-sm" style={{ color: '#7C8B84', lineHeight: 1.7 }}>{c.solution}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Results */}
              <section id="section-5" className="mb-16">
                <h2 className="font-display font-bold text-2xl mb-8" style={{ letterSpacing: '-0.02em' }}>Results</h2>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {[
                    { metric: '92%', label: 'Processing time reduction', before: '3.2h avg', after: '15 min' },
                    { metric: '98.6%', label: 'Extraction accuracy', before: '~82% manual', after: '98.6% automated' },
                    { metric: '12k+', label: 'Contracts processed monthly', before: '~800/month', after: '12,400/month' },
                    { metric: '$0', label: 'Critical errors post-launch', before: 'Frequent', after: 'Zero in 6 months' },
                  ].map((r) => (
                    <div
                      key={r.label}
                      className="rounded-xl p-5"
                      style={{ background: 'rgba(15,191,122,0.05)', border: '1px solid rgba(15,191,122,0.15)' }}
                    >
                      <div className="gradient-text font-display font-bold text-3xl mb-1">{r.metric}</div>
                      <div className="text-xs font-mono mb-3" style={{ color: '#7C8B84' }}>{r.label}</div>
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span style={{ color: '#7C8B84' }}>{r.before}</span>
                        <span style={{ color: 'rgba(15,191,122,0.4)' }}>→</span>
                        <span style={{ color: '#0FBF7A' }}>{r.after}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* What's Next */}
              <section id="section-6" className="mb-16">
                <h2 className="font-display font-bold text-2xl mb-6" style={{ letterSpacing: '-0.02em' }}>What I'd Do Next</h2>
                <p className="text-base" style={{ color: '#EAF2ED', lineHeight: 1.85 }}>
                  The current system is extraction-focused. The obvious next step is analysis: once you have structured data from thousands of contracts, you can start answering questions like "which clients have the most favourable IP clauses?" or flag anomalies automatically. That's a different product — but the data is all there.
                </p>
              </section>

              {/* Next project */}
              <div
                className="rounded-2xl p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
                style={{ background: 'rgba(17,25,22,0.6)', border: '1px solid rgba(15,191,122,0.1)' }}
              >
                <div>
                  <div className="eyebrow mb-2 opacity-60">Next project</div>
                  <div className="font-display font-bold text-xl">{nextProject.title}</div>
                  <div className="text-sm mt-1" style={{ color: '#7C8B84' }}>{nextProject.outcome}</div>
                </div>
                <Link to={`/work/${nextProject.slug}`} className="btn-ghost flex-shrink-0">
                  View →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
