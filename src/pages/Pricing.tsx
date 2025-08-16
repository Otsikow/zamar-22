import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Clock, Music, Cross, Heart, Users, Download, Megaphone } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "@/contexts/TranslationContext";
import Footer from "@/components/sections/Footer";
import ProductCheckoutButton from "@/components/ui/product-checkout-button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  currency: string;
  billing_interval: string;
  category: string;
  is_active: boolean;
}

// Pricing page component
const Pricing = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('price_cents', { ascending: true });
        
        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const formatPrice = (priceCents: number, currency: string = 'GBP') => {
    const price = priceCents / 100;
    return `£${price.toFixed(price % 1 === 0 ? 0 : 2)}`;
  };

  const getProductsByCategory = (category: string) => 
    products.filter(p => p.category === category);

  const customSongProducts = getProductsByCategory('custom_song');
  const supporterProducts = getProductsByCategory('supporter');
  const subscriptionProducts = getProductsByCategory('subscription');
  const advertisingProducts = getProductsByCategory('advertising');
  const downloadProducts = getProductsByCategory('download');
  const customSongTiers = [
    {
      name: t('pricing.essentials', 'Essentials'),
      price: "£25",
      popular: false,
      badge: null,
      features: [
        t('pricing.feature_1_song', '1 song'),
        t('pricing.feature_single_theme', 'Single theme'),
        t('pricing.feature_1_genre', '1 genre choice'),
        t('pricing.feature_delivery_3_4', 'Delivery in 3–4 days'),
        t('pricing.feature_mp3_download', 'MP3 download'),
        t('pricing.feature_basic_production', 'Basic production')
      ],
      icon: Music,
      description: t('pricing.perfect_for_quick', 'Perfect for quick personal messages'),
      cta: t('pricing.order_now', 'Order Now')
    },
    {
      name: t('pricing.signature', 'Signature'),
      price: "£60",
      popular: true,
      badge: t('pricing.most_popular', 'Most Popular'),
      features: [
        t('pricing.feature_1_song_2_versions', '1 song in 2 versions'),
        t('pricing.feature_multiple_themes', 'Multiple themes'),
        t('pricing.feature_pdf_lyrics', 'PDF lyrics included'),
        t('pricing.feature_delivery_48_72', 'Delivery in 48–72 hrs'),
        t('pricing.feature_high_quality_mp3', 'High-quality MP3'),
        t('pricing.feature_professional_mixing', 'Professional mixing'),
        t('pricing.feature_1_minor_revision', '1 minor revision')
      ],
      icon: Star,
      description: t('pricing.most_popular_choice', 'Most popular choice for special occasions'),
      cta: t('pricing.order_now', 'Order Now')
    },
    {
      name: t('pricing.premier', 'Premier'),
      price: "£129",
      popular: false,
      badge: t('pricing.limited_availability', 'Limited Availability'),
      features: [
        t('pricing.feature_2_songs_2_versions', '2 songs in 2 versions'),
        t('pricing.feature_complex_storytelling', 'Complex storytelling'),
        t('pricing.feature_free_major_revision', 'Free major revision'),
        t('pricing.feature_delivery_24_48', 'Delivery in 24–48 hrs'),
        t('pricing.feature_studio_quality', 'Studio-quality production'),
        t('pricing.feature_mp3_wav_instrumental', 'MP3 + WAV + Instrumental versions'),
        t('pricing.feature_priority_support', 'Priority support')
      ],
      icon: Clock,
      description: t('pricing.premium_experience', 'Premium experience with fastest delivery'),
      cta: t('pricing.order_now', 'Order Now')
    }
  ];

  const supporterPlans = [
    {
      name: t('pricing.supporter_lifetime', 'Supporter Lifetime'),
      price: "£49",
      subtitle: t('pricing.only_first_500', 'Only first 500 supporters'),
      features: [
        t('pricing.ad_free_streaming', 'Ad-free streaming'),
        t('pricing.unlimited_downloads', 'Unlimited downloads (songs & lyrics)'),
        t('pricing.playlist_creation', 'Playlist creation'),
        t('pricing.song_suggestion_submissions', 'Song suggestion submissions'),
        t('pricing.access_my_library', 'Access to My Library')
      ],
      cta: t('pricing.become_supporter', 'Become a Supporter')
    },
    {
      name: t('pricing.standard', 'Standard'),
      price: "£6/month",
      yearlyPrice: "£60/year",
      savings: t('pricing.save_12', 'save £12'),
      features: [
        t('pricing.all_supporter_perks', 'All Supporter perks'),
        t('pricing.exclusive_playlists', 'Exclusive playlists'),
        t('pricing.early_access_new_releases', 'Early access to new releases'),
        t('pricing.behind_scenes_content', 'Behind-the-scenes content')
      ],
      cta: t('pricing.subscribe_now', 'Subscribe Now')
    },
    {
      name: t('pricing.family_church', 'Family/Church'),
      price: "£12/month",
      yearlyPrice: "£120/year",
      subtitle: t('pricing.up_to_5_accounts', 'up to 5 accounts'),
      features: [
        t('pricing.all_standard_perks', 'All Standard perks for multiple users')
      ],
      cta: t('pricing.subscribe_now', 'Subscribe Now')
    }
  ];

  const otherServices = [
    {
      category: "Advertiser Packages",
      plans: [
        { name: "Banner Ads", price: "£150/month" },
        { name: "Audio Ads", price: "£300/month" },
        { name: "Combo (Banner + Audio)", price: "£400/month" }
      ],
      cta: "Advertise with Us"
    },
    {
      category: "Pay-Per-Download",
      plans: [
        { name: "Single Song", price: "£1.29" },
        { name: "Album", price: "£4.99" },
        { name: "Bundle: 10 songs", price: "£9.99" }
      ],
      cta: "Buy Now"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-6 flex items-center justify-center gap-3">
              <Star className="w-10 h-10 md:w-12 md:h-12 text-primary" />
              {t('pricing.choose_your', 'Choose Your')}{" "}
              <span className="text-transparent bg-gradient-primary bg-clip-text">
                {t('pricing.perfect_package', 'Perfect Package')}
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-inter">
              {t('pricing.description', 'Every song is crafted with care, love, and faith. Select the package that best fits your needs and occasion.')}
            </p>
          </div>

          {/* Custom Song Packages */}
          <div className="mb-20">
            <h2 className="text-3xl font-playfair font-bold text-center text-foreground mb-2">
              {t('pricing.custom_song_packages', 'Custom Song Packages')}
            </h2>
            <p className="text-center text-muted-foreground mb-12 font-inter">
              {t('pricing.personalized_songs', 'Personalized songs created just for you')}
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {customSongProducts.map((product, index) => {
                const isPopular = product.name.includes('Signature');
                const isLimited = product.name.includes('Premier');
                const IconComponent = product.name.includes('Essential') ? Music : 
                                   product.name.includes('Signature') ? Star : Clock;
                
                return (
                <Card 
                  key={product.id} 
                  className={`relative bg-gradient-card border-border hover:border-primary/30 transition-all duration-300 ${
                    isPopular ? 'ring-2 ring-primary/20 shadow-gold' : ''
                  }`}
                >
                  {(isPopular || isLimited) && (
                    <Badge className={`absolute -top-3 left-1/2 transform -translate-x-1/2 font-semibold ${
                      isPopular 
                        ? 'bg-gradient-primary text-black' 
                        : 'bg-accent text-accent-foreground border border-primary/30'
                    }`}>
                      {isPopular ? t('pricing.most_popular', 'Most Popular') : t('pricing.limited_availability', 'Limited Availability')}
                    </Badge>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                     <div className="flex justify-center mb-4">
                       <div className={`p-3 rounded-full ${isPopular ? 'bg-primary/30' : 'bg-primary/20'}`}>
                         <IconComponent className="w-6 h-6 text-primary" />
                       </div>
                     </div>
                    <CardTitle className="text-2xl font-playfair text-foreground">
                      {product.name.replace('Custom Song – ', '')}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground font-inter">
                      {product.description}
                    </p>
                    <div className="text-4xl font-bold text-primary mt-4">
                      {formatPrice(product.price_cents, product.currency)}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="mb-8">
                      <p className="text-sm text-muted-foreground font-inter text-center">
                        {t('pricing.personalized_creation', 'Personalized creation just for you')}
                      </p>
                    </div>
                    
                    <ProductCheckoutButton
                      productId={product.id}
                      label={t('pricing.order_now', 'Order Now')}
                      variant={isPopular ? "hero" : "outline"}
                      size="lg"
                      className="w-full"
                    />
                  </CardContent>
                 </Card>
                 );
               })}
            </div>
          </div>

          {/* Supporter & Subscription Plans */}
          <div className="mb-20">
            <h2 className="text-3xl font-playfair font-bold text-center text-foreground mb-2">
              {t('pricing.supporter_plans', 'Supporter & Subscription Plans')}
            </h2>
            <p className="text-center text-muted-foreground mb-12 font-inter">
              {t('pricing.ongoing_access', 'Ongoing access to our complete music library and exclusive content')}
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[...supporterProducts, ...subscriptionProducts].map((product, index) => {
                const isLifetime = product.name.includes('Lifetime');
                const isFamily = product.name.includes('Family');
                const isYearly = product.billing_interval === 'yearly';
                
                return (
                <Card 
                  key={product.id} 
                  className="relative bg-gradient-card border-border hover:border-primary/30 transition-all duration-300"
                >
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                       <div className="p-3 rounded-full bg-primary/20">
                         {isLifetime ? (
                           <Heart className="w-6 h-6 text-primary" />
                         ) : (
                           <Users className="w-6 h-6 text-primary" />
                         )}
                       </div>
                    </div>
                    <CardTitle className="text-2xl font-playfair text-foreground">
                      {product.name.replace('Subscription – ', '')}
                    </CardTitle>
                    {isLifetime && (
                      <p className="text-sm text-primary font-semibold font-inter">
                        {t('pricing.only_first_500', 'Only first 500 supporters')}
                      </p>
                    )}
                    {isFamily && (
                      <p className="text-sm text-primary font-semibold font-inter">
                        {t('pricing.up_to_5_accounts', 'up to 5 accounts')}
                      </p>
                    )}
                    <div className="mt-4">
                      <div className="text-4xl font-bold text-primary">
                        {formatPrice(product.price_cents, product.currency)}{!isLifetime && `/${product.billing_interval === 'yearly' ? 'year' : 'month'}`}
                      </div>
                       {isYearly && (
                         <div className="text-sm text-muted-foreground">
                           {t('pricing.save_money', 'Save money with yearly billing')}
                         </div>
                       )}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="mb-8">
                      <p className="text-sm text-muted-foreground font-inter text-center">
                        {product.description || t('pricing.full_access', 'Full access to platform features')}
                      </p>
                    </div>
                    
                    <ProductCheckoutButton
                      productId={product.id}
                      label={isLifetime ? t('pricing.become_supporter', 'Become a Supporter') : t('pricing.subscribe_now', 'Subscribe Now')}
                      variant="outline"
                      size="lg"
                      className="w-full"
                    />
                  </CardContent>
                 </Card>
                );
              })}
            </div>
          </div>

          {/* Advertisers, Donations & Downloads */}
          <div className="mb-20">
            <h2 className="text-3xl font-playfair font-bold text-center text-foreground mb-12">
              {t('pricing.additional_services', 'Additional Services')}
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
              <Card className="bg-gradient-card border-border">
                <CardHeader className="text-center pb-4">
                   <div className="flex justify-center mb-4">
                     <div className="p-3 rounded-full bg-primary/20">
                       <Megaphone className="w-6 h-6 text-primary" />
                     </div>
                   </div>
                  <CardTitle className="text-xl font-playfair text-foreground">
                    Advertiser Packages
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3 mb-6">
                    {advertisingProducts.map((product, index) => (
                      <div key={product.id} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                        <span className="text-sm font-inter text-muted-foreground">
                          {product.name.replace('Advertiser – ', '')}
                        </span>
                        <span className="text-sm font-semibold text-primary">
                          {formatPrice(product.price_cents)}/month
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    className="w-full" 
                    variant="outline"
                    size="lg"
                    asChild
                  >
                    <Link to="/advertise">
                      Advertise with Us
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-border">
                <CardHeader className="text-center pb-4">
                   <div className="flex justify-center mb-4">
                     <div className="p-3 rounded-full bg-primary/20">
                       <Download className="w-6 h-6 text-primary" />
                     </div>
                   </div>
                  <CardTitle className="text-xl font-playfair text-foreground">
                    Pay-Per-Download
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3 mb-6">
                    {downloadProducts.map((product, index) => (
                      <div key={product.id} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                        <span className="text-sm font-inter text-muted-foreground">
                          {product.name.replace('Pay-Per-Download – ', '')}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-primary">
                            {formatPrice(product.price_cents)}
                          </span>
                          <ProductCheckoutButton
                            productId={product.id}
                            label="Buy"
                            variant="outline"
                            size="sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    className="w-full" 
                    variant="outline"
                    size="lg"
                    asChild
                  >
                    <Link to="/songs">
                      Browse Songs
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Donations Section */}
            <Card className="bg-accent/10 border-primary/10 max-w-2xl mx-auto">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl font-playfair font-semibold text-foreground mb-4">
                  {t('pricing.support_ministry', 'Support Our Ministry')}
                </h3>
                <p className="text-muted-foreground font-inter mb-6 leading-relaxed">
                  {t('pricing.ministry_description', 'Help us continue creating faith-based music, supporting translation projects, and spreading the Gospel through music worldwide.')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="hero" size="lg" asChild>
                     <Link to="/donate">
                       {t('pricing.give_now', 'Give Now')}
                     </Link>
                   </Button>
                   <Button variant="outline" size="lg" asChild>
                     <Link to="/donate?type=recurring">
                       {t('pricing.monthly_giving', 'Monthly Giving')}
                     </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Faith-Based Notice */}
          <div className="max-w-4xl mx-auto">
            <Card className="bg-accent/20 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-full flex-shrink-0">
                    <Cross className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-playfair font-semibold text-foreground mb-2">
                      {t('pricing.faith_based_platform', 'Faith-Based Platform')}
                    </h3>
                    <p className="text-muted-foreground font-inter leading-relaxed">
                      {t('pricing.faith_notice', 'We are a Christian-led platform committed to creating meaningful music that honors our values. We may respectfully decline songs that conflict with our Christian principles, including content that promotes hate, profanity, violence, or anti-biblical messages.')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Pricing;