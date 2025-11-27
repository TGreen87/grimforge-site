'use client'

import { useEffect, useState } from 'react'
import { Modal, Select, Slider, Switch, Space, Typography, Button, Spin, message, Card, Tooltip } from 'antd'
import { SoundOutlined, PlayCircleOutlined, PauseCircleOutlined, SettingOutlined } from '@ant-design/icons'

const { Text, Paragraph } = Typography

interface Voice {
  voice_id: string
  name: string
  category: string
  description: string
  labels: Record<string, string>
  preview_url?: string
  recommended: boolean
}

export interface VoiceSettings {
  enabled: boolean
  voice_id: string
  voice_name: string
  model_id: 'eleven_flash_v2_5' | 'eleven_turbo_v2_5' | 'eleven_multilingual_v2'
  stability: number
  similarity_boost: number
  style: number
  speed: number
  auto_play: boolean // Auto-play assistant responses
}

const DEFAULT_SETTINGS: VoiceSettings = {
  enabled: false,
  voice_id: '', // Will be populated from API
  voice_name: '',
  model_id: 'eleven_flash_v2_5',
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.0,
  speed: 1.0,
  auto_play: false,
}

const TTS_MODELS = [
  { value: 'eleven_flash_v2_5', label: 'Flash v2.5 (Fastest, ~75ms)', description: 'Ultra-low latency, great for interactive use' },
  { value: 'eleven_turbo_v2_5', label: 'Turbo v2.5 (Balanced)', description: 'Better quality, slightly slower' },
  { value: 'eleven_multilingual_v2', label: 'Multilingual v2 (Best)', description: 'Highest quality, supports 29 languages' },
]

interface VoiceSettingsModalProps {
  open: boolean
  onClose: () => void
  settings: VoiceSettings
  onSettingsChange: (settings: VoiceSettings) => void
}

