"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  title: string;
  artist?: string | null;
  primaryImage: string;
  additionalImages?: string[];
}

const FALLBACK = "/placeholder.svg";

export function ProductGallery({ title, artist, primaryImage, additionalImages }: ProductGalleryProps) {
  const images = useMemo(() => {
    const entries = [primaryImage, ...(additionalImages ?? [])].filter(Boolean);
    const unique = Array.from(new Set(entries));
    return unique.length > 0 ? unique : [FALLBACK];
  }, [primaryImage, additionalImages]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const activeSrc = images[Math.min(activeIndex, images.length - 1)];
  const caption = artist ? `${artist} — ${title}` : title;

  return (
    <div className="space-y-4">
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="group relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary/30"
            onClick={() => setLightboxOpen(true)}
            aria-label={`Open gallery lightbox for ${caption}`}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSrc}
                initial={{ opacity: 0.2, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <Image
                  src={activeSrc || FALLBACK}
                  alt={caption}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-background/80 via-background/30 to-transparent px-3 py-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <span className="text-xs text-muted-foreground">Tap to enlarge</span>
              <span className="text-xs text-muted-foreground">{activeIndex + 1}/{images.length}</span>
            </div>
          </button>
        </DialogTrigger>
        <DialogContent className="bg-background/95 sm:max-w-4xl">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg">
            <Image
              src={activeSrc || FALLBACK}
              alt={caption}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{caption}</span>
            <span>{activeIndex + 1}/{images.length}</span>
          </div>
        </DialogContent>
      </Dialog>

      {images.length > 1 ? (
        <div className="grid grid-cols-5 gap-2">
          {images.map((src, index) => (
            <Button
              key={src}
              type="button"
              variant="ghost"
              className={cn(
                "relative aspect-square overflow-hidden rounded border border-transparent bg-background/40 p-0",
                index === activeIndex ? "border-accent" : "hover:border-border"
              )}
              onClick={() => setActiveIndex(index)}
              aria-label={`View image ${index + 1} of ${images.length}`}
            >
              <Image src={src || FALLBACK} alt="" fill className="object-cover" sizes="15vw" />
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
