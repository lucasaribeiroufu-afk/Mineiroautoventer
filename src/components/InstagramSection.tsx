import React from 'react';
import { CompanySettings } from '../types';
import { Instagram, ExternalLink } from 'lucide-react';
import { REAL_IMAGE_FILENAMES } from '../utils/imagePaths';

interface InstagramSectionProps {
  settings: CompanySettings;
}

export const InstagramSection: React.FC<InstagramSectionProps> = ({ settings }) => {
  const instagramPhoto = settings.workshopPhotos?.instagram || REAL_IMAGE_FILENAMES.instagram || '/assets/images/equipe-instagram.webp';

  return (
    <section id="instagram" className="py-16 sm:py-20 bg-[#081426] text-white border-t border-slate-800">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="bg-gradient-to-r from-[#050D1A] to-[#0A1A33] border border-blue-900/40 rounded-3xl p-6 sm:p-10 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Workshop Real Photograph (Proportional, professional and engine framed) */}
          <div className="md:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[340px] aspect-[4/5] sm:aspect-[4/5] rounded-2xl overflow-hidden border border-slate-700/80 shadow-lg group bg-slate-900">
              <img
                src={instagramPhoto}
                alt="Profissional do Mineiro Auto Center ao lado do veículo com capô aberto"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  // Fallback to PNG if webp unsupported
                  if (!e.currentTarget.src.includes('.png')) {
                    e.currentTarget.src = '/assets/images/equipe-instagram.png';
                  }
                }}
                className="w-full h-full object-cover object-[center_12%] transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#081426]/85 via-transparent to-transparent flex items-end p-3 pointer-events-none">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Instagram className="w-4 h-4 text-pink-400" />
                  @autocentermineiro
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Short Callout & Instagram Button */}
          <div className="md:col-span-7 space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-950/60 border border-pink-800/60 text-pink-300 text-xs font-semibold">
              <Instagram className="w-3.5 h-3.5" />
              <span>Instagram Oficial</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
              Acompanhe a rotina da nossa equipe
            </h3>

            <p className="text-base text-slate-300 max-w-xl">
              Confira os bastidores dos atendimentos, manutenções em tempo real e novidades da nossa oficina em Uberlândia.
            </p>

            <div className="pt-2">
              <a
                href={settings.instagramUrl || "https://www.instagram.com/autocentermineiro/"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 text-sm sm:text-base font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 active:from-purple-700 active:to-pink-700 rounded-xl shadow-lg transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
              >
                <Instagram className="w-5 h-5" />
                <span>Veja nossa rotina no Instagram</span>
                <ExternalLink className="w-4 h-4 opacity-80" />
              </a>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
