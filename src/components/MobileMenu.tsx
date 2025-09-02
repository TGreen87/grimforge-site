import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import AdvancedSearch from "./AdvancedSearch";
import { brand } from "@/config/brand";
import { navLinks } from "@/config/nav";

interface MobileMenuProps {
  scrollToSection: (id: string) => void;
  isAuthenticated: boolean;
}

const MobileMenu = ({ scrollToSection, isAuthenticated }: MobileMenuProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button aria-label="Open menu" variant="ghost" size="sm" className="md:hidden text-foreground hover:text-accent">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="bg-background border-border z-[100] w-80">
        <SheetHeader>
          <SheetTitle className="blackletter text-bone">{brand.name}</SheetTitle>
        </SheetHeader>

        <div className="mt-4">
          <AdvancedSearch />
        </div>

        <nav className="mt-6 space-y-2">
          {navLinks.map((link) => (
            <SheetClose asChild key={link.id}>
              <button
                onClick={() => scrollToSection(link.id)}
                className="w-full text-left px-3 py-2 rounded hover:bg-muted transition-colors"
                aria-label={`Go to ${link.label}`}
              >
                {link.label}
              </button>
            </SheetClose>
          ))}
          {isAuthenticated && (
            <SheetClose asChild>
              <a
                href="/admin"
                className="block w-full text-left px-3 py-2 rounded hover:bg-muted transition-colors"
                aria-label="Go to Admin"
              >
                Admin
              </a>
            </SheetClose>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;
