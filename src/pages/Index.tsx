import Hero from "@/components/sections/Hero";
import FeaturedSongs from "@/components/sections/FeaturedSongs";
import LiveCounter from "@/components/sections/LiveCounter";
import Footer from "@/components/sections/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20">
        <Hero />
        <FeaturedSongs />
        <LiveCounter />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
