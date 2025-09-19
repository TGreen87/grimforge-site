"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  layout?: 'classic' | 'split' | 'minimal' | string | null;
  badgeText?: string | null;
  highlightItems?: string[] | null;
}

export function CampaignHeroClient({ campaign }: { campaign: CampaignHeroData }) {
  const layout = (campaign.layout ?? 'classic') as 'classic' | 'split' | 'minimal' | string
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

  const highlightItems = React.useMemo(
    () => (Array.isArray(campaign.highlightItems) ? campaign.highlightItems.filter(Boolean) : []),
    [campaign.highlightItems],
  )

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

  React.useEffect(() => {
    if (!prefersReducedMotion) return
    const video = videoRef.current
    if (!video) return
    video.pause()
    video.currentTime = 0
    setVideoPlaying(false)
  }, [prefersReducedMotion])

  const showVideo = Boolean(campaign.backgroundVideoUrl) && !prefersReducedMotion
  const hasHeroImage = Boolean(campaign.heroImageUrl)
  const badgeLabel = campaign.badgeText || 'Featured Campaign'

  const renderVideoToggleButton = (className?: string, size: 'icon' | 'sm' = 'icon') => {
    if (!showVideo) return null
    return (
      <Button
        variant="ghost"
        size={size === 'icon' ? 'icon' : 'sm'}
        type="button"
        className={cn(
          'bg-background/40 hover:bg-background/60 text-bone',
          size === 'sm' ? 'gap-2 px-3' : '',
          className,
        )}
        onClick={toggleVideoPlayback}
        aria-label={videoPlaying ? 'Pause background video' : 'Play background video'}
        aria-pressed={videoPlaying}
      >
        {videoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        {size === 'sm' ? <span className="text-xs uppercase tracking-[0.2em]">{videoPlaying ? 'Pause video' : 'Play video'}</span> : null}
      </Button>
    )
  }

  const renderAudioControls = (className?: string, variant: 'icon' | 'inline' = 'icon') => {
    if (!campaign.audioPreviewUrl) return null
    const isInline = variant === 'inline'
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Button
          variant={isInline ? 'outline' : 'ghost'}
          size={isInline ? 'sm' : 'icon'}
          type="button"
          className={cn('text-bone', isInline ? 'gap-2 border-border bg-background/40 hover:bg-background/60' : 'bg-background/40 hover:bg-background/60')}
          onClick={toggleAudioPlayback}
          aria-label={audioPlaying ? 'Pause audio preview' : 'Play audio preview'}
          aria-pressed={audioPlaying}
        >
          {audioPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isInline ? <span className="text-xs uppercase tracking-[0.2em]">{audioPlaying ? 'Pause preview' : 'Play preview'}</span> : null}
        </Button>
        <Button
          variant={isInline ? 'ghost' : 'ghost'}
          size={isInline ? 'icon' : 'icon'}
          type="button"
          className="h-8 w-8 bg-background/40 hover:bg-background/60 text-bone"
          onClick={toggleAudioMute}
          aria-label={audioMuted ? 'Unmute audio preview' : 'Mute audio preview'}
          aria-pressed={audioMuted}
        >
          {audioMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
        <audio ref={audioRef} src={campaign.audioPreviewUrl ?? undefined} preload="none" />
      </div>
    )
  }

  const renderHighlightList = (className?: string) => {
    if (highlightItems.length === 0) return null
    return (
      <ul className={cn('mt-6 flex flex-col gap-3 text-sm text-muted-foreground/90', className)} role="list">
        {highlightItems.map((item, index) => (
          <li key={`${item}-${index}`} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    )
  }

  const renderClassicLayout = () => (
    <section className="relative isolate flex min-h-screen flex-col justify-center overflow-hidden pt-20">
      {showVideo ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={campaign.backgroundVideoUrl ?? undefined}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
      ) : hasHeroImage ? (
        <div
          className="absolute inset-0 h-full w-full bg-cover bg-center"
          style={backgroundImageStyle}
          aria-hidden="true"
        />
      ) : (
        <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-slate-900 via-slate-950 to-black" aria-hidden="true" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/70 to-background" aria-hidden="true" />

      <motion.div
        className="relative z-10 mx-auto max-w-3xl px-6 text-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <span className="inline-flex items-center justify-center rounded-full border border-border/60 bg-background/30 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          {badgeLabel}
        </span>
        <h1 className="gothic-heading mt-6 text-3xl text-bone drop-shadow-lg sm:text-5xl">
          {campaign.title}
        </h1>
        {campaign.subtitle ? (
          <p className="mt-4 text-lg text-muted-foreground/90">
            {campaign.subtitle}
          </p>
        ) : null}
        {campaign.description ? (
          <p className="mt-4 text-base text-muted-foreground/80">
            {campaign.description}
          </p>
        ) : null}
        {renderHighlightList('items-center sm:items-center sm:text-base')}
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="gothic-heading text-sm sm:text-base">
            <Link href={primaryHref}>{campaign.ctaPrimaryLabel ?? 'Listen & buy'}</Link>
          </Button>
          <Button variant="outline" asChild size="lg" className="gothic-heading text-sm sm:text-base">
            <Link href={secondaryHref}>{campaign.ctaSecondaryLabel ?? 'Browse catalog'}</Link>
          </Button>
        </div>
      </motion.div>

      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 sm:flex-row">
        {renderVideoToggleButton()}
        {renderAudioControls(undefined, 'icon')}
      </div>
    </section>
  )

  const renderSplitLayout = () => (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-background/95 via-background to-background py-24">
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background/90 to-transparent" aria-hidden="true" />
      <div className="container mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="order-2 flex flex-col justify-center text-left lg:order-1">
          <span className="inline-flex w-fit items-center rounded-full border border-border/60 bg-background/40 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            {badgeLabel}
          </span>
          <h1 className="gothic-heading mt-6 text-3xl text-bone drop-shadow-lg sm:text-5xl">
            {campaign.title}
          </h1>
          {campaign.subtitle ? (
            <p className="mt-3 text-lg text-muted-foreground/90">
              {campaign.subtitle}
            </p>
          ) : null}
          {campaign.description ? (
            <p className="mt-3 text-base text-muted-foreground/80">
              {campaign.description}
            </p>
          ) : null}
          {renderHighlightList('items-start sm:text-base')}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="gothic-heading text-sm sm:text-base">
              <Link href={primaryHref}>{campaign.ctaPrimaryLabel ?? 'Listen & buy'}</Link>
            </Button>
            <Button variant="outline" asChild size="lg" className="gothic-heading text-sm sm:text-base">
              <Link href={secondaryHref}>{campaign.ctaSecondaryLabel ?? 'Browse catalog'}</Link>
            </Button>
          </div>
          {renderAudioControls('mt-6', 'inline')}
        </div>

        <div className="order-1 lg:order-2">
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-background/40 shadow-2xl">
            {showVideo ? (
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                src={campaign.backgroundVideoUrl ?? undefined}
                autoPlay
                muted
                loop
                playsInline
                aria-hidden="true"
              />
            ) : hasHeroImage ? (
              <div
                className="h-full w-full bg-cover bg-center"
                style={backgroundImageStyle}
                aria-hidden="true"
              />
            ) : (
              <div className="flex h-full min-h-[420px] w-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-black text-muted-foreground">
                <span className="text-xs uppercase tracking-[0.3em]">Upload hero media</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/10 via-transparent to-background/10" aria-hidden="true" />
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-3">
              {renderVideoToggleButton('h-9 w-9 rounded-full border border-border/60 bg-background/60 backdrop-blur sm:h-10 sm:w-10')}
            </div>
          </div>
        </div>
      </div>
    </section>
  )

  const renderMinimalLayout = () => (
    <section className="relative isolate overflow-hidden bg-[#07090c] py-24">
      {hasHeroImage ? (
        <div className="absolute inset-0 opacity-40" style={backgroundImageStyle} aria-hidden="true" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black opacity-80" aria-hidden="true" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" aria-hidden="true" />
      <div className="container relative mx-auto max-w-3xl px-6 text-center sm:text-left">
        <span className="inline-flex items-center rounded-full border border-border/40 bg-background/30 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          {badgeLabel}
        </span>
        <h1 className="gothic-heading mt-6 text-3xl text-bone sm:text-4xl">
          {campaign.title}
        </h1>
        {campaign.subtitle ? (
          <p className="mt-3 text-lg text-muted-foreground/90">
            {campaign.subtitle}
          </p>
        ) : null}
        {campaign.description ? (
          <p className="mt-4 text-base text-muted-foreground/80">
            {campaign.description}
          </p>
        ) : null}
        {renderHighlightList('items-center sm:items-start sm:text-base')}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="gothic-heading text-sm sm:text-base">
            <Link href={primaryHref}>{campaign.ctaPrimaryLabel ?? 'Listen & buy'}</Link>
          </Button>
          <Button variant="outline" asChild size="lg" className="gothic-heading text-sm sm:text-base">
            <Link href={secondaryHref}>{campaign.ctaSecondaryLabel ?? 'Browse catalog'}</Link>
          </Button>
        </div>
        {renderAudioControls('mt-6 flex flex-wrap gap-3', 'inline')}
      </div>
    </section>
  )

  if (layout === 'split') {
    return renderSplitLayout()
  }
  if (layout === 'minimal') {
    return renderMinimalLayout()
  }
  return renderClassicLayout()
}
