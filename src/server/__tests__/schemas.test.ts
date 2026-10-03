import { describe, expect, it } from 'vitest';
import {
  metricSchema,
  linkSchema,
  seoSchema,
  projectSchema,
  postSchema,
  testimonialSchema,
  roleSchema,
  techItemSchema,
  skillGroupSchema,
  settingsSchema,
  leadSchema,
  leadUpdateSchema,
  mediaSchema,
} from '../schemas';

/**
 * PLAN.md W6 item 4 — that each schema rejects the shapes it's supposed to,
 * not just accepts the shapes it's supposed to. This is the write-side half
 * of AGENTS.md §4 rule 5 ("Every admin mutation gets... Zod safeParse") —
 * a schema that silently accepts garbage defeats that gate even if the
 * route calls it correctly.
 */

const validMetric = { value: '92%', label: 'faster processing' };
const validLink = { label: 'GitHub', href: 'https://github.com/wasik' };

const validProject = {
  slug: 'docflow-ai',
  title: 'DocFlow AI',
  tagline: 'Contract intake that runs itself.',
  categories: ['AI'],
  problem: 'Manual review was the bottleneck.',
  headline: validMetric,
  metrics: [validMetric],
  stack: ['Next.js'],
  role: 'Lead engineer',
  timeline: '3 months',
  year: 2024,
  accent: '#0fbf7a',
  architecture: [{ id: 'a', label: 'Intake', detail: 'Receives documents' }],
  sections: [{ id: 's', title: 'Overview', bodyMdx: '# hi' }],
};

const validPost = {
  slug: 'shipping-fast',
  kind: 'article',
  title: 'Shipping fast',
  excerpt: 'Some thoughts.',
  date: '2024-01-01',
  readTime: '4 min',
  tags: ['ai'],
  bodyMdx: '# hi',
};

describe('metricSchema', () => {
  it('accepts a valid metric', () => {
    expect(metricSchema.safeParse(validMetric).success).toBe(true);
  });

  it('rejects an empty value', () => {
    expect(metricSchema.safeParse({ ...validMetric, value: '' }).success).toBe(false);
  });

  it('rejects a missing label', () => {
    const withoutLabel: Partial<typeof validMetric> = { ...validMetric };
    delete withoutLabel.label;
    expect(metricSchema.safeParse(withoutLabel).success).toBe(false);
  });
});

describe('linkSchema', () => {
  it('accepts a valid link', () => {
    expect(linkSchema.safeParse(validLink).success).toBe(true);
  });

  it('rejects a non-URL href', () => {
    expect(linkSchema.safeParse({ ...validLink, href: 'not a url' }).success).toBe(false);
  });
});

describe('seoSchema', () => {
  it('accepts an empty object — every field optional', () => {
    expect(seoSchema.safeParse({}).success).toBe(true);
  });

  it('rejects a title over 70 characters', () => {
    expect(seoSchema.safeParse({ title: 'x'.repeat(71) }).success).toBe(false);
  });

  it('rejects a description over 200 characters', () => {
    expect(seoSchema.safeParse({ description: 'x'.repeat(201) }).success).toBe(false);
  });
});

describe('projectSchema', () => {
  it('accepts a valid project', () => {
    const result = projectSchema.safeParse(validProject);
    expect(result.success).toBe(true);
  });

  it('defaults status to draft and order to 0', () => {
    const result = projectSchema.safeParse(validProject);
    expect(result.success && result.data.status).toBe('draft');
    expect(result.success && result.data.order).toBe(0);
  });

  it('rejects an uppercase slug', () => {
    expect(projectSchema.safeParse({ ...validProject, slug: 'DocFlow-AI' }).success).toBe(false);
  });

  it('rejects a slug with spaces', () => {
    expect(projectSchema.safeParse({ ...validProject, slug: 'doc flow' }).success).toBe(false);
  });

  it('rejects an unknown category', () => {
    expect(projectSchema.safeParse({ ...validProject, categories: ['Blockchain'] }).success).toBe(
      false,
    );
  });

  it('rejects an empty categories array', () => {
    expect(projectSchema.safeParse({ ...validProject, categories: [] }).success).toBe(false);
  });

  it('rejects a year outside 2000-2100', () => {
    expect(projectSchema.safeParse({ ...validProject, year: 1999 }).success).toBe(false);
  });

  it('rejects an empty sections array', () => {
    expect(projectSchema.safeParse({ ...validProject, sections: [] }).success).toBe(false);
  });

  it('rejects an invalid publishedAt', () => {
    expect(projectSchema.safeParse({ ...validProject, publishedAt: 'not-a-date' }).success).toBe(
      false,
    );
  });
});

describe('postSchema', () => {
  it('accepts a valid post', () => {
    expect(postSchema.safeParse(validPost).success).toBe(true);
  });

  it('rejects an unknown kind', () => {
    expect(postSchema.safeParse({ ...validPost, kind: 'video' }).success).toBe(false);
  });

  it('rejects a malformed date', () => {
    expect(postSchema.safeParse({ ...validPost, date: '01/01/2024' }).success).toBe(false);
  });

  it('rejects an empty bodyMdx', () => {
    expect(postSchema.safeParse({ ...validPost, bodyMdx: '' }).success).toBe(false);
  });
});

