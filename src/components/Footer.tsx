import React from 'react';
import { CompanySettings } from '../types';
import { Logo } from './Logo';
import { Instagram, MapPin, MessageSquare, Lock, Navigation } from 'lucide-react';

interface FooterProps {
  settings: CompanySettings;
  onOpenPrivacy: () => void;
  onOpenAdmin: () => void;
  onOpenAppointment: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  onOpenPrivacy,
  onOpenAdmin,
  onOpenAppointment,
}) => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 text-xs py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Col 1: Brand & Bio */}
          <div className="space-y-4 md:col-span-1">
            <Logo size="md" />
            <p className="text-slate-400 text-xs leading-relaxed">
              Oficina mecânica no Bairro Brasil em Uberlândia–MG. Cuidado e manutenção para o seu automóvel.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-slate-900 text-slate-300 hover:text-pink-400 hover:bg-slate-800 transition-colors"
                aria-label="Instagram do Mineiro Auto Center"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={settings.googleMapsDestinationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-slate-900 text-slate-300 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                aria-label="Traçar rota no Google Maps"
              >
                <Navigation className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Navegação
            </h4>
            <ul className="space-y-2">
              <li><a href="#meus-agendamentos" className="text-blue-300 hover:text-white transition-colors">Meus agendamentos</a></li>
              <li>
                <a href="#inicio" className="hover:text-white transition-colors">
                  Início
                </a>
              </li>
              <li>
                <a href="#servicos" className="hover:text-white transition-colors">
                  Serviços
                </a>
              </li>
              <li>
                <a href="#oficina" className="hover:text-white transition-colors">
                  Oficina
                </a>
              </li>
              <li>
                <button
                  onClick={onOpenAppointment}
                  className="hover:text-white transition-colors text-left"
                >
                  Agendamento
                </button>
              </li>
              <li>
                <a href="#contato" className="hover:text-white transition-colors">
                  Contato
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Unidade & Endereço */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Localização
            </h4>
            <div className="space-y-2 text-slate-300">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  {settings.street}, nº {settings.number}<br />
                  {settings.neighborhood} — {settings.city}–{settings.state}<br />
                  CEP: {settings.zipCode}
                </span>
              </p>
              <p className="flex items-center gap-2 pt-1 text-slate-300">
                <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                <a 
                  href="https://wa.me/5534996342522" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  WhatsApp: (34) 99634-2522
                </a>
              </p>
            </div>
          </div>

          {/* Col 4: Privacidade & Acesso Operacional */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Informações
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Aviso de privacidade e proteção aos dados dos clientes.
            </p>
            <div className="pt-2 flex flex-col items-start gap-2">
              <button
                onClick={onOpenPrivacy}
                className="text-blue-400 hover:text-blue-300 underline font-medium"
              >
                Aviso de Privacidade
              </button>
              <button
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 border border-blue-500 text-white transition-colors mt-2 text-xs font-semibold"
              >
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span>Área Restrita — Painel da Oficina</span>
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div>
            © {new Date().getFullYear()} {settings.name}. Todos os direitos reservados.
          </div>
          <div>
            <span>Uberlândia–MG</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
