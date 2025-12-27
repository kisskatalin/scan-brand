
import React from 'react';
import { LogoIcon } from './LogoIcon';

interface LoadingOverlayProps {
  progress: number;
  showDelayedMessage?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ progress, showDelayedMessage }) => {
  return (
    <div className="absolute inset-0 z-20 overflow-hidden bg-white/80 backdrop-blur-[2px] transition-all duration-300 flex flex-col items-center justify-center">
        
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
         <div className="w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-90 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-scan shadow-sm"></div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .animate-scan {
          position: absolute;
          animation: scan 2.5s ease-in-out infinite;
        }
      `}</style>

      <div className="relative z-10 flex flex-col items-center">
          <div className="relative">
            <LogoIcon className="w-12 h-12 text-black animate-pulse" />
          </div>
          <p className="mt-6 text-black font-logo text-2xl tracking-tighter transform scale-y-110 animate-pulse">
            Scanning...
          </p>
          <p className="text-4xl font-light text-black mt-2">{progress}%</p>
          
          {showDelayedMessage && progress >= 99 && (
            <p className="text-xs text-gray-500 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-700 text-center px-6">
               This might take a moment, we are performing a deep visual analysis.
            </p>
          )}
      </div>
    </div>
  );
};
