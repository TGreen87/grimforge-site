'use client'

import { memo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Eye, Heart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  id: string;
  title: string;
  artist: string;
  format: "vinyl" | "cassette" | "cd";
  price: string;
  image: string;
  limited?: boolean;
  preOrder?: boolean;
}

const ProductCard = ({ id, title, artist, format, price, image, limited, preOrder }: ProductCardProps) => {
  const router = useRouter();
  const { addItem } = useCart();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();
  
  // Extract original ID for navigation (remove any -rec- suffix)
  const originalId = id.split('-rec-')[0];
  const formatIcons = {
    vinyl: "🎵",
    cassette: "📼", 
    cd: "💿"
  };

  const handleAddToCart = () => {
    const priceNumber = parseFloat(price.replace('$', ''));
    addItem({
      id,
      title,
      artist,
      format,
      price: priceNumber,
      image
    });
    
    toast({
      title: "Added to cart",
      description: `${artist} - ${title} has been summoned to your cart`,
      duration: 2000,
    });
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const priceNumber = parseFloat(price.replace('$', ''));
    
    if (isInWishlist(id)) {
      removeFromWishlist(id);
      toast({
        title: "Removed from wishlist",
        description: `${artist} - ${title} has been removed from your dark desires`,
        duration: 2000,
      });
    } else {
      addToWishlist({
        id,
        title,
        artist,
        format,
        price: priceNumber,
        image
      });
      toast({
        title: "Added to wishlist",
        description: `${artist} - ${title} has been added to your dark desires`,
        duration: 2000,
      });
    }
  };

  const handleCardClick = () => {
    router.push(`/product/${originalId}`);
  };

  return (
    <Card 
      className="group bg-card/80 backdrop-blur-sm border-border hover:border-accent transition-all duration-300 hover:shadow-blood cursor-pointer"
      onClick={handleCardClick}
    >
      <CardContent className="p-3 md:p-4">
        {/* Image Container */}
        <div className="relative aspect-square mb-3 md:mb-4 overflow-hidden rounded">
          <img 
            src={image} 
            alt={`${artist} - ${title}`}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Vinyl Spin Effect */}
          {format === "vinyl" && (
            <div className="absolute inset-0 vinyl-spin opacity-0 group-hover:opacity-30 bg-gradient-to-r from-transparent via-bone/20 to-transparent"></div>
          )}
          
          {/* Badges - Mobile optimized */}
          <div className="absolute top-1.5 left-1.5 md:top-2 md:left-2 flex flex-col gap-1">
            {limited && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                Limited
              </Badge>
            )}
            {preOrder && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                Preorder
              </Badge>
            )}
            <Badge variant="outline" className="text-xs px-1.5 py-0.5 border-frost text-frost">
              <span className="hidden sm:inline">{formatIcons[format]} </span>
              {format.toUpperCase()}
            </Badge>
          </div>

          {/* Hover Actions - Touch optimized */}
          <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-1.5 md:gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 w-8 md:h-9 md:w-9 border-frost text-frost hover:bg-frost hover:text-background p-0"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/product/${originalId}`);
              }}
            >
              <Eye className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </Button>
            <Button 
              size="sm" 
              variant={isInWishlist(id) ? "default" : "outline"}
              className={`h-8 w-8 md:h-9 md:w-9 p-0 ${isInWishlist(id) ? "bg-accent hover:bg-accent/90" : "border-frost text-frost hover:bg-frost hover:text-background"}`}
              onClick={handleWishlistToggle}
            >
              <Heart className={`h-3.5 w-3.5 md:h-4 md:w-4 ${isInWishlist(id) ? 'fill-current' : ''}`} />
            </Button>
            <Button size="sm" className="h-8 w-8 md:h-9 md:w-9 bg-accent hover:bg-accent/90 p-0" onClick={(e) => {
              e.stopPropagation();
              handleAddToCart();
            }}>
              <ShoppingCart className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </Button>
          </div>
        </div>

        {/* Product Info - Mobile optimized */}
        <div className="space-y-1.5 md:space-y-2">
          <h3 className="gothic-heading text-sm md:text-base font-semibold text-bone line-clamp-1">
            {title}
          </h3>
          <p className="text-muted-foreground text-xs md:text-sm">
            {artist}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-base md:text-lg font-bold text-accent">
              {price}
            </span>
            <Button size="sm" variant="ghost" className="text-xs md:text-sm text-muted-foreground hover:text-accent px-2" onClick={handleAddToCart}>
            <span className="hidden sm:inline">Add to Cart</span>
            <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(ProductCard);
