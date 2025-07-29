import { Skull, Facebook, Instagram, Twitter, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-background/95 border-t border-border mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Skull className="h-6 w-6 text-accent" />
              <span className="blackletter text-xl text-bone">Black Plague Records</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Australia's premier distributor of underground black metal since the darkness began.
            </p>
            <div className="flex space-x-4">
              <Facebook className="h-5 w-5 text-muted-foreground hover:text-accent cursor-pointer transition-colors" />
              <Instagram className="h-5 w-5 text-muted-foreground hover:text-accent cursor-pointer transition-colors" />
              <Twitter className="h-5 w-5 text-muted-foreground hover:text-accent cursor-pointer transition-colors" />
              <Mail className="h-5 w-5 text-muted-foreground hover:text-accent cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Catalog */}
          <div className="space-y-4">
            <h3 className="gothic-heading text-bone">Catalog</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/?section=catalog" className="hover:text-accent transition-colors">New Arrivals</Link></li>
              <li><Link to="/?section=vinyl" className="hover:text-accent transition-colors">Vinyl Records</Link></li>
              <li><Link to="/?section=cassettes" className="hover:text-accent transition-colors">Cassette Tapes</Link></li>
              <li><Link to="/?section=cds" className="hover:text-accent transition-colors">Compact Discs</Link></li>
              <li><Link to="/?section=catalog" className="hover:text-accent transition-colors">Limited Editions</Link></li>
            </ul>
          </div>

          {/* Information */}
          <div className="space-y-4">
            <h3 className="gothic-heading text-bone">Information</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/legal/shipping" className="hover:text-accent transition-colors">Shipping Info</Link></li>
              <li><Link to="/legal/returns" className="hover:text-accent transition-colors">Returns</Link></li>
              <li><Link to="/legal/size-guide" className="hover:text-accent transition-colors">Size Guide</Link></li>
              <li><Link to="/legal/care" className="hover:text-accent transition-colors">Care Instructions</Link></li>
              <li><Link to="/legal/contact" className="hover:text-accent transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="gothic-heading text-bone">Join the Cult</h3>
            <p className="text-sm text-muted-foreground">
              Subscribe for news of the latest releases from the underground.
            </p>
            <div className="flex">
              <input 
                type="email" 
                placeholder="Enter your email"
                className="flex-1 px-3 py-2 bg-secondary border border-border rounded-l text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button className="px-4 py-2 bg-accent text-accent-foreground rounded-r hover:bg-accent/90 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © 2024 Black Plague Records. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/legal/privacy" className="text-sm text-muted-foreground hover:text-accent transition-colors">
              Privacy Policy
            </Link>
            <Link to="/legal/terms" className="text-sm text-muted-foreground hover:text-accent transition-colors">
              Terms of Service
            </Link>
            <Link to="/legal/shipping" className="text-sm text-muted-foreground hover:text-accent transition-colors">
              Shipping Info
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;