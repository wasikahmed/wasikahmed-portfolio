import { SiteShell } from '@/components/site/site-shell';
import { Footer } from '@/components/site/footer';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteShell>
      {/* pt-16 clears the fixed header. */}
      <main id="main" className="flex-1 pt-16">
        {children}
      </main>
      <Footer />
    </SiteShell>
  );
}
