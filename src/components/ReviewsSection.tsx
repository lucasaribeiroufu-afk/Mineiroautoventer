import React from 'react';
import { CompanySettings } from '../types';
import { StorageService } from '../services/storage';
import { ExternalLink, Star } from 'lucide-react';

interface ReviewsSectionProps {
  settings: CompanySettings;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ settings }) => {
  const handleOpenGoogle = () => {
    StorageService.trackEvent('maps_click', 'reviews_google_link');
    window.open(settings.googleReviewsUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section id="avaliacoes" className="py-16 sm:py-20 bg-[#081426] border-t border-slate-800">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 text-amber-400 justify-center">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-amber-400" />
            ))}
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            Avaliações no Google
          </h2>

          <p className="text-base text-slate-300">
            Acompanhe as opiniões e relatos de clientes que já realizaram manutenção conosco diretamente no nosso perfil do Google.
          </p>

          <div className="pt-4">
            <button
              onClick={handleOpenGoogle}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#145CFF] hover:bg-blue-600 rounded-xl transition-all shadow-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <span>Ver avaliações no Google</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
