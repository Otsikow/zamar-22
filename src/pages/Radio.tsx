import Footer from "@/components/sections/Footer";
import CategoryRadio from "@/components/player/CategoryRadio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Radio as RadioIcon, Headphones, Shuffle, Repeat } from "lucide-react";

const Radio = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header Section */}
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-playfair font-bold mb-2">
              Zamar Radio
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Just like your favorite radio station
            </p>
          </div>

          {/* Radio Player Component */}
          <CategoryRadio />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Radio;