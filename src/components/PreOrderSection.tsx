import PreOrderCard from "./PreOrderCard";
import album1 from "@/assets/album-1.jpg";
import album2 from "@/assets/album-2.jpg";
import album3 from "@/assets/album-3.jpg";

const PreOrderSection = () => {
  // Mock pre-order data
  const preOrders = [
    {
      id: "immortal-northern-chaos",
      title: "Northern Chaos Gods",
      artist: "Immortal",
      format: "vinyl" as const,
      price: "$55.00",
      image: album1,
      releaseDate: "2024-03-15",
      totalPressing: 500,
      currentOrders: 423,
      description: "The legendary Norse warriors return with their most glacial and atmospheric opus yet. Limited gatefold edition with frost-covered artwork.",
      limitedEdition: true
    },
    {
      id: "gorgoroth-destroyer",
      title: "Destroyer",
      artist: "Gorgoroth",
      format: "cassette" as const,
      price: "$28.00",
      image: album2,
      releaseDate: "2024-02-28",
      totalPressing: 300,
      currentOrders: 267,
      description: "Raw and uncompromising black metal terror. Pro-dubbed cassettes with exclusive artwork and lyrics sheet.",
      limitedEdition: true
    },
    {
      id: "watain-trident-wolf",
      title: "The Wild Hunt",
      artist: "Watain",
      format: "cd" as const,
      price: "$22.00",
      image: album3,
      releaseDate: "2024-04-01",
      totalPressing: 1000,
      currentOrders: 156,
      description: "Swedish black metal masters deliver their most ritualistic album. Digipak edition with bonus tracks and sigil artwork."
    }
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-secondary/10">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="blackletter text-4xl md:text-6xl mb-4 text-bone">
            Pre-Order Rituals
          </h2>
          <div className="w-24 h-1 blood-accent mx-auto mb-6"></div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Reserve your copy of upcoming releases before they manifest in the physical realm. 
            Limited pressings vanish quickly into the void.
          </p>
        </div>

        {/* Pre-Order Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {preOrders.map((preOrder) => (
            <PreOrderCard key={preOrder.id} {...preOrder} />
          ))}
        </div>

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
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <input 
                type="email" 
                placeholder="your@darkness.com"
                className="flex-1 max-w-sm px-4 py-2 bg-secondary border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button 
                className="px-6 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/90 transition-colors gothic-heading"
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