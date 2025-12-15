import React from 'react';
import { LogoIcon } from './LogoIcon';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-screen-md mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Custom Logo Container - w-10 (small/compact) */}
          <div className="flex items-center justify-center w-10 h-10 bg-black text-white rounded-none shadow-sm">
            {/* Shared Logo Icon - w-5 size fixed as requested */}
            <LogoIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-logo text-black leading-none tracking-tighter transform scale-y-110 origin-left mt-1">
              Scan&Brand
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
};