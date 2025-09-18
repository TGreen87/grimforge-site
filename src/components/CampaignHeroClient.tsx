"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface CampaignHeroData {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  heroImageUrl?: string | null;
  backgroundVideoUrl?: string | null;
  ctaPrimaryLabel?: string | null;
  ctaPrimaryHref?: string | null;
  ctaSecondaryLabel?: string | null;
  ctaSecondaryHref?: string | null;
  audioPreviewUrl?: string | null;
}

export function CampaignHeroClient({ campaign }: { campaign: CampaignHeroData }) {
  const backgroundImageStyle = campaign.heroImageUrl
    ? { backgroundImage: `url(${campaign.heroImageUrl})` }
    : undefined

  const primaryHref = campaign.ctaPrimaryHref ?? '/#catalog'
  const secondaryHref = campaign.ctaSecondaryHref ?? '/#catalog'
  const prefersReducedMotion = useReducedMotion()
  const [videoPlaying, setVideoPlaying] = React.useState(true)
  const [audioPlaying, setAudioPlaying] = React.useState(false)
  const [audioMuted, setAudioMuted] = React.useState(false)
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  const toggleVideoPlayback = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play().catch(() => null)
      setVideoPlaying(true)
    } else {
      video.pause()
      setVideoPlaying(false)
    }
  }

  const toggleAudioPlayback = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play().catch(() => null)
      setAudioPlaying(true)
    } else {
      audio.pause()
      setAudioPlaying(false)
    }
  }

  const toggleAudioMute = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = !audio.muted
    setAudioMuted(audio.muted)
  }

  React.useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const handleEnded = () => setAudioPlaying(false)
    audio.addEventListener('ended', handleEnded)
    audio.muted = true
    setAudioMuted(true)
    return () => {
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {!prefersReducedMotion && campaign.backgroundVideoUrl ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={campaign.backgroundVideoUrl}
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        <div
          className="absolute inset-0 h-full w-full bg-cover bg-center"
          style={backgroundImageStyle}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/60 to-background" />

      <motion.div
        className="relative z-10 mx-auto max-w-3xl px-6 text-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground mb-6">Featured Campaign</p>
        <h1 className="gothic-heading text-3xl sm:text-5xl text-bone drop-shadow-lg">
          {campaign.title}
        </h1>
        {campaign.subtitle && (
          <p className="mt-4 text-lg text-muted-foreground/90">
            {campaign.subtitle}
          </p>
        )}
        {campaign.description && (
          <p className="mt-4 text-base text-muted-foreground/80">
            {campaign.description}
          </p>
        )}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="gothic-heading text-sm sm:text-base">
            <Link href={primaryHref}>{campaign.ctaPrimaryLabel ?? 'Listen & buy'}</Link>
          </Button>
          <Button variant="outline" asChild size="lg" className="gothic-heading text-sm sm:text-base">
            <Link href={secondaryHref}>{campaign.ctaSecondaryLabel ?? 'Browse catalog'}</Link>
          </Button>
        </div>
      </motion.div>

      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 sm:flex-row">
        {!prefersReducedMotion && campaign.backgroundVideoUrl ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-background/40 hover:bg-background/60 text-bone"
            onClick={toggleVideoPlayback}
          >
            {videoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        ) : null}
        {campaign.audioPreviewUrl ? (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-background/40 hover:bg-background/60 text-bone"
              onClick={toggleAudioPlayback}
            >
              {audioPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-background/40 hover:bg-background/60 text-bone"
              onClick={toggleAudioMute}
            >
              {audioMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <audio ref={audioRef} src={campaign.audioPreviewUrl ?? undefined} preload="none" />
          </div>
        ) : null}
      </div>
    </section>
  )
}
