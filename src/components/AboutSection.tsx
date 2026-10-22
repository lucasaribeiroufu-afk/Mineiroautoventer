import React, { useState } from 'react';
import { CompanySettings } from '../types';
import { REAL_IMAGE_FILENAMES } from '../utils/imagePaths';
import { 
  MapPin, 
  Wrench, 
  Users, 
  Maximize2, 
  CheckCircle2, 
  Disc, 
  Sliders, 
  Camera
} from 'lucide-react';
import { ImageLightboxModal } from './ImageLightboxModal';

interface AboutSectionProps {
  settings: CompanySettings;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ settings }) => {
  const [selectedPhoto, setSelectedPhoto] = useState<{ src: string; title: string; subtitle: string } | null>(null);

  // Photographs mapped to uploaded server photos or fallback originals
  const mainWorkshopPhoto = settings.workshopPhotos?.aboutWorkshop || REAL_IMAGE_FILENAMES.aboutWorkshop;
  const clientKeyPhoto = settings.workshopPhotos?.clientKey || REAL_IMAGE_FILENAMES.clientKey;
  const wheelAlignmentPhoto = settings.workshopPhotos?.wheelAlignment || REAL_IMAGE_FILENAMES.wheelAlignment;
  const enginePhoto = settings.workshopPhotos?.mechanicEngine || REAL_IMAGE_FILENAMES.mechanicEngine;
  const suspensionPhoto = settings.workshopPhotos?.suspension || REAL_IMAGE_FILENAMES.suspension;

  return (
    <section id="oficina" className="py-16 sm:py-24 bg-[#081426] text-white border-b border-slate-800">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header - Exact requested text */}
        <div className="max-w-3xl mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#145CFF] tracking-wider uppercase">
            <Camera className="w-3.5 h-3.5" />
            <span>Nossa Estrutura e Atendimento</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading tracking-tight">
            Conheça o Mineiro Auto Center
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Atendimento no bairro Brasil, em Uberlândia. Converse com nossa equipe sobre a manutenção do seu veículo.
          </p>
        </div>

        {/* COMPOSIÇÃO FOTOGRÁFICA (Fotos verticais proporcionais sem cortes de rostos ou mãos) */}
        <div className="space-y-8">
          
          {/* Top Row: Foto Maior (Profissional ao lado do carro) + Foto Menor (Entrega da Chave) + Apresentação */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Foto Maior: Profissional trabalhando no veículo elevado no elevador (Vertical Proporcional, ponto focal topo-médio) */}
            <div className="lg:col-span-7">
              <div 
                className="relative rounded-2xl overflow-hidden border border-blue-900/40 bg-[#050D1A] shadow-xl aspect-[9/13] sm:aspect-[4/5] md:aspect-[9/12] group cursor-pointer"
                onClick={() => setSelectedPhoto({
                  src: mainWorkshopPhoto,
                  title: 'Manutenção Técnica no Elevador Automotivo',
                  subtitle: 'Profissional qualificado revisando suspensão e freios no Mineiro Auto Center'
                })}
              >
                {/* Ambient glow matching photo */}
                <div 
                  className="absolute inset-0 bg-cover bg-center blur-2xl opacity-20 scale-110 pointer-events-none"
                  style={{ backgroundImage: `url(${mainWorkshopPhoto})` }}
                />

                <img
                  key={mainWorkshopPhoto}
                  src={mainWorkshopPhoto}
                  alt="Profissional com uniforme da oficina trabalhando em veículo no elevador automotivo"
                  loading="lazy"
                  decoding="async"
                  className="relative z-10 w-full h-full object-cover object-[center_25%] transition-transform duration-700 group-hover:scale-[1.02]"
                  referrerPolicy="no-referrer"
                />

                {/* Subtitle Badge */}
                <div className="absolute bottom-3 left-3 z-20 bg-[#081426]/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs text-slate-200 font-medium flex items-center gap-2">
                  <Wrench className="w-3.5 h-3.5 text-blue-400" />
                  <span>Manutenção técnica e mecânica especializada</span>
                </div>

                {/* Zoom button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPhoto({
                      src: mainWorkshopPhoto,
                      title: 'Manutenção Técnica no Elevador Automotivo',
                      subtitle: 'Profissional qualificado revisando suspensão e freios no Mineiro Auto Center'
                    });
                  }}
                  className="absolute top-3 right-3 z-20 p-2 rounded-xl bg-[#081426]/80 hover:bg-[#081426] border border-slate-700/70 text-slate-200 hover:text-white backdrop-blur-sm transition-all shadow"
                  title="Ampliar fotografia inteira sem cortes"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Coluna Direita: Foto Menor (Galpão Interno com Elevadores) + Texto de Atendimento e Confiança */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Foto Menor: Ambiente Interno da Oficina e Elevadores (Vertical 4:5 ajustada) */}
              <div 
                className="relative rounded-2xl overflow-hidden border border-blue-900/40 bg-[#050D1A] shadow-lg aspect-[4/5] sm:aspect-[4/4.5] group cursor-pointer"
                onClick={() => setSelectedPhoto({
                  src: clientKeyPhoto,
                  title: 'Estrutura Interna e Elevadores',
                  subtitle: 'Ambiente amplo, piso limpo e organizado no Bairro Brasil'
                })}
              >
                <img
                  key={clientKeyPhoto}
                  src={clientKeyPhoto}
                  alt="Instalações internas da oficina com múltiplos elevadores e veículos em atendimento"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover object-[center_35%] transition-transform duration-500 group-hover:scale-[1.02]"
                  referrerPolicy="no-referrer"
                />

                <div className="absolute bottom-3 left-3 z-20 bg-[#081426]/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs text-slate-200 font-medium flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <span>Galpão e Elevadores Automotivos</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPhoto({
                      src: clientKeyPhoto,
                      title: 'Estrutura Interna e Elevadores',
                      subtitle: 'Ambiente amplo, piso limpo e organizado no Bairro Brasil'
                    });
                  }}
                  className="absolute top-3 right-3 z-20 p-2 rounded-xl bg-[#081426]/80 hover:bg-[#081426] border border-slate-700/70 text-slate-200 hover:text-white backdrop-blur-sm transition-all shadow"
                  title="Ampliar fotografia inteira"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              {/* Informações da Oficina */}
              <div className="bg-[#050D1A] p-5 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  <span>Compromisso e Confiança</span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Trabalhamos com clareza em todas as etapas, desde a recepção do veículo até a entrega das chaves com o diagnóstico do serviço realizado.
                </p>
                <div className="pt-2 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>{settings.street}, nº {settings.number} — Bairro Brasil, {settings.city}–{settings.state}</span>
                </div>
              </div>

            </div>

          </div>

          {/* Galeria Compacta: Alinhamento, Trabalho no Motor e Amortecedor */}
          <div className="pt-6 border-t border-slate-800/80">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                Rotina Técnica na Oficina (Alinhamento, Motor e Suspensão)
              </h4>
              <span className="text-xs text-slate-400">
                Clique nas fotos para ver em tamanho original
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              
              {/* 1. Alinhamento e Balanceamento (Vertical 3:4 calibrada no técnico e tela) */}
              <div 
                className="group relative rounded-2xl overflow-hidden border border-blue-900/40 bg-[#050D1A] shadow-md aspect-[3/4] cursor-pointer hover:border-blue-500/50 transition-all"
                onClick={() => setSelectedPhoto({
                  src: wheelAlignmentPhoto,
                  title: 'Alinhamento e Balanceamento Computadorizado',
                  subtitle: 'Geometria 3D de alta precisão no Mineiro Auto Center'
                })}
              >
                <img
                  key={wheelAlignmentPhoto}
                  src={wheelAlignmentPhoto}
                  alt="Profissional operando equipamento de geometria computadorizada"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover object-[center_20%] transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#081426] via-[#081426]/80 to-transparent p-3 pt-6 z-10 flex items-center justify-between text-xs text-slate-200">
                  <span className="font-semibold flex items-center gap-1.5 truncate">
                    <Disc className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    Alinhamento e Geometria
                  </span>
                  <Maximize2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0 ml-1" />
                </div>
              </div>

              {/* 2. Manutenção no Motor (Vertical 3:4 calibrada no capô e mãos do mecânico) */}
              <div 
                className="group relative rounded-2xl overflow-hidden border border-blue-900/40 bg-[#050D1A] shadow-md aspect-[3/4] cursor-pointer hover:border-blue-500/50 transition-all"
                onClick={() => setSelectedPhoto({
                  src: enginePhoto,
                  title: 'Mecânica e Revisão do Motor',
                  subtitle: 'Manutenção preventiva e corretiva no compartimento do motor'
                })}
              >
                <img
                  key={enginePhoto}
                  src={enginePhoto}
                  alt="Profissional trabalhando diretamente no motor do veículo"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover object-[center_22%] transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />

                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#081426] via-[#081426]/80 to-transparent p-3 pt-6 z-10 flex items-center justify-between text-xs text-slate-200">
                  <span className="font-semibold flex items-center gap-1.5 truncate">
                    <Wrench className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    Mecânica e Motor
                  </span>
                  <Maximize2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0 ml-1" />
                </div>
              </div>

              {/* 3. Rampa Técnica de Alinhamento e Geometria */}
              <div 
                className="group relative rounded-2xl overflow-hidden border border-blue-900/40 bg-[#050D1A] shadow-md aspect-[3/4] cursor-pointer hover:border-blue-500/50 transition-all"
                onClick={() => setSelectedPhoto({
                  src: suspensionPhoto,
                  title: 'Rampa Técnica de Alinhamento Computadorizado',
                  subtitle: 'Estrutura especializada para geometria e alinhamento de precisão'
                })}
              >
                <img
                  key={suspensionPhoto}
                  src={suspensionPhoto}
                  alt="Rampa técnica de alinhamento computadorizado na oficina Mineiro Auto Center"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover object-[center_35%] transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />

                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#081426] via-[#081426]/80 to-transparent p-3 pt-6 z-10 flex items-center justify-between text-xs text-slate-200">
                  <span className="font-semibold flex items-center gap-1.5 truncate">
                    <Sliders className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    Rampa de Alinhamento 3D
                  </span>
                  <Maximize2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0 ml-1" />
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Lightbox Modal for Full Resolution Uncropped Inspection */}
      {selectedPhoto && (
        <ImageLightboxModal
          isOpen={true}
          onClose={() => setSelectedPhoto(null)}
          imageSrc={selectedPhoto.src}
          imageAlt={selectedPhoto.title}
          title={selectedPhoto.title}
          subtitle={selectedPhoto.subtitle}
        />
      )}
    </section>
  );
};
