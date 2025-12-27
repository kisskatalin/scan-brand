
import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

interface ImageInputProps {
  onImageSelected: (base64: string, mimeType: string, preview: string) => void;
}

export const ImageInput: React.FC<ImageInputProps> = ({ onImageSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateOptimizedPayload = (file: File): Promise<{base64: string, mimeType: string}> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.onload = (event) => {
        const img = new Image();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Refined optimization: 
          // 800px is the sweet spot for Gemini to see small logos clearly.
          // Lower quality (0.4) in WebP keeps the file size extremely small.
          const maxDim = 800; 
          const quality = 0.4;

          if (width > height && width > maxDim) {
            height = (height * maxDim) / width;
            width = maxDim;
          } else if (height > width && height > maxDim) {
            width = (width * maxDim) / height;
            height = maxDim;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d', { alpha: false }); // Disable alpha for better optimization
          if (ctx) {
            // Fill white background just in case of transparency
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            
            const mimeType = 'image/webp';
            const dataUrl = canvas.toDataURL(mimeType, quality);
            const base64 = dataUrl.split(',')[1];
            resolve({ base64, mimeType });
          } else {
            // Fallback if canvas fails
            const result = (event.target?.result as string).split(',')[1];
            resolve({ 
                base64: result, 
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
    
    const highResPreview = URL.createObjectURL(file);
    e.target.value = '';
    
    try {
        const { base64, mimeType } = await generateOptimizedPayload(file);
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
              Capture a photo or select from gallery
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
