import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { ShoppingCart, Minus, Plus, X } from "lucide-react";

const CartDrawer = () => {
  const { items, getTotalItems, getTotalPrice, updateQuantity, removeItem } = useCart();

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="relative text-foreground hover:text-accent">
          <ShoppingCart className="h-4 w-4" />
          {getTotalItems() > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-accent text-accent-foreground text-xs">
              {getTotalItems()}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="bg-background border-border w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="gothic-heading text-bone">Cart of Darkness</SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col h-full">
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto py-6">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Your cart awaits the darkness...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 bg-card rounded border border-border">
                    <img 
                      src={item.image} 
                      alt={`${item.artist} - ${item.title}`}
                      className="w-16 h-16 object-cover rounded"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="gothic-heading text-sm font-semibold text-bone truncate">
                        {item.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">{item.artist}</p>
                      <p className="text-xs text-frost uppercase">{item.format}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 border-frost text-frost hover:bg-frost hover:text-background"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <span className="text-sm font-medium w-8 text-center text-bone">
                        {item.quantity}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 border-frost text-frost hover:bg-frost hover:text-background"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-bold text-accent">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Cart Footer */}
          {items.length > 0 && (
            <div className="border-t border-border pt-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="gothic-heading text-lg text-bone">Total:</span>
                <span className="text-xl font-bold text-accent">
                  {formatPrice(getTotalPrice())}
                </span>
              </div>
              
              <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground gothic-heading">
                Proceed to Ritual Checkout
              </Button>
              
              <Button variant="outline" className="w-full border-frost text-frost hover:bg-frost hover:text-background">
                Continue Shopping
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;