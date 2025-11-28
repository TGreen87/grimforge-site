import { NextRequest, NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/assistant/auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// ElevenLabs TTS Models
const TTS_MODELS = {
  'eleven_flash_v2_5': { name: 'Flash v2.5', latency: 'ultra-low (~75ms)', quality: 'high' },
  'eleven_turbo_v2_5': { name: 'Turbo v2.5', latency: 'low', quality: 'very high' },
  'eleven_multilingual_v2': { name: 'Multilingual v2', latency: 'medium', quality: 'excellent' },
} as const

type TTSModelId = keyof typeof TTS_MODELS

interface TTSRequest {
  text: string
  voice_id?: string
  model_id?: TTSModelId
  stability?: number
  similarity_boost?: number
  style?: number
  speed?: number
}

// Default voice - will use first available if not set
// Note: ElevenLabs premade voices change; this should be fetched dynamically
const DEFAULT_VOICE_ID = '' // Will be handled in request

export async function POST(request: NextRequest) {
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

    const body = (await request.json()) as TTSRequest
    const {
      text,
      voice_id = DEFAULT_VOICE_ID,
      model_id = 'eleven_flash_v2_5', // Fast by default
      stability = 0.5,
      similarity_boost = 0.75,
      style = 0.0,
      speed = 1.0,
    } = body

    if (!text?.trim()) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    // Limit text length for cost control
    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'Text too long (max 5000 characters)' },
        { status: 400 }
      )
    }

    // Call ElevenLabs TTS API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id,
          voice_settings: {
            stability,
            similarity_boost,
            style,
            speed,
            use_speaker_boost: true,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs TTS error:', response.status, errorText)
      return NextResponse.json(
        { error: `TTS failed: ${response.status}`, details: errorText },
        { status: response.status }
      )
    }

    // Return audio as binary
    const audioBuffer = await response.arrayBuffer()

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error('TTS endpoint error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'TTS failed' },
      { status: 500 }
    )
  }
}
