import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, TrendingUp, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SearchResult {
  id: string;
  title: string;
  artist: string;
  format: string;
  price: number;
  image: string;
  genre: string;
}

interface SearchSuggestion {
  type: "product" | "artist" | "genre" | "recent";
  text: string;
  count?: number;
}

// Mock search data
const mockProducts: SearchResult[] = [
  { id: "1", title: "Eternal Darkness", artist: "Shadowmoon", format: "Vinyl", price: 34.99, image: "/assets/album-1.jpg", genre: "Black Metal" },
  { id: "2", title: "Blood Moon Rising", artist: "Crimson Tide", format: "CD", price: 18.99, image: "/assets/album-2.jpg", genre: "Death Metal" },
  { id: "3", title: "Necromantic Ritual", artist: "Death's Embrace", format: "Cassette", price: 24.99, image: "/assets/album-3.jpg", genre: "Black Metal" },
  { id: "4", title: "Shadow's Call", artist: "Void Walker", format: "Vinyl", price: 39.99, image: "/assets/album-4.jpg", genre: "Doom Metal" },
  { id: "5", title: "Dark Prophecy", artist: "Nightmare Lord", format: "CD", price: 21.99, image: "/assets/album-5.jpg", genre: "Gothic Metal" },
];

const trendingSearches = [
  "Black Metal", "Vinyl Records", "Limited Edition", "Death Metal", "Doom Metal"
];

const recentSearches = [
  "Shadowmoon", "Eternal Darkness", "Black Metal Vinyl"
];

interface AdvancedSearchProps {
  onSearchResults?: (results: SearchResult[]) => void;
  placeholder?: string;
  className?: string;
}

const AdvancedSearch = ({ onSearchResults, placeholder = "Search for dark treasures...", className = "" }: AdvancedSearchProps) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Generate suggestions based on query
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([
        ...trendingSearches.map(term => ({ type: "genre" as const, text: term, count: Math.floor(Math.random() * 50) + 10 })),
        ...recentSearches.map(term => ({ type: "recent" as const, text: term }))
      ]);
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    // Simulate API delay
    const timeoutId = setTimeout(() => {
      const searchQuery = query.toLowerCase();
      
      // Generate suggestions
      const productSuggestions = mockProducts
        .filter(p => p.title.toLowerCase().includes(searchQuery) || p.artist.toLowerCase().includes(searchQuery))
        .slice(0, 3)
        .map(p => ({ type: "product" as const, text: `${p.title} - ${p.artist}` }));
      
      const artistSuggestions = [...new Set(mockProducts
        .filter(p => p.artist.toLowerCase().includes(searchQuery))
        .map(p => p.artist))]
        .slice(0, 2)
        .map(artist => ({ type: "artist" as const, text: artist, count: Math.floor(Math.random() * 20) + 5 }));
      
      const genreSuggestions = [...new Set(mockProducts
        .filter(p => p.genre.toLowerCase().includes(searchQuery))
        .map(p => p.genre))]
        .slice(0, 2)
        .map(genre => ({ type: "genre" as const, text: genre, count: Math.floor(Math.random() * 30) + 10 }));

      setSuggestions([...productSuggestions, ...artistSuggestions, ...genreSuggestions]);
      
      // Generate search results
      const searchResults = mockProducts.filter(product => 
        product.title.toLowerCase().includes(searchQuery) ||
        product.artist.toLowerCase().includes(searchQuery) ||
        product.genre.toLowerCase().includes(searchQuery)
      );
      
      setResults(searchResults);
      onSearchResults?.(searchResults);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, onSearchResults]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    onSearchResults?.([]);
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case "product": return <Search className="h-4 w-4" />;
      case "artist": return <TrendingUp className="h-4 w-4" />;
      case "genre": return <TrendingUp className="h-4 w-4" />;
      case "recent": return <Clock className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const getSuggestionLabel = (type: string) => {
    switch (type) {
      case "product": return "Product";
      case "artist": return "Artist";
      case "genre": return "Genre";
      case "recent": return "Recent";
      default: return "";
    }
  };

  return (
    <div ref={searchRef} className={`relative w-full max-w-lg ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10 bg-background border-border focus:border-accent"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Search Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading && (
            <div className="p-4 text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mx-auto mb-2"></div>
              Searching the darkness...
            </div>
          )}

          {!isLoading && suggestions.length > 0 && (
            <div className="p-2">
              {!query && (
                <>
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Trending Searches
                  </div>
                  {suggestions.filter(s => s.type === "genre").map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted rounded-md"
                    >
                      <TrendingUp className="h-4 w-4 text-accent" />
                      <span>{suggestion.text}</span>
                      {suggestion.count && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {suggestion.count}
                        </Badge>
                      )}
                    </button>
                  ))}

                  {suggestions.filter(s => s.type === "recent").length > 0 && (
                    <>
                      <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mt-4">
                        Recent Searches
                      </div>
                      {suggestions.filter(s => s.type === "recent").map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted rounded-md"
                        >
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{suggestion.text}</span>
                        </button>
                      ))}
                    </>
                  )}
                </>
              )}

              {query && suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted rounded-md"
                >
                  {getSuggestionIcon(suggestion.type)}
                  <div className="flex-1">
                    <span>{suggestion.text}</span>
                    {suggestion.type !== "product" && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {getSuggestionLabel(suggestion.type)}
                      </Badge>
                    )}
                  </div>
                  {suggestion.count && (
                    <Badge variant="secondary" className="text-xs">
                      {suggestion.count}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          )}

          {!isLoading && query && results.length > 0 && (
            <div className="border-t border-border p-2">
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Products ({results.length})
              </div>
              {results.slice(0, 5).map((result) => (
                <button
                  key={result.id}
                  onClick={() => navigate(`/product/${result.id}`)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted rounded-md"
                >
                  <img 
                    src={result.image} 
                    alt={result.title}
                    className="w-10 h-10 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{result.title}</div>
                    <div className="text-sm text-muted-foreground">{result.artist}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${result.price}</div>
                    <Badge variant="outline" className="text-xs">
                      {result.format}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isLoading && query && results.length === 0 && suggestions.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No results found for "{query}"
              <div className="text-sm mt-1">Try different keywords or browse our catalog</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;