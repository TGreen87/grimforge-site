import { useState } from "react";
import { Heart, X, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseBrowserClient } from "@/integrations/supabase/browser";

interface WishlistItem {
  id: string;
  title: string;
  artist: string;
  format: string;
  price: number;
  image: string;
  addedAt: string;
}

const WishlistDrawer = () => {
  const { items, removeItem, getTotalItems } = useWishlist();
  const { addItem: addToCart } = useCart();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);

  const handleMoveToCart = async (item: WishlistItem) => {
    setMovingId(item.id);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('variants')
        .select('id')
        .eq('product_id', item.id)
        .eq('active', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data?.id) {
        throw new Error('Variant unavailable for this release. View the product to see more options.');
      }

      addToCart({
        productId: item.id,
        variantId: data.id,
        title: `${item.artist} - ${item.title}`,
        price: item.price,
        image: item.image,
        quantity: 1,
      });

      removeItem(item.id);

      toast({
        title: "Moved to Cart",
        description: `${item.title} has been moved from wishlist to cart.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to add this item to the cart right now.';
      toast({
        title: 'Unable to move item',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setMovingId(null);
    }
  };

  const handleRemoveItem = (item: WishlistItem) => {
    removeItem(item.id);
    toast({
      title: "Removed from Wishlist",
      description: `${item.title} has been removed from your wishlist.`,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const totalValue = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button aria-label="Open wishlist" variant="ghost" size="sm" className="relative text-foreground hover:text-accent">
          <Heart className="h-4 w-4" />
          {getTotalItems() > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {getTotalItems()}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:w-[400px] bg-background border-border">
        <SheetHeader>
          <SheetTitle className="gothic-heading text-bone">
            Wishlist ({getTotalItems()})
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Your wishlist is empty</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add items to your wishlist
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 p-3 bg-card/50 rounded-lg border border-border">
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-bone truncate">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">{item.artist}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{item.format}</Badge>
                      <span className="text-sm font-medium text-accent">{formatPrice(item.price)}</span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => handleMoveToCart(item)}
                        disabled={movingId === item.id}
                      >
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        {movingId === item.id ? 'Moving…' : 'Add to Cart'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="text-xs h-7 px-2"
                        onClick={() => handleRemoveItem(item)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {items.length > 0 && (
                <div className="border-t border-border pt-4 mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-medium">Total Value:</span>
                    <span className="font-bold text-lg text-accent">{formatPrice(totalValue)}</span>
                  </div>
                  <Button 
                    className="w-full"
                    disabled={movingId !== null}
                    onClick={async () => {
                      for (const wishlistItem of items) {
                        await handleMoveToCart(wishlistItem);
                      }
                      setIsOpen(false);
                    }}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {movingId ? 'Moving…' : 'Move All to Cart'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default WishlistDrawer;