export default function VoiceSettingsModal({
  open,
  onClose,
  settings,
  onSettingsChange,
}: VoiceSettingsModalProps) {
  const [voices, setVoices] = useState<Voice[]>([])
  const [loading, setLoading] = useState(false)
  const [previewPlaying, setPreviewPlaying] = useState<string | null>(null)
  const [testPlaying, setTestPlaying] = useState(false)
  const audioRef = useState<HTMLAudioElement | null>(null)

  // Fetch available voices when modal opens
  useEffect(() => {
    if (!open) return

    async function fetchVoices() {
      setLoading(true)
      try {
        const response = await fetch('/api/admin/voice/voices', {
          credentials: 'include',
        })
        if (response.ok) {
          const data = await response.json()
          const fetchedVoices = data.voices || []
          setVoices(fetchedVoices)

          // If no voice is selected yet, use the default from API or first voice
          if (!settings.voice_id && fetchedVoices.length > 0) {
            const defaultVoice = data.default_voice_id
              ? fetchedVoices.find((v: Voice) => v.voice_id === data.default_voice_id)
              : fetchedVoices[0]

            if (defaultVoice) {
              onSettingsChange({
                ...settings,
                voice_id: defaultVoice.voice_id,
                voice_name: defaultVoice.name,
              })
            }
          }
        } else {
          message.error('Failed to load voices')
        }
      } catch (error) {
        console.error('Failed to fetch voices:', error)
        message.error('Failed to load voices')
      } finally {
        setLoading(false)
      }
    }

    fetchVoices()
  }, [open, settings.voice_id, onSettingsChange])

  // Play voice preview
  function playPreview(voice: Voice) {
    if (!voice.preview_url) {
      message.warning('No preview available for this voice')
      return
    }

    if (previewPlaying === voice.voice_id) {
      // Stop current preview
      setPreviewPlaying(null)
      return
    }

    setPreviewPlaying(voice.voice_id)
    const audio = new Audio(voice.preview_url)
    audio.onended = () => setPreviewPlaying(null)
    audio.onerror = () => {
      setPreviewPlaying(null)
      message.error('Failed to play preview')
    }
    audio.play()
  }

  // Test current voice settings
  async function testVoice() {
    setTestPlaying(true)
    try {
      const response = await fetch('/api/admin/voice/tts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: "G'day mate! I'm your Obsidian Rite Records copilot. Let me help you with products, orders, and marketing.",
          voice_id: settings.voice_id,
          model_id: settings.model_id,
          stability: settings.stability,
          similarity_boost: settings.similarity_boost,
          style: settings.style,
          speed: settings.speed,
        }),
      })

      if (!response.ok) {
        throw new Error('TTS request failed')
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      audio.onended = () => {
        setTestPlaying(false)
        URL.revokeObjectURL(audioUrl)
      }
      audio.onerror = () => {
        setTestPlaying(false)
        message.error('Failed to play test audio')
      }
      audio.play()
    } catch (error) {
      console.error('Test voice failed:', error)
      message.error('Failed to test voice')
      setTestPlaying(false)
    }
  }

  function handleVoiceSelect(voice_id: string) {
    const voice = voices.find((v) => v.voice_id === voice_id)
    onSettingsChange({
      ...settings,
      voice_id,
      voice_name: voice?.name || 'Unknown',
    })
  }

  return (
    <Modal
      title={
        <Space>
          <SoundOutlined style={{ color: '#8B0000' }} />
          <span className="font-cinzel">Voice Settings</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      maskClosable={true}
      keyboard={true}
      destroyOnClose={false}
      zIndex={1100}
      footer={[
        <Button key="test" onClick={testVoice} loading={testPlaying} disabled={!settings.enabled || !settings.voice_id}>
          <PlayCircleOutlined /> Test Voice
        </Button>,
        <Button key="close" type="primary" onClick={onClose} style={{ backgroundColor: '#8B0000' }}>
          Done
        </Button>,
      ]}
      width={520}
    >
      <div className="space-y-6">
        {/* Enable/Disable Voice */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-[#141b26]">
          <div>
            <Text strong>Enable Voice Assistant</Text>
            <Paragraph type="secondary" className="text-xs mb-0">
              Use ElevenLabs for high-quality text-to-speech
            </Paragraph>
          </div>
          <Switch
            checked={settings.enabled}
            onChange={(enabled) => onSettingsChange({ ...settings, enabled })}
          />
        </div>

        {settings.enabled && (
          <>
            {/* Voice Selection */}
            <div>
              <Text strong>Voice</Text>
              <Select
                value={settings.voice_id}
                onChange={handleVoiceSelect}
                loading={loading}
                style={{ width: '100%', marginTop: 8 }}
                optionLabelProp="label"
              >
                {voices.map((voice) => (
                  <Select.Option key={voice.voice_id} value={voice.voice_id} label={voice.name}>
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <Text strong>{voice.name}</Text>
                        {voice.recommended && (
                          <Text type="secondary" className="text-xs ml-2">
                            Recommended
                          </Text>
                        )}
                        <br />
                        <Text type="secondary" className="text-xs">
                          {voice.description || Object.values(voice.labels || {}).join(', ')}
                        </Text>
                      </div>
                      {voice.preview_url && (
                        <Button
                          type="text"
                          size="small"
                          icon={previewPlaying === voice.voice_id ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                          onClick={(e) => {
                            e.stopPropagation()
                            playPreview(voice)
                          }}
                        />
                      )}
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </div>

            {/* Model Selection */}
            <div>
              <Text strong>Quality Model</Text>
              <Select
                value={settings.model_id}
                onChange={(model_id) => onSettingsChange({ ...settings, model_id })}
                style={{ width: '100%', marginTop: 8 }}
              >
                {TTS_MODELS.map((model) => (
                  <Select.Option key={model.value} value={model.value}>
                    <div>
                      <Text>{model.label}</Text>
                      <br />
                      <Text type="secondary" className="text-xs">{model.description}</Text>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </div>

            {/* Voice Parameters */}
            <Card size="small" title="Voice Tuning" className="bg-[#0f1624]">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <Text>Stability</Text>
                    <Text type="secondary">{settings.stability.toFixed(2)}</Text>
                  </div>
                  <Slider
                    min={0}
                    max={1}
                    step={0.05}
                    value={settings.stability}
                    onChange={(stability) => onSettingsChange({ ...settings, stability })}
                    tooltip={{ formatter: (v) => `${((v || 0) * 100).toFixed(0)}%` }}
                  />
                  <Text type="secondary" className="text-xs">
                    Higher = more consistent, Lower = more expressive
                  </Text>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <Text>Similarity Boost</Text>
                    <Text type="secondary">{settings.similarity_boost.toFixed(2)}</Text>
                  </div>
                  <Slider
                    min={0}
                    max={1}
                    step={0.05}
                    value={settings.similarity_boost}
                    onChange={(similarity_boost) => onSettingsChange({ ...settings, similarity_boost })}
                    tooltip={{ formatter: (v) => `${((v || 0) * 100).toFixed(0)}%` }}
                  />
                  <Text type="secondary" className="text-xs">
                    How closely to match the original voice
                  </Text>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <Text>Speed</Text>
                    <Text type="secondary">{settings.speed.toFixed(2)}x</Text>
                  </div>
                  <Slider
                    min={0.5}
                    max={2}
                    step={0.1}
                    value={settings.speed}
                    onChange={(speed) => onSettingsChange({ ...settings, speed })}
                    tooltip={{ formatter: (v) => `${v}x` }}
                  />
                </div>
              </div>
            </Card>

            {/* Auto-play setting */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <Text>Auto-play Responses</Text>
                <br />
                <Text type="secondary" className="text-xs">
                  Automatically read assistant messages aloud
                </Text>
              </div>
              <Switch
                checked={settings.auto_play}
                onChange={(auto_play) => onSettingsChange({ ...settings, auto_play })}
              />
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

export { DEFAULT_SETTINGS as DEFAULT_VOICE_SETTINGS }
