import { NextRequest, NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/assistant/auth'

export const dynamic = 'force-dynamic'

interface Voice {
  voice_id: string
  name: string
  category: string
  description?: string
  labels?: Record<string, string>
  preview_url?: string
}

interface VoicesResponse {
  voices: Voice[]
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin auth
    const adminCheck = await assertAdmin(request)
    if (!adminCheck.ok) {
      return adminCheck.error
    }

    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ELEVENLABS_API_KEY not configured' },
        { status: 500 }
      )
    }

    // Fetch all available voices from ElevenLabs
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs voices error:', errorText)
      return NextResponse.json(
        { error: `Failed to fetch voices: ${response.status}` },
        { status: response.status }
      )
    }

    const data = (await response.json()) as VoicesResponse
    console.log(`[ElevenLabs] Fetched ${data.voices?.length || 0} voices`)

    // Return ALL voices, categorized
    const allVoices = (data.voices || []).map((v) => {
      // Build a description from labels if no description provided
      const labelStr = v.labels
        ? Object.entries(v.labels)
            .map(([k, val]) => `${val}`)
            .join(', ')
        : ''

      return {
        voice_id: v.voice_id,
        name: v.name,
        category: v.category || 'unknown',
        description: v.description || labelStr || '',
        labels: v.labels || {},
        preview_url: v.preview_url || null,
        // Mark premade voices as recommended
        recommended: v.category === 'premade' || v.category === 'high_quality',
      }
    })

    // Sort: recommended first, then by name
    allVoices.sort((a, b) => {
      if (a.recommended && !b.recommended) return -1
      if (!a.recommended && b.recommended) return 1
      return a.name.localeCompare(b.name)
    })

    // Find a good default voice (first premade male or first premade)
    const defaultVoice = allVoices.find(
      (v) => v.category === 'premade' && v.labels?.gender === 'male'
    ) || allVoices.find((v) => v.category === 'premade') || allVoices[0]

    return NextResponse.json({
      voices: allVoices,
      default_voice_id: defaultVoice?.voice_id || null,
    })
  } catch (error) {
    console.error('Voices endpoint error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch voices' },
      { status: 500 }
    )
  }
}
