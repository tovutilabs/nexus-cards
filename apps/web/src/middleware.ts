import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'es'],
  defaultLocale: 'en',
  localePrefix: 'as-needed', // Don't add /en prefix for default locale
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|p|s|offline|.*\\..*).*)'], // Apply to all routes except API, Next.js internals, static files, and public routes (p/, s/, offline)
};
