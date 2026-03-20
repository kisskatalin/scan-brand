
import React, { useState } from 'react';
import { AnalysisResult as ResultType } from '../types';
import { sortFashionItems } from '../utils/fashionUtils';
import { Check, AlertTriangle, Star } from 'lucide-react';
import { LogoIcon } from './LogoIcon';

interface AnalysisResultProps {
  result: ResultType;
}

const ImageWithFallback = ({ src, alt, className }: { src: string, alt: string, className: string }) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    
    // If runtime loading fails, hide completely
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
  const sortedItems = sortFashionItems(result.items);

  const getConfidenceText = (conf: string) => {
    const c = (conf || '').toLowerCase();
    if (c === 'perfect') return 'Perfect';
    if (c === 'high') return 'High';
    if (c === 'medium') return 'Medium';
    return 'Low';
  };

  const isStrictFashionItem = (category: string) => {
    const c = category.toLowerCase();
    const fashionKeywords = [
        'shoe', 'sneaker', 'boot', 'footwear', 'clothing', 'apparel', 'dress', 'top', 
        'shirt', 't-shirt', 'jacket', 'coat', 'outerwear', 'pant', 'jean', 'skirt', 
        'suit', 'knitwear', 'accessory', 'bag', 'handbag', 'watch', 'jewelry', 'hat', 'cap',
        'blouse', 'sweater', 'hoodie', 'shorts', 'trousers', 'blazer', 'cardigan', 'scarf', 
        'belt', 'sunglasses', 'earrings', 'necklace', 'bracelet', 'ring', 'pumps', 'heels',
        'sandals', 'loafers', 'oxfords', 'clutch', 'wallet', 'purse'
    ];
    const exclusions = [
        'logo', 'brand', 'person', 'human', 'background', 'scenery', 'room', 
        'furniture', 'architecture', 'car', 'landscape', 'decor', 'nature'
    ];
    const hasFashionKeyword = fashionKeywords.some(kw => c.includes(kw));
    const hasExclusion = exclusions.some(exc => c.includes(exc));
    return hasFashionKeyword && !hasExclusion;
  };

  const isValidImageUrl = (url?: string) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    
    // Thorough list of phrases suggesting a placeholder or broken image link
    const invalidPatterns = [
        'unavailable', 'placeholder', 'not-found', 'broken-image', 'image_not_available',
        'no-image', 'stock-photo', '404', 'default-image', 'missing', 'img_not_found',
        'coming-soon', 'null', 'undefined', 'spacer.gif', 'transparent.png'
    ];
    
    return !invalidPatterns.some(pattern => lowerUrl.includes(pattern));
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

      <div className="space-y-4 pb-6 mt-8">
        <h3 className="text-xl font-sans font-normal text-gray-400 px-1">
          Identified Pieces
        </h3>
        
        {sortedItems.map((item, index) => {
          const isPerfectMatch = (item.confidence || '').toLowerCase() === 'perfect';
          const isHighConfidence = (item.confidence || '').toLowerCase() === 'high';
          const isFashion = isStrictFashionItem(item.category);
          const validImage = isValidImageUrl(item.imageUrl);
          
          // Only show preview if it's a perfect match AND it's a strictly defined fashion item AND URL is valid
          const showPreview = isPerfectMatch && isFashion && validImage;
          
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
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-6 h-6 flex items-center justify-center bg-black text-white text-[10px] font-bold rounded-full shrink-0">
                                        {index + 1}
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block">
                                        {item.category}
                                    </span>
                                </div>
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
