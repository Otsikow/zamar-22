
import { Heart, Cross, Info, Music, DollarSign, Plus, Users, HelpCircle, FileText, Mail, HeartHandshake } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "@/contexts/TranslationContext";

const Footer = () => {
  const { t } = useTranslation();
  
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <img src="/lovable-uploads/eea63e8f-61ca-4fd6-9db2-366e8d4ee1b9.png" alt="Zamar logo" className="w-8 h-8" />
              <span className="text-2xl font-playfair font-bold text-foreground">
                Zamar
              </span>
            </div>
            <p className="text-muted-foreground mb-4 max-w-md font-inter">
              {t('footer.description', 'Creating meaningful custom songs for every occasion. A faith-based platform dedicated to bringing your stories to life through music.')}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Cross className="w-4 h-4 text-primary" />
              <span>{t('footer.faith_values', 'Built on faith, powered by technology')}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-playfair font-semibold text-foreground mb-4">{t('footer.quick_links', 'Quick Links')}</h3>
            <ul className="space-y-2 font-inter">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  {t('footer.about_us', 'About Us')}
                </Link>
              </li>
              <li>
                <Link to="/songs" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  {t('footer.song_library', 'Song Library')}
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  {t('footer.pricing', 'Pricing')}
                </Link>
              </li>
              <li>
                <Link to="/request-song" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  {t('footer.create_song', 'Create Song')}
                </Link>
              </li>
              <li>
                <Link to="/testimonies" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {t('footer.testimonies', 'Testimonies')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-playfair font-semibold text-foreground mb-4">{t('footer.support', 'Support')}</h3>
            <ul className="space-y-2 font-inter">
              <li>
                <Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  {t('footer.faq', 'FAQ')}
                </Link>
              </li>
              <li>
                <Link to="/legal" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {t('footer.legal', 'Legal & Compliance')}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {t('footer.terms_conditions', 'Terms & Conditions')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {t('footer.contact_us', 'Contact Us')}
                </Link>
              </li>
              <li>
                <Link to="/donate" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4" />
                  {t('footer.support_mission', 'Support Our Mission')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground font-inter">© {new Date().getFullYear()} Zamar. {t('footer.rights', 'All rights reserved.')}</p>
            
            {/* Faith Disclaimer */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-accent/20 px-4 py-2 rounded-lg">
              <Cross className="w-4 h-4 text-primary" />
              <span className="font-inter">
                {t('footer.faith_disclaimer', '🛐 Faith-based disclaimer: We reserve the right to decline requests that go against our Christian values.')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
