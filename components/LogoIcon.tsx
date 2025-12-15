import React from 'react';

interface LogoIconProps {
  className?: string;
}

export const LogoIcon: React.FC<LogoIconProps> = ({ className }) => {
  return (
    <svg 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5"
      strokeLinecap="square" 
      strokeLinejoin="miter"
      className={className}
      style={{ overflow: 'visible' }}
    >
      {/* Corner Brackets - Pushed OUTSIDE to -4/28 for extended frame */}
      <path d="M-4 6V-4H6" />
      <path d="M18 -4H28V6" />
      <path d="M28 18V28H18" />
      <path d="M6 28H-4V18" />
    </svg>
  );
};