
import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M17 6.1H3M21 12.1H3M17 18.1H3" />
      <path d="M14 3l.7 1.4.8.6 1.5.2 1.5-.2.8-.6.7-1.4-.7-1.5-.8-.5-1.5-.2-1.5.2-.8.5-.7 1.5zM14 21l.7-1.4.8-.6 1.5-.2 1.5.2.8.6.7 1.4-.7 1.5-.8.5-1.5.2-1.5-.2-.8-.5-.7-1.5z" />
    </svg>
  );
};
