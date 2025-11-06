import { useParams, Navigate } from "react-router-dom";
import { useState } from "react";
import { Star, ShoppingCart, Heart, Share2, Play, Truck, Shield, RotateCcw } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { brand } from "@/config/brand";
import ProductReviews from "@/components/ProductReviews";
import RecommendationEngine from "@/components/RecommendationEngine";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";

// Product interface
interface Product {
  id: string;
  title: string;
  artist: string;
  format: string;
  price: number;
  image: string;
  images: string[];
  description: string;
  trackListing: string[];
  genre: string;
  releaseYear: number;
  label: string;
  catalog: string;
  weight: string;
  limitedEdition: boolean;
  stock: number;
  rating: number;
  reviews: number;
  originalPrice?: number;
}

// Empty product database - only real products from Supabase
const productDatabase: Record<string, Product> = {};

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Get product based on ID
  if (!id) {
    return <Navigate to="/404" replace />;
  }

  let product: Product | undefined = productDatabase[id];
  
  // Fallback: try dynamic products uploaded via Admin (stored in localStorage)
  if (!product) {
    try {
      interface LocalStorageRecord {
        id?: string;
        title?: string;
        artist?: string;
        format?: string;
        price?: number;
        image?: string;
        description?: string;
        tracks?: string[];
        tags?: string[];
        genre?: string;
        releaseYear?: number;
        label?: string;
        sku?: string;
        weight?: string;
        limited?: boolean;
        stock?: number;
      }
      
      const recordsRaw = localStorage.getItem('orr_records');
      const records = recordsRaw ? JSON.parse(recordsRaw) as LocalStorageRecord[] : [];
      const rec = records.find((r) => r.id === id || (typeof r.id === 'string' && r.id.startsWith(id + '-')));
      if (rec) {
        const fmt = String(rec.format ?? 'vinyl').toLowerCase();
        const formatProper = fmt === 'vinyl' ? 'Vinyl' : fmt === 'cd' ? 'CD' : 'Cassette';
        product = {
          id: rec.id ?? id,
          title: rec.title ?? 'Untitled',
          artist: rec.artist ?? 'Unknown',
          format: formatProper,
          price: Number(rec.price ?? 0),
          image: rec.image ?? '/assets/album-1.jpg',
          images: [rec.image ?? '/assets/album-1.jpg'],
          description: rec.description ?? 'No description provided.',
          trackListing: Array.isArray(rec.tracks) ? rec.tracks : [],
          genre: Array.isArray(rec.tags) ? rec.tags.join(', ') : (rec.genre ?? 'Music'),
          releaseYear: rec.releaseYear ?? new Date().getFullYear(),
          label: rec.label ?? 'Independent',
          catalog: rec.sku ?? '',
          weight: rec.weight ?? 'Standard',
          limitedEdition: !!rec.limited,
          stock: Number(rec.stock ?? 0),
          rating: 4.7,
          reviews: 0,
        };
      }
    } catch (e) {
      console.warn('Failed to parse dynamic records from storage', e);
    }
  }
  
  if (!product) {
    return <Navigate to="/404" replace />;
  }


  const handleAddToCart = () => {
    toast({
      title: "Shopify checkout coming soon",
      description: "Cart actions will relaunch once the new Shopify experience ships.",
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
        "name": brand.name
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
        url={`https://obsidianriterecords.com/product/${id}`}
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
                  {product.originalPrice && (
                    <span className="text-xl text-muted-foreground line-through">
                      ${product.originalPrice}
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
                  {product.trackListing.map((track: string, index: number) => (
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
