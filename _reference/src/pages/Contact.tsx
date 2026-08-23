import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';

type FormState = {
  name: string;
  email: string;
  type: string;
  budget: string;
  message: string;
};

export default function Contact() {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') === 'hire' ? 'hire' : searchParams.get('type') === 'project' ? 'project' : '';

  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    type: initialType,
    budget: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const queryType = searchParams.get('type');
    if (queryType === 'hire' || queryType === 'project') {
      setForm(prev => ({ ...prev, type: queryType }));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen pt-32 pb-28 px-6 lg:px-10 relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 right-0 w-[50%] h-[70%] pointer-events-none" style={{
        background: 'radial-gradient(ellipse at top right, rgba(11,92,78,0.12) 0%, transparent 70%)',
        filter: 'blur(80px)',
      }} />
      <div className="absolute inset-0 grid-texture opacity-25 pointer-events-none" />

      <div className="relative max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="mb-16">
          <div className="eyebrow mb-4">Contact</div>
          <h1
            className="font-display font-bold mb-4"
            style={{ fontSize: 'clamp(40px, 5vw, 72px)', letterSpacing: '-0.03em' }}
          >
            Let's talk.
          </h1>
          <p className="text-lg" style={{ color: '#7C8B84', lineHeight: 1.7, maxWidth: '480px' }}>
            Whether you're hiring an engineer or need something built — the first step is the same.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-20 items-start">
          {/* Form */}
          <div className="lg:col-span-3">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="eyebrow block mb-2 opacity-70">Name</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Wasik Ahmed"
                      className="form-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="eyebrow block mb-2 opacity-70">Email</label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="hello@example.com"
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="eyebrow block mb-2 opacity-70">What are you looking for?</label>
                  <select name="type" value={form.type} onChange={handleChange} className="form-input" required>
                    <option value="" disabled>Select one…</option>
                    <option value="hire">Hire for a full-time role</option>
                    <option value="project">Build a specific project or system</option>
                    <option value="consult">Technical consultation</option>
                    <option value="other">Something else</option>
                  </select>
                </div>

                <div>
                  <label className="eyebrow block mb-2 opacity-70">Budget range (if applicable)</label>
                  <select name="budget" value={form.budget} onChange={handleChange} className="form-input">
                    <option value="">Not applicable / Prefer to discuss</option>
                    <option value="under5k">Under $5k</option>
                    <option value="5k-20k">$5k – $20k</option>
                    <option value="20k-50k">$20k – $50k</option>
                    <option value="50k+">$50k+</option>
                  </select>
                </div>

                <div>
                  <label className="eyebrow block mb-2 opacity-70">What's the problem?</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Describe the problem you're trying to solve. The more specific, the better — 'we need AI' is less useful than 'we spend 4 hours a day extracting data from invoices.'"
                    className="form-input resize-none"
                    rows={6}
                    required
                  />
                </div>

                <button type="submit" className="btn-primary self-start">
                  Send message
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2">
                    <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </form>
            ) : (
              <div
                className="rounded-2xl p-10 text-center"
                style={{ background: 'rgba(15,191,122,0.05)', border: '1px solid rgba(15,191,122,0.2)' }}
              >
                <div className="text-4xl mb-4">✓</div>
                <h2 className="font-display font-bold text-2xl mb-3" style={{ letterSpacing: '-0.02em' }}>Got it.</h2>
                <p style={{ color: '#7C8B84', lineHeight: 1.7 }}>
                  I'll get back to you within 24 hours. If it's urgent, email me directly at{' '}
                  <a href="mailto:wasik@example.com" className="text-emerald hover:underline">wasik@example.com</a>.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Direct contact */}
            <div className="glass-card-no-hover p-6">
              <div className="eyebrow mb-5 opacity-70">Direct</div>
              <div className="flex flex-col gap-4">
                <a
                  href="mailto:wasik@example.com"
                  className="flex items-center gap-3 group transition-colors"
                  style={{ color: '#EAF2ED' }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(15,191,122,0.08)', border: '1px solid rgba(15,191,122,0.15)' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#0FBF7A" strokeWidth="1.5">
                      <rect x="1" y="3" width="14" height="10" rx="2" />
                      <path d="M1 5l7 5 7-5" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium group-hover:text-emerald transition-colors">wasik@example.com</div>
                    <div className="text-xs font-mono" style={{ color: '#7C8B84' }}>Preferred for project inquiries</div>
                  </div>
                </a>

                <a
                  href="#"
                  className="flex items-center gap-3 group transition-colors"
                  style={{ color: '#EAF2ED' }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(15,191,122,0.08)', border: '1px solid rgba(15,191,122,0.15)' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#0FBF7A" strokeWidth="1.5">
                      <rect x="1" y="1" width="14" height="14" rx="3" />
                      <path d="M5 8a3 3 0 1 0 6 0 3 3 0 0 0-6 0M11 5V5.01" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium group-hover:text-emerald transition-colors">LinkedIn</div>
                    <div className="text-xs font-mono" style={{ color: '#7C8B84' }}>For professional inquiries</div>
                  </div>
                </a>
              </div>
            </div>

            {/* Calendar booking */}
            <div className="glass-card-no-hover p-6">
              <div className="eyebrow mb-4 opacity-70">Book a call</div>
              <p className="text-sm mb-5" style={{ color: '#7C8B84', lineHeight: 1.7 }}>
                30-minute discovery call, no commitment. We figure out if there's a fit — or I point you somewhere better.
              </p>
              <a
                href="#"
                className="btn-ghost w-full justify-center"
                style={{ textAlign: 'center' }}
              >
                Book 30 min →
              </a>
            </div>

            {/* Response time */}
            <div
              className="p-5 rounded-xl flex items-start gap-4"
              style={{ background: 'rgba(15,191,122,0.04)', border: '1px solid rgba(15,191,122,0.1)' }}
            >
              <div className="w-2 h-2 rounded-full bg-emerald pulse-dot mt-1 flex-shrink-0" />
              <div>
                <div className="text-sm font-semibold mb-1">Usually responds in under 24 hours</div>
                <div className="text-xs font-mono" style={{ color: '#7C8B84' }}>Mon – Fri, 9am – 6pm EST</div>
              </div>
            </div>

            {/* Not sure what to say? */}
            <div
              className="p-5 rounded-xl"
              style={{ background: 'rgba(17,25,22,0.6)', border: '1px solid rgba(15,191,122,0.08)' }}
            >
              <div className="eyebrow mb-3 opacity-60">Not sure what to say?</div>
              <p className="text-sm" style={{ color: '#7C8B84', lineHeight: 1.7 }}>
                Start with the problem, not the solution. "We spend X hours doing Y manually" tells me everything I need.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
