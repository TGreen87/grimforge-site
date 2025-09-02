import PreOrderCard from "./PreOrderCard";
const album1 = "/assets/album-1.jpg";
const album2 = "/assets/album-2.jpg";
const album3 = "/assets/album-3.jpg";

const PreOrderSection = () => {
  // Empty pre-orders - will show coming soon message
  const preOrders: Array<Record<string, any>> = [];

  return (
    <section id="preorders" className="py-20 px-4 bg-gradient-to-b from-background to-secondary/10">
      <div className="container mx-auto">
        {/* Section Header - Mobile optimized */}
        <div className="text-center mb-10 md:mb-16">
          <h2 className="blackletter text-3xl md:text-5xl lg:text-6xl mb-3 md:mb-4 text-bone">
            Pre-Order Rituals
          </h2>
          <div className="w-16 md:w-24 h-1 blood-accent mx-auto mb-4 md:mb-6"></div>
          <p className="text-base md:text-lg text-muted-foreground max-w-xl md:max-w-2xl mx-auto px-4">
            Reserve your copy of upcoming releases before they manifest in the physical realm. 
            Limited pressings vanish quickly into the void.
          </p>
        </div>

        {/* Pre-Order Grid - Coming Soon Message */}
        {preOrders.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-secondary/20 border border-border rounded-lg p-8 max-w-2xl mx-auto">
              <h3 className="gothic-heading text-2xl text-bone mb-4">
                Pre-Orders Coming Soon
              </h3>
              <p className="text-muted-foreground">
                Exclusive limited releases will be available for pre-order soon. 
                Join our newsletter below to be notified first when they're ready.
              </p>
            </div>
          </div>
        ) : null}

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-secondary/20 border border-border rounded-lg p-8 max-w-2xl mx-auto">
            <h3 className="gothic-heading text-2xl text-bone mb-4">
              Join the Inner Circle
            </h3>
            <p className="text-muted-foreground mb-6">
              Get notified about upcoming limited releases before they're announced to the masses. 
              Be the first to secure your copy of the rarest pressings.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 justify-center">
                <input 
                  type="email" 
                  placeholder="arg@obsidianriterecords.com"
                  className="flex-1 max-w-sm px-4 py-2 bg-secondary border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm md:text-base"
                />
              <button 
                className="px-6 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/90 transition-colors gothic-heading text-sm md:text-base"
                onClick={() => {
                  // Add email subscription logic here
                  alert('Thank you for joining the cult! You will receive notifications about new releases.');
                }}
              >
                Join the Cult
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PreOrderSection;
