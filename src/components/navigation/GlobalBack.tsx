import React from 'react';
import { useLocation } from 'react-router-dom';
import BackButton from '@/components/ui/back-button';

const GlobalBack = () => {
  const location = useLocation();

  // Hide on home page and auth page
  // Also hide on admin chat inbox page as it has its own specialized back buttons
  const hiddenPages = ["/", "/auth", "/admin/chat"];
  
  if (hiddenPages.includes(location.pathname)) return null;

  return (
    <div className="container mx-auto px-4 max-w-5xl mt-2">
      <BackButton variant="outline" size="sm" showOnDesktop label="Back" />
    </div>
  );
};

export default GlobalBack;
