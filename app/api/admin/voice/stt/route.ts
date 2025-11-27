import { NextRequest, NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/assistant/auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Transcription can take time

// ElevenLabs STT Models
const STT_MODELS = {
  'scribe_v1': { name: 'Scribe v1', accuracy: 'high', languages: 99 },
} as const

type STTModelId = keyof typeof STT_MODELS

interface STTResponse {
  text: string
  words?: Array<{
    word: string
    start: number
    end: number
    speaker_id?: string
  }>
  language_code?: string
}

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

    // Parse multipart form data
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null
    const modelId = (formData.get('model_id') as string) || 'scribe_v1'
    const languageCode = formData.get('language_code') as string | null

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      )
    }

    // Validate file size (max 25MB for quick transcription)
    const MAX_SIZE = 25 * 1024 * 1024
    if (audioFile.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Audio file too large (max 25MB)' },
        { status: 400 }
      )
    }

    // Create form data for ElevenLabs
    const elevenlabsFormData = new FormData()
    elevenlabsFormData.append('file', audioFile)
    elevenlabsFormData.append('model_id', modelId)
    if (languageCode) {
      elevenlabsFormData.append('language_code', languageCode)
    }

    // Call ElevenLabs STT API
    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: elevenlabsFormData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs STT error:', errorText)
      return NextResponse.json(
        { error: `STT failed: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Extract just the text for simple use cases
    const result: STTResponse = {
      text: data.text || '',
      words: data.words,
      language_code: data.language_code,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('STT endpoint error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'STT failed' },
      { status: 500 }
    )
  }
}
