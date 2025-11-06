import { NextResponse } from 'next/server'
import { shopifyEnv } from '@/lib/shopify/env'

export async function GET() {
  const { domain, token, version, isConfigured } = shopifyEnv

  return NextResponse.json({
    ok: isConfigured,
    hasDomain: Boolean(domain),
    hasToken: Boolean(token),
    version,
  })
}

