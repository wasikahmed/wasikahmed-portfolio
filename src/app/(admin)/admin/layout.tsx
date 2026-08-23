import { SessionProvider } from '@/components/admin/session-provider';

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
