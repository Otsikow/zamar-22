import { useLocation, Link } from 'react-router-dom';
import { Home, Music, Radio, Folder, Menu } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';

const BottomNav = () => {
  const location = useLocation();
  const { t } = useTranslation();

  const tabs = [
    { label: t('nav.home', 'Home'), icon: Home, link: "/" },
    { label: t('nav.songs', 'Songs'), icon: Music, link: "/songs" },
    { label: t('nav.radio', 'Radio'), icon: Radio, link: "/radio" },
    { label: t('nav.library', 'Library'), icon: Folder, link: "/library" },
    { label: t('nav.menu', 'Menu'), icon: Menu, link: "/more" }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/20 backdrop-blur-xl border-t border-white/10 shadow-lg supports-[backdrop-filter]:bg-background/20 z-50">
      <div className="flex justify-around items-center py-2 px-4">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.link;
          const IconComponent = tab.icon;
          
          return (
            <Link
              key={tab.label}
              to={tab.link}
              className={`flex flex-col items-center py-1 px-2 min-w-0 flex-1 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              } transition-colors hover:text-primary`}
            >
              <IconComponent className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium truncate">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;