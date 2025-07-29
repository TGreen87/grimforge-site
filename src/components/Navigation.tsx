import { ShoppingCart, Search, Menu, Skull } from "lucide-react";
import { Button } from "@/components/ui/button";
import CartDrawer from "./CartDrawer";
import AuthModal from "./AuthModal";
import UserMenu from "./UserMenu";
import { useAuth } from "@/contexts/AuthContext";

const Navigation = () => {
  const { isAuthenticated } = useAuth();
  return (
    <nav className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Skull className="h-8 w-8 text-accent" />
          <span className="blackletter text-2xl text-bone">Black Plague Records</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <a href="#catalog" className="text-foreground hover:text-accent transition-colors">
            Catalog
          </a>
          <a href="#vinyl" className="text-foreground hover:text-accent transition-colors">
            Vinyl
          </a>
          <a href="#cassettes" className="text-foreground hover:text-accent transition-colors">
            Cassettes
          </a>
          <a href="#cds" className="text-foreground hover:text-accent transition-colors">
            CDs
          </a>
          <a href="#grimoire" className="text-foreground hover:text-accent transition-colors">
            Grimoire
          </a>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="text-foreground hover:text-accent">
            <Search className="h-4 w-4" />
          </Button>
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