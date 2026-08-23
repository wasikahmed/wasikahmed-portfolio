'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks which section the reader is currently in.
 *
 * Deliberately scroll-position based rather than IntersectionObserver. An
 * observer with a narrow trigger band reports nothing at all when no
 * heading happens to be inside it — at the very top of a page, or between
 * two widely spaced sections — which leaves the indicator showing whichever
 * section it last saw. That is worse than no indicator, because it is
 * confidently wrong.
 *
 * Measuring against a fixed line always yields an answer.
 */
export function useActiveSection(ids: string[], linePosition = 0.3) {
  const key = ids.join('|');
  const [active, setActive] = useState(ids[0] ?? '');

  useEffect(() => {
    const sectionIds = key ? key.split('|') : [];
    if (sectionIds.length === 0) return;

    const compute = () => {
      const line = window.scrollY + window.innerHeight * linePosition;

      let current = sectionIds[0];
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (top <= line) current = id;
        else break;
      }

      // At the very bottom, the last section is the one being read even if
      // its heading sits above the line.
      const atBottom =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
      if (atBottom) current = sectionIds[sectionIds.length - 1];

      setActive(current);
    };

    // rAF rather than a synchronous call, so this is a subscription
    // callback rather than a render-cascading setState in the effect body.
    const initial = requestAnimationFrame(compute);
    window.addEventListener('scroll', compute, { passive: true });
    window.addEventListener('resize', compute);

    return () => {
      cancelAnimationFrame(initial);
      window.removeEventListener('scroll', compute);
      window.removeEventListener('resize', compute);
    };
  }, [key, linePosition]);

  return active;
}
