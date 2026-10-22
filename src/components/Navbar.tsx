import React, { useState } from 'react';
import { Logo } from './Logo';
import { Menu, X, Calendar, Camera } from 'lucide-react';

interface NavbarProps {
  onOpenQuote: () => void;
  onOpenAppointment: () => void;
  onOpenAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenQuote,
  onOpenAppointment,
  onOpenAdmin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#081426]/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Original Preservada */}
          <a href="#" className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md">
            <Logo size="md" />
          </a>

          {/* Navigation Links: Início, Serviços, Oficina, Dicas e Contato */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
            <a href="#inicio" className="hover:text-white transition-colors">
              Início
            </a>
            <a href="#servicos" className="hover:text-white transition-colors">
              Serviços
            </a>
            <a href="#oficina" className="hover:text-white transition-colors">
              Oficina
            </a>
            <a href="#dicas" className="hover:text-white transition-colors">
              Dicas
            </a>
            <a href="#contato" className="hover:text-white transition-colors">
              Contato
            </a>
          </nav>

          {/* Actions: Agendar serviço + Acesso Fotos */}
          <div className="hidden sm:flex items-center gap-3">
            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-400 hover:text-blue-300 hover:bg-slate-900 border border-slate-800 rounded-lg transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                title="Painel da oficina para adicionar ou gerenciar fotos"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Fotos da Oficina</span>
              </button>
            )}

            <button
              onClick={onOpenAppointment}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#145CFF] hover:bg-blue-600 active:bg-blue-700 rounded-xl shadow-md transition-all hover:-translate-y-0.5 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <Calendar className="w-4 h-4" />
              <span>Agendar serviço</span>
            </button>
          </div>

          {/* Mobile buttons */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onOpenAppointment}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#145CFF] hover:bg-blue-600 rounded-lg whitespace-nowrap"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Agendar</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white focus:outline-none rounded-lg"
              aria-label="Abrir menu de navegação"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-[#081426] px-4 pt-3 pb-6 space-y-3">
          <nav className="flex flex-col space-y-2 text-base font-medium text-slate-300">
            <a
              href="#inicio"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-white transition-colors"
            >
              Início
            </a>
            <a
              href="#servicos"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-white transition-colors"
            >
              Serviços
            </a>
            <a
              href="#oficina"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-white transition-colors"
            >
              Oficina
            </a>
            <a
              href="#dicas"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-white transition-colors"
            >
              Dicas de Manutenção
            </a>
            <a
              href="#contato"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-white transition-colors"
            >
              Contato
            </a>
          </nav>

          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAppointment();
              }}
              className="w-full py-2.5 px-4 text-center text-sm font-semibold text-white bg-[#145CFF] hover:bg-blue-600 rounded-xl shadow flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Agendar serviço</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenQuote();
              }}
              className="w-full py-2.5 px-4 text-center text-sm font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl"
            >
              Solicitar orçamento
            </button>

            {onOpenAdmin && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdmin();
                }}
                className="w-full py-2 px-3 text-center text-xs font-semibold text-blue-400 bg-blue-950/40 hover:bg-blue-950 border border-blue-900/60 rounded-xl flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>Fotos da Oficina (Adicionar Fotos)</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
