import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NowPlayingProvider } from "@/contexts/NowPlayingContext";
import MiniPlayer from "@/components/player/MiniPlayer";
import Index from "./pages/Index";
import Pricing from "./pages/Pricing";
import RequestSong from "./pages/RequestSong";
import SongsLibrary from "./pages/SongsLibrary";
import SongDetail from "./pages/SongDetail";
import SongPlayer from "./pages/SongPlayer";
import Radio from "./pages/Radio";
import ThankYou from "./pages/ThankYou";
import AboutUs from "./pages/AboutUs";
import Library from "./pages/Library";
import CreatePlaylist from "./pages/CreatePlaylist";
import ManagePlaylists from "./pages/ManagePlaylists";
import Testimonies from "./pages/Testimonies";
import Donate from "./pages/Donate";
import More from "./pages/More";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import AdminChatInbox from "./pages/AdminChatInbox";
import NotificationCenter from "./pages/NotificationCenter";
import NotFound from "./pages/NotFound";
import ReferralCalculator from "./pages/ReferralCalculator";
import ReferralDashboard from "./pages/ReferralDashboard";
import AdminReferralPayoutDashboard from "./pages/AdminReferralPayoutDashboard";
import Terms from "./pages/Terms";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import BottomNav from "@/components/navigation/BottomNav";
import Header from "@/components/navigation/Header";
import { FloatingChatButton } from "@/components/chat/FloatingChatButton";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NowPlayingProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Header />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/request" element={<ProtectedRoute><RequestSong /></ProtectedRoute>} />
              <Route path="/songs" element={<SongsLibrary />} />
              <Route path="/songs/:id" element={<SongDetail />} />
              <Route path="/player/:id" element={<SongPlayer />} />
              <Route path="/radio" element={<Radio />} />
              <Route path="/thank-you" element={<ThankYou />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Library /></ProtectedRoute>} />
              <Route path="/playlist/create" element={<ProtectedRoute><CreatePlaylist /></ProtectedRoute>} />
              <Route path="/playlist/manage" element={<ProtectedRoute><ManagePlaylists /></ProtectedRoute>} />
              <Route path="/testimonies" element={<Testimonies />} />
              <Route path="/donate" element={<Donate />} />
              <Route path="/more" element={<More />} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
              <Route path="/admin/chat" element={<ProtectedRoute><AdminChatInbox /></ProtectedRoute>} />
              <Route path="/admin/chat-inbox" element={<ProtectedRoute><AdminChatInbox /></ProtectedRoute>} />
              <Route path="/admin/notifications" element={<ProtectedRoute><NotificationCenter /></ProtectedRoute>} />
              <Route path="/referral" element={<ReferralCalculator />} />
              <Route path="/referral-dashboard" element={<ProtectedRoute><ReferralDashboard /></ProtectedRoute>} />
              <Route path="/admin/referral-payouts" element={<ProtectedRoute><AdminReferralPayoutDashboard /></ProtectedRoute>} />
              <Route path="/terms" element={<Terms />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <MiniPlayer />
            <BottomNav />
            <FloatingChatButton />
          </BrowserRouter>
        </TooltipProvider>
      </NowPlayingProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
