"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import ProductCard from "./ProductCard";

interface Product {
  id: string;
  title: string;
  artist: string;
  format: "vinyl" | "cassette" | "cd";
  price: string;
  image: string;
  genre: string;
  limited?: boolean;
  preOrder?: boolean;
}

interface RecommendationEngineProps {
  currentProductId?: string;
  userGenres?: string[];
  userPurchaseHistory?: string[];
  className?: string;
}

// Empty recommendations - will show coming soon message
const mockProducts: Product[] = [];

const RecommendationEngine = ({ 
  currentProductId, 
  userGenres = ["Black Metal", "Death Metal"], 
  userPurchaseHistory = [],
  className = ""
}: RecommendationEngineProps) => {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [recommendationType, setRecommendationType] = useState<string>("");

  useEffect(() => {
    const generateRecommendations = () => {
      let recommended: Product[] = [];
      let type = "";

      if (currentProductId) {
        // Product page recommendations
        const currentProduct = mockProducts.find(p => p.id === currentProductId);
        if (currentProduct) {
          // Same artist recommendations
          const sameArtist = mockProducts.filter(p => 
            p.artist === currentProduct.artist && p.id !== currentProductId
          );
          
          // Same genre recommendations  
          const sameGenre = mockProducts.filter(p => 
            p.genre === currentProduct.genre && 
            p.id !== currentProductId && 
            !sameArtist.find(sa => sa.id === p.id)
          );

          // Format preferences (if user likes vinyl, recommend more vinyl)
          const sameFormat = mockProducts.filter(p => 
            p.format === currentProduct.format && 
            p.id !== currentProductId &&
            !sameArtist.find(sa => sa.id === p.id) &&
            !sameGenre.find(sg => sg.id === p.id)
          );

          recommended = [
            ...sameArtist.slice(0, 2),
            ...sameGenre.slice(0, 2), 
            ...sameFormat.slice(0, 2)
          ].slice(0, 6);

          type = currentProduct.artist;
        }
      } else {
        // Homepage recommendations based on user preferences
        const genreRecommendations = mockProducts.filter(p => 
          userGenres.includes(p.genre) && 
          !userPurchaseHistory.includes(p.id)
        );

        // Add some trending/featured items
        const trending = mockProducts.filter(p => p.limited || p.preOrder);

        recommended = [
          ...genreRecommendations.slice(0, 4),
          ...trending.slice(0, 2)
        ].slice(0, 6);

        type = "your dark tastes";
      }

      // Add some randomization to keep it fresh - ensure unique IDs
      const shuffled = recommended.sort(() => Math.random() - 0.5);
      const unique = shuffled.filter((item, index, self) =>
        index === self.findIndex((i) => i.id === item.id)
      );

      setRecommendations(unique);
      setRecommendationType(type);
    };

    generateRecommendations();
  }, [currentProductId, userGenres, userPurchaseHistory]);

  // Show coming soon message when no recommendations
  if (recommendations.length === 0) {
    return (
      <Card className={`bg-card/50 border-border ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            More releases coming soon
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            New releases will appear here as the catalog grows.
          </p>
        </CardHeader>
      </Card>
    );
  }

  const getRecommendationTitle = () => {
    if (currentProductId) {
      return `More from ${recommendationType}`;
    }
    return "Recommended for You";
  };

  const getRecommendationSubtitle = () => {
    if (currentProductId) {
      return "Discover more dark treasures from this realm";
    }
    return `Curated based on ${recommendationType}`;
  };

  return (
    <Card className={`bg-card/50 border-border ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          {getRecommendationTitle()}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {getRecommendationSubtitle()}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              title={product.title}
              artist={product.artist}
              format={product.format}
              price={product.price}
              image={product.image}
              limited={product.limited}
              preOrder={product.preOrder}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecommendationEngine;
