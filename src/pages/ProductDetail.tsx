import { useParams, Navigate } from "react-router-dom";
import { useState } from "react";
import { Star, ShoppingCart, Heart, Share2, Play, Truck, Shield, RotateCcw } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

// Mock product data - in production this would come from a database
const mockProduct = {
  id: "1",
  title: "Eternal Darkness",
  artist: "Shadowmoon",
  format: "Vinyl",
  price: 34.99,
  originalPrice: 39.99,
  image: "/src/assets/album-1.jpg",
  images: ["/src/assets/album-1.jpg", "/src/assets/album-2.jpg"],
  description: "A haunting journey through the depths of darkness, this album captures the essence of eternal night. Recorded in the crypts of ancient castles, each track tells a story of shadow and despair.",
  trackListing: [
    "1. Embrace of Shadows",
    "2. Eternal Night",
    "3. Whispers from the Abyss", 
    "4. Dance of the Damned",
    "5. Moonless Sky",
    "6. Final Descent"
  ],
  genre: "Black Metal",
  releaseYear: 2023,
  label: "Dark Arts Records",
  catalog: "DAR-666",
  weight: "180g",
  limitedEdition: true,
  stock: 15,
  rating: 4.8,
  reviews: 127
};

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // In production, you'd fetch the product based on the ID
  if (!id || id !== "1") {
    return <Navigate to="/404" replace />;
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: mockProduct.id,
        title: mockProduct.title,
        artist: mockProduct.artist,
        format: mockProduct.format,
        price: mockProduct.price,
        image: mockProduct.image
      });
    }
    
    toast({
      title: "Added to Cart",
      description: `${quantity}x ${mockProduct.title} has been added to your dark collection.`,
    });
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `${mockProduct.title} - ${mockProduct.artist}`,
    "description": mockProduct.description,
    "image": mockProduct.images,
    "brand": {
      "@type": "Brand",
      "name": mockProduct.label
    },
    "sku": mockProduct.catalog,
    "category": "Music",
    "offers": {
      "@type": "Offer",
      "price": mockProduct.price,
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "Black Plague Records"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": mockProduct.rating,
      "reviewCount": mockProduct.reviews
    }
  };

  return (
    <>
      <SEOHead
        title={`${mockProduct.title} by ${mockProduct.artist}`}
        description={mockProduct.description}
        keywords={`${mockProduct.artist}, ${mockProduct.title}, ${mockProduct.genre}, vinyl, ${mockProduct.format.toLowerCase()}`}
        url={`https://blackplaguerecords.com/product/${id}`}
        type="product"
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 pt-24 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                <img 
                  src={mockProduct.images[selectedImage]} 
                  alt={`${mockProduct.title} album cover`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-2">
                {mockProduct.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-20 h-20 rounded-md overflow-hidden border-2 ${
                      selectedImage === index ? 'border-accent' : 'border-border'
                    }`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {mockProduct.limitedEdition && (
                    <Badge variant="destructive">Limited Edition</Badge>
                  )}
                  <Badge variant="outline">{mockProduct.format}</Badge>
                </div>
                <h1 className="gothic-heading text-4xl mb-2">{mockProduct.title}</h1>
                <p className="text-xl text-muted-foreground mb-4">by {mockProduct.artist}</p>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${i < Math.floor(mockProduct.rating) ? 'fill-accent text-accent' : 'text-muted-foreground'}`} 
                      />
                    ))}
                    <span className="text-sm text-muted-foreground ml-1">
                      {mockProduct.rating} ({mockProduct.reviews} reviews)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <span className="text-3xl font-bold">${mockProduct.price}</span>
                  {mockProduct.originalPrice && (
                    <span className="text-xl text-muted-foreground line-through">
                      ${mockProduct.originalPrice}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium">Quantity:</label>
                  <select 
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="border border-border rounded-md px-3 py-2 bg-background"
                  >
                    {[...Array(Math.min(mockProduct.stock, 10))].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                  <span className="text-sm text-muted-foreground">
                    {mockProduct.stock} in stock
                  </span>
                </div>

                <div className="flex gap-4">
                  <Button onClick={handleAddToCart} className="flex-1">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                  <Button variant="outline" size="icon">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="text-center">
                  <Truck className="h-6 w-6 mx-auto mb-2 text-accent" />
                  <div className="text-sm font-medium">Free Shipping</div>
                  <div className="text-xs text-muted-foreground">Orders over $50</div>
                </div>
                <div className="text-center">
                  <Shield className="h-6 w-6 mx-auto mb-2 text-accent" />
                  <div className="text-sm font-medium">Secure Payment</div>
                  <div className="text-xs text-muted-foreground">Protected checkout</div>
                </div>
                <div className="text-center">
                  <RotateCcw className="h-6 w-6 mx-auto mb-2 text-accent" />
                  <div className="text-sm font-medium">30-Day Returns</div>
                  <div className="text-xs text-muted-foreground">Easy returns</div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Details Tabs */}
          <div className="mt-16">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="tracks">Track Listing</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="mt-6">
                <div className="prose prose-invert max-w-none">
                  <p>{mockProduct.description}</p>
                </div>
              </TabsContent>
              
              <TabsContent value="tracks" className="mt-6">
                <div className="space-y-2">
                  {mockProduct.trackListing.map((track, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                      <span>{track}</span>
                      <Button variant="ghost" size="sm">
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="details" className="mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Product Details</h3>
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Artist:</dt>
                        <dd>{mockProduct.artist}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Genre:</dt>
                        <dd>{mockProduct.genre}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Release Year:</dt>
                        <dd>{mockProduct.releaseYear}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Label:</dt>
                        <dd>{mockProduct.label}</dd>
                      </div>
                    </dl>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Physical Details</h3>
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Format:</dt>
                        <dd>{mockProduct.format}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Weight:</dt>
                        <dd>{mockProduct.weight}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Catalog #:</dt>
                        <dd>{mockProduct.catalog}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default ProductDetail;