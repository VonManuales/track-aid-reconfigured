/**
 * Public site identity — set NEXT_PUBLIC_SITE_URL when deploying (e.g. Vercel custom domain).
 * For local dev, use `npm run dev:local` and open http://trackaid.local:3000
 */
export const SITE_NAME = 'TrackAid';

export const SITE_TAGLINE = 'Philippine Resource Mobilization Tracker';

export const SITE_DESCRIPTION =
  'Eastern Visayas predictability dashboard for LGUs and NGOs — funding coverage and interactive maps.';

export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (url) return url.replace(/\/$/, '');
  if (process.env.NODE_ENV === 'development') {
    return 'http://trackaid.local:3000';
  }
  return 'https://trackaid.app';
}
