
import React from 'react';
import { Feather } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <Feather 
      className={cn("h-5 w-5 md:h-6 md:w-6 text-argumentum-gold animate-feather-float", className)} 
    />
  );
};
