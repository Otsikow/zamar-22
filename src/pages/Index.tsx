import HeroSection from "@/components/HeroSection";
import FeaturedSongs from "@/components/sections/FeaturedSongs";
import LiveCounter from "@/components/sections/LiveCounter";
import Footer from "@/components/sections/Footer";
import VideoShowcase from "@/components/sections/VideoShowcase";
import heroImage from "@/assets/hero-music.jpg";
import WelcomeBanner from "@/components/auth/WelcomeBanner";
import AdGrid from "@/components/ads/AdGrid";
const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20">
        <HeroSection bgImageUrl={heroImage} />
        <WelcomeBanner />
        <AdGrid placement="home_hero" limit={4} className="container mx-auto my-6" />
        <FeaturedSongs />
        <LiveCounter />
        <VideoShowcase />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
