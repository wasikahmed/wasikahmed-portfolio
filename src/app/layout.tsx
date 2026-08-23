import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wasik Ahmed',
  description: 'Software engineer building AI and automation systems.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
