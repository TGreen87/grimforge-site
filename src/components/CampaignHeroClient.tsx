"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

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

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {campaign.backgroundVideoUrl ? (
        <video
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
    </section>
  )
}
