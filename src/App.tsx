
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NowPlayingProvider } from "@/contexts/NowPlayingContext";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import BulletproofReferralTracker from "@/components/referrals/BulletproofReferralTracker";
import Header from "@/components/navigation/Header";
import BottomNav from "@/components/navigation/BottomNav";
import MiniPlayer from "@/components/player/MiniPlayer";
import GlobalBack from "@/components/navigation/GlobalBack";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Import all pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Library from "./pages/Library";
import Radio from "./pages/Radio";
import RequestSong from "./pages/RequestSong";
import SongPlayer from "./pages/SongPlayer";
import SongDetail from "./pages/SongDetail";
import SongsLibrary from "./pages/SongsLibrary";
import CreatePlaylist from "./pages/CreatePlaylist";
import ManagePlaylists from "./pages/ManagePlaylists";
import Settings from "./pages/Settings";
import More from "./pages/More";
import Admin from "./pages/Admin";
import Analytics from "./pages/Analytics";
import AdminChatInbox from "./pages/AdminChatInbox";
import AdminDonationAnalytics from "./pages/AdminDonationAnalytics";
import AdminReferralPayoutDashboard from "./pages/AdminReferralPayoutDashboard";
import AdminCustomSongs from "./pages/AdminCustomSongs";
import AdminCustomSongDetail from "./pages/AdminCustomSongDetail";
import NotificationCenter from "./pages/NotificationCenter";
import Terms from "./pages/Terms";
import AboutUs from "./pages/AboutUs";
import Pricing from "./pages/Pricing";
import PaymentSuccess from "./pages/PaymentSuccess";
import Advertise from "./pages/Advertise";
import Donate from "./pages/Donate";
import ThankYou from "./pages/ThankYou";
import Testimonies from "./pages/Testimonies";
import TestimoniesSubmit from "./pages/TestimoniesSubmit";
import TestimoniesMySubmissions from "./pages/TestimoniesMySubmissions";
import AdminTestimonies from "./pages/AdminTestimonies";
import AdminOrders from "./pages/AdminOrders";
import ReferralDashboard from "./pages/ReferralDashboard";
import ReferralCalculator from "./pages/ReferralCalculator";
import PlaylistDetail from "./pages/PlaylistDetail";
import { ReferralDashboard as ReferralDashboardComponent } from "./components/referrals/ReferralDashboard";
import PublicPlaylists from "./pages/PublicPlaylists";
import PublicPlaylistDetail from "./pages/PublicPlaylistDetail";
import NotFound from "./pages/NotFound";
import LegalCompliance from "./pages/LegalCompliance";
import GDPRPolicy from "./pages/GDPRPolicy";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import PwaInstallBanner from "@/components/PwaInstallBanner";
import WelcomeOnSignIn from "@/components/auth/WelcomeOnSignIn";
import ReferralAnalytics from "./pages/ReferralAnalytics";
import TestimonyDetail from "./pages/TestimonyDetail";
import SuggestSong from "./pages/SuggestSong";
import AdminSuggestions from "./pages/AdminSuggestions";
import LibrarySuggestions from "./pages/LibrarySuggestions";

const queryClient = new QueryClient();

