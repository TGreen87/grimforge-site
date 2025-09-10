import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { catalog as catalogCopy } from "@/content/copy";
import { useState, useEffect } from "react";

interface Filters {
  searchTerm: string;
  selectedGenres: string[];
  priceRange: [number, number];
  grimnessLevel: [number];
  sortBy: string;
  inStock: boolean;
  limitedOnly: boolean;
}

interface CatalogFiltersProps {
  onFiltersChange: (filters: Filters) => void;
}

const CatalogFilters = ({ onFiltersChange }: CatalogFiltersProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [grimnessLevel, setGrimnessLevel] = useState<[number]>([50]);
  const [sortBy, setSortBy] = useState("featured");
  const [inStock, setInStock] = useState(false);
  const [limitedOnly, setLimitedOnly] = useState(false);

  const genres = [
    "Black Metal", "Death Metal", "Atmospheric Black Metal", 
    "Raw Black Metal", "Symphonic Black Metal", "DSBM",
    "War Metal", "Blackened Death", "Post-Black Metal"
  ];

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  // Update parent whenever filters change
  useEffect(() => {
    const filters: Filters = {
      searchTerm,
      selectedGenres,
      priceRange,
      grimnessLevel,
      sortBy,
      inStock,
      limitedOnly
    };
    onFiltersChange(filters);
  }, [searchTerm, selectedGenres, priceRange, grimnessLevel, sortBy, inStock, limitedOnly, onFiltersChange]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedGenres([]);
    setPriceRange([0, 100] as [number, number]);
    setGrimnessLevel([50] as [number]);
    setSortBy("featured");
    setInStock(false);
    setLimitedOnly(false);
  };

  return (
    <div className="bg-card/50 border border-border rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="gothic-heading text-lg text-bone flex items-center">
          <SlidersHorizontal className="h-5 w-5 mr-2 text-accent" />
          {catalogCopy.filterHeading}
        </h3>
        <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-muted-foreground hover:text-accent">
          <X className="h-4 w-4 mr-1" />
          Clear All
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Search */}
        <div className="space-y-2">
          <Label className="text-sm text-bone">{catalogCopy.searchLabel}</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Band, album, label..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-secondary/50 border-border"
            />
          </div>
        </div>

        {/* Sort */}
        <div className="space-y-2">
          <Label className="text-sm text-bone">{catalogCopy.sortByLabel}</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="bg-secondary/50 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="newest">Newest Arrivals</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="artist">Artist A-Z</SelectItem>
              <SelectItem value="grimness">{catalogCopy.intensityLabel}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Price range */}
        <div className="space-y-2">
          <Label className="text-sm text-bone">{catalogCopy.priceRangeLabel}</Label>
          <div className="px-2">
            <Slider
              value={priceRange}
              onValueChange={(value) => setPriceRange(value as [number, number])}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>${priceRange[0]}</span>
              <span>${priceRange[1]}</span>
            </div>
          </div>
        </div>

        {/* Intensity */}
        <div className="space-y-2">
          <Label className="text-sm text-bone">Intensity</Label>
          <div className="px-2">
            <Slider
              value={grimnessLevel}
              onValueChange={(value) => setGrimnessLevel(value as [number])}
              max={100}
              step={10}
              className="w-full"
            />
            <div className="text-center text-xs text-accent mt-1">
              {grimnessLevel[0] < 30 ? "Melodic" : 
               grimnessLevel[0] < 60 ? "Dark" : 
               grimnessLevel[0] < 80 ? "Grim" : "Pure Evil"}
            </div>
          </div>
        </div>
      </div>

      {/* Genre Tags */}
      <div className="mt-6">
        <Label className="text-sm text-bone mb-3 block">{catalogCopy.genresLabel}</Label>
        <div className="flex flex-wrap gap-2">
          {genres.map(genre => (
            <Badge
              key={genre}
              variant={selectedGenres.includes(genre) ? "default" : "outline"}
              className={`cursor-pointer transition-all ${
                selectedGenres.includes(genre) 
                  ? "bg-accent text-accent-foreground hover:bg-accent/90" 
                  : "border-frost text-frost hover:bg-frost hover:text-background"
              }`}
              onClick={() => handleGenreToggle(genre)}
            >
              {genre}
            </Badge>
          ))}
        </div>
      </div>

      {/* Quick Filters - Mobile responsive */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
        <Button
          variant={inStock ? "default" : "outline"}
          size="sm"
          onClick={() => setInStock(!inStock)}
          className={`w-full sm:w-auto ${inStock ? "bg-accent hover:bg-accent/90" : "border-frost text-frost hover:bg-frost hover:text-background"}`}
        >
          {catalogCopy.quickInStock}
        </Button>
        <Button
          variant={limitedOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setLimitedOnly(!limitedOnly)}
          className={`w-full sm:w-auto ${limitedOnly ? "bg-accent hover:bg-accent/90" : "border-frost text-frost hover:bg-frost hover:text-background"}`}
        >
          {catalogCopy.quickLimited}
        </Button>
      </div>
    </div>
  );
};

export default CatalogFilters;
