import React, { useState } from 'react';
import { CompanySettings } from '../types';
import { REAL_IMAGE_FILENAMES } from '../utils/imagePaths';
import { 
  Calendar, 
  FileText, 
  MapPin, 
  Navigation, 
  Wrench, 
  CheckCircle2, 
  Camera,
  UploadCloud,
  Maximize2
} from 'lucide-react';
import { ImageLightboxModal } from './ImageLightboxModal';
import { motion } from 'framer-motion';

interface HeroProps {
  settings: CompanySettings;
  onOpenQuote: () => void;
  onOpenAppointment: () => void;
  onOpenAdmin?: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  settings,
  onOpenQuote,
  onOpenAppointment,
  onOpenAdmin,
}) => {
  const [imgError, setImgError] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const facadeImageSrc = 
    settings.workshopPhotos?.heroFacade || 
    REAL_IMAGE_FILENAMES.heroFacade;

  const wheel3DImageSrc = 
    settings.workshopPhotos?.wheel3D || 
    REAL_IMAGE_FILENAMES.wheel3D;

  React.useEffect(() => {
    setImgError(false);
  }, [facadeImageSrc]);

  const handleDirectionsClick = () => {
    window.open(settings.googleMapsDestinationUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section id="inicio" className="relative bg-[#081426] text-white pt-8 pb-16 sm:py-20 lg:py-24 border-b border-slate-800 overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Headings, Text & CTAs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 space-y-6"
          >
            
            {/* Tag / Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/80 border border-blue-800/80 text-blue-300 text-xs font-semibold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Oficina Mecânica Especializada em Uberlândia</span>
            </div>

            {/* Main Title - Exact requested copy */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15] font-heading">
              Seu carro bem cuidado, do diagnóstico à revisão.
            </h1>

            {/* Subtitle - Exact requested copy */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-normal">
              Mecânica, alinhamento, freios e suspensão no bairro Brasil, em Uberlândia. Fale com nossa equipe e solicite seu atendimento.
            </p>

            {/* Action Buttons: Agendar serviço + Solicitar orçamento */}
            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              <button
                onClick={onOpenAppointment}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-base font-semibold text-white bg-[#145CFF] hover:bg-blue-600 active:bg-blue-700 rounded-xl shadow-lg shadow-blue-950/60 transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <Calendar className="w-5 h-5" />
                <span>Agendar serviço</span>
              </button>

              <button
                onClick={onOpenQuote}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-base font-semibold text-slate-100 bg-slate-900/90 hover:bg-slate-800 active:bg-slate-950 border border-slate-700/80 rounded-xl shadow-sm transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                <FileText className="w-5 h-5 text-blue-400" />
                <span>Solicitar orçamento</span>
              </button>

              <button
                onClick={handleDirectionsClick}
                className="inline-flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                title="Ver endereço no Google Maps"
              >
                <Navigation className="w-4 h-4 text-blue-400" />
                <span>Como chegar</span>
              </button>
            </div>

            {/* Highlights row */}
            <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Alinhamento computadorizado</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Suspensão e amortecedores</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Revisão preventiva e motor</span>
              </div>
            </div>

          </motion.div>

          {/* Right Column: Visual Composition with Facade Photo & 3D Wheel Foreground Layer */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 flex justify-center"
          >
            <div className="relative w-full max-w-[420px]">
              
              {/* Primary Featured Photo Frame - Vertical Proportion Preserved (NO Cut Faces, NO Cut Sign) */}
              <div className="relative w-full max-w-[390px] mx-auto aspect-[9/16] rounded-2xl overflow-hidden border border-blue-900/40 bg-[#050D1A] shadow-2xl group transition-all">
                
                {/* Ambient glow matching photo */}
                <div 
                  className="absolute inset-0 bg-cover bg-center blur-2xl opacity-25 scale-110 pointer-events-none"
                  style={{ backgroundImage: `url(${facadeImageSrc})` }}
                />

                {!imgError ? (
                  <img
                    key={facadeImageSrc}
                    src={facadeImageSrc}
                    alt="Fachada do Mineiro Auto Center e Mecânica - Rua Ricardo Siquierolli Tucci, 2749, Bairro Brasil, Uberlândia"
                    onError={() => setImgError(true)}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    className="relative z-10 w-full h-full object-cover object-[center_12%] transition-transform duration-700 group-hover:scale-[1.02]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-blue-950/80 border border-blue-800 flex items-center justify-center text-blue-400 shadow-inner">
                      <Wrench className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white font-heading">
                        Mineiro Auto Center
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Rua Ricardo Siquierolli Tucci, nº 2749 — Bairro Brasil
                      </p>
                    </div>
                  </div>
                )}

                {/* Top-Left: Functional Overlay 1 — Localização: Bairro Brasil · Uberlândia */}
                <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#081426]/90 border border-blue-500/40 text-blue-200 text-xs font-semibold backdrop-blur-md shadow-md">
                  <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Bairro Brasil · Uberlândia</span>
                </div>

                {/* Top-Right: Full Resolution Zoom Button */}
                <button
                  onClick={() => setIsLightboxOpen(true)}
                  className="absolute top-3 right-3 z-20 p-2 rounded-xl bg-[#081426]/80 hover:bg-[#081426] border border-slate-700/70 text-slate-200 hover:text-white backdrop-blur-sm transition-all shadow"
                  title="Ver fotografia inteira em alta resolução (sem cortes)"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                {/* Bottom Address & Functional Overlay 2: Ver horários disponíveis */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#081426] via-[#081426]/90 to-transparent p-4 pt-12 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-200">
                    <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="font-medium truncate">{settings.street}, nº {settings.number}</span>
                  </div>

                  {/* Functional Overlay 2 — Acesso: Ver horários disponíveis */}
                  <button
                    onClick={onOpenAppointment}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#145CFF] hover:bg-blue-600 text-white font-semibold shadow transition-all hover:scale-[1.02] active:scale-[0.98]"
                    title="Ver horários de agendamento disponíveis"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Ver horários disponíveis</span>
                  </button>
                </div>
              </div>

              {/* FOREGROUND LAYER: 3D Wheel Illustration floating gently (up to 8px) 
                  Carefully positioned at bottom-right outside the sign and face */}
              <div 
                className="absolute -bottom-6 -right-5 sm:-bottom-8 sm:-right-8 z-30 w-32 h-32 sm:w-40 sm:h-40 rounded-2xl p-2 bg-[#081426]/90 border border-blue-500/40 shadow-2xl backdrop-blur-md animate-float-slow transition-all group-hover:scale-105"
                title="Ilustração 3D: Roda e Alinhamento Automotivo"
              >
                <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800">
                  <img
                    src={wheel3DImageSrc}
                    alt="Ilustração 3D de Roda e Freio de Alta Precisão"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-contain p-1"
                  />
                  <div className="absolute bottom-1.5 inset-x-1 text-center">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-600/90 text-white tracking-wider shadow">
                      RODA 3D
                    </span>
                  </div>
                </div>
              </div>

              {/* Admin quick upload trigger */}
              {onOpenAdmin && (
                <div className="mt-3 flex items-center justify-between px-1 text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-blue-400" />
                    Fachada e Roda 3D
                  </span>
                  <button
                    onClick={onOpenAdmin}
                    className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-semibold bg-slate-900/80 hover:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 transition-colors"
                    title="Adicionar ou alterar fotos da oficina de forma manual"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Adicionar fotos no site</span>
                  </button>
                </div>
              )}

            </div>
          </motion.div>

        </div>
      </div>

      {/* Lightbox Modal for Uncropped Facade */}
      <ImageLightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        imageSrc={facadeImageSrc}
        imageAlt="Fachada Mineiro Auto Center"
        title="Fotografia da Fachada Oficial"
        subtitle="Rua Ricardo Siquierolli Tucci, nº 2749 — Bairro Brasil, Uberlândia"
      />
    </section>
  );
};
