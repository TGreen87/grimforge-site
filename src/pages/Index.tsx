import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import ProductCatalog from "@/components/ProductCatalog";
import PreOrderSection from "@/components/PreOrderSection";
import GrimoireSection from "@/components/GrimoireSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <HeroSection />
        <ProductCatalog />
        <PreOrderSection />
        <GrimoireSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
