export function getBaseUrl() {
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || 'http://localhost:3000'
}

