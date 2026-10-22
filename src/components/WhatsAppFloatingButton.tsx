import React from 'react';
import { CompanySettings } from '../types';
import { StorageService, OFFICIAL_WHATSAPP_PHONE } from '../services/storage';
import { MessageSquare, Calendar } from 'lucide-react';

interface WhatsAppFloatingButtonProps {
  settings: CompanySettings;
  onOpenAppointment: () => void;
}

export const WhatsAppFloatingButton: React.FC<WhatsAppFloatingButtonProps> = ({ 
  settings,
  onOpenAppointment 
}) => {
  const cleanPhone = settings.whatsappPhone.replace(/\D/g, '') || OFFICIAL_WHATSAPP_PHONE;

  const handleWhatsAppClick = () => {
    StorageService.trackEvent('whatsapp_click', 'floating_action');
    const message = encodeURIComponent('Olá! Vim pelo site do Mineiro Auto Center e gostaria de atendimento.');
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {/* Mobile Fixed Bar: Agendar serviço + WhatsApp sem encobrir conteúdo */}
      <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-slate-950/95 backdrop-blur-md border-t border-slate-800 p-3 shadow-2xl pointer-events-auto">
        <div className="flex items-center gap-2 max-w-md mx-auto">
          <button
            onClick={onOpenAppointment}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold active:bg-slate-800 transition-colors shadow-sm"
          >
            <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Agendar serviço</span>
          </button>

          <button
            onClick={handleWhatsAppClick}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-md"
          >
            <MessageSquare className="w-4 h-4 fill-white shrink-0" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Desktop Floating WhatsApp Button */}
      <div className="hidden sm:flex fixed bottom-6 right-6 z-40 items-end flex-col gap-2 pointer-events-auto">
        <button
          onClick={handleWhatsAppClick}
          className="group relative flex items-center justify-center w-14 h-14 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/50"
          aria-label="Abrir conversa no WhatsApp oficial do Mineiro Auto Center"
          title="Fale no WhatsApp (34) 99634-2522"
        >
          <MessageSquare className="w-7 h-7 fill-white" />
        </button>
      </div>
    </>
  );
};
