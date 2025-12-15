import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

interface ImageInputProps {
  onImageSelected: (base64: string, mimeType: string, preview: string) => void;
}

export const ImageInput: React.FC<ImageInputProps> = ({ onImageSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Optimize image for AI processing (Resize & Compress)
  const generateOptimizedPayload = (file: File): Promise<{base64: string, mimeType: string}> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // SPEED OPTIMIZATION: Aggressive Compression for AI Payload
          // We limit the dimension to 480px. This is sufficient for Gemini 3 Pro
          // to identify fashion items but results in a significantly smaller payload
          // than 640px or 1024px, reducing upload and processing latency.
          const maxDim = 480; 
          
          // Quality 0.5 (50%) is enough for computer vision analysis (shapes/logos)
          // but keeps file size extremely low for speed.
          const quality = 0.5;

          if (width > height && width > maxDim) {
            height = (height * maxDim) / width;
            width = maxDim;
          } else if (height > width && height > maxDim) {
            width = (width * maxDim) / height;
            height = maxDim;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Use WebP for superior compression
            const mimeType = 'image/webp';
            const dataUrl = canvas.toDataURL(mimeType, quality);
            const base64 = dataUrl.split(',')[1];
            resolve({ base64, mimeType });
          } else {
            // Fallback
            resolve({ 
                base64: (event.target?.result as string).split(',')[1], 
                mimeType: file.type
            });
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Generate High-Res Preview immediately for UI (Crisp visuals for user)
    // This ensures the user sees the original quality image.
    const highResPreview = URL.createObjectURL(file);

    e.target.value = '';

    try {
        // 2. Generate Highly Optimized Payload for AI in background (Fast analysis)
        const { base64, mimeType } = await generateOptimizedPayload(file);
        
        // 3. Pass High-Res Preview + Optimized Payload
        onImageSelected(base64, mimeType, highResPreview);
    } catch (error) {
        console.error("Error processing image:", error);
    }
  };

  const triggerSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      <div 
        onClick={triggerSelect}
        className="group relative overflow-hidden rounded-none bg-white hover:bg-gray-50 transition-all duration-500 cursor-pointer p-12 text-center"
      >
        {/* Custom Sparse Dashed Border using SVG */}
        <div className="absolute inset-0 pointer-events-none">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <rect 
                    x="1" 
                    y="1" 
                    width="99.5%" 
                    height="99%" 
                    fill="none" 
                    stroke="rgba(10,10,10,0.2)" 
                    strokeWidth="1" 
                    strokeDasharray="6 6" 
                    className="group-hover:stroke-black transition-colors duration-500"
                />
            </svg>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-full border border-black/10 flex items-center justify-center group-hover:scale-105 group-hover:border-black transition-all duration-500">
            <Upload className="w-6 h-6 text-gray-400 group-hover:text-black transition-colors" />
          </div>
          <div>
            <h3 className="text-xl font-sans font-medium text-black mb-2">Upload Image</h3>
            <p className="text-sm text-gray-500 font-normal">
              Take a photo or select from gallery
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};