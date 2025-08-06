
import { Heart, Cross } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <img src="/lovable-uploads/afeffcca-3646-4967-b85e-0646f2b6bcf2.png" alt="Zamar" className="w-8 h-8" />
              <span className="text-2xl font-playfair font-bold text-foreground">
                Zamar
              </span>
            </div>
            <p className="text-muted-foreground mb-4 max-w-md font-inter">
              Creating meaningful custom songs for every occasion. A faith-based platform 
              dedicated to bringing your stories to life through music.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Cross className="w-4 h-4 text-primary" />
              <span>Faith-based platform • Christian values</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-playfair font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2 font-inter">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/songs" className="text-muted-foreground hover:text-primary transition-colors">
                  Song Library
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-muted-foreground hover:text-primary transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/request" className="text-muted-foreground hover:text-primary transition-colors">
                  Create Song
                </Link>
              </li>
              <li>
                <Link to="/testimonies" className="text-muted-foreground hover:text-primary transition-colors">
                  Testimonies
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-playfair font-semibold text-foreground mb-4">Support</h3>
            <ul className="space-y-2 font-inter">
              <li>
                <Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <a href="mailto:hello@zamar.com" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <Link to="/donate" className="text-muted-foreground hover:text-primary transition-colors">
                  Support Our Mission
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground font-inter">© 2025 Zamar. All rights reserved.</p>
            
            {/* Faith Disclaimer */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-accent/20 px-4 py-2 rounded-lg">
              <Cross className="w-4 h-4 text-primary" />
              <span className="font-inter">
                🛐 Faith-based disclaimer: We reserve the right to decline requests that go against our Christian values.
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
