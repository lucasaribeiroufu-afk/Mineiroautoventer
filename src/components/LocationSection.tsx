import React, { useState } from 'react';
import { CompanySettings } from '../types';
import { StorageService } from '../services/storage';
import { REAL_IMAGE_FILENAMES } from '../utils/imagePaths';
import { 
  MapPin, 
  Navigation, 
  MessageSquare,
  Calendar,
  Phone,
  Clock,
  ExternalLink
} from 'lucide-react';

interface LocationSectionProps {
  settings: CompanySettings;
  onOpenAppointment: () => void;
}

export const LocationSection: React.FC<LocationSectionProps> = ({ 
  settings,
  onOpenAppointment
}) => {
  const [phoneImgError, setPhoneImgError] = useState(false);

  const phonePhoto = settings.workshopPhotos?.contactPhone || REAL_IMAGE_FILENAMES.contactPhone;

  const handleDirectionsClick = () => {
    StorageService.trackEvent('maps_click', 'location_section_directions');
    window.open(settings.googleMapsDestinationUrl, '_blank', 'noopener,noreferrer');
  };

  const handleWhatsAppClick = () => {
    StorageService.trackEvent('whatsapp_click', 'location_section_whatsapp');
    window.open('https://wa.me/5534996342522?text=' + encodeURIComponent('Olá! Gostaria de falar sobre a oficina.'), '_blank');
  };

  return (
    <section id="contato" className="py-16 sm:py-24 bg-[#F5F7FA] text-[#172033] border-t border-slate-200">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12 space-y-3">
          <div className="text-xs font-bold text-[#145CFF] tracking-wider uppercase">
            Localização e Contato
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#172033] font-heading tracking-tight">
            Venha nos visitar no Bairro Brasil
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            Fácil acesso em Uberlândia com atendimento ágil, estacionamento próprio e equipe pronta para receber seu veículo.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          
          {/* Lado Esquerdo/Direito: Informações, Foto de Atendimento Telefônico & WhatsApp */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            
            {/* Foto de Atendimento por Telefone e Canais Diretos */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              
              {/* Card com Foto de Atendimento ao Telefone (1:1 Sem cortes) */}
              <div className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-300 bg-white shrink-0 flex items-center justify-center shadow-sm">
                  {!phoneImgError ? (
                    <img
                      src={phonePhoto}
                      alt="Profissional ao telefone na oficina Mineiro Auto Center"
                      onError={() => setPhoneImgError(true)}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover object-center"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Phone className="w-7 h-7 text-[#145CFF]" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#172033]">Atendimento Direto da Oficina</h4>
                  <p className="text-xs text-slate-600 mt-0.5">Tire dúvidas sobre serviços, peças e horários diretamente com nossa equipe.</p>
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-[#145CFF] shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#172033]">Endereço Oficial</h3>
                    <p className="text-sm text-slate-700 font-medium mt-0.5">
                      Rua Ricardo Siquierolli Tucci, nº 2749
                    </p>
                    <p className="text-xs text-slate-500">
                      Bairro Brasil, Uberlândia–MG, CEP 38400-722
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleDirectionsClick}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-[#145CFF] hover:text-white bg-blue-50 hover:bg-[#145CFF] border border-blue-200 rounded-xl transition-all"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Como chegar (Abrir no Google Maps)</span>
                    <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                  </button>
                </div>
              </div>

              {/* WhatsApp e Contato (Verde APENAS no WhatsApp) */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                
                {/* WhatsApp button com verde #25D366 */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-emerald-100 text-[#25D366]">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block font-medium">WhatsApp Oficial</span>
                      <span className="text-sm font-bold text-[#172033]">
                        (34) 99634-2522
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleWhatsAppClick}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#25D366] hover:bg-[#20ba5a] active:bg-[#1da851] rounded-xl shadow transition-all hover:-translate-y-0.5"
                  >
                    Conversar
                  </button>
                </div>

                {/* Agendamento */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-blue-100 text-[#145CFF]">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block font-medium">Horário de Atendimento</span>
                      <span className="text-xs text-slate-700 font-semibold">
                        Segunda a Sexta: 08h às 18h | Sábado: 08h às 12h
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={onOpenAppointment}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#145CFF] hover:bg-blue-600 rounded-xl shadow transition-all hover:-translate-y-0.5"
                  >
                    Agendar
                  </button>
                </div>

              </div>

            </div>

          </div>

          {/* Lado do Mapa: Google Maps Integrado com Endereço Oficial */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="w-full flex-1 min-h-[380px] rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-white relative">
              <iframe
                title="Localização Mineiro Auto Center no Google Maps"
                src="https://maps.google.com/maps?q=Rua%20Ricardo%20Siquierolli%20Tucci,%202749,%20Bairro%20Brasil,%20Uberl%C3%A2ndia%20MG&t=&z=16&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                className="w-full h-full min-h-[400px] border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />

              {/* Float badge sobre o mapa */}
              <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200 shadow-md text-xs font-semibold text-[#172033] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#145CFF]" />
                <span>Mineiro Auto Center — nº 2749</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
