import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import { ServiceWorkerRegistration } from '@/components/service-worker-registration';
import { SkipToContent } from '@/components/skip-to-content';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'Nexus Cards',
  description: 'Digital Business Card Platform',
  manifest: '/manifest.json',
  themeColor: '#4f46e5',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Nexus Cards',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <SkipToContent />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <ServiceWorkerRegistration />
            {children}
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
