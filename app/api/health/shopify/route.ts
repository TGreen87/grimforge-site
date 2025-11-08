import { NextResponse } from 'next/server'
import { shopifyAdminEnv, shopifyEnv } from '@/lib/shopify/env'

export async function GET() {
  const { domain, token, version, isConfigured } = shopifyEnv
  const { isConfigured: adminConfigured } = shopifyAdminEnv

  return NextResponse.json({
    ok: isConfigured,
    hasDomain: Boolean(domain),
    hasToken: Boolean(token),
    version,
    hasAdminToken: adminConfigured,
  })
}
