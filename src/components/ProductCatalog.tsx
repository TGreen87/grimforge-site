import ProductCard from "./ProductCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import album1 from "@/assets/album-1.jpg";
import album2 from "@/assets/album-2.jpg";
import album3 from "@/assets/album-3.jpg";
import album4 from "@/assets/album-4.jpg";
import album5 from "@/assets/album-5.jpg";
import album6 from "@/assets/album-6.jpg";

const ProductCatalog = () => {
  // Mock data for demonstration
  const products = [
    {
      title: "De Mysteriis Dom Sathanas",
      artist: "Mayhem",
      format: "vinyl" as const,
      price: "$45.00",
      image: album1,
      limited: true
    },
    {
      title: "Hvis Lyset Tar Oss",
      artist: "Burzum", 
      format: "cassette" as const,
      price: "$25.00",
      image: album2
    },
    {
      title: "In the Nightside Eclipse",
      artist: "Emperor",
      format: "cd" as const,
      price: "$18.00",
      image: album3
    },
    {
      title: "Transilvanian Hunger",
      artist: "Darkthrone",
      format: "vinyl" as const,
      price: "$42.00",
      image: album4,
      preOrder: true
    },
    {
      title: "The Somberlain",
      artist: "Dissection",
      format: "vinyl" as const,
      price: "$48.00",
      image: album5
    },
    {
      title: "Under a Funeral Moon",
      artist: "Darkthrone",
      format: "cassette" as const,
      price: "$22.00",
      image: album6,
      limited: true
    }
  ];

  const vinylProducts = products.filter(p => p.format === "vinyl");
  const cassetteProducts = products.filter(p => p.format === "cassette");
  const cdProducts = products.filter(p => p.format === "cd");

  return (
    <section id="catalog" className="py-20 px-4">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="blackletter text-4xl md:text-6xl mb-4 text-bone">
            Catalog
          </h2>
          <div className="w-24 h-1 blood-accent mx-auto mb-6"></div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover the finest collection of black metal releases from legendary acts and underground hordes
          </p>
        </div>

        {/* Format Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-secondary/50">
            <TabsTrigger value="all" className="gothic-heading">All Formats</TabsTrigger>
            <TabsTrigger value="vinyl" className="gothic-heading">Vinyl</TabsTrigger>
            <TabsTrigger value="cassette" className="gothic-heading">Cassettes</TabsTrigger>
            <TabsTrigger value="cd" className="gothic-heading">CDs</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <ProductCard key={index} {...product} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="vinyl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {vinylProducts.map((product, index) => (
                <ProductCard key={index} {...product} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="cassette">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cassetteProducts.map((product, index) => (
                <ProductCard key={index} {...product} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="cd">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cdProducts.map((product, index) => (
                <ProductCard key={index} {...product} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default ProductCatalog;