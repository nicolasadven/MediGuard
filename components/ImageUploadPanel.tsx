
import React, { useRef, useState } from 'react';
import { Upload, X, Camera, ZoomIn, ZoomOut, AlertCircle, ImageIcon } from 'lucide-react';
import { Violation } from '../types';

interface ImageUploadPanelProps {
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  imagePreviewUrl: string | null;
  setImagePreviewUrl: (url: string | null) => void;
  violations?: Violation[];
  t: any;
}

const ImageUploadPanel: React.FC<ImageUploadPanelProps> = ({
  imageFile,
  setImageFile,
  imagePreviewUrl,
  setImagePreviewUrl,
  violations = [],
  t
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
      setIsZoomed(false);
      setNaturalSize(null);
    }
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageFile(null);
    setImagePreviewUrl(null);
    setIsZoomed(false);
    setNaturalSize(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setPosition({ x, y });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden transition-colors">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h2 className="font-semibold text-slate-700 dark:text-slate-200">{t.imageTitle}</h2>
        </div>
        {imagePreviewUrl && (
          <div className="flex items-center gap-2">
            {violations.length > 0 && (
              <span className="text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-300 px-2 py-1 rounded-full flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {violations.filter(v => v.boundingBox).length} {t.found}
              </span>
            )}
            <div 
              onClick={toggleZoom}
              className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm active:bg-slate-50 dark:active:bg-slate-700 touch-manipulation cursor-pointer"
            >
              {isZoomed ? <ZoomOut className="h-3 w-3" /> : <ZoomIn className="h-3 w-3" />}
              <span>{isZoomed ? t.reset : t.zoom}</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-1 p-4 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-950/50 relative overflow-hidden">
        {imagePreviewUrl ? (
          <div 
            className={`relative w-full h-full flex items-center justify-center overflow-hidden rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
          >
            {/* Aspect Ratio Wrapper: Ensures overlays align perfectly with image content */}
            <div
              className="relative transition-transform duration-200 ease-out"
              onClick={toggleZoom}
              onMouseMove={handleMouseMove}
              style={{
                transform: isZoomed ? 'scale(2.5)' : 'scale(1)',
                transformOrigin: `${position.x}% ${position.y}%`,
                aspectRatio: naturalSize ? `${naturalSize.width} / ${naturalSize.height}` : 'auto',
                maxWidth: '100%',
                maxHeight: '100%',
                display: 'flex' 
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={imagePreviewUrl} 
                alt="Room Preview" 
                className="w-full h-full object-contain"
                onLoad={(e) => setNaturalSize({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })}
              />
              
              {/* Bounding Box Overlays */}
              {naturalSize && violations.map((violation, index) => {
                if (!violation.boundingBox || violation.boundingBox.length !== 4) return null;
                const [ymin, xmin, ymax, xmax] = violation.boundingBox;
                
                // Smart positioning: If box is in top 10% of image, show tooltip below, else above
                const isNearTop = ymin < 100;

                return (
                  <div
                    key={index}
                    className="absolute border-2 border-red-500 border-dashed bg-red-500/10 z-10 transition-all hover:bg-red-500/30 group cursor-help"
                    style={{
                      top: `${ymin / 10}%`,
                      left: `${xmin / 10}%`,
                      height: `${(ymax - ymin) / 10}%`,
                      width: `${(xmax - xmin) / 10}%`,
                    }}
                  >
                    {/* Tooltip Label */}
                    <div 
                      className={`
                        absolute left-1/2 -translate-x-1/2 px-2 py-1 
                        bg-red-600 text-white text-[10px] font-bold rounded shadow-lg 
                        opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20
                        whitespace-nowrap max-w-[200px] truncate
                        ${isNearTop ? 'top-full mt-1' : 'bottom-full mb-1'}
                      `}
                    >
                      {violation.hazard}
                      {/* Arrow */}
                      <div className={`absolute left-1/2 -translate-x-1/2 border-4 border-transparent ${isNearTop ? 'bottom-full border-b-red-600' : 'top-full border-t-red-600'}`}></div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Clear Button (only when not zoomed) */}
            {!isZoomed && (
              <button
                onClick={clearImage}
                className="absolute top-2 right-2 bg-white/90 dark:bg-slate-800/90 p-3 rounded-full shadow-md hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-600 dark:text-slate-300 hover:text-red-500 transition-colors z-20 touch-manipulation"
                title="Remove Image"
              >
                <X className="h-6 w-6" />
              </button>
            )}
            
            {/* Hint Overlay */}
            {!isZoomed && (
               <div className="absolute bottom-4 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full pointer-events-none opacity-0 hover:opacity-100 transition-opacity z-20">
                 {t.tapToZoom}
               </div>
            )}
          </div>
        ) : (
          <div 
            onClick={triggerUpload}
            className="w-full h-full min-h-[300px] border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-all group active:scale-[0.99] touch-manipulation"
          >
            {/* Mobile-friendly Shutter Button Style */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-blue-400 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 w-20 h-20 rounded-full flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-blue-900/50 group-hover:scale-110 transition-transform">
                <Camera className="h-9 w-9 text-white" />
              </div>
            </div>
            
            <p className="text-slate-800 dark:text-slate-200 font-bold text-lg mb-1">{t.takePhoto}</p>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <ImageIcon className="h-3 w-3" />
              <span>{t.uploadGallery}</span>
            </div>
          </div>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          capture="environment" // Forces rear camera on mobile
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ImageUploadPanel;
