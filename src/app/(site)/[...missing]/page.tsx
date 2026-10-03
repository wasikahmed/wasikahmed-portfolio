import { notFound } from 'next/navigation';

/*
 * Catches every public URL nothing else matches, so it 404s through
 * (site)/not-found.tsx — inside the site layout, with navigation and
 * analytics — rather than Next's bare root-level default. Every real route
 * is a static segment and outranks this; only genuinely unknown paths land
 * here.
 */
export default function Missing() {
  notFound();
}
