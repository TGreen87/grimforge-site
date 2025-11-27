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

// Curated list of recommended voices for the copilot
// These are voices that work well for an Australian metal music business assistant
const RECOMMENDED_VOICES = [
  'JBFqnCBsd6RMkjVDRZzb', // George - warm, friendly
  '21m00Tcm4TlvDq8ikWAM', // Rachel - clear, professional
  'AZnzlk1XvdvUeBnXmlld', // Domi - energetic
  'EXAVITQu4vr4xnSDxMaL', // Bella - warm female
  'ErXwobaYiN019PkySvjV', // Antoni - friendly male
  'MF3mGyEYCl7XYWbV9V6O', // Elli - young female
  'TxGEqnHWrfWFTfGW9XjX', // Josh - deep male
  'VR6AewLTigWG4xSOukaG', // Arnold - authoritative
  'pNInz6obpgDQGcFmaJgB', // Adam - narrative
  'yoZ06aMxZJJ28mfd3POQ', // Sam - clear male
]

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

    // Fetch all available voices
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

    // Filter to recommended voices and format response
    const voices = data.voices
      .filter((v) => RECOMMENDED_VOICES.includes(v.voice_id))
      .map((v) => ({
        voice_id: v.voice_id,
        name: v.name,
        category: v.category,
        description: v.description || '',
        labels: v.labels || {},
        preview_url: v.preview_url,
        recommended: true,
      }))

    // Also include any custom/cloned voices the user has
    const customVoices = data.voices
      .filter((v) => v.category === 'cloned' || v.category === 'generated')
      .map((v) => ({
        voice_id: v.voice_id,
        name: v.name,
        category: v.category,
        description: v.description || '',
        labels: v.labels || {},
        preview_url: v.preview_url,
        recommended: false,
      }))

    return NextResponse.json({
      voices: [...voices, ...customVoices],
      default_voice_id: 'JBFqnCBsd6RMkjVDRZzb', // George
    })
  } catch (error) {
    console.error('Voices endpoint error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch voices' },
      { status: 500 }
    )
  }
}
