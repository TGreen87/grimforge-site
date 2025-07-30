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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        onLoadedData={() => setIsPlaying(true)}
      >
        <source src="/Video_for_Obsidian_Rite_Records.mp4" type="video/mp4" />
      </video>
      
      {/* Bottom overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/90"></div>
      
      {/* Video Controls */}
      <div className="absolute top-6 right-6 z-20 flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlay}
          className="bg-background/20 hover:bg-background/40 text-white backdrop-blur-sm"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className="bg-background/20 hover:bg-background/40 text-white backdrop-blur-sm"
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </Button>
      </div>
      
      {/* Main Content - Positioned at bottom */}
      <div className="absolute bottom-24 left-0 right-0 z-10 text-center px-4">
        <p className="text-lg md:text-xl text-muted-foreground mb-6 leading-relaxed drop-shadow-lg">
          Underground Black Metal Collection<br />
          Vinyl • Cassettes • CDs
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
          <Button 
            size="lg" 
            className="gothic-heading bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg"
            onClick={() => {
              const catalogElement = document.getElementById('catalog');
              if (catalogElement) {
                catalogElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
          >
            Explore Catalog
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="gothic-heading border-frost text-frost hover:bg-frost hover:text-background shadow-lg"
            onClick={() => {
              const catalogElement = document.getElementById('catalog');
              if (catalogElement) {
                catalogElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
          >
            New Arrivals
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