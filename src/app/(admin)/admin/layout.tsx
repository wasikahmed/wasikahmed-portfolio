import { SessionProvider } from '@/components/admin/session-provider';
import { ExcludeFromAnalytics } from '@/components/analytics/exclude-from-analytics';

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {/* Every admin page, login included: whoever reaches /admin is the
          owner or someone they invited, never a visitor. */}
      <ExcludeFromAnalytics />
      {children}
    </SessionProvider>
  );
}
