import React, { useRef, useState } from 'react';
import { Upload, X, Camera, ZoomIn, ZoomOut, AlertCircle } from 'lucide-react';
import { Violation } from '../types';

interface ImageUploadPanelProps {
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  imagePreviewUrl: string | null;
  setImagePreviewUrl: (url: string | null) => void;
  violations?: Violation[];
}

const ImageUploadPanel: React.FC<ImageUploadPanelProps> = ({
  imageFile,
  setImageFile,
  imagePreviewUrl,
  setImagePreviewUrl,
  violations = []
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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-blue-600" />
          <h2 className="font-semibold text-slate-700">Reality (Room Image)</h2>
        </div>
        {imagePreviewUrl && (
          <div className="flex items-center gap-2">
            {violations.length > 0 && (
              <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {violations.filter(v => v.boundingBox).length} Detected
              </span>
            )}
            <div className="flex items-center gap-1 text-xs font-medium text-slate-400 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
              {isZoomed ? <ZoomOut className="h-3 w-3" /> : <ZoomIn className="h-3 w-3" />}
              <span>{isZoomed ? 'Reset' : 'Zoom'}</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-1 p-4 flex flex-col items-center justify-center bg-slate-50/50 relative overflow-hidden">
        {imagePreviewUrl ? (
          <div 
            className={`relative w-full h-full flex items-center justify-center overflow-hidden rounded-lg shadow-sm border border-slate-100 bg-white ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
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
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded shadow-sm opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-20">
                      {violation.hazard}
                      {/* Arrow */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-red-600"></div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Clear Button (only when not zoomed) */}
            {!isZoomed && (
              <button
                onClick={clearImage}
                className="absolute top-2 right-2 bg-white/90 p-2 rounded-full shadow-md hover:bg-red-50 text-slate-600 hover:text-red-500 transition-colors z-20"
                title="Remove Image"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            
            {/* Hint Overlay */}
            {!isZoomed && (
               <div className="absolute bottom-4 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full pointer-events-none opacity-0 hover:opacity-100 transition-opacity z-20">
                 Click image to zoom • Hover boxes for details
               </div>
            )}
          </div>
        ) : (
          <div 
            onClick={triggerUpload}
            className="w-full h-full min-h-[300px] border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
          >
            <div className="bg-blue-100 p-4 rounded-full mb-4 group-hover:bg-blue-200 transition-colors">
              <Upload className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-slate-600 font-medium mb-1">Click to upload image</p>
            <p className="text-slate-400 text-sm">JPG, PNG supported</p>
          </div>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ImageUploadPanel;
