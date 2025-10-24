'use client'

import { Facebook, Instagram, Mail } from "lucide-react";
import Link from "next/link";
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
              <li>{atHome ? <a href="#catalog" className="hover:text-accent transition-colors text-left">New arrivals</a> : <Link href="/#catalog" className="hover:text-accent transition-colors text-left">New arrivals</Link>}</li>
              <li>{atHome ? <a href="#vinyl" className="hover:text-accent transition-colors text-left">Vinyl Records</a> : <Link href="/#vinyl" className="hover:text-accent transition-colors text-left">Vinyl Records</Link>}</li>
              <li>{atHome ? <a href="#cassettes" className="hover:text-accent transition-colors text-left">Cassettes</a> : <Link href="/#cassettes" className="hover:text-accent transition-colors text-left">Cassettes</Link>}</li>
              <li>{atHome ? <a href="#cds" className="hover:text-accent transition-colors text-left">Compact Discs</a> : <Link href="/#cds" className="hover:text-accent transition-colors text-left">Compact Discs</Link>}</li>
              <li>{atHome ? <a href="#catalog" className="hover:text-accent transition-colors text-left">Limited editions</a> : <Link href="/#catalog" className="hover:text-accent transition-colors text-left">Limited editions</Link>}</li>
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
