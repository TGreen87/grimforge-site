import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import ProductCatalog from "@/components/ProductCatalog";
import PreOrderSection from "@/components/PreOrderSection";
import GrimoireSection from "@/components/GrimoireSection";
import RecommendationEngine from "@/components/RecommendationEngine";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const Index = () => {
  return (
    <>
      <SEOHead />
      <div className="min-h-screen">
        <Navigation />
        <main>
          <HeroSection />
          <ProductCatalog />
          <div className="container mx-auto px-4 py-16">
            <RecommendationEngine />
          </div>
          <PreOrderSection />
          <GrimoireSection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
