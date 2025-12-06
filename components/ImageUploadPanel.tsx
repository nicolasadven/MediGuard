import React, { useRef, useState } from 'react';
import { Upload, X, Camera, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageUploadPanelProps {
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  imagePreviewUrl: string | null;
  setImagePreviewUrl: (url: string | null) => void;
}

const ImageUploadPanel: React.FC<ImageUploadPanelProps> = ({
  imageFile,
  setImageFile,
  imagePreviewUrl,
  setImagePreviewUrl,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
      setIsZoomed(false);
    }
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageFile(null);
    setImagePreviewUrl(null);
    setIsZoomed(false);
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
          <div className="flex items-center gap-1 text-xs font-medium text-slate-400 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
            {isZoomed ? <ZoomOut className="h-3 w-3" /> : <ZoomIn className="h-3 w-3" />}
            <span>{isZoomed ? 'Click to Reset' : 'Click to Zoom'}</span>
          </div>
        )}
      </div>
      
      <div className="flex-1 p-4 flex flex-col items-center justify-center bg-slate-50/50 relative overflow-hidden">
        {imagePreviewUrl ? (
          <div 
            className={`relative w-full h-full flex items-center justify-center overflow-hidden rounded-lg shadow-sm border border-slate-100 bg-white ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
            onClick={toggleZoom}
            onMouseMove={handleMouseMove}
          >
             {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={imagePreviewUrl} 
              alt="Room Preview" 
              className="max-h-full max-w-full object-contain transition-transform duration-200 ease-out"
              style={{
                transform: isZoomed ? 'scale(2.5)' : 'scale(1)',
                transformOrigin: `${position.x}% ${position.y}%`
              }}
            />
            
            {/* Only show clear button when not zoomed to prevent accidental deletions while exploring */}
            {!isZoomed && (
              <button
                onClick={clearImage}
                className="absolute top-2 right-2 bg-white/90 p-2 rounded-full shadow-md hover:bg-red-50 text-slate-600 hover:text-red-500 transition-colors z-10"
                title="Remove Image"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            
            {/* Hint Overlay */}
            {!isZoomed && (
               <div className="absolute bottom-4 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
                 Click image to inspect details
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