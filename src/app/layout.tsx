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
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'Wasik Ahmed',
  description: 'Software engineer building AI and automation systems.',
  openGraph: {
    type: 'website',
    siteName: 'Wasik Ahmed',
    title: 'Wasik Ahmed',
    description: 'Software engineer building AI and automation systems.',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
