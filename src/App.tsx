
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NowPlayingProvider } from "@/contexts/NowPlayingContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Library from "./pages/Library";
import Radio from "./pages/Radio";
import More from "./pages/More";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import SongPlayer from "./pages/SongPlayer";
import SongDetail from "./pages/SongDetail";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import Analytics from "./pages/Analytics";
import SongsLibrary from "./pages/SongsLibrary";
import CreatePlaylist from "./pages/CreatePlaylist";
import ManagePlaylists from "./pages/ManagePlaylists";
import RequestSong from "./pages/RequestSong";
import AboutUs from "./pages/AboutUs";
import Terms from "./pages/Terms";
import Testimonies from "./pages/Testimonies";
import Donate from "./pages/Donate";
import ThankYou from "./pages/ThankYou";
import Pricing from "./pages/Pricing";
import NotificationCenter from "./pages/NotificationCenter";
import ReferralDashboard from "./pages/ReferralDashboard";
import ReferralCalculator from "./pages/ReferralCalculator";
import AdminReferralPayoutDashboard from "./pages/AdminReferralPayoutDashboard";
import AdminDonationAnalytics from "./pages/AdminDonationAnalytics";
import AdminChatInbox from "./pages/AdminChatInbox";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <NowPlayingProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
                <Route path="/radio" element={<ProtectedRoute><Radio /></ProtectedRoute>} />
                <Route path="/more" element={<ProtectedRoute><More /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/song/:id" element={<ProtectedRoute><SongPlayer /></ProtectedRoute>} />
                <Route path="/song-detail/:id" element={<ProtectedRoute><SongDetail /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                <Route path="/admin/chat-inbox" element={<ProtectedRoute><AdminChatInbox /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                <Route path="/songs-library" element={<ProtectedRoute><SongsLibrary /></ProtectedRoute>} />
                <Route path="/create-playlist" element={<ProtectedRoute><CreatePlaylist /></ProtectedRoute>} />
                <Route path="/manage-playlists" element={<ProtectedRoute><ManagePlaylists /></ProtectedRoute>} />
                <Route path="/request-song" element={<ProtectedRoute><RequestSong /></ProtectedRoute>} />
                <Route path="/about-us" element={<AboutUs />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/testimonies" element={<Testimonies />} />
                <Route path="/donate" element={<Donate />} />
                <Route path="/thank-you" element={<ThankYou />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/notifications" element={<ProtectedRoute><NotificationCenter /></ProtectedRoute>} />
                <Route path="/referral-dashboard" element={<ProtectedRoute><ReferralDashboard /></ProtectedRoute>} />
                <Route path="/referral-calculator" element={<ProtectedRoute><ReferralCalculator /></ProtectedRoute>} />
                <Route path="/admin/referral-payouts" element={<ProtectedRoute><AdminReferralPayoutDashboard /></ProtectedRoute>} />
                <Route path="/admin/donation-analytics" element={<ProtectedRoute><AdminDonationAnalytics /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </NowPlayingProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
