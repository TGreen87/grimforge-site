import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Eye } from "lucide-react";

interface ProductCardProps {
  title: string;
  artist: string;
  format: "vinyl" | "cassette" | "cd";
  price: string;
  image: string;
  limited?: boolean;
  preOrder?: boolean;
}

const ProductCard = ({ title, artist, format, price, image, limited, preOrder }: ProductCardProps) => {
  const formatIcons = {
    vinyl: "🎵",
    cassette: "📼", 
    cd: "💿"
  };

  return (
    <Card className="group bg-card/80 backdrop-blur-sm border-border hover:border-accent transition-all duration-300 hover:shadow-blood">
      <CardContent className="p-4">
        {/* Image Container */}
        <div className="relative aspect-square mb-4 overflow-hidden rounded">
          <img 
            src={image} 
            alt={`${artist} - ${title}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Vinyl Spin Effect */}
          {format === "vinyl" && (
            <div className="absolute inset-0 vinyl-spin opacity-0 group-hover:opacity-30 bg-gradient-to-r from-transparent via-bone/20 to-transparent"></div>
          )}
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {limited && (
              <Badge variant="destructive" className="text-xs">
                Limited
              </Badge>
            )}
            {preOrder && (
              <Badge variant="secondary" className="text-xs">
                Pre-Order
              </Badge>
            )}
            <Badge variant="outline" className="text-xs border-frost text-frost">
              {formatIcons[format]} {format.toUpperCase()}
            </Badge>
          </div>

          {/* Hover Actions */}
          <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
            <Button size="sm" variant="outline" className="border-frost text-frost hover:bg-frost hover:text-background">
              <Eye className="h-4 w-4" />
            </Button>
            <Button size="sm" className="bg-accent hover:bg-accent/90">
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-2">
          <h3 className="gothic-heading text-sm font-semibold text-bone line-clamp-1">
            {title}
          </h3>
          <p className="text-muted-foreground text-sm">
            {artist}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-accent">
              {price}
            </span>
            <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-accent">
              Add to Cart
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;