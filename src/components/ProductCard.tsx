'use client'

import { memo, KeyboardEvent, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Eye, Heart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import ThreeDTilt from "@/components/fx/ThreeDTilt";
import { getSupabaseBrowserClient } from "@/integrations/supabase/browser";

interface ProductCardProps {
  id: string;
  slug?: string;
  title: string;
  artist: string;
  format: "vinyl" | "cassette" | "cd";
  price: string;
  image: string;
  limited?: boolean;
  preOrder?: boolean;
}

const ProductCard = ({ id, slug, title, artist, format, price, image, limited, preOrder }: ProductCardProps) => {
  const { addItem } = useCart();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const priceNumber = useMemo(() => parseFloat(price.replace('$', '')), [price]);
  
  // Prefer slug for navigation; fallback to a slugified title route handled by product page
  const fallbackSlugFromTitle = `${artist} ${title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  const href = slug ? `/products/${slug}` : `/products/${fallbackSlugFromTitle}`;
  const formatIcons = {
    vinyl: "🎵",
    cassette: "📼", 
    cd: "💿"
  };

  const isWishlisted = isInWishlist(id);

  const voidKey = useMemo(() => {
    const withoutQuery = image.split('?')[0] ?? ''
    const filename = withoutQuery.split('/').pop() ?? id
    return filename.replace(/\.[^/.]+$/, '') || id
  }, [image, id])

  const addToCart = async () => {
    setIsAdding(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('variants')
        .select('id')
        .eq('product_id', id)
        .eq('active', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data?.id) {
        throw new Error('No active variant found. Open the product page to choose a format.');
      }

      addItem({
        productId: id,
        variantId: data.id,
        title: `${artist} - ${title}`,
        price: Number.isFinite(priceNumber) ? priceNumber : 0,
        image,
        quantity: 1,
      });

      toast({
        title: "Added to cart",
        description: `${artist} - ${title} has been summoned to your cart`,
        duration: 2000,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to add to cart right now.';
      toast({
        title: 'Unable to add to cart',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddToCartClick = async (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation();
    if (isAdding) return;
    await addToCart();
  };

  const toggleWishlist = () => {
    if (isWishlisted) {
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
        price: Number.isFinite(priceNumber) ? priceNumber : 0,
        image,
      });
      toast({
        title: "Added to wishlist",
        description: `${artist} - ${title} has been added to your dark desires`,
        duration: 2000,
      });
    }
  };

  const handleWishlistClick = (event?: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    event?.stopPropagation();
    toggleWishlist();
  };

  const navigateToProduct = () => {
    if (typeof window !== 'undefined') {
      window.location.assign(href);
    }
  };

  const handleCardClick = () => {
    navigateToProduct();
  };
  const handleCardKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigateToProduct();
    }
  };

  return (
    <Card
      className="group bg-card/80 backdrop-blur-sm border-border hover:border-accent transition-all duration-300 hover:shadow-blood cursor-pointer"
      onClick={handleCardClick}
      role="link"
      tabIndex={0}
      onKeyDown={handleCardKey}
    >
      <CardContent className="p-3 md:p-4">
        {/* Image Container */}
        <ThreeDTilt className="mb-3 md:mb-4">
          <div className="jacket relative aspect-square overflow-hidden rounded">
            <img
              src={image}
              alt={`${artist} - ${title}`}
              loading="lazy"
              data-void-key={voidKey}
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
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/80 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
              <a href={href} onClick={(e) => e.stopPropagation()}>
                <Button
                  size="default"
                  variant="outline"
                  className="h-11 w-11 sm:h-10 sm:w-10 border-frost text-frost hover:bg-frost hover:text-background p-0"
                  aria-label={`View details for ${artist} - ${title}`}
                >
                  <Eye className="h-3.5 w-3.5 md:h-4 md:w-4" />
                </Button>
              </a>
              <Button
                size="default"
                variant={isWishlisted ? "default" : "outline"}
                className={cn(
                  "h-11 w-11 sm:h-10 sm:w-10 p-0",
                  isWishlisted ? "bg-accent hover:bg-accent/90" : "border-frost text-frost hover:bg-frost hover:text-background",
                )}
                onClick={(event) => handleWishlistClick(event)}
                aria-label={`${isWishlisted ? 'Remove from' : 'Add to'} wishlist: ${artist} - ${title}`}
              >
                <Heart className={cn('h-3.5 w-3.5 md:h-4 md:w-4', isWishlisted ? 'fill-current' : undefined)} />
              </Button>
              <Button
                size="default"
                className="h-11 w-11 sm:h-10 sm:w-10 bg-accent hover:bg-accent/90 p-0"
                onClick={(event) => handleAddToCartClick(event)}
                disabled={isAdding}
                aria-label={`Add to cart: ${artist} - ${title}`}
              >
                <ShoppingCart className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>
        </ThreeDTilt>

        {/* Product Info - Mobile optimized */}
        <div className="space-y-1.5 md:space-y-2">
          <h3 className="gothic-heading text-sm md:text-base font-semibold text-bone line-clamp-1 break-words">
            <a href={href} onClick={(e)=>e.stopPropagation()} className="hover:underline break-words" aria-label={`View details for ${artist} - ${title}`}>
              {title}
            </a>
          </h3>
          <p className="text-muted-foreground text-xs md:text-sm">
            {artist}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-base md:text-lg font-bold text-accent">
              {price}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              className="flex-1 min-w-[120px] bg-accent hover:bg-accent/90 text-sm"
              onClick={(event) => handleAddToCartClick(event)}
              disabled={isAdding}
            >
              {isAdding ? 'Adding…' : 'Quick add'}
            </Button>
            <Button
              size="icon"
              variant={isWishlisted ? "secondary" : "outline"}
              className={cn('h-9 w-9', isWishlisted ? 'bg-accent/20 text-accent-foreground' : 'text-muted-foreground hover:text-accent')}
              onClick={(event) => handleWishlistClick(event)}
            >
              <Heart className={cn('h-4 w-4', isWishlisted ? 'fill-current' : undefined)} />
              <span className="sr-only">{`${isWishlisted ? 'Remove from' : 'Add to'} wishlist`}</span>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 text-muted-foreground hover:text-accent"
              onClick={(event) => {
                event.stopPropagation();
                navigateToProduct();
              }}
            >
              <Eye className="h-4 w-4" />
              <span className="sr-only">View release</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(ProductCard);
