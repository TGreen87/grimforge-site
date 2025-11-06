'use client'

import { Search } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import WishlistDrawer from "./WishlistDrawer";
import AdvancedSearch from "./AdvancedSearch";
import AuthModal from "./AuthModal";
import UserMenu from "./UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { brand } from "@/config/brand";
import { useActiveSection } from "@/hooks/useActiveSection";
import MobileMenu from "./MobileMenu";
import { navLinks } from "@/config/nav";
 
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
      <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
        {/* Logo - Desktop Only */}
        <div className="hidden md:flex items-center">
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <div className="relative h-8 w-auto">
              <Image
                src="/ORR_Logo.png"
                alt={brand.name}
                height={32}
                width={200}
                data-void-key="hero-logo"
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
                alt={brand.name}
                height={24}
                width={150}
                data-void-key="hero-logo"
                className="h-6 w-auto object-contain"
                priority
              />
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6" role="navigation" aria-label="Primary">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollToSection(link.id)}
              className={`text-foreground hover:text-accent transition-colors cursor-pointer ${activeId === link.id ? 'text-accent' : ''}`}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="hidden md:block">
            <AdvancedSearch />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-foreground hover:text-accent"
            aria-label="Open search"
          >
            <Search className="h-4 w-4" />
          </Button>
          <WishlistDrawer />
          {isAuthenticated ? (
            <>
              <a href="/admin" className="hidden md:block text-sm underline-offset-4 hover:underline" onClick={(e) => { e.preventDefault(); window.location.href = '/admin' }}>
                Admin
              </a>
              <UserMenu />
            </>
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
