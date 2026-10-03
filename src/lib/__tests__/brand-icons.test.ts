import { describe, expect, it } from 'vitest';
import { socialIcon, techIcon } from '../brand-icons';

describe('techIcon', () => {
  it('matches stack items however they are punctuated or cased', () => {
    expect(techIcon('Next.js')?.title).toBe('Next.js');
    expect(techIcon('tailwind css')?.title).toBe('Tailwind CSS');
    expect(techIcon('PostgreSQL')?.title).toBe('PostgreSQL');
  });

  it('accepts the common short forms', () => {
    expect(techIcon('Postgres')?.title).toBe('PostgreSQL');
    expect(techIcon('Node')?.title).toBe('Node.js');
  });

  // An unknown item must render as a plain tag, never a wrong mark.
  it('returns nothing for items it has no mark for', () => {
    expect(techIcon('LLM APIs')).toBeUndefined();
    expect(techIcon('WebSockets')).toBeUndefined();
  });
});

describe('socialIcon', () => {
  it('goes by where the link points, not its label', () => {
    expect(socialIcon('https://github.com/someone')?.title).toBe('GitHub');
    expect(socialIcon('https://www.linkedin.com/in/someone')?.title).toBe('LinkedIn');
    expect(socialIcon('https://twitter.com/someone')?.title).toBe('X');
  });

  it('covers mail and the site’s own WhatsApp redirect', () => {
    expect(socialIcon('mailto:a@example.com')?.title).toBe('Email');
    expect(socialIcon('/whatsapp')?.title).toBe('WhatsApp');
  });

  it('returns nothing for an unknown host or an unparseable href', () => {
    expect(socialIcon('https://example.com')).toBeUndefined();
    expect(socialIcon('not a url')).toBeUndefined();
    // A lookalike host must not borrow a real brand's mark.
    expect(socialIcon('https://notgithub.com/x')).toBeUndefined();
  });
});
