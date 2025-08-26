"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Clock, Users, Flame, AlertTriangle } from "lucide-react";

interface PreOrderCardProps {
  id: string;
  title: string;
  artist: string;
  format: "vinyl" | "cassette" | "cd";
  price: string;
  image: string;
  releaseDate: string;
  totalPressing: number;
  currentOrders: number;
  description: string;
  limitedEdition?: boolean;
}

const PreOrderCard = ({
  id,
  title,
  artist,
  format,
  price,
  image,
  releaseDate,
  totalPressing,
  currentOrders,
  description,
  limitedEdition
}: PreOrderCardProps) => {
  const [isOrdering, setIsOrdering] = useState(false);
  const { addItem } = useCart();
  const { toast } = useToast();

  const remainingCopies = totalPressing - currentOrders;
  const progressPercentage = (currentOrders / totalPressing) * 100;
  const isAlmostSoldOut = remainingCopies <= totalPressing * 0.1; // Less than 10% remaining
  const isSoldOut = remainingCopies <= 0;

  const formatIcons = {
    vinyl: "🎵",
    cassette: "📼", 
    cd: "💿"
  };

  const handlePreOrder = async () => {
    if (isSoldOut) return;
    
    setIsOrdering(true);
    
    // Simulate pre-order processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const priceNumber = parseFloat(price.replace('$', ''));
    addItem({
      id: `preorder-${id}`,
      title: `[PRE-ORDER] ${title}`,
      artist,
      format,
      price: priceNumber,
      image
    });
    
    toast({
      title: "Pre-order secured! 🔥",
      description: `Your copy of ${title} has been reserved in the dark. You will be charged when it ships.`,
      duration: 3000,
    });
    
    setIsOrdering(false);
  };

  const getDaysUntilRelease = () => {
    const today = new Date();
    const release = new Date(releaseDate);
    const diffTime = release.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilRelease = getDaysUntilRelease();

  return (
    <Card className="group bg-card/80 backdrop-blur-sm border-border hover:border-accent transition-all duration-300 hover:shadow-blood overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative">
          <img 
            src={image} 
            alt={`${artist} - ${title}`}
            className="w-full h-48 object-cover"
          />
          
          {/* Overlay Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <Badge className="bg-accent text-accent-foreground text-xs">
              <Clock className="h-3 w-3 mr-1" />
              PRE-ORDER
            </Badge>
            {limitedEdition && (
              <Badge variant="destructive" className="text-xs">
                <Flame className="h-3 w-3 mr-1" />
                LIMITED
              </Badge>
            )}
            <Badge variant="outline" className="text-xs border-frost text-frost">
              {formatIcons[format]} {format.toUpperCase()}
            </Badge>
          </div>

          {/* Urgency Badge */}
          {isAlmostSoldOut && !isSoldOut && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-destructive text-destructive-foreground text-xs animate-pulse">
                <AlertTriangle className="h-3 w-3 mr-1" />
                ALMOST GONE
              </Badge>
            </div>
          )}

          {isSoldOut && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Badge variant="destructive" className="text-lg">
                SOLD OUT
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Product Info */}
        <div className="space-y-3">
          <div>
            <h3 className="gothic-heading text-lg font-semibold text-bone line-clamp-1">
              {title}
            </h3>
            <p className="text-muted-foreground">
              {artist}
            </p>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {description}
          </p>

          {/* Release Info */}
          <div className="bg-secondary/20 p-3 rounded border border-border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-bone">Release Date:</span>
              <span className="text-sm text-accent font-medium">
                {new Date(releaseDate).toLocaleDateString()}
              </span>
            </div>
            
            {daysUntilRelease > 0 ? (
              <p className="text-xs text-frost">
                {daysUntilRelease} days until darkness descends
              </p>
            ) : (
              <p className="text-xs text-accent">
                Released! Shipping now...
              </p>
            )}
          </div>

          {/* Pressing Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-bone flex items-center">
                <Users className="h-4 w-4 mr-1" />
                Pressing Progress
              </span>
              <span className="text-sm text-muted-foreground">
                {currentOrders} / {totalPressing}
              </span>
            </div>
            
            <Progress 
              value={progressPercentage} 
              className="h-2"
            />
            
            <div className="flex justify-between text-xs">
              <span className="text-frost">
                {remainingCopies} copies remaining
              </span>
              <span className="text-muted-foreground">
                {progressPercentage.toFixed(0)}% reserved
              </span>
            </div>
          </div>

          {/* Price and Action */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xl font-bold text-accent">
                {price}
              </span>
              <p className="text-xs text-muted-foreground">
                Charged when shipped
              </p>
            </div>
            
            <Button 
              onClick={handlePreOrder}
              disabled={isSoldOut || isOrdering}
              className={`gothic-heading ${
                isSoldOut 
                  ? "bg-muted text-muted-foreground cursor-not-allowed" 
                  : "bg-accent hover:bg-accent/90 text-accent-foreground"
              }`}
            >
              {isOrdering ? "Reserving..." : 
               isSoldOut ? "Sold Out" : 
               "Reserve Copy"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PreOrderCard;