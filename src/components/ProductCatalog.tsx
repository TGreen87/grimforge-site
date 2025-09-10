'use client'

import ProductCard from "./ProductCard";
import ComingSoonCard from "./ComingSoonCard";
import CatalogFilters from "./CatalogFilters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo, useEffect } from "react";
import { useSupabaseProducts } from "@/hooks/useSupabaseProducts";
import { catalog as catalogCopy } from "@/content/copy";

interface Filters {
  searchTerm: string;
  selectedGenres: string[];
  priceRange: [number, number];
  grimnessLevel: [number];
  sortBy: string;
  inStock: boolean;
  limitedOnly: boolean;
}

const ProductCatalog = () => {
  const [filters, setFilters] = useState<Filters>({
    searchTerm: "",
    selectedGenres: [],
    priceRange: [0, 100],
    grimnessLevel: [50],
    sortBy: "featured",
    inStock: false,
    limitedOnly: false
  });
  const [activeTab, setActiveTab] = useState("all");

  // Handle navigation from external sources
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'vinyl' || hash === 'cassettes' || hash === 'cds') {
        const tabValue = hash === 'cassettes' ? 'cassette' : hash === 'cds' ? 'cd' : hash;
        setActiveTab(tabValue);
      }
    };

    // Check initial hash
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  // Coming soon placeholders
  const comingSoonItems = [
    { id: "coming-soon-vinyl-1", format: "vinyl" as const },
    { id: "coming-soon-vinyl-2", format: "vinyl" as const },
    { id: "coming-soon-cassette-1", format: "cassette" as const },
    { id: "coming-soon-cassette-2", format: "cassette" as const },
    { id: "coming-soon-cd-1", format: "cd" as const },
  ];

  // Products from Supabase (live)
  const supabaseProducts = useSupabaseProducts();

  const allProductsCombined = useMemo(() => [...supabaseProducts], [supabaseProducts]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = allProductsCombined;

    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.title.toLowerCase().includes(searchLower) ||
        product.artist.toLowerCase().includes(searchLower) ||
        product.genre.some(g => g.toLowerCase().includes(searchLower))
      );
    }

    // Genre filter
    if (filters.selectedGenres.length > 0) {
      filtered = filtered.filter(product =>
        filters.selectedGenres.some(genre => product.genre.includes(genre))
      );
    }

    // Price range filter
    filtered = filtered.filter(product =>
      product.priceNumber >= filters.priceRange[0] && 
      product.priceNumber <= filters.priceRange[1]
    );

    // Grimness filter
    const [grimnessMin] = filters.grimnessLevel;
    filtered = filtered.filter(product => product.grimness >= grimnessMin);

    // In stock filter
    if (filters.inStock) {
      filtered = filtered.filter(product => product.inStock);
    }

    // Limited edition filter
    if (filters.limitedOnly) {
      filtered = filtered.filter(product => product.limited);
    }

    // Format filter (from tab)
    if (activeTab !== "all") {
      filtered = filtered.filter(product => product.format === activeTab);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "price-low":
          return a.priceNumber - b.priceNumber;
        case "price-high":
          return b.priceNumber - a.priceNumber;
        case "artist":
          return a.artist.localeCompare(b.artist);
        case "grimness":
          return b.grimness - a.grimness;
        case "newest":
          return b.releaseYear - a.releaseYear;
        case "featured":
        default:
          return b.featured ? 1 : -1;
      }
    });

    return filtered;
  }, [filters, activeTab, allProductsCombined]);

  const vinylProducts = filteredProducts.filter(p => p.format === "vinyl");
  const cassetteProducts = filteredProducts.filter(p => p.format === "cassette");
  const cdProducts = filteredProducts.filter(p => p.format === "cd");

  return (
    <section id="catalog" className="py-20 px-4">
      <div className="container mx-auto">
        {/* Section Header - Mobile optimized */}
        <div className="text-center mb-8 md:mb-16">
          <h2 className="blackletter text-3xl md:text-5xl lg:text-6xl mb-3 md:mb-4 text-bone">
            Catalog
          </h2>
          <div className="w-16 md:w-24 h-1 blood-accent mx-auto mb-4 md:mb-6"></div>
          <p className="text-base md:text-lg text-muted-foreground max-w-xl md:max-w-2xl mx-auto px-4">
            Explore new and classic black metal releases from independent and underground artists.
          </p>
        </div>

        {/* Advanced Filters */}
        <CatalogFilters onFiltersChange={setFilters} onReset={() => setActiveTab('all')} />

        {/* Format Tabs - Mobile responsive */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6 md:mb-8 bg-secondary/50">
            <TabsTrigger value="all" className="gothic-heading text-xs md:text-sm">
              <span className="hidden sm:inline">All Formats</span>
              <span className="sm:hidden">All</span> ({filteredProducts.length})
            </TabsTrigger>
            <TabsTrigger value="vinyl" className="gothic-heading text-xs md:text-sm">
              Vinyl ({vinylProducts.length})
            </TabsTrigger>
            <TabsTrigger value="cassette" className="gothic-heading text-xs md:text-sm">
              <span className="hidden sm:inline">Cassettes</span>
              <span className="sm:hidden">Tapes</span> ({cassetteProducts.length})
            </TabsTrigger>
            <TabsTrigger value="cd" className="gothic-heading text-xs md:text-sm">
              CDs ({cdProducts.length})
            </TabsTrigger>
          </TabsList>

          {/* Anchor points for footer navigation (scrolls into view) */}
          <div id="vinyl" className="block h-0 scroll-mt-24" />
          <div id="cassettes" className="block h-0 scroll-mt-24" />
          <div id="cds" className="block h-0 scroll-mt-24" />

          <TabsContent value="all">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">{catalogCopy.emptyState}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
                {comingSoonItems.map((item) => (
                  <ComingSoonCard key={item.id} format={item.format} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="vinyl">
            {vinylProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">{catalogCopy.emptyState}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {vinylProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
                {comingSoonItems.filter(item => item.format === "vinyl").map((item) => (
                  <ComingSoonCard key={item.id} format={item.format} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cassette">
            {cassetteProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">{catalogCopy.emptyState}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {cassetteProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
                {comingSoonItems.filter(item => item.format === "cassette").map((item) => (
                  <ComingSoonCard key={item.id} format={item.format} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cd">
            {cdProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">{catalogCopy.emptyState}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {cdProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
                {comingSoonItems.filter(item => item.format === "cd").map((item) => (
                  <ComingSoonCard key={item.id} format={item.format} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default ProductCatalog;
