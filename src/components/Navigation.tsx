'use client'

import { ShoppingCart, Search, Menu } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import CartDrawer from "./CartDrawer";
import WishlistDrawer from "./WishlistDrawer";
import AdvancedSearch from "./AdvancedSearch";
import AuthModal from "./AuthModal";
import UserMenu from "./UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { brand } from "@/config/brand";
import { useActiveSection } from "@/hooks/useActiveSection";
import MobileMenu from "./MobileMenu";
 
const Navigation = () => {
  const { isAuthenticated } = useAuth();
  const sectionIds = ["catalog", "vinyl", "cassettes", "cds", "grimoire", "preorders"];
  const activeId = useActiveSection(sectionIds);
 
  const scrollToSection = (sectionId: string) => {
    // For format-specific sections, set hash and scroll to catalog
    if (sectionId === 'vinyl' || sectionId === 'cassettes' || sectionId === 'cds') {
      window.location.hash = sectionId;
      const catalogElement = document.getElementById('catalog');
      if (catalogElement) {
        const y = catalogElement.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        const y = element.getBoundingClientRect().top + window.pageYOffset - 80; // header offset
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  };
  return (
    <nav className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo - Desktop Only */}
        <div className="hidden md:flex items-center">
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <div className="relative h-8 w-auto">
              <Image 
                src="/ORR_Logo.png" 
                alt="Obsidian Rite Records" 
                height={32}
                width={120}
                className="h-8 w-auto object-contain"
                priority
              />
            </div>
          </Link>
        </div>

        {/* Mobile Logo */}
        <div className="flex md:hidden items-center">
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <div className="relative h-6 w-auto">
              <Image 
                src="/ORR_Logo.png" 
                alt="Obsidian Rite Records" 
                height={24}
                width={90}
                className="h-6 w-auto object-contain"
                priority
              />
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8" role="navigation" aria-label="Primary">
          <button 
            onClick={() => scrollToSection('catalog')}
            className={`text-foreground hover:text-accent transition-colors cursor-pointer ${activeId === 'catalog' ? 'text-accent' : ''}`}
          >
            Catalog
          </button>
          <button 
            onClick={() => scrollToSection('vinyl')}
            className={`text-foreground hover:text-accent transition-colors cursor-pointer ${activeId === 'vinyl' ? 'text-accent' : ''}`}
          >
            Vinyl
          </button>
          <button 
            onClick={() => scrollToSection('cassettes')}
            className={`text-foreground hover:text-accent transition-colors cursor-pointer ${activeId === 'cassettes' ? 'text-accent' : ''}`}
          >
            Cassettes
          </button>
          <button 
            onClick={() => scrollToSection('cds')}
            className={`text-foreground hover:text-accent transition-colors cursor-pointer ${activeId === 'cds' ? 'text-accent' : ''}`}
          >
            CDs
          </button>
          <button 
            onClick={() => scrollToSection('grimoire')}
            className={`text-foreground hover:text-accent transition-colors cursor-pointer ${activeId === 'grimoire' ? 'text-accent' : ''}`}
          >
            Grimoire
          </button>
          <button 
            onClick={() => scrollToSection('preorders')}
            className={`text-foreground hover:text-accent transition-colors cursor-pointer ${activeId === 'preorders' ? 'text-accent' : ''}`}
          >
            Pre-orders
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
          <MobileMenu scrollToSection={scrollToSection} isAuthenticated={isAuthenticated} />
        </div>
      </div>
    </nav>
  );
};

export default Navigation;