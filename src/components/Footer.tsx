'use client'

import { Facebook, Instagram, Mail } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { brand } from "@/config/brand";
import NewsletterSignup from "@/components/NewsletterSignup";
import { footer as footerCopy } from "@/content/copy";

const Footer = () => {
  const pathname = usePathname();
  const router = useRouter();

  const scrollToSection = (sectionId: string) => {
    // Use hash navigation so the browser scrolls to anchors reliably
    router.push(`/#${sectionId}`);
  };
  return (
    <footer className="bg-background/95 border-t border-border mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="blackletter text-xl text-bone">{brand.name}</span>
            </div>
            <p className="text-muted-foreground text-sm">{footerCopy.tagline}</p>
            <div className="flex space-x-4">
              <Facebook className="h-5 w-5 text-muted-foreground hover:text-accent cursor-pointer transition-colors" />
              <Instagram className="h-5 w-5 text-muted-foreground hover:text-accent cursor-pointer transition-colors" />
              <Mail className="h-5 w-5 text-muted-foreground hover:text-accent cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Catalog */}
          <div className="space-y-4">
            <h3 className="gothic-heading text-bone">Catalog</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => scrollToSection('catalog')} className="hover:text-accent transition-colors text-left">New arrivals</button></li>
              <li><button onClick={() => scrollToSection('vinyl')} className="hover:text-accent transition-colors text-left">Vinyl Records</button></li>
              <li><button onClick={() => scrollToSection('cassettes')} className="hover:text-accent transition-colors text-left">Cassettes</button></li>
              <li><button onClick={() => scrollToSection('cds')} className="hover:text-accent transition-colors text-left">Compact Discs</button></li>
              <li><button onClick={() => scrollToSection('catalog')} className="hover:text-accent transition-colors text-left">Limited editions</button></li>
            </ul>
          </div>

          {/* Information */}
          <div className="space-y-4">
            <h3 className="gothic-heading text-bone">Information</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/legal/shipping" className="hover:text-accent transition-colors">Shipping Info</Link></li>
              <li><Link href="/legal/returns" className="hover:text-accent transition-colors">Returns</Link></li>
              <li><Link href="/legal/size-guide" className="hover:text-accent transition-colors">Size Guide</Link></li>
              <li><Link href="/legal/care" className="hover:text-accent transition-colors">Care Instructions</Link></li>
              <li><Link href="/legal/contact" className="hover:text-accent transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="gothic-heading text-bone">{footerCopy.cta}</h3>
            <p className="text-sm text-muted-foreground">Subscribe for new releases and limited runs.</p>
            <NewsletterSignup />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Obsidian Rite Records. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/legal/privacy" className="text-sm text-muted-foreground hover:text-accent transition-colors">
              Privacy Policy
            </Link>
            <Link href="/legal/terms" className="text-sm text-muted-foreground hover:text-accent transition-colors">
              Terms of Service
            </Link>
            <Link href="/legal/shipping" className="text-sm text-muted-foreground hover:text-accent transition-colors">
              Shipping Info
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
