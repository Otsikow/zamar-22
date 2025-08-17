import React from 'react';
import { useLocation } from 'react-router-dom';
import BackButton from '@/components/ui/back-button';

const GlobalBack = () => {
  const location = useLocation();

  // Hide on pages that already have their own back buttons or don't need them
  const hiddenPages = [
    "/", 
    "/auth", 
    "/admin/chat",
    "/admin/custom-songs",
    "/analytics",
    "/create-playlist",
    "/manage-playlists",
    "/request-song",
    "/song-player",
    "/terms",
    "/testimonies/my-submissions",
    "/playlists/public"
  ];
  
  // Also hide on dynamic routes that have their own back buttons
  const isDynamicRouteWithBackButton = 
    location.pathname.startsWith("/playlist/") ||
    location.pathname.startsWith("/playlists/") ||
    location.pathname.startsWith("/song/") ||
    location.pathname.startsWith("/testimony/") ||
    location.pathname.startsWith("/admin/custom-songs/");
  
  if (hiddenPages.includes(location.pathname) || isDynamicRouteWithBackButton) return null;

  return (
    <div className="container mx-auto px-4 max-w-5xl pt-16">
      <BackButton variant="outline" size="sm" showOnDesktop={true} label="Back" />
    </div>
  );
};

export default GlobalBack;
