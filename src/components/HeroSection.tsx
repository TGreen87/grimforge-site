import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 frost-overlay"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background"></div>
      
      {/* Main Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1 className="blackletter text-6xl md:text-8xl mb-6 text-bone">
          Obsidian Rite Records
        </h1>
        <div className="w-32 h-1 blood-accent mx-auto mb-8"></div>
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
          Purveyors of the darkest sounds from the underground.<br />
          Vinyl • Cassettes • CDs from the depths of black metal.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            className="gothic-heading bg-accent hover:bg-accent/90 text-accent-foreground"
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
            className="gothic-heading border-frost text-frost hover:bg-frost hover:text-background"
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
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="w-px h-12 bg-gradient-to-b from-accent to-transparent animate-blood-drip"></div>
      </div>
    </section>
  );
};

export default HeroSection;