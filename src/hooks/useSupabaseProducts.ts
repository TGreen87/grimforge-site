import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SupabaseProductRow {
  id: string;
  title?: string;
  artist?: string;
  format?: string;
  price?: number;
  image?: string;
  limited?: boolean;
  pre_order?: boolean;
  stock?: number;
  tags?: string[];
  release_year?: number;
  featured?: boolean;
}

export interface CatalogProduct {
  id: string;
  title: string;
  artist: string;
  format: "vinyl" | "cassette" | "cd";
  price: string;
  priceNumber: number;
  image: string;
  limited?: boolean;
  preOrder?: boolean;
  inStock: boolean;
  genre: string[];
  grimness: number;
  releaseYear: number;
  featured: boolean;
}

export function useSupabaseProducts() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);

  const mapRow = (r: SupabaseProductRow): CatalogProduct => ({
    id: r.id,
    title: r.title ?? "Untitled",
    artist: r.artist ?? "Unknown",
    format: (r.format ?? "vinyl") as "vinyl" | "cassette" | "cd",
    priceNumber: Number(r.price ?? 0),
    price: `$${Number(r.price ?? 0).toFixed(2)}`,
    image: r.image || "/assets/album-1.jpg",
    limited: !!r.limited,
    preOrder: !!r.pre_order,
    inStock: Number(r.stock ?? 0) > 0,
    genre: Array.isArray(r.tags) ? r.tags : [],
    grimness: 60,
    releaseYear: r.release_year ?? new Date().getFullYear(),
    featured: !!r.featured,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Failed to load products", error);
        return;
      }
      if (!isMounted) return;
      setProducts((data ?? []).map(mapRow));
    };

    fetchProducts();

    const channel = supabase
      .channel("public:products")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          // re-fetch on any change
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return products;
}
