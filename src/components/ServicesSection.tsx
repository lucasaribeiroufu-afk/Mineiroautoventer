import React, { useState } from 'react';
import { ServiceItem, CompanySettings } from '../types';
import { REAL_IMAGE_FILENAMES } from '../utils/imagePaths';
import { Automotive3DViewer } from './Automotive3DViewer';
import { 
  Droplets, 
  Disc, 
  ShieldAlert, 
  Sliders, 
  Cpu, 
  Wrench, 
  MessageSquare,
  Sparkles,
  Info
} from 'lucide-react';

interface ServicesSectionProps {
  services: ServiceItem[];
  settings?: CompanySettings;
  onSelectServiceForQuote: (service: ServiceItem) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  services,
  settings,
  onSelectServiceForQuote,
}) => {
  const [tilt, setTilt] = useState<{ [key: string]: { rotateX: number; rotateY: number } }>({});

  const handleMouseMove = (id: string, e: React.MouseEvent<HTMLDivElement>) => {
    // Disable on touch / mobile devices
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Maximum 3 degrees tilt
    const rotateY = ((x / rect.width) - 0.5) * 6;
    const rotateX = -((y / rect.height) - 0.5) * 6;
    setTilt(prev => ({ ...prev, [id]: { rotateX, rotateY } }));
  };

  const handleMouseLeave = (id: string) => {
    setTilt(prev => ({ ...prev, [id]: { rotateX: 0, rotateY: 0 } }));
  };

  // 3 Primary featured services with automotive 3D illustrations
  const featuredServices = [
    {
      id: 'alinhamento-balanceamento',
      title: 'Alinhamento e balanceamento',
      description: 'Geometria computadorizada com alinhamento dianteiro e traseiro para rodar seguro e prolongar a vida útil dos pneus.',
      image: settings?.workshopPhotos?.wheel3D || REAL_IMAGE_FILENAMES.wheel3D,
      imageAlt: 'Ilustração 3D de Roda e Pneu Automotivo',
      badge: 'Roda 3D • Ilustração',
      icon: <Disc className="w-5 h-5 text-blue-600" />,
      serviceItem: services.find(s => s.id === 'alinhamento-balanceamento') || {
        id: 'alinhamento-balanceamento',
        title: 'Alinhamento e balanceamento',
        shortDescription: 'Alinhamento e balanceamento computadorizado',
        fullDescription: '',
        category: 'geometria',
        iconName: 'Disc',
        priceType: 'diagnostic_required',
        includedItems: [],
        active: true,
      } as ServiceItem,
    },
    {
      id: 'suspensao-amortecedores',
      title: 'Suspensão e amortecedores',
      description: 'Inspeção e substituição de amortecedores, molas, batentes, pivôs e buchas com diagnóstico minucioso de estabilidade e ruídos.',
      image: settings?.workshopPhotos?.suspension3D || REAL_IMAGE_FILENAMES.suspension3D,
      imageAlt: 'Ilustração 3D de Suspensão e Amortecedor Automotivo',
      badge: 'Suspensão 3D • Ilustração',
      icon: <Sliders className="w-5 h-5 text-blue-600" />,
      serviceItem: services.find(s => s.id === 'suspensao-amortecedores') || {
        id: 'suspensao-amortecedores',
        title: 'Suspensão e amortecedores',
        shortDescription: 'Suspensão e amortecedores',
        fullDescription: '',
        category: 'mecanica',
        iconName: 'Sliders',
        priceType: 'diagnostic_required',
        includedItems: [],
        active: true,
      } as ServiceItem,
    },
    {
      id: 'sistema-freios',
      title: 'Freios',
      description: 'Revisão completa do sistema de frenagem: pastilhas, discos, fluido de freio, lonas e cilindros com checagem de eficiência.',
      image: settings?.workshopPhotos?.brakes3D || REAL_IMAGE_FILENAMES.brakes3D,
      imageAlt: 'Ilustração 3D de Disco e Pinça de Freio Automotivo',
      badge: 'Freios 3D • Ilustração',
      icon: <ShieldAlert className="w-5 h-5 text-blue-600" />,
      serviceItem: services.find(s => s.id === 'sistema-freios') || {
        id: 'sistema-freios',
        title: 'Freios',
        shortDescription: 'Revisão e manutenção de freios',
        fullDescription: '',
        category: 'preventiva',
        iconName: 'ShieldAlert',
        priceType: 'diagnostic_required',
        includedItems: [],
        active: true,
      } as ServiceItem,
    },
  ];

  // Complementary services line requested in item C
  const complementaryServices = [
    {
      id: 'troca-oleo',
      title: 'Troca de óleo e filtros',
      description: 'Óleo lubrificante especificado pelo fabricante, filtros de óleo, ar, combustível e cabine.',
      icon: <Droplets className="w-5 h-5 text-[#145CFF]" />,
    },
    {
      id: 'mecanica-revisao',
      title: 'Mecânica e revisão',
      description: 'Manutenção de motor, arrefecimento, correias dentadas, velas e revisão periódica completa.',
      icon: <Wrench className="w-5 h-5 text-[#145CFF]" />,
    },
    {
      id: 'diagnostico-injecao',
      title: 'Diagnóstico de injeção',
      description: 'Scanner eletrônico automotivo, leitura de parâmetros, bicos injetores e sensores.',
      icon: <Cpu className="w-5 h-5 text-[#145CFF]" />,
    },
  ];

  return (
    <section id="servicos" className="py-16 sm:py-24 bg-[#F5F7FA] text-[#172033] border-b border-slate-200">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header - Exact requested title */}
        <div className="max-w-3xl mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#145CFF] tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Manutenção Especializada</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#172033] font-heading tracking-tight">
            O que seu carro precisa hoje?
          </h2>
          
          <p className="text-base sm:text-lg text-slate-600">
            Conheça nossos principais serviços para a segurança, estabilidade e desempenho do seu veículo no Bairro Brasil.
          </p>
        </div>

        {/* 3 Featured Cards with 3D Illustrations (Large, Uncropped) & Interactive 3° Tilt */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-14">
          {featuredServices.map(feat => {
            const currentTilt = tilt[feat.id] || { rotateX: 0, rotateY: 0 };
            const tiltStyle: React.CSSProperties = {
              transform: `perspective(1000px) rotateX(${currentTilt.rotateX}deg) rotateY(${currentTilt.rotateY}deg)`,
              transition: currentTilt.rotateX === 0 && currentTilt.rotateY === 0 
                ? 'transform 0.4s ease-out, box-shadow 0.3s ease' 
                : 'transform 0.08s ease-out, box-shadow 0.2s ease',
            };

            return (
              <div
                key={feat.id}
                onMouseMove={e => handleMouseMove(feat.id, e)}
                onMouseLeave={() => handleMouseLeave(feat.id)}
                style={tiltStyle}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-md hover:shadow-xl hover:border-blue-300 transition-all flex flex-col justify-between overflow-hidden group will-change-transform"
              >
                {/* 3D Illustration Frame - Padded & Perfectly Sized without Cutting */}
                <div className="relative w-full aspect-[4/3] bg-gradient-to-b from-[#081426] to-[#0A1A33] p-4 flex items-center justify-center overflow-hidden">
                  
                  {/* Subtle radial light in background of 3D piece */}
                  <div className="absolute inset-0 bg-blue-500/10 radial-gradient pointer-events-none" />

                  <img
                    key={feat.image}
                    src={feat.image}
                    alt={feat.imageAlt}
                    loading="lazy"
                    decoding="async"
                    className="relative z-10 w-full h-full object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Badge */}
                  <div className="absolute top-3 left-3 z-20">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#081426]/90 text-blue-300 border border-blue-900/60 backdrop-blur-sm shadow-sm">
                      {feat.badge}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-[#172033] font-heading group-hover:text-[#145CFF] transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <button
                      onClick={() => onSelectServiceForQuote(feat.serviceItem)}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold text-white bg-[#145CFF] hover:bg-blue-600 active:bg-blue-700 rounded-xl shadow-md transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Solicitar orçamento</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Informative Note: 3D parts are illustrations of services */}
        <div className="mb-10 flex items-center gap-2 text-xs text-slate-500 px-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>* As imagens automotivas 3D acima são ilustrações conceituais dos serviços técnicos prestados por nossa equipe.</span>
        </div>

        {/* Complementary Services Line (Troca de óleo e filtros; mecânica e revisão; diagnóstico de injeção) */}
        <div className="pt-4 border-t border-slate-200">
          <div className="mb-6">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Serviços Complementares da Oficina
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {complementaryServices.map(comp => {
              const matchedService = services.find(s => 
                s.title.toLowerCase().includes(comp.title.toLowerCase().split(' ')[0])
              ) || {
                id: comp.id,
                title: comp.title,
                shortDescription: comp.description,
                fullDescription: '',
                category: 'mecanica',
                iconName: 'Wrench',
                priceType: 'diagnostic_required',
                includedItems: [],
                active: true,
              } as ServiceItem;

              return (
                <div 
                  key={comp.id}
                  className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-2.5">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                      {comp.icon}
                    </div>
                    <h5 className="text-base font-bold text-[#172033] group-hover:text-[#145CFF] transition-colors">
                      {comp.title}
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {comp.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-100">
                    <button
                      onClick={() => onSelectServiceForQuote(matchedService)}
                      className="text-xs font-semibold text-[#145CFF] hover:text-blue-700 flex items-center gap-1.5 transition-colors"
                    >
                      <span>Solicitar orçamento</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* INTERACTIVE 3D AUTOMOTIVE VIEWER (Three.js with 360° drag and offscreen pause) */}
        <div className="mt-14 pt-10 border-t border-slate-200">
          <div className="max-w-3xl mb-6 space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#145CFF] tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tecnologia & Visualização 3D</span>
            </div>
            <h4 className="text-2xl font-extrabold text-[#172033] font-heading">
              Inspeção Técnica Interativa: Roda e Conjunto de Freio
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Arraste a peça em 360°, aproxime o disco ventilado e confira os detalhes dos sistemas de segurança e geometria que revisamos na oficina.
            </p>
          </div>

          <Automotive3DViewer 
            onOpenQuoteWithService={(serviceName) => {
              const matched = services.find(s => 
                s.title.toLowerCase().includes('freio') || s.title.toLowerCase().includes('alinhamento')
              ) || services[0];
              onSelectServiceForQuote({
                ...matched,
                title: serviceName || matched.title,
              });
            }}
          />
        </div>

      </div>
    </section>
  );
};
