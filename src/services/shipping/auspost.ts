// Lightweight Australia Post shipping quote scaffold.
// This module safely no-ops when env vars are missing.

export type ShippingItem = {
  // grams; default weights should be supplied by caller if product lacks one
  weight_g: number
  // cm; optional — AusPost can quote without dimensions but better with
  length_cm?: number
  width_cm?: number
  height_cm?: number
  // quantity of identical items
  quantity?: number
}

export type ShippingDestination = {
  country: string // ISO 2 (e.g., 'AU')
  postcode?: string // required for AU domestic
  state?: string
  suburb?: string
}

export type ShippingOption = {
  carrier: 'AUSPOST'
  service_code: string
  display_name: string
  amount_cents: number
  currency: 'AUD'
  // Optional delivery window in business days
  eta_min_days?: number
  eta_max_days?: number
}

export type QuoteParams = {
  originPostcode: string
  destination: ShippingDestination
  items: ShippingItem[]
}

// Env accessors kept here to isolate configuration.
function getConfig() {
  const apiKey = process.env.AUSPOST_API_KEY || ''
  const originPostcode = process.env.AUSPOST_ORIGIN_POSTCODE || ''
  return { apiKey, originPostcode }
}

// Combine weights/parcel data into a single package for a first pass.
function summarizePackage(items: ShippingItem[]) {
  const totalWeight = items.reduce((g, it) => g + (it.weight_g * (it.quantity ?? 1)), 0)
  // Very simple package heuristic: pick max dims across items if provided
  const dims = items.reduce(
    (acc, it) => ({
      length_cm: Math.max(acc.length_cm, it.length_cm ?? 0),
      width_cm: Math.max(acc.width_cm, it.width_cm ?? 0),
      height_cm: Math.max(acc.height_cm, it.height_cm ?? 0),
    }),
    { length_cm: 0, width_cm: 0, height_cm: 0 }
  )
  return { weight_g: Math.max(50, Math.floor(totalWeight)), ...dims }
}

// Map AusPost service names into friendlier labels
function labelFor(serviceName: string): string {
  if (/express/i.test(serviceName)) return 'Express (AusPost)'
  if (/parcel post/i.test(serviceName)) return 'Parcel Post (AusPost)'
  if (/standard/i.test(serviceName)) return 'Standard (AusPost)'
  return serviceName
}

function allowDomestic(serviceName: string): boolean {
  return /express/i.test(serviceName) || /parcel\s*post/i.test(serviceName)
}

function allowInternational(serviceName: string): boolean {
  // Keep it simple and customer-friendly: Standard and Express
  return /standard/i.test(serviceName) || /express/i.test(serviceName)
}

// Public: quote rates (returns [] if not configured)
export async function quoteAusPostRates(params: QuoteParams): Promise<ShippingOption[]> {
  const { apiKey } = getConfig()
  if (!apiKey) {
    return [] // not configured; caller should fallback
  }

  const { originPostcode, destination, items } = params
  const pkg = summarizePackage(items)

  // Domestic vs International endpoints differ. For scaffold, we’ll call domestic if AU, else international for a single indicative rate per service.
  const isDomestic = (destination.country || 'AU').toUpperCase() === 'AU'

  try {
    if (isDomestic) {
      // AusPost Postage Assessment: Domestic Parcel Service
      // Docs: https://developers.auspost.com.au/apis/domestic-postage
      const url = new URL('https://digitalapi.auspost.com.au/postage/parcel/domestic/service.json')
      url.searchParams.set('from_postcode', originPostcode)
      url.searchParams.set('to_postcode', destination.postcode || '')
      url.searchParams.set('length', String(Math.max(1, Math.round(pkg.length_cm || 1))))
      url.searchParams.set('width', String(Math.max(1, Math.round(pkg.width_cm || 1))))
      url.searchParams.set('height', String(Math.max(1, Math.round(pkg.height_cm || 1))))
      url.searchParams.set('weight', String(Math.max(1, Math.round(pkg.weight_g))))

      const res = await fetch(url.toString(), {
        headers: { 'AUTH-KEY': apiKey },
        // Prevent hanging in previews
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`AusPost domestic service fetch failed: ${res.status}`)
      const data = (await res.json()) as any
      const services: any[] = data?.services?.service || []
      const options: ShippingOption[] = services
        .filter((s) => allowDomestic(String(s.name || s.code || '')))
        .map((s) => ({
        carrier: 'AUSPOST',
        service_code: String(s.code || s.product_id || s.service_code || s.name || 'DOM'),
        display_name: labelFor(String(s.name || s.code || 'AusPost')),
        amount_cents: Math.round(Number(s.price) * 100) || 0,
        currency: 'AUD',
        eta_min_days: s.delivery_time && parseInt(String(s.delivery_time).split('-')[0]) || undefined,
        eta_max_days: s.delivery_time && parseInt(String(s.delivery_time).split('-').pop()!) || undefined,
      }))
      return options.filter(o => o.amount_cents > 0).sort((a,b)=>a.amount_cents-b.amount_cents)
    } else {
      // AusPost Postage Assessment: International Parcel Service
      // Docs: https://developers.auspost.com.au/apis/international-postage
      const url = new URL('https://digitalapi.auspost.com.au/postage/parcel/international/service.json')
      url.searchParams.set('from_postcode', originPostcode)
      url.searchParams.set('country_code', destination.country)
      url.searchParams.set('weight', String(Math.max(1, Math.round(pkg.weight_g))))

      const res = await fetch(url.toString(), {
        headers: { 'AUTH-KEY': apiKey },
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`AusPost intl service fetch failed: ${res.status}`)
      const data = (await res.json()) as any
      const services: any[] = data?.services?.service || []
      const options: ShippingOption[] = services
        .filter((s) => allowInternational(String(s.name || s.code || '')))
        .map((s) => ({
        carrier: 'AUSPOST',
        service_code: String(s.code || s.product_id || s.service_code || s.name || 'INTL'),
        display_name: labelFor(String(s.name || s.code || 'AusPost')),
        amount_cents: Math.round(Number(s.price) * 100) || 0,
        currency: 'AUD',
      }))
      return options.filter(o => o.amount_cents > 0).sort((a,b)=>a.amount_cents-b.amount_cents)
    }
  } catch (e) {
    // Silent degrade to empty on error; caller should fallback
    console.error('AusPost quote error:', e)
    return []
  }
}