describe('testimonialSchema', () => {
  const valid = {
    quote: 'Great work.',
    name: 'Jane Doe',
    title: 'CTO',
    company: 'Acme',
    initials: 'JD',
  };

  it('accepts a valid testimonial and defaults featured to true', () => {
    const result = testimonialSchema.safeParse(valid);
    expect(result.success && result.data.featured).toBe(true);
  });

  it('rejects initials over 4 characters', () => {
    expect(testimonialSchema.safeParse({ ...valid, initials: 'TOOLONG' }).success).toBe(false);
  });
});

describe('roleSchema', () => {
  const valid = {
    title: 'Senior Engineer',
    company: 'Acme',
    period: '2022–Present',
    type: 'Full-time',
    shipped: ['A pipeline'],
  };

  it('accepts a valid role', () => {
    expect(roleSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects an empty shipped array', () => {
    expect(roleSchema.safeParse({ ...valid, shipped: [] }).success).toBe(false);
  });
});

describe('techItemSchema', () => {
  it('accepts a valid tech item', () => {
    expect(
      techItemSchema.safeParse({ name: 'Next.js', group: 'Framework', projects: [] }).success,
    ).toBe(true);
  });

  it('rejects an unknown group', () => {
    expect(
      techItemSchema.safeParse({ name: 'Next.js', group: 'Database', projects: [] }).success,
    ).toBe(false);
  });
});

describe('skillGroupSchema', () => {
  it('accepts a valid skill group', () => {
    expect(skillGroupSchema.safeParse({ category: 'AI', items: ['LLMs'] }).success).toBe(true);
  });

  it('rejects an empty items array', () => {
    expect(skillGroupSchema.safeParse({ category: 'AI', items: [] }).success).toBe(false);
  });
});

describe('settingsSchema', () => {
  const valid = {
    name: 'Wasik Ahmed',
    initials: 'WA',
    role: 'Software Engineer',
    discipline: 'AI & Automation',
    tagline: 'I build systems that do the work for you.',
    proof: 'Shipped four production systems.',
    email: 'hello@example.com',
    location: 'Remote',
    timezone: 'UTC',
    available: true,
    availableFor: 'Contract work',
    responseTime: '24 hours',
    socials: [validLink],
  };

  it('accepts valid settings', () => {
    expect(settingsSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects an invalid email', () => {
    expect(settingsSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false);
  });
  it('accepts a WhatsApp number as typed, or empty to clear it', () => {
    expect(settingsSchema.safeParse({ ...valid, whatsapp: '+44 7700 900123' }).success).toBe(true);
    expect(settingsSchema.safeParse({ ...valid, whatsapp: '(880) 1712-345678' }).success).toBe(
      true,
    );
    expect(settingsSchema.safeParse({ ...valid, whatsapp: '' }).success).toBe(true);
  });

  it('rejects a WhatsApp value that is not a full international number', () => {
    // Too short to carry a country code, letters, and a wa.me URL pasted whole.
    for (const whatsapp of ['12345', '+44 7700 CALLME', 'https://wa.me/447700900123']) {
      expect(settingsSchema.safeParse({ ...valid, whatsapp }).success).toBe(false);
    }
  });
});

describe('leadSchema — the public /api/contact boundary', () => {
  const valid = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    message: 'I need a system built.',
  };

  it('accepts a minimal valid submission', () => {
    expect(leadSchema.safeParse(valid).success).toBe(true);
  });

  // A page loaded before the select was removed still sends `intent` —
  // stripped, never stored and never a rejection.
  it('strips a stale intent field rather than rejecting it', () => {
    const result = leadSchema.safeParse({ ...valid, intent: 'role' });
    expect(result.success).toBe(true);
    expect(result.data).not.toHaveProperty('intent');
  });

  it('rejects an invalid email', () => {
    expect(leadSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false);
  });

  it('rejects a message over 5000 characters', () => {
    expect(leadSchema.safeParse({ ...valid, message: 'x'.repeat(5001) }).success).toBe(false);
  });

  it('rejects an empty message', () => {
    expect(leadSchema.safeParse({ ...valid, message: '' }).success).toBe(false);
  });
});

describe('leadUpdateSchema', () => {
  it('accepts an empty object — every field optional', () => {
    expect(leadUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('rejects an unknown status', () => {
    expect(leadUpdateSchema.safeParse({ status: 'closed' }).success).toBe(false);
  });
});

describe('mediaSchema', () => {
  it('accepts valid alt text', () => {
    expect(mediaSchema.safeParse({ alt: 'A screenshot of the dashboard' }).success).toBe(true);
  });

  it('rejects empty alt text', () => {
    expect(mediaSchema.safeParse({ alt: '' }).success).toBe(false);
  });
});
