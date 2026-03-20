
import React from 'react';
import { FashionItem } from '../types';
import { Star } from 'lucide-react';

interface ImageMarkerProps {
    items: FashionItem[];
}

export const ImageMarker: React.FC<ImageMarkerProps> = ({ items }) => {
    if (!items || items.length === 0) return null;

    // Calculate initial positions
    const initialPositions = items.map(item => {
        if (!item.box_2d) return null;
        const [ymin, xmin, ymax, xmax] = item.box_2d;
        return {
            top: (ymin + ymax) / 20, // 0-1000 to 0-100
            left: (xmin + xmax) / 20,
        };
    });

    // Simple collision avoidance (5 passes for better convergence)
    const adjustedPositions = initialPositions.map(p => p ? { ...p } : null);
    const minDistance = 8; // Increased minimum distance to account for star icon

    for (let pass = 0; pass < 5; pass++) {
        for (let i = 0; i < adjustedPositions.length; i++) {
            for (let j = i + 1; j < adjustedPositions.length; j++) {
                const p1 = adjustedPositions[i];
                const p2 = adjustedPositions[j];
                if (!p1 || !p2) continue;

                let dx = p2.left - p1.left;
                let dy = p2.top - p1.top;
                
                // Handle exact same position with small jitter
                if (dx === 0 && dy === 0) {
                    dx = Math.random() * 0.1 - 0.05;
                    dy = Math.random() * 0.1 - 0.05;
                }
                
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < minDistance) {
                    const angle = Math.atan2(dy, dx);
                    const force = (minDistance - distance) / 2;
                    
                    // Push both away
                    p1.left -= Math.cos(angle) * force;
                    p1.top -= Math.sin(angle) * force;
                    p2.left += Math.cos(angle) * force;
                    p2.top += Math.sin(angle) * force;

                    // Keep within bounds
                    p1.left = Math.max(4, Math.min(96, p1.left));
                    p1.top = Math.max(4, Math.min(96, p1.top));
                    p2.left = Math.max(4, Math.min(96, p2.left));
                    p2.top = Math.max(4, Math.min(96, p2.top));
                }
            }
        }
    }

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {items.map((item, index) => {
                const pos = adjustedPositions[index];
                if (!pos) return null;

                const isPerfectMatch = (item.confidence || '').toLowerCase() === 'perfect';

                return (
                    <div 
                        key={index}
                        className="absolute w-8 h-8 -ml-4 -mt-4 flex items-center justify-center bg-white text-black text-xs font-bold rounded-full border-2 border-black shadow-lg animate-in zoom-in duration-500 pointer-events-auto group cursor-help transition-all duration-300 hover:bg-black hover:text-white hover:z-50"
                        style={{ 
                            top: `${pos.top}%`, 
                            left: `${pos.left}%`,
                            zIndex: 10 + index
                        }}
                    >
                        {index + 1}
                        
                        {isPerfectMatch && (
                            <div className="absolute -top-1 -right-1 bg-black rounded-full p-0.5 border border-white">
                                <Star className="w-2 h-2 text-white fill-white" />
                            </div>
                        )}
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black text-white rounded shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
                            <span className="text-[10px] font-bold uppercase tracking-widest">
                                {item.brand || 'Unknown'}
                            </span>
                            {/* Arrow */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
