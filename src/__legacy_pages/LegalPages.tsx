import { useParams, Navigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const LegalPages = () => {
  const { page } = useParams<{ page: string }>();

  const legalContent = {
    privacy: {
      title: "Privacy Policy",
      lastUpdated: "January 2024",
      content: `
        <h2>Information We Collect</h2>
        <p>At Black Ritual Records, we collect information you provide directly to us, such as when you create an account, make a purchase, or contact us.</p>
        
        <h2>How We Use Your Information</h2>
        <p>We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.</p>
        
        <h2>Information Sharing</h2>
        <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.</p>
        
        <h2>Data Security</h2>
        <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
        
        <h2>Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at arg@obsidianriterecords.com</p>
      `
    },
    terms: {
      title: "Terms of Service",
      lastUpdated: "January 2024",
      content: `
        <h2>Acceptance of Terms</h2>
        <p>By accessing and using Black Ritual Records, you accept and agree to be bound by the terms and provision of this agreement.</p>
        
        <h2>Products and Services</h2>
        <p>All products are subject to availability. We reserve the right to discontinue any product at any time.</p>
        
        <h2>Pricing and Payment</h2>
        <p>All prices are in USD and subject to change without notice. Payment must be received in full before shipping.</p>
        
        <h2>Shipping and Returns</h2>
        <p>We ship worldwide. Return policy allows for returns within 30 days of purchase for unopened items.</p>
        
        <h2>Limitation of Liability</h2>
        <p>Black Ritual Records shall not be liable for any indirect, incidental, special, consequential, or punitive damages.</p>
        
        <h2>Contact Information</h2>
        <p>For questions regarding these terms, contact us at arg@obsidianriterecords.com</p>
      `
    },
    shipping: {
      title: "Shipping Information",
      lastUpdated: "January 2024",
      content: `
        <h2>Shipping Methods</h2>
        <p>We offer three shipping tiers to suit your dark desires:</p>
        <ul>
          <li><strong>Standard Summoning (5-7 days):</strong> $5.99</li>
          <li><strong>Express Ritual (2-3 days):</strong> $12.99</li>
          <li><strong>Overnight Conjuring (1 day):</strong> $24.99</li>
        </ul>
        
        <h2>International Shipping</h2>
        <p>We ship to most countries worldwide. International shipping rates calculated at checkout.</p>
        
        <h2>Processing Time</h2>
        <p>Orders are typically processed within 1-2 business days. Pre-orders may have extended processing times.</p>
        
        <h2>Packaging</h2>
        <p>All items are carefully packaged to ensure they arrive in perfect condition. Vinyl records are shipped in protective mailers.</p>
        
        <h2>Tracking</h2>
        <p>All orders include tracking information. You will receive a tracking number via email once your order ships.</p>
      `
    },
    returns: {
      title: "Returns & Refunds",
      lastUpdated: "January 2024",
      content: `
        <h2>Return Policy</h2>
        <p>We accept returns within 30 days of purchase for unopened items in original condition.</p>
        
        <h2>Refund Process</h2>
        <p>Refunds will be processed to your original payment method within 5-10 business days of receiving the returned item.</p>
        
        <h2>Return Shipping</h2>
        <p>Customers are responsible for return shipping costs unless the item was damaged or defective upon arrival.</p>
        
        <h2>Damaged Items</h2>
        <p>If you receive a damaged item, please contact us immediately with photos. We will provide a replacement or full refund.</p>
        
        <h2>How to Return</h2>
        <p>Contact our customer service at arg@obsidianriterecords.com to initiate a return and receive instructions.</p>
        
        <h2>Non-Returnable Items</h2>
        <p>Opened vinyl records, CDs, and cassettes cannot be returned unless defective. Digital downloads are non-returnable.</p>
      `
    },
    "size-guide": {
      title: "Size Guide",
      lastUpdated: "January 2024",
      content: `
        <h2>Vinyl Record Sizes</h2>
        <ul>
          <li><strong>12" LP:</strong> Standard album format (33⅓ RPM)</li>
          <li><strong>10" EP:</strong> Extended play format</li>
          <li><strong>7" Single:</strong> Standard single format (45 RPM)</li>
        </ul>
        
        <h2>Cassette Tape Specifications</h2>
        <p>All cassettes are standard size (4" x 2.5") and compatible with all standard cassette players.</p>
        
        <h2>CD Specifications</h2>
        <p>Standard 120mm diameter CDs, compatible with all CD players and computer drives.</p>
        
        <h2>Packaging Dimensions</h2>
        <ul>
          <li><strong>Vinyl:</strong> 12.5" x 12.5" x 0.25"</li>
          <li><strong>CD:</strong> 5.5" x 5" x 0.4"</li>
          <li><strong>Cassette:</strong> 4.3" x 2.8" x 0.7"</li>
        </ul>
      `
    },
    care: {
      title: "Care Instructions",
      lastUpdated: "January 2024", 
      content: `
        <h2>Vinyl Record Care</h2>
        <ul>
          <li>Store vertically to prevent warping</li>
          <li>Keep away from direct sunlight and heat</li>
          <li>Handle by edges and label area only</li>
          <li>Clean with anti-static brush before each play</li>
          <li>Use proper inner sleeves to prevent scratches</li>
        </ul>
        
        <h2>Cassette Tape Care</h2>
        <ul>
          <li>Store in cool, dry place</li>
          <li>Rewind fully after each use</li>
          <li>Keep away from magnetic fields</li>
          <li>Clean tape heads regularly</li>
        </ul>
        
        <h2>CD Care</h2>
        <ul>
          <li>Handle by edges only</li>
          <li>Store in protective cases</li>
          <li>Clean with soft, lint-free cloth</li>
          <li>Wipe from center to edge in straight lines</li>
        </ul>
      `
    },
    contact: {
      title: "Contact Us",
      lastUpdated: "January 2024",
      content: `
        <h2>Get in Touch</h2>
        <p>We're here to help with your dark musical needs. Contact us through any of the following methods:</p>
        
        <h2>Customer Service</h2>
        <p><strong>Email:</strong> arg@obsidianriterecords.com</p>
        <p><strong>Hours:</strong> Monday - Friday, 9 AM - 6 PM AEST</p>
        
        <h2>Orders & Shipping</h2>
        <p><strong>Email:</strong> arg@obsidianriterecords.com</p>
        
        <h2>Returns & Refunds</h2>
        <p><strong>Email:</strong> arg@obsidianriterecords.com</p>
        
        <h2>General Inquiries</h2>
        <p><strong>Email:</strong> arg@obsidianriterecords.com</p>
        
        <h2>Response Time</h2>
        <p>We typically respond to all inquiries within 24 hours during business days.</p>
      `
    }
  };

  if (!page || !legalContent[page as keyof typeof legalContent]) {
    return <Navigate to="/404" replace />;
  }

  const content = legalContent[page as keyof typeof legalContent];

  return (
    <>
      <SEOHead
        title={content.title}
        description={`${content.title} for Black Ritual Records - Understanding your rights and our policies for dark music purchases.`}
        url={`https://blackplaguerecords.com/legal/${page}`}
      />
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 pt-24 pb-16">
          <div className="max-w-4xl mx-auto">
            <header className="mb-8">
              <h1 className="gothic-heading text-4xl mb-4">{content.title}</h1>
              <p className="text-muted-foreground">Last updated: {content.lastUpdated}</p>
            </header>
            
            <div 
              className="prose prose-invert max-w-none space-y-6"
              dangerouslySetInnerHTML={{ __html: content.content }}
            />
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default LegalPages;