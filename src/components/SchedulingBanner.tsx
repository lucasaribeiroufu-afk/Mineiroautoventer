import React from 'react';
import { CompanySettings } from '../types';
import { Calendar, MessageSquare } from 'lucide-react';
import { StorageService } from '../services/storage';

interface SchedulingBannerProps {
  settings: CompanySettings;
  onOpenAppointment: () => void;
}

export const SchedulingBanner: React.FC<SchedulingBannerProps> = ({
  settings,
  onOpenAppointment,
}) => {
  const handleWhatsAppClick = () => {
    StorageService.trackEvent('whatsapp_click', 'scheduling_banner');
    const cleanPhone = settings.whatsappPhone.replace(/\D/g, '') || '34996342522';
    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent('Olá! Gostaria de falar sobre a manutenção do meu veículo no Mineiro Auto Center.')}`, '_blank');
  };

  return (
    <section className="py-14 sm:py-16 bg-[#145CFF] text-white relative overflow-hidden">
      {/* Background soft ambient accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-900/20 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          
          {/* Exact requested text */}
          <div className="space-y-2 max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading tracking-tight">
              Vamos cuidar do seu carro?
            </h2>
            <p className="text-base sm:text-lg text-blue-100 font-normal">
              Agende online a sua revisão ou fale diretamente com a nossa oficina pelo WhatsApp.
            </p>
          </div>

          {/* Action buttons: "Agendar serviço" e "Falar no WhatsApp" (Verde APENAS no WhatsApp) */}
          <div className="flex flex-wrap items-center justify-center gap-4 shrink-0">
            <button
              onClick={onOpenAppointment}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-bold text-[#081426] bg-white hover:bg-slate-100 active:bg-slate-200 rounded-xl shadow-lg transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Calendar className="w-5 h-5 text-[#145CFF]" />
              <span>Agendar serviço</span>
            </button>

            {/* Verde APENAS nas ações de WhatsApp (#25D366) */}
            <button
              onClick={handleWhatsAppClick}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-bold text-white bg-[#25D366] hover:bg-[#20ba5a] active:bg-[#1da851] rounded-xl shadow-lg transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Falar no WhatsApp</span>
            </button>
          </div>

        </div>
      </div>
    </section>
  );
};
