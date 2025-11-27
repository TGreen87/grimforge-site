import { NextRequest, NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/assistant/auth'
import { testN8nWebhook } from '@/lib/webhooks/n8n'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/n8n/test
 * Test n8n webhook connectivity
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin auth
    const adminCheck = await assertAdmin(request)
    if (!adminCheck.ok) {
      return adminCheck.error
    }

    const body = await request.json()
    const { url, secret } = body

    if (!url) {
      return NextResponse.json(
        { error: 'Webhook URL is required' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid webhook URL format' },
        { status: 400 }
      )
    }

    // Test the webhook
    const result = await testN8nWebhook(url, secret)

    return NextResponse.json({
      success: result.success,
      latencyMs: result.latencyMs,
      error: result.error,
      testedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('n8n test endpoint error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Test failed' },
      { status: 500 }
    )
  }
}