// Component to capture referral codes on all pages
const ReferralCaptureWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <BulletproofReferralTracker />
      {children}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <TranslationProvider>
              <NowPlayingProvider>
                <div className="flex flex-col min-h-screen bg-background">
                <Header />
                <WelcomeOnSignIn />
                
                <main className="flex-1 pt-16 pb-20">
                  <GlobalBack />
                  <ReferralCaptureWrapper>
                    <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/terms" element={<Terms />} />
                     <Route path="/legal" element={<LegalCompliance />} />
                     <Route path="/legal/gdpr" element={<GDPRPolicy />} />
                     <Route path="/about" element={<AboutUs />} />
                     <Route path="/pricing" element={<Pricing />} />
                     <Route path="/payment-success" element={<PaymentSuccess />} />
                     <Route path="/advertise" element={<Advertise />} />
                    <Route path="/testimonies" element={<Testimonies />} />
                    <Route path="/testimony/:id" element={<TestimonyDetail />} />
                    <Route path="/testimonies/submit" element={<TestimoniesSubmit />} />
                    <Route path="/testimonies/my-submissions" element={<ProtectedRoute><TestimoniesMySubmissions /></ProtectedRoute>} />
                    {/* Public Routes */}
                    <Route path="/radio" element={<Radio />} />
                    <Route path="/songs" element={<SongsLibrary />} />
                    <Route path="/player/:id" element={<SongPlayer />} />
                    <Route path="/songs/:id" element={<SongDetail />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/faq" element={<FAQ />} />
                    
                    {/* Protected Routes */}
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                     <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
                     <Route path="/library/suggestions" element={<ProtectedRoute><LibrarySuggestions /></ProtectedRoute>} />
                     <Route path="/request-song" element={<ProtectedRoute><RequestSong /></ProtectedRoute>} />
                     <Route path="/suggest-song" element={<ProtectedRoute><SuggestSong /></ProtectedRoute>} />
                     <Route path="/songs-library" element={<ProtectedRoute><SongsLibrary /></ProtectedRoute>} />
                     <Route path="/create-playlist" element={<ProtectedRoute><CreatePlaylist /></ProtectedRoute>} />
                    <Route path="/playlist/create" element={<ProtectedRoute><CreatePlaylist /></ProtectedRoute>} />
                    <Route path="/manage-playlists" element={<ProtectedRoute><ManagePlaylists /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                     <Route path="/more" element={<ProtectedRoute><More /></ProtectedRoute>} />
                     <Route path="/donate" element={<Donate />} />
                     <Route path="/thank-you" element={<ProtectedRoute><ThankYou /></ProtectedRoute>} />
                    
                    {/* Referral Routes */}
                    <Route path="/referrals" element={<ProtectedRoute><ReferralDashboardComponent /></ProtectedRoute>} />
                    <Route path="/referrals/dashboard" element={<ProtectedRoute><ReferralDashboard /></ProtectedRoute>} />
                    <Route path="/referrals/analytics" element={<ProtectedRoute><ReferralAnalytics /></ProtectedRoute>} />
                    <Route path="/referral" element={<ProtectedRoute><ReferralCalculator /></ProtectedRoute>} />
                    <Route path="/referral-calculator" element={<ProtectedRoute><ReferralCalculator /></ProtectedRoute>} />
                    
                    {/* Playlist Routes */}
                    <Route path="/playlists/public" element={<PublicPlaylists />} />
                    <Route path="/playlists/:id/public" element={<PublicPlaylistDetail />} />
                    <Route path="/playlists/:id" element={<ProtectedRoute><PlaylistDetail /></ProtectedRoute>} />
                    
                    {/* Admin Routes */}
                    <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                    <Route path="/admin/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                    <Route path="/admin/chat-inbox" element={<ProtectedRoute><AdminChatInbox /></ProtectedRoute>} />
                    <Route path="/admin/donations" element={<ProtectedRoute><AdminDonationAnalytics /></ProtectedRoute>} />
                    <Route path="/admin/referral-payouts" element={<ProtectedRoute><AdminReferralPayoutDashboard /></ProtectedRoute>} />
                    <Route path="/admin/referral-ops" element={<ProtectedRoute><AdminReferralPayoutDashboard /></ProtectedRoute>} />
                     <Route path="/admin/custom-songs" element={<ProtectedRoute><AdminCustomSongs /></ProtectedRoute>} />
                     <Route path="/admin/orders" element={<ProtectedRoute><AdminOrders /></ProtectedRoute>} />
                      <Route path="/admin/custom-requests/:id" element={<ProtectedRoute><AdminCustomSongDetail /></ProtectedRoute>} />
                     <Route path="/admin/suggestions" element={<ProtectedRoute><AdminSuggestions /></ProtectedRoute>} />
                     <Route path="/admin/testimonies" element={<ProtectedRoute><AdminTestimonies /></ProtectedRoute>} />
                     <Route path="/admin/notifications" element={<ProtectedRoute><NotificationCenter /></ProtectedRoute>} />
                    
                     <Route path="*" element={<NotFound />} />
                   </Routes>
                 </ReferralCaptureWrapper>
               </main>

                <PwaInstallBanner />
                <BottomNav />
                <MiniPlayer />
                </div>
              </NowPlayingProvider>
            </TranslationProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
