import { useParams, Navigate } from "react-router-dom";
import { useState } from "react";
import { Star, ShoppingCart, Heart, Share2, Play, Truck, Shield, RotateCcw } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import ProductReviews from "@/components/ProductReviews";
import RecommendationEngine from "@/components/RecommendationEngine";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";

// Comprehensive product database
const productDatabase = {
  "mayhem-de-mysteriis": {
    id: "mayhem-de-mysteriis",
    title: "De Mysteriis Dom Sathanas",
    artist: "Mayhem",
    format: "Vinyl",
    price: 45.00,
    originalPrice: 50.00,
    image: "/assets/album-1.jpg",
    images: ["/assets/album-1.jpg", "/assets/album-2.jpg"],
    description: "The most influential black metal album ever recorded. A masterpiece of darkness, chaos, and raw emotion that defined an entire genre. Recorded with legendary vocalist Dead and featuring the haunting vocals of Attila Csihar.",
    trackListing: [
      "1. Funeral Fog",
      "2. Freezing Moon", 
      "3. Cursed in Eternity",
      "4. Pagan Fears",
      "5. Life Eternal",
      "6. From the Dark Past",
      "7. Buried by Time and Dust",
      "8. De Mysteriis Dom Sathanas"
    ],
    genre: "Black Metal",
    releaseYear: 1994,
    label: "Deathlike Silence Productions",
    catalog: "ANTI-MOSH-006",
    weight: "180g",
    limitedEdition: true,
    stock: 12,
    rating: 4.9,
    reviews: 245
  },
  "burzum-hvis-lyset": {
    id: "burzum-hvis-lyset",
    title: "Hvis Lyset Tar Oss",
    artist: "Burzum",
    format: "Cassette",
    price: 25.00,
    image: "/assets/album-2.jpg",
    images: ["/assets/album-2.jpg", "/assets/album-1.jpg"],
    description: "Varg Vikernes' atmospheric masterpiece that pushed black metal into new territories. Four epic compositions that blend raw darkness with ambient beauty, creating a hypnotic journey through Norse mythology.",
    trackListing: [
      "1. Det Som En Gang Var",
      "2. Hvis Lyset Tar Oss",
      "3. Inn i Slottet Fra Drømmen",
      "4. Tomhet"
    ],
    genre: "Atmospheric Black Metal",
    releaseYear: 1994,
    label: "Misanthropy Records",
    catalog: "MISANTHROPIA-001",
    weight: "Standard",
    limitedEdition: false,
    stock: 8,
    rating: 4.7,
    reviews: 189
  },
  "emperor-nightside": {
    id: "emperor-nightside",
    title: "In the Nightside Eclipse",
    artist: "Emperor",
    format: "CD",
    price: 18.00,
    image: "/assets/album-3.jpg",
    images: ["/assets/album-3.jpg", "/assets/album-4.jpg"],
    description: "Emperor's symphonic black metal debut that revolutionized the genre with its complex arrangements and atmospheric keyboards. A perfect blend of brutality and beauty from the Norwegian masters.",
    trackListing: [
      "1. Into the Infinity of Thoughts",
      "2. The Burning Shadows of Silence",
      "3. Cosmic Keys to My Creations & Times",
      "4. Beyond the Great Vast Forest",
      "5. Towards the Pantheon",
      "6. The Majesty of the Nightsky",
      "7. I Am the Black Wizards",
      "8. Inno a Satana"
    ],
    genre: "Symphonic Black Metal",
    releaseYear: 1994,
    label: "Candlelight Records",
    catalog: "CANDLE-009",
    weight: "Standard",
    limitedEdition: false,
    stock: 22,
    rating: 4.8,
    reviews: 167
  },
  "darkthrone-transilvanian": {
    id: "darkthrone-transilvanian",
    title: "Transilvanian Hunger",
    artist: "Darkthrone",
    format: "Vinyl",
    price: 42.00,
    image: "/assets/album-4.jpg",
    images: ["/assets/album-4.jpg", "/assets/album-5.jpg"],
    description: "The epitome of raw black metal minimalism. Fenriz's hypnotic drumming and Nocturno Culto's razor-sharp guitar work create an atmosphere of pure Nordic frost and darkness.",
    trackListing: [
      "1. Transilvanian Hunger",
      "2. Over Fjell og Gjennom Torner",
      "3. Skald av Satans Sol",
      "4. Slottet i det Fjerne",
      "5. Graven Tåkeheimens Saler",
      "6. I en Hall med Flesk og Mjød",
      "7. As Flittermice as Satans Spys",
      "8. En Ås i Dype Skogen"
    ],
    genre: "Raw Black Metal",
    releaseYear: 1994,
    label: "Peaceville Records",
    catalog: "VILE-42",
    weight: "180g",
    limitedEdition: true,
    stock: 0,
    rating: 4.6,
    reviews: 134
  },
  "dissection-somberlain": {
    id: "dissection-somberlain",
    title: "The Somberlain",
    artist: "Dissection",
    format: "Vinyl",
    price: 48.00,
    originalPrice: 55.00,
    image: "/assets/album-5.jpg",
    images: ["/assets/album-5.jpg", "/assets/album-6.jpg"],
    description: "Jon Nödtveidt's masterpiece of melodic blackened death metal. Technical precision meets dark atmosphere in this Swedish classic that influenced countless bands with its perfect balance of brutality and melody.",
    trackListing: [
      "1. Black Horizons",
      "2. The Somberlain",
      "3. Crimson Towers",
      "4. A Land Forlorn",
      "5. Heaven's Damnation",
      "6. Frozen",
      "7. Into Infinite Obscurity",
      "8. In the Cold Winds of Nowhere",
      "9. The Grief Prophecy / Shadows Over a Lost Kingdom",
      "10. Mistress of the Bleeding Sorrow",
      "11. Feathers Fell"
    ],
    genre: "Blackened Death Metal",
    releaseYear: 1993,
    label: "No Fashion Records",
    catalog: "NFR-010",
    weight: "180g",
    limitedEdition: true,
    stock: 6,
    rating: 4.8,
    reviews: 198
  },
  "darkthrone-funeral-moon": {
    id: "darkthrone-funeral-moon",
    title: "Under a Funeral Moon",
    artist: "Darkthrone",
    format: "Cassette",
    price: 22.00,
    image: "/assets/album-6.jpg",
    images: ["/assets/album-6.jpg", "/assets/album-1.jpg"],
    description: "Darkthrone's second chapter in their unholy trilogy. More focused and aggressive than its predecessor, this album cemented the duo's reputation as masters of primitive black metal.",
    trackListing: [
      "1. Natassja in Eternal Sleep",
      "2. Summer of the Diabolical Holocaust",
      "3. The Dance of Eternal Shadows",
      "4. Unholy Black Metal",
      "5. To Walk the Infernal Fields",
      "6. Under a Funeral Moon",
      "7. Inn i de Dype Skogers Favn",
      "8. Crossing the Triangle of Flames"
    ],
    genre: "Raw Black Metal",
    releaseYear: 1993,
    label: "Peaceville Records",
    catalog: "VILE-38",
    weight: "Standard",
    limitedEdition: true,
    stock: 15,
    rating: 4.7,
    reviews: 156
  },
  // Recommendation products
  "rec-1": {
    id: "rec-1",
    title: "Eternal Darkness",
    artist: "Shadowmoon",
    format: "Vinyl",
    price: 34.99,
    image: "/assets/album-1.jpg",
    images: ["/assets/album-1.jpg", "/assets/album-2.jpg"],
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
  },
  "rec-2": {
    id: "rec-2",
    title: "Blood Moon Rising",
    artist: "Crimson Tide",
    format: "CD",
    price: 18.99,
    image: "/assets/album-2.jpg",
    images: ["/assets/album-2.jpg", "/assets/album-3.jpg"],
    description: "An aggressive assault of death metal fury, combining technical prowess with atmospheric darkness.",
    trackListing: [
      "1. Blood Moon Ascendant",
      "2. Crimson Ritual",
      "3. Tides of War",
      "4. Sanguine Dreams",
      "5. Red Dawn"
    ],
    genre: "Death Metal",
    releaseYear: 2023,
    label: "Crimson Records",
    catalog: "CR-013",
    weight: "Standard",
    limitedEdition: false,
    stock: 30,
    rating: 4.5,
    reviews: 89
  },
  "rec-3": {
    id: "rec-3",
    title: "Necromantic Ritual",
    artist: "Death's Embrace",
    format: "Cassette",
    price: 24.99,
    image: "/assets/album-3.jpg",
    images: ["/assets/album-3.jpg", "/assets/album-4.jpg"],
    description: "Raw necromantic black metal with ritualistic overtones and bone-chilling atmosphere.",
    trackListing: [
      "1. Invocation of the Dead",
      "2. Necromantic Rites",
      "3. Bone Cathedral",
      "4. Death's Embrace",
      "5. Beyond the Veil"
    ],
    genre: "Black Metal",
    releaseYear: 2023,
    label: "Necro Productions",
    catalog: "NP-007",
    weight: "Standard",
    limitedEdition: false,
    stock: 18,
    rating: 4.6,
    reviews: 72
  },
  "rec-4": {
    id: "rec-4",
    title: "Shadow's Call",
    artist: "Void Walker",
    format: "Vinyl",
    price: 39.99,
    image: "/assets/album-4.jpg",
    images: ["/assets/album-4.jpg", "/assets/album-5.jpg"],
    description: "Crushing doom metal with atmospheric interludes that drag the listener into the void.",
    trackListing: [
      "1. The Void Beckons",
      "2. Shadow's Call",
      "3. Walker in Darkness",
      "4. Endless Descent",
      "5. Consumed by Night"
    ],
    genre: "Doom Metal",
    releaseYear: 2023,
    label: "Void Records",
    catalog: "VR-021",
    weight: "180g",
    limitedEdition: true,
    stock: 8,
    rating: 4.7,
    reviews: 93
  },
  "rec-5": {
    id: "rec-5",
    title: "Dark Prophecy",
    artist: "Nightmare Lord",
    format: "CD",
    price: 21.99,
    image: "/assets/album-5.jpg",
    images: ["/assets/album-5.jpg", "/assets/album-6.jpg"],
    description: "Gothic metal with symphonic elements and haunting vocals that tell tales of dark prophecies.",
    trackListing: [
      "1. Prophecy Foretold",
      "2. Dark Visions",
      "3. Nightmare's Reign",
      "4. Lord of Shadows",
      "5. The Final Hour"
    ],
    genre: "Gothic Metal",
    releaseYear: 2023,
    label: "Gothic Arts",
    catalog: "GA-044",
    weight: "Standard",
    limitedEdition: false,
    stock: 25,
    rating: 4.4,
    reviews: 64
  },
  "rec-6": {
    id: "rec-6",
    title: "Abyssal Dreams",
    artist: "Shadowmoon",
    format: "Vinyl",
    price: 42.99,
    image: "/assets/album-6.jpg",
    images: ["/assets/album-6.jpg", "/assets/album-1.jpg"],
    description: "The highly anticipated follow-up to Eternal Darkness, diving deeper into atmospheric black metal territories.",
    trackListing: [
      "1. Dreams of the Abyss",
      "2. Shadowmoon Rising",
      "3. Depths Unknown",
      "4. Whispers in Sleep",
      "5. Abyssal Throne"
    ],
    genre: "Black Metal",
    releaseYear: 2024,
    label: "Dark Arts Records",
    catalog: "DAR-777",
    weight: "180g",
    limitedEdition: true,
    stock: 0,
    rating: 4.9,
    reviews: 156
  }
};

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Get product based on ID
  if (!id) {
    return <Navigate to="/404" replace />;
  }

  const product = productDatabase[id as keyof typeof productDatabase];
  
  if (!product) {
    return <Navigate to="/404" replace />;
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        title: product.title,
        artist: product.artist,
        format: product.format,
        price: product.price,
        image: product.image
      });
    }
    
    toast({
      title: "Added to Cart",
      description: `${quantity}x ${product.title} has been added to your dark collection.`,
    });
  };

  const handleWishlistToggle = () => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      toast({
        title: "Removed from Wishlist",
        description: `${product.title} has been removed from your dark desires.`,
      });
    } else {
      addToWishlist({
        id: product.id,
        title: product.title,
        artist: product.artist,
        format: product.format,
        price: product.price,
        image: product.image
      });
      toast({
        title: "Added to Wishlist",
        description: `${product.title} has been added to your dark desires.`,
      });
    }
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `${product.title} - ${product.artist}`,
    "description": product.description,
    "image": product.images,
    "brand": {
      "@type": "Brand",
      "name": product.label
    },
    "sku": product.catalog,
    "category": "Music",
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "Black Ritual Records"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": product.rating,
      "reviewCount": product.reviews
    }
  };

  return (
    <>
      <SEOHead
        title={`${product.title} by ${product.artist}`}
        description={product.description}
        keywords={`${product.artist}, ${product.title}, ${product.genre}, vinyl, ${product.format.toLowerCase()}`}
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
                  src={product.images[selectedImage]} 
                  alt={`${product.title} album cover`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-2">
                {product.images.map((image, index) => (
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
                  {product.limitedEdition && (
                    <Badge variant="destructive">Limited Edition</Badge>
                  )}
                  <Badge variant="outline">{product.format}</Badge>
                </div>
                <h1 className="gothic-heading text-4xl mb-2">{product.title}</h1>
                <p className="text-xl text-muted-foreground mb-4">by {product.artist}</p>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'fill-accent text-accent' : 'text-muted-foreground'}`} 
                      />
                    ))}
                    <span className="text-sm text-muted-foreground ml-1">
                      {product.rating} ({product.reviews} reviews)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <span className="text-3xl font-bold">${product.price}</span>
                  {(product as any).originalPrice && (
                    <span className="text-xl text-muted-foreground line-through">
                      ${(product as any).originalPrice}
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
                    {[...Array(Math.min(product.stock, 10))].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                  <span className="text-sm text-muted-foreground">
                    {product.stock} in stock
                  </span>
                </div>

                <div className="flex gap-4">
                  <Button onClick={handleAddToCart} className="flex-1">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                  <Button 
                    variant={isInWishlist(product.id) ? "default" : "outline"} 
                    size="icon"
                    onClick={handleWishlistToggle}
                  >
                    <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
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
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="tracks">Track Listing</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="mt-6">
                <div className="prose prose-invert max-w-none">
                  <p>{product.description}</p>
                </div>
              </TabsContent>
              
              <TabsContent value="tracks" className="mt-6">
                <div className="space-y-2">
                  {product.trackListing.map((track, index) => (
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
                        <dd>{product.artist}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Genre:</dt>
                        <dd>{product.genre}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Release Year:</dt>
                        <dd>{product.releaseYear}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Label:</dt>
                        <dd>{product.label}</dd>
                      </div>
                    </dl>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Physical Details</h3>
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Format:</dt>
                        <dd>{product.format}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Weight:</dt>
                        <dd>{product.weight}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Catalog #:</dt>
                        <dd>{product.catalog}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="reviews" className="mt-6">
                <ProductReviews 
                  productId={id || "1"}
                  reviews={[]}
                  averageRating={product.rating}
                  totalReviews={product.reviews}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Recommendations */}
          <div className="mt-16">
            <RecommendationEngine currentProductId={id} />
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default ProductDetail;