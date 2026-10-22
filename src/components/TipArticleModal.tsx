import React from 'react';
import { MaintenanceTip } from '../types';
import { 
  X, 
  Calendar, 
  MessageSquare, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Share2, 
  Wrench, 
  Droplets, 
  Disc, 
  Sliders 
} from 'lucide-react';

interface TipArticleModalProps {
  tip: MaintenanceTip | null;
  isOpen: boolean;
  onClose: () => void;
  onScheduleService: (serviceId?: string) => void;
  onOpenQuote: (serviceId?: string) => void;
}

export const TipArticleModal: React.FC<TipArticleModalProps> = ({
  tip,
  isOpen,
  onClose,
  onScheduleService,
  onOpenQuote,
}) => {
  if (!isOpen || !tip) return null;

  const getCategoryIcon = (category: MaintenanceTip['category']) => {
    switch (category) {
      case 'oleo':
        return <Droplets className="w-5 h-5 text-amber-400" />;
      case 'freios':
        return <Disc className="w-5 h-5 text-red-400" />;
      case 'pneus':
        return <Disc className="w-5 h-5 text-blue-400" />;
      case 'suspensao':
        return <Sliders className="w-5 h-5 text-indigo-400" />;
      default:
        return <Wrench className="w-5 h-5 text-blue-400" />;
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: tip.title,
        text: tip.summary,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${tip.title} - Dicas Mineiro Auto Center: ${window.location.href}`);
      alert('Link do artigo copiado para a área de transferência!');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tip-modal-title"
    >
      <div 
        className="relative w-full max-w-3xl bg-[#081426] border border-blue-900/50 rounded-2xl shadow-2xl text-slate-100 overflow-hidden my-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between gap-4 bg-gradient-to-r from-[#050D1A] to-[#0A1A33]">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-950/80 border border-blue-800 text-blue-300">
                {getCategoryIcon(tip.category)}
                <span>{tip.categoryLabel}</span>
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>{tip.readTime} de leitura</span>
              </span>
              <span className="text-xs text-slate-500">• Bairro Brasil, Uberlândia</span>
            </div>
            <h2 id="tip-modal-title" className="text-xl sm:text-2xl font-extrabold text-white font-heading leading-tight">
              {tip.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700 transition-colors shrink-0"
            aria-label="Fechar artigo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-300 text-sm sm:text-base leading-relaxed">
          
          {/* Summary Lead */}
          <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-900/40 text-blue-100 font-medium leading-relaxed">
            {tip.summary}
          </div>

          {/* Sinais de Alerta (Sintomas) */}
          {tip.symptoms && tip.symptoms.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/40 space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Sinais de Alerta: Quando Procurar a Oficina Imediatamente</span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                {tip.symptoms.map((symptom, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold mt-0.5">•</span>
                    <span>{symptom}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Full Article Content */}
          <div className="space-y-4 text-slate-200">
            {tip.content.map((paragraph, idx) => (
              <p key={idx} className="leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Checklist / Pontos-Chave */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Recomendações Práticas do Especialista</span>
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
              {tip.keyPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Intervalo Recomendado */}
          {tip.recommendedInterval && (
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/50 p-3 rounded-lg border border-slate-800/60">
              <Clock className="w-4 h-4 text-blue-400 shrink-0" />
              <span><strong>Intervalo Sugerido:</strong> {tip.recommendedInterval}</span>
            </div>
          )}

          {/* Metadata Footer */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
            <span>Publicado por <strong>{tip.author}</strong></span>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-medium"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartilhar dica</span>
            </button>
          </div>

        </div>

        {/* Modal Footer CTAs */}
        <div className="p-4 sm:p-6 border-t border-slate-800 bg-[#050D1A] flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-400 hover:text-white"
          >
            Fechar
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                onOpenQuote(tip.relatedServiceId);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all"
            >
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <span>Pedir Orçamento</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onScheduleService(tip.relatedServiceId);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#145CFF] hover:bg-blue-600 rounded-xl shadow-md transition-all hover:-translate-y-0.5"
            >
              <Calendar className="w-4 h-4" />
              <span>Agendar Revisão</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
