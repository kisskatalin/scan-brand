
import React, { useState } from 'react';
import { AnalysisResult as ResultType } from '../types';
import { Check, AlertTriangle, Star } from 'lucide-react';
import { LogoIcon } from './LogoIcon';

interface AnalysisResultProps {
  result: ResultType;
}

const ImageWithFallback = ({ src, alt, className }: { src: string, alt: string, className: string }) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    if (error) return null;
    return (
        <img 
            src={src} 
            alt={alt} 
            className={`${className} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
        />
    );
};

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ result }) => {
  const sortedItems = [...result.items].sort((a, b) => {
    // Map confidence levels to scores for sorting (case-insensitive)
    const scores: Record<string, number> = { 'perfect': 4, 'high': 3, 'medium': 2, 'low': 1 };
    
    const getScore = (confidence: string) => scores[(confidence || '').toLowerCase()] || 0;
    
    const scoreA = getScore(a.confidence);
    const scoreB = getScore(b.confidence);
    
    if (scoreA !== scoreB) return scoreB - scoreA;
    
    // Secondary sort: Generic items go to bottom
    const isGeneric = (str: string) => {
        const s = (str || '').toLowerCase();
        return s.includes('unknown') || s.includes('unidentified') || s.includes('generic') || s === 'n/a' || s.includes('ismeretlen');
    };
    if (isGeneric(a.brand) && !isGeneric(b.brand)) return 1;
    if (!isGeneric(a.brand) && isGeneric(b.brand)) return -1;
    return 0;
  });

  const getConfidenceText = (conf: string) => {
    const c = (conf || '').toLowerCase();
    if (c === 'perfect') return 'Perfect';
    if (c === 'high') return 'High';
    if (c === 'medium') return 'Medium';
    return 'Low';
  };

  // Logic to determine if an item is a clothing/accessory item
  const isFashionCategory = (category: string) => {
    const c = category.toLowerCase();
    // Exclude non-fashion categories that might accidentally slip in from general search results
    const exclusions = ['person', 'human', 'background', 'scenery', 'room', 'furniture', 'architecture', 'car', 'landscape'];
    return !exclusions.some(exc => c.includes(exc));
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      <div className="relative overflow-hidden bg-black text-white p-8 shadow-2xl mb-2">
        <div className="absolute top-8 right-8 opacity-20">
            <LogoIcon className="w-20 h-20 text-white" />
        </div>
        <h3 className="text-[10px] font-medium uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
          Visual Analysis
        </h3>
        <p className="text-[1.1rem] font-serif font-light leading-relaxed italic text-gray-100">
          "{result.styleSummary}"
        </p>
      </div>

      <div className="space-y-4 pb-6 mt-2">
        <h3 className="text-xl font-sans font-normal text-gray-400 px-1">
          Identified Pieces
        </h3>
        
        {sortedItems.map((item, index) => {
          const isPerfectMatch = (item.confidence || '').toLowerCase() === 'perfect';
          const isHighConfidence = (item.confidence || '').toLowerCase() === 'high';
          const isFashion = isFashionCategory(item.category);
          // Only show preview if it's a perfect match AND it's a clothing/accessory item
          const showPreview = isPerfectMatch && isFashion && item.imageUrl;
          
          // Filter out empty materials to avoid rendering empty section
          const validMaterials = item.materials?.filter(m => m && m.trim().length > 0) || [];

          return (
            <div 
              key={index} 
              className={`bg-white border-l-2 border-y border-r border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-500 ${
                  isPerfectMatch ? 'border-l-black' : 'border-l-gray-200'
              }`}
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-start md:gap-6">
                    
                    <div className="flex-1">
                        <div className="flex justify-between items-start gap-4 mb-3">
                             <div className="flex-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-3">
                                    {item.category}
                                </span>
                                <h4 className="text-2xl font-sans font-bold text-black leading-tight">
                                    {item.brand || 'Unknown Brand'}
                                </h4>
                             </div>
                             
                             {/* Mobile View Indicators */}
                             <div className="flex flex-col items-end gap-3 shrink-0 md:hidden">
                                {isPerfectMatch ? (
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-widest">
                                        <Star className="w-3 h-3 fill-white" />
                                        Perfect Match
                                    </div>
                                ) : (
                                    <div className={`flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider ${
                                        isHighConfidence ? 'text-black' : 'text-gray-400'
                                    }`}>
                                        {isHighConfidence ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                        {getConfidenceText(item.confidence)} Match
                                    </div>
                                )}
                                {showPreview && (
                                    <ImageWithFallback 
                                        src={item.imageUrl!} 
                                        alt={item.brand} 
                                        className="w-32 h-32 bg-white p-2 object-contain border border-gray-100 mt-2"
                                    />
                                )}
                             </div>
                        </div>

                        <p className="text-sm font-normal text-gray-600 leading-relaxed w-full">
                          {item.description}
                        </p>
                        
                        {validMaterials.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">Materials</span>
                                <p className="text-sm font-normal text-black leading-relaxed capitalize">
                                    {validMaterials.join(', ')}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Desktop View Indicators */}
                    <div className="hidden md:flex flex-col items-end gap-3 shrink-0">
                        {isPerfectMatch ? (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-widest">
                                <Star className="w-3 h-3 fill-white" />
                                Perfect Match
                            </div>
                        ) : (
                            <div className={`flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider ${
                                isHighConfidence ? 'text-black' : 'text-gray-400'
                            }`}>
                                {isHighConfidence ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                {getConfidenceText(item.confidence)} Match
                            </div>
                        )}

                        {showPreview && (
                            <ImageWithFallback 
                                src={item.imageUrl!} 
                                alt={item.brand} 
                                className="w-32 h-32 bg-white p-2 object-contain border border-gray-100"
                            />
                        )}
                    </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
