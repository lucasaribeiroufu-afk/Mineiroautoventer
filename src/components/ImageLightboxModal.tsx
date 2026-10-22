import React, { useEffect } from 'react';
import { X, ZoomIn, Download, ExternalLink } from 'lucide-react';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageAlt: string;
  title?: string;
  subtitle?: string;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  imageAlt,
  title,
  subtitle,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative max-w-5xl max-h-[92vh] w-full flex flex-col items-center bg-[#081426] border border-blue-900/50 rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="w-full flex items-center justify-between px-4 py-3 bg-[#050D1A] border-b border-slate-800 text-slate-200">
          <div>
            <h4 className="text-sm font-bold text-white truncate">{title || 'Visualização da Fotografia'}</h4>
            {subtitle && <p className="text-xs text-slate-400 truncate">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Display Area with 100% natural aspect ratio preservation */}
        <div className="relative w-full flex-1 min-h-[300px] max-h-[78vh] p-2 sm:p-4 flex items-center justify-center bg-black/40 overflow-auto">
          <img
            src={imageSrc}
            alt={imageAlt}
            className="max-h-[75vh] max-w-full w-auto h-auto object-contain rounded-lg shadow-2xl transition-transform"
          />
        </div>

        {/* Footer info bar */}
        <div className="w-full flex items-center justify-between px-4 py-2.5 bg-[#050D1A] border-t border-slate-800/80 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <ZoomIn className="w-3.5 h-3.5 text-blue-400" />
            Fotografia exibida em alta resolução sem cortes
          </span>
          <a
            href={imageSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium"
          >
            <span>Abrir arquivo original</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
