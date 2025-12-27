
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageInput } from './components/ImageInput';
import { AnalysisResult } from './components/AnalysisResult';
import { LoadingOverlay } from './components/LoadingOverlay';
import { analyzeFashionImage } from './services/geminiService';
import { AnalysisResult as ResultType, ImageFile } from './types';
import { RefreshCcw, X, AlertTriangle } from 'lucide-react';
import { LogoIcon } from './components/LogoIcon';

const App: React.FC = () => {
  const [currentImage, setCurrentImage] = useState<ImageFile | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ResultType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDelayed, setIsDelayed] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isLoading && progress >= 99) {
      timer = setTimeout(() => {
        setIsDelayed(true);
      }, 2000); 
    }
    return () => clearTimeout(timer);
  }, [progress, isLoading]);

  const handleImageSelected = (base64: string, mimeType: string, preview: string) => {
    setCurrentImage({ base64, mimeType, preview });
    setAnalysisResult(null);
    setError(null);
  };

  const handleScan = async () => {
    if (!currentImage) return;

    setIsLoading(true);
    setIsDelayed(false);
    setError(null);
    setProgress(0);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 99) return 99;
        let increment = prev < 30 ? 2.0 : prev < 85 ? 0.2 : 0.015;
        const next = prev + increment;
        return next > 99 ? 99 : next;
      });
    }, 100);

    try {
      // Maintaining the requested thorough feel with a minimal delay for quality processing
      const minTimePromise = new Promise(resolve => setTimeout(resolve, 8000));
      const aiPromise = analyzeFashionImage(currentImage.base64, currentImage.mimeType);
      
      const [result] = await Promise.all([aiPromise, minTimePromise]);
      
      setAnalysisResult(result);
      setProgress(100);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      clearInterval(progressInterval);
      if (!error) {
        setTimeout(() => {
            setIsLoading(false);
            setIsDelayed(false);
        }, 500);
      } else {
        setIsLoading(false);
        setIsDelayed(false);
      }
    }
  };

  const handleReset = () => {
    setCurrentImage(null);
    setAnalysisResult(null);
    setError(null);
    setProgress(0);
    setIsDelayed(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main 
        className={`max-w-screen-md mx-auto px-6 pb-0 space-y-12 flex-grow w-full flex flex-col items-center ${!currentImage ? 'justify-center' : 'pt-10'}`}
      >
        
        {!currentImage && (
          <div className="text-center space-y-6">
            <h2 className="text-4xl md:text-5xl text-black leading-tight flex flex-col md:block items-center justify-center gap-2">
              <span className="font-serif tracking-tighter inline-block transform scale-y-110">Scan</span>
              <span className="font-serif tracking-tighter inline-block transform scale-y-110 px-2">the look <span>&</span> find the</span>
              <span className="font-serif tracking-tighter inline-block transform scale-y-110">Brand.</span>
            </h2>
            <p className="text-black font-normal max-w-sm mx-auto">
              Upload your image to uncover brands, styles and every detail.
            </p>
          </div>
        )}

        <div className="relative w-full">
          {!currentImage ? (
            <ImageInput onImageSelected={handleImageSelected} />
          ) : (
            <div className="w-fit mx-auto relative shadow-xl">
              <img 
                src={currentImage.preview} 
                alt="Uploaded analysis" 
                className="w-auto h-auto max-h-[60vh] max-w-full object-contain"
              />
              
              {isLoading && <LoadingOverlay progress={Math.floor(progress)} showDelayedMessage={isDelayed} />}
              
              {!isLoading && (
                 <button 
                 onClick={handleReset}
                 className="absolute top-4 right-4 p-2 bg-white text-black rounded-full shadow-lg hover:bg-black hover:text-white transition-all duration-300 z-10"
                 aria-label="Remove image"
               >
                 <X className="w-5 h-5" />
               </button>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-gray-50 border-l-2 border-red-500 p-6 flex items-start gap-4 w-full">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <p className="font-serif text-black font-medium">Analysis Failed</p>
              <p className="text-sm text-gray-500 mt-1">{error}</p>
              <button 
                onClick={() => setCurrentImage(null)} 
                className="mt-4 text-xs font-bold uppercase tracking-widest text-black hover:underline"
              >
                Restart
              </button>
            </div>
          </div>
        )}

        {analysisResult && !isLoading && (
          <div className="space-y-4 w-full">
            <AnalysisResult result={analysisResult} />
            
            <p className="text-[10px] text-gray-400 font-sans font-light text-center mt-8">
                AI can make mistakes. Please verify important information.
            </p>

            <div className="h-32"></div>

            <button 
                onClick={handleReset}
                className="w-full py-5 bg-black text-white font-medium text-sm uppercase tracking-widest hover:bg-gray-900 transition-colors flex items-center justify-center gap-5"
            >
                <RefreshCcw className="w-4 h-4" />
                Scan New Look
            </button>
          </div>
        )}

      </main>
      
      {(!currentImage || (analysisResult && !isLoading)) && (
        <footer className="w-full py-8 text-center bg-white">
            <p className="text-[10px] text-gray-400 font-sans uppercase tracking-widest">
                Created by: <a href="https://kisskatal.in" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors font-medium underline decoration-dotted underline-offset-4">kisskatal.in</a>
            </p>
        </footer>
      )}

      {currentImage && !analysisResult && !isLoading && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-6 z-40 animate-in slide-in-from-bottom-full duration-500">
             <div className="max-w-screen-md mx-auto">
                <button 
                  onClick={handleScan}
                  className="w-full py-4 bg-black text-white font-medium text-sm uppercase tracking-widest hover:bg-gray-900 transition-all shadow-lg flex items-center justify-center gap-6"
                >
                  <LogoIcon className="w-5 h-5" />
                  Scan Look
                </button>
             </div>
        </div>
      )}
    </div>
  );
};

export default App;
