import { ShoppingCart, Search, Menu, Skull } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CartDrawer from "./CartDrawer";
import WishlistDrawer from "./WishlistDrawer";
import AdvancedSearch from "./AdvancedSearch";
import AuthModal from "./AuthModal";
import UserMenu from "./UserMenu";
import { useAuth } from "@/contexts/AuthContext";

const Navigation = () => {
  const { isAuthenticated } = useAuth();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };
  return (
    <nav className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Skull className="h-8 w-8 text-accent" />
          <Link to="/" className="blackletter text-2xl text-bone hover:text-accent transition-colors">
            Black Ritual Records
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <button 
            onClick={() => scrollToSection('catalog')}
            className="text-foreground hover:text-accent transition-colors cursor-pointer"
          >
            Catalog
          </button>
          <button 
            onClick={() => scrollToSection('vinyl')}
            className="text-foreground hover:text-accent transition-colors cursor-pointer"
          >
            Vinyl
          </button>
          <button 
            onClick={() => scrollToSection('cassettes')}
            className="text-foreground hover:text-accent transition-colors cursor-pointer"
          >
            Cassettes
          </button>
          <button 
            onClick={() => scrollToSection('cds')}
            className="text-foreground hover:text-accent transition-colors cursor-pointer"
          >
            CDs
          </button>
          <button 
            onClick={() => scrollToSection('grimoire')}
            className="text-foreground hover:text-accent transition-colors cursor-pointer"
          >
            Grimoire
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:block">
            <AdvancedSearch />
          </div>
          <Button variant="ghost" size="sm" className="md:hidden text-foreground hover:text-accent">
            <Search className="h-4 w-4" />
          </Button>
          <WishlistDrawer />
          <CartDrawer />
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <AuthModal />
          )}
          <Button variant="ghost" size="sm" className="md:hidden text-foreground hover:text-accent">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;