import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  to?: string;
  onClick?: () => void;
  className?: string;
  variant?: 'ghost' | 'outline' | 'default';
  size?: 'sm' | 'lg' | 'icon';
  showOnDesktop?: boolean;
}

const BackButton = ({ 
  to, 
  onClick, 
  className, 
  variant = 'ghost', 
  size = 'sm',
  showOnDesktop = false 
}: BackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "text-white hover:bg-white/10 transition-colors",
        !showOnDesktop && "lg:hidden",
        size === 'sm' && "p-2 h-8 w-8",
        size === 'lg' && "p-4 h-12 w-12",
        size === 'icon' && "p-3 h-10 w-10", 
        className
      )}
      onClick={handleClick}
    >
      <ArrowLeft className={cn(
        size === 'sm' && "h-4 w-4",
        size === 'lg' && "h-6 w-6",
        size === 'icon' && "h-5 w-5"
      )} />
    </Button>
  );
};

export default BackButton;