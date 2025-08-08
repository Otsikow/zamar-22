import HeroSection from "@/components/HeroSection";
import FeaturedSongs from "@/components/sections/FeaturedSongs";
import LiveCounter from "@/components/sections/LiveCounter";
import Footer from "@/components/sections/Footer";
import heroImage from "@/assets/hero-music.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20">
        <HeroSection bgImageUrl={heroImage} />
        <FeaturedSongs />
        <LiveCounter />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
