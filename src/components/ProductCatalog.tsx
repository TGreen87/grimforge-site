import ProductCard from "./ProductCard";
import CatalogFilters from "./CatalogFilters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
const album1 = "/assets/album-1.jpg";
const album2 = "/assets/album-2.jpg";
const album3 = "/assets/album-3.jpg";
const album4 = "/assets/album-4.jpg";
const album5 = "/assets/album-5.jpg";
const album6 = "/assets/album-6.jpg";
import { useState, useMemo, useEffect } from "react";
import { storageKeys, getJSON } from "@/lib/storage";

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
  // Enhanced mock data with more properties for filtering
  const allProducts = [
    {
      id: "mayhem-de-mysteriis",
      title: "De Mysteriis Dom Sathanas",
      artist: "Mayhem",
      format: "vinyl" as const,
      price: "$45.00",
      priceNumber: 45,
      image: album1,
      limited: true,
      inStock: true,
      genre: ["Black Metal", "Raw Black Metal"],
      grimness: 95,
      releaseYear: 1994,
      featured: true
    },
    {
      id: "burzum-hvis-lyset",
      title: "Hvis Lyset Tar Oss",
      artist: "Burzum", 
      format: "cassette" as const,
      price: "$25.00",
      priceNumber: 25,
      image: album2,
      inStock: true,
      genre: ["Atmospheric Black Metal", "Black Metal"],
      grimness: 85,
      releaseYear: 1994,
      featured: false
    },
    {
      id: "emperor-nightside",
      title: "In the Nightside Eclipse",
      artist: "Emperor",
      format: "cd" as const,
      price: "$18.00",
      priceNumber: 18,
      image: album3,
      inStock: true,
      genre: ["Symphonic Black Metal", "Black Metal"],
      grimness: 80,
      releaseYear: 1994,
      featured: true
    },
    {
      id: "darkthrone-transilvanian",
      title: "Transilvanian Hunger",
      artist: "Darkthrone",
      format: "vinyl" as const,
      price: "$42.00",
      priceNumber: 42,
      image: album4,
      preOrder: true,
      inStock: false,
      genre: ["Raw Black Metal", "Black Metal"],
      grimness: 90,
      releaseYear: 1994,
      featured: false
    },
    {
      id: "dissection-somberlain",
      title: "The Somberlain",
      artist: "Dissection",
      format: "vinyl" as const,
      price: "$48.00",
      priceNumber: 48,
      image: album5,
      inStock: true,
      genre: ["Blackened Death", "Black Metal"],
      grimness: 75,
      releaseYear: 1993,
      featured: true
    },
    {
      id: "darkthrone-funeral-moon",
      title: "Under a Funeral Moon",
      artist: "Darkthrone",
      format: "cassette" as const,
      price: "$22.00",
      priceNumber: 22,
      image: album6,
      limited: true,
      inStock: true,
      genre: ["Raw Black Metal", "Black Metal"],
      grimness: 92,
      releaseYear: 1993,
      featured: false
    }
  ];

  // Dynamically added products from Admin uploads (local storage)
  const dynamicProducts = useMemo(() => {
    const records = getJSON<any[]>(storageKeys.records, []);
    return records
      .filter((r) => r && (r.active ?? true))
      .map((r) => ({
        id: r.id,
        title: r.title ?? "Untitled",
        artist: r.artist ?? "Unknown",
        format: (r.format ?? "vinyl") as "vinyl" | "cassette" | "cd",
        price: `$${Number(r.price ?? 0).toFixed(2)}`,
        priceNumber: Number(r.price ?? 0),
        image: r.image ?? album1,
        limited: !!r.limited,
        preOrder: !!r.preOrder,
        inStock: Number(r.stock ?? 0) > 0,
        genre: Array.isArray(r.tags) ? r.tags : (typeof r.genre === "string" ? [r.genre] : []),
        grimness: 60,
        releaseYear: r.releaseYear ?? new Date().getFullYear(),
        featured: !!r.featured,
      }));
  }, []);

  const allProductsCombined = useMemo(() => [...allProducts, ...dynamicProducts], [dynamicProducts]);

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
            Discover the finest collection of black metal releases from legendary acts and underground hordes
          </p>
        </div>

        {/* Advanced Filters */}
        <CatalogFilters onFiltersChange={setFilters} />

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

          {/* Add invisible anchor points for navigation */}
          <div id="vinyl" className="absolute -top-20"></div>
          <div id="cassettes" className="absolute -top-20"></div>
          <div id="cds" className="absolute -top-20"></div>

          <TabsContent value="all">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  No albums found in the darkness... Try adjusting your filters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="vinyl">
            {vinylProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  No vinyl records match your dark desires...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {vinylProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cassette">
            {cassetteProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  No cassettes echo in the void...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {cassetteProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cd">
            {cdProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  No CDs shine in the moonlight...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {cdProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
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