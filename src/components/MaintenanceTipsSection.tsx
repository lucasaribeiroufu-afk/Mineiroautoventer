import React, { useState, useEffect } from 'react';
import { MaintenanceTip } from '../types';
import { StorageService } from '../services/storage';
import { TipArticleModal } from './TipArticleModal';
import { 
  BookOpen, 
  Droplets, 
  Disc, 
  Sliders, 
  Wrench, 
  Clock, 
  ArrowRight, 
  AlertTriangle, 
  Sparkles,
  Calendar,
  MessageSquare
} from 'lucide-react';

interface MaintenanceTipsSectionProps {
  onOpenAppointmentWithService?: (serviceName?: string) => void;
  onOpenQuoteWithService?: (serviceName?: string) => void;
}

export const MaintenanceTipsSection: React.FC<MaintenanceTipsSectionProps> = ({
  onOpenAppointmentWithService,
  onOpenQuoteWithService,
}) => {
  const [tips, setTips] = useState<MaintenanceTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [activeArticle, setActiveArticle] = useState<MaintenanceTip | null>(null);

  useEffect(() => {
    const loadTips = async () => {
      try {
        const data = await StorageService.fetchTips();
        setTips(data);
      } catch (err) {
        console.warn('Erro ao carregar dicas de manutenção:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTips();

    // Listen to real-time tips updates from SSE
    const unsubscribe = StorageService.subscribeToScheduleEvents(event => {
      if (event.type === 'tips_updated') {
        loadTips();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const categories = [
    { id: 'todos', label: 'Todas as Dicas' },
    { id: 'oleo', label: 'Óleo & Filtros' },
    { id: 'freios', label: 'Freios & Segurança' },
    { id: 'pneus', label: 'Geometria & Pneus' },
    { id: 'suspensao', label: 'Suspensão & Barulhos' },
  ];

  const filteredTips = selectedCategory === 'todos' 
    ? tips 
    : tips.filter(t => t.category === selectedCategory);

  const getCategoryBadge = (category: MaintenanceTip['category']) => {
    switch (category) {
      case 'oleo':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: <Droplets className="w-3.5 h-3.5 text-amber-600" />,
        };
      case 'freios':
        return {
          bg: 'bg-red-50 text-red-800 border-red-200',
          icon: <Disc className="w-3.5 h-3.5 text-red-600" />,
        };
      case 'pneus':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          icon: <Disc className="w-3.5 h-3.5 text-blue-600" />,
        };
      case 'suspensao':
        return {
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          icon: <Sliders className="w-3.5 h-3.5 text-indigo-600" />,
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-800 border-slate-200',
          icon: <Wrench className="w-3.5 h-3.5 text-slate-600" />,
        };
    }
  };

  // Structured Data Schema.org (FAQPage & Articles for Google Search Local SEO)
  const schemaFaqData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': tips.map(tip => ({
      '@type': 'Question',
      'name': tip.title,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': `${tip.summary} ${tip.keyPoints.join(' ')}`,
      },
    })),
  };

  return (
    <section id="dicas" className="py-16 sm:py-24 bg-[#F5F7FA] text-[#172033] border-b border-slate-200">
      {/* Schema.org FAQPage for SEO */}
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFaqData) }}
      />

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-[#145CFF] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dicas Técnicas & Cuidados Preventivos</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#081426] font-heading tracking-tight">
            Dicas de Manutenção do Mineiro
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Orientações práticas de mecânica preventiva para você identificar ruídos, saber o momento exato de trocar fluidos e evitar quebras caras nas ruas de Uberlândia.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-10 pb-2 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-[#145CFF] text-white shadow-md'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Tips Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse space-y-4">
                <div className="h-5 bg-slate-200 rounded w-1/3" />
                <div className="h-7 bg-slate-200 rounded w-3/4" />
                <div className="h-16 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : filteredTips.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-base font-bold text-slate-800">Nenhum artigo nesta categoria</h4>
            <p className="text-xs text-slate-500">Selecione "Todas as Dicas" para visualizar os artigos técnicos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {filteredTips.map(tip => {
              const badge = getCategoryBadge(tip.category);

              return (
                <article
                  key={tip.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all flex flex-col justify-between overflow-hidden group p-6 sm:p-7"
                >
                  <div className="space-y-4">
                    
                    {/* Top Meta: Category + Read Time */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${badge.bg}`}>
                        {badge.icon}
                        <span>{tip.categoryLabel}</span>
                      </span>

                      <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{tip.readTime}</span>
                      </span>
                    </div>

                    {/* Title */}
                    <h3 
                      onClick={() => setActiveArticle(tip)}
                      className="text-xl sm:text-2xl font-bold text-[#081426] font-heading group-hover:text-[#145CFF] transition-colors cursor-pointer leading-snug"
                    >
                      {tip.title}
                    </h3>

                    {/* Summary */}
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {tip.summary}
                    </p>

                    {/* Symptoms Quick Box */}
                    {tip.symptoms && tip.symptoms.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/70 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Fique atento se notar:</span>
                        </div>
                        <p className="text-xs text-amber-950 font-medium leading-relaxed">
                          {tip.symptoms[0]}
                        </p>
                      </div>
                    )}

                    {/* Key takeaways bullet points */}
                    <div className="space-y-1.5 pt-2">
                      {tip.keyPoints.slice(0, 2).map((point, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#145CFF] mt-1.5 shrink-0" />
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>

                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-6 mt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <button
                      onClick={() => setActiveArticle(tip)}
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-[#145CFF] hover:text-blue-700 transition-colors group/btn"
                    >
                      <span>Ler artigo completo</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </button>

                    <div className="flex items-center gap-2">
                      {onOpenQuoteWithService && (
                        <button
                          onClick={() => onOpenQuoteWithService(tip.title)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
                          title="Pedir orçamento para este serviço"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                          <span>Orçar</span>
                        </button>
                      )}

                      {onOpenAppointmentWithService && (
                        <button
                          onClick={() => onOpenAppointmentWithService(tip.title)}
                          className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#145CFF] hover:bg-blue-600 rounded-lg shadow-sm transition-all hover:scale-[1.02]"
                          title="Agendar revisão deste item"
                        >
                          <Calendar className="w-3.5 h-3.5 inline mr-1" />
                          <span>Agendar</span>
                        </button>
                      )}
                    </div>
                  </div>

                </article>
              );
            })}
          </div>
        )}

        {/* Quick CTA Bottom Banner */}
        <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#081426] to-[#0A1A33] text-white border border-blue-900/40 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-lg font-bold text-white">Notou algum ruído estranho ou luz acesa no seu carro?</h4>
            <p className="text-xs sm:text-sm text-slate-300">
              Traga para uma avaliação diagnóstica transparente com nossa equipe no Bairro Brasil.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {onOpenAppointmentWithService && (
              <button
                onClick={() => onOpenAppointmentWithService('Avaliação Diagnóstica Preventiva')}
                className="px-5 py-3 text-xs sm:text-sm font-bold text-white bg-[#145CFF] hover:bg-blue-600 rounded-xl shadow-md transition-all hover:-translate-y-0.5"
              >
                Agendar Avaliação
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Full Article Reading Modal */}
      <TipArticleModal
        tip={activeArticle}
        isOpen={Boolean(activeArticle)}
        onClose={() => setActiveArticle(null)}
        onScheduleService={(serviceId) => {
          if (onOpenAppointmentWithService) {
            onOpenAppointmentWithService(activeArticle?.title || serviceId);
          }
        }}
        onOpenQuote={(serviceId) => {
          if (onOpenQuoteWithService) {
            onOpenQuoteWithService(activeArticle?.title || serviceId);
          }
        }}
      />
    </section>
  );
};
