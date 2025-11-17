'use client'

import { Facebook, Instagram, Mail } from "lucide-react";
import { usePathname } from "next/navigation";
import { brand } from "@/config/brand";
import NewsletterSignup from "@/components/NewsletterSignup";
import { footer as footerCopy } from "@/content/copy";
import { toggleVoidMode } from "@/components/fx/VoidToggle";

const Footer = () => {
  const pathname = usePathname();
  const atHome = pathname === '/';
  return (
    <footer className="bg-background/95 border-t border-border mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div>
              <button
                type="button"
                aria-label="Toggle Void Mode"
                onClick={() => toggleVoidMode()}
                className="flex items-center space-x-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-accent"
              >
                <span className="blackletter text-xl text-bone">{brand.name}</span>
              </button>
            </div>
            <p className="text-muted-foreground text-sm">{footerCopy.tagline}</p>
            <div className="flex space-x-4">
              {Boolean(brand.socials.facebook) && (
                <a
                  href={brand.socials.facebook}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Follow on Facebook"
                >
                  <Facebook className="h-5 w-5 text-muted-foreground hover:text-accent transition-colors" />
                </a>
              )}
              <a
                href={brand.socials.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Follow on Instagram"
              >
                <Instagram className="h-5 w-5 text-muted-foreground hover:text-accent transition-colors" />
              </a>
              <a
                href="mailto:arg@obsidianriterecords.com"
                aria-label="Email Obsidian Rite Records"
              >
                <Mail className="h-5 w-5 text-muted-foreground hover:text-accent transition-colors" />
              </a>
            </div>
          </div>

          {/* Catalog */}
          <div className="space-y-4">
            <h3 className="gothic-heading text-bone">Catalog</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href={atHome ? '#catalog' : '/#catalog'} className="hover:text-accent transition-colors text-left">New arrivals</a></li>
              <li><a href={atHome ? '#vinyl' : '/#vinyl'} className="hover:text-accent transition-colors text-left">Vinyl Records</a></li>
              <li><a href={atHome ? '#cassettes' : '/#cassettes'} className="hover:text-accent transition-colors text-left">Cassettes</a></li>
              <li><a href={atHome ? '#cds' : '/#cds'} className="hover:text-accent transition-colors text-left">Compact Discs</a></li>
              <li><a href={atHome ? '#catalog' : '/#catalog'} className="hover:text-accent transition-colors text-left">Limited editions</a></li>
            </ul>
          </div>

          {/* Information */}
          <div className="space-y-4">
            <h3 className="gothic-heading text-bone">Information</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/legal/shipping" className="hover:text-accent transition-colors">Shipping Info</a></li>
              <li><a href="/legal/returns" className="hover:text-accent transition-colors">Returns</a></li>
              <li><a href="/legal/size-guide" className="hover:text-accent transition-colors">Size Guide</a></li>
              <li><a href="/legal/care" className="hover:text-accent transition-colors">Care Instructions</a></li>
              <li><a href="/legal/contact" className="hover:text-accent transition-colors">Contact</a></li>
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
            <a href="/legal/privacy" className="text-sm text-muted-foreground hover:text-accent transition-colors">
              Privacy Policy
            </a>
            <a href="/legal/terms" className="text-sm text-muted-foreground hover:text-accent transition-colors">
              Terms of Service
            </a>
            <a href="/legal/shipping" className="text-sm text-muted-foreground hover:text-accent transition-colors">
              Shipping Info
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
