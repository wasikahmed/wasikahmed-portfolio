import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import { MotionProvider } from '@/components/motion/motion-provider';
import './globals.css';

/*
 * Self-hosted via next/font — removes the three render-blocking Google
 * Fonts requests the prototype made and eliminates font-swap layout shift.
 */
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  display: 'swap',
});

/*
 * `metadataBase` is what turns the generated `opengraph-image` into an absolute
 * URL — social crawlers reject relative ones. Falls back to localhost so `next
 * build` (which runs with no env in Docker) does not warn on every route.
 */
/*
 * Only the fallback now: every public page gets its description and social
 * card from the CMS via `(site)/layout.tsx` and `pageMetadata`. What is left
 * here is seen by /docs and the admin, so it is kept deliberately generic —
 * a static string that can't go stale the way the old pitch line did.
 */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4000'),
  title: 'Wasik Ahmed',
  description: 'Software engineering portfolio.',
  openGraph: {
    type: 'website',
    siteName: 'Wasik Ahmed',
    title: 'Wasik Ahmed',
    description: 'Software engineering portfolio.',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /*
     * `data-scroll-behavior="smooth"` tells Next to switch off globals.css's
     * smooth scrolling while it resets scroll on a route change. Without it,
     * Next 16 scrolls each of the new page's top-level sections into view,
     * last to first. With smooth scrolling on, those calls animate instead of
     * jumping, and the final one (to the top) is a no-op from scrollY 0, so it
     * never cancels the in-flight scroll to the second section. /about opened
     * on Skills.
     */
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
