'use client'

import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

const HeroSection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        onLoadedData={() => setIsPlaying(true)}
        onError={() => console.log('Video failed to load')}
      >
        <source src="/Video_for_Obsidian_Rite_Records.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Bottom overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/90"></div>
      
      {/* Video Controls - Responsive positioning */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-20 flex gap-1 md:gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlay}
          className="h-8 w-8 md:h-10 md:w-10 bg-background/20 hover:bg-background/40 text-white backdrop-blur-sm"
        >
          {isPlaying ? <Pause size={16} className="md:w-5 md:h-5" /> : <Play size={16} className="md:w-5 md:h-5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className="h-8 w-8 md:h-10 md:w-10 bg-background/20 hover:bg-background/40 text-white backdrop-blur-sm"
        >
          {isMuted ? <VolumeX size={16} className="md:w-5 md:h-5" /> : <Volume2 size={16} className="md:w-5 md:h-5" />}
        </Button>
      </div>
      
      {/* Main Content - Responsive positioning and sizing */}
      <div className="absolute bottom-16 md:bottom-24 left-0 right-0 z-10 text-center px-4">
        <p className="text-base md:text-lg lg:text-xl text-muted-foreground mb-4 md:mb-6 leading-relaxed drop-shadow-lg">
          Black metal catalog<br className="hidden sm:block" />
          <span className="sm:hidden">•</span>
          <span className="hidden sm:inline"> • </span>
          Vinyl <span className="hidden sm:inline">• </span>
          <span className="sm:hidden">•</span> Cassettes <span className="hidden sm:inline">• </span>
          <span className="sm:hidden">•</span> CDs
        </p>
        
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 justify-center max-w-sm sm:max-w-md mx-auto">
          <Button 
            size="lg" 
            className="gothic-heading bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg text-sm md:text-base"
            onClick={() => {
              const catalogElement = document.getElementById('catalog');
              if (catalogElement) {
                catalogElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
          >
            Browse catalog
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="gothic-heading border-frost text-frost hover:bg-frost hover:text-background shadow-lg text-sm md:text-base"
            onClick={() => {
              const catalogElement = document.getElementById('catalog');
              if (catalogElement) {
                catalogElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
          >
            New arrivals
          </Button>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="w-px h-12 bg-gradient-to-b from-accent to-transparent animate-blood-drip"></div>
      </div>
    </section>
  );
};

export default HeroSection;
