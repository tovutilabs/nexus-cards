import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ServiceWorkerRegistration } from '@/components/service-worker-registration';
import { SkipToContent } from '@/components/skip-to-content';

export const metadata: Metadata = {
  title: 'Nexus Cards',
  description: 'Digital Business Card Platform',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Nexus Cards',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#4f46e5',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SkipToContent />
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
