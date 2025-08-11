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
  label?: string;
}

const BackButton = ({ 
  to, 
  onClick, 
  className, 
  variant = 'default', 
  size = 'sm',
  showOnDesktop = false,
  label
}: BackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    if (to) {
      navigate(to);
      return;
    }

    // Determine if we can safely go back within the SPA history
    const hasSpaHistory = typeof window !== 'undefined' && (window.history.state?.idx ?? 0) > 0;
    const hasSameOriginReferrer = typeof document !== 'undefined' && document.referrer.startsWith(window.location.origin);

    if (hasSpaHistory || hasSameOriginReferrer) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <Button
      type="button"
      aria-label={label ?? "Go back"}
      variant={variant}
      size={size}
      className={cn(
        "transition-colors",
        !showOnDesktop && "lg:hidden",
        size === 'sm' && (label ? "h-8 px-3" : "p-2 h-8 w-8"),
        size === 'lg' && (label ? "h-12 px-4" : "p-4 h-12 w-12"),
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
      {label && <span className="ml-2 text-sm font-medium">{label}</span>}
    </Button>
  );
};

export default BackButton;