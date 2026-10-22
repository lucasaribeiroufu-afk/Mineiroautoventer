import React, { useState, useEffect } from 'react';
import { CompanySettings, ServiceItem } from '../types';
import { StorageService, OFFICIAL_WHATSAPP_PHONE } from '../services/storage';
import { X, MessageSquare, AlertCircle } from 'lucide-react';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CompanySettings;
  services: ServiceItem[];
  preSelectedService?: ServiceItem | null;
  onOpenPrivacyPolicy: () => void;
}

export const QuoteModal: React.FC<QuoteModalProps> = ({
  isOpen,
  onClose,
  settings,
  services,
  preSelectedService,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    vehicle: '',
    serviceName: '',
    issueDescription: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (preSelectedService) {
      setFormData(prev => ({
        ...prev,
        serviceName: preSelectedService.title,
      }));
    } else if (services.length > 0 && !formData.serviceName) {
      setFormData(prev => ({
        ...prev,
        serviceName: services[0].title,
      }));
    }
  }, [preSelectedService, services]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Informe seu nome.';
    if (!formData.vehicle.trim()) errs.vehicle = 'Informe o modelo e ano do veículo.';
    if (!formData.serviceName.trim()) errs.serviceName = 'Selecione o serviço.';
    if (!formData.issueDescription.trim()) errs.issueDescription = 'Descreva brevemente o problema ou necessidade.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Track event locally
    StorageService.addQuote({
      clientName: formData.name.trim(),
      whatsapp: '',
      vehicleModel: formData.vehicle.trim(),
      vehicleYear: '',
      serviceId: '',
      serviceName: formData.serviceName.trim(),
      issueDescription: formData.issueDescription.trim(),
      allowPromo: false,
    });

    const message = 
      `Olá! Vim pelo site do Mineiro Auto Center e gostaria de solicitar um orçamento.\n\n` +
      `Nome: ${formData.name.trim()}\n` +
      `Veículo: ${formData.vehicle.trim()}\n` +
      `Serviço: ${formData.serviceName.trim()}\n` +
      `Descrição do problema: ${formData.issueDescription.trim()}`;

    const cleanPhone = settings.whatsappPhone.replace(/\D/g, '') || OFFICIAL_WHATSAPP_PHONE;
    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 my-8 text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quote-modal-title"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Fechar janela"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6 space-y-1">
          <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
            Solicitação Direta
          </div>
          <h2 id="quote-modal-title" className="text-xl sm:text-2xl font-bold text-white font-heading">
            Solicitar orçamento
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Solicite seu orçamento pelo WhatsApp. Serviços que dependem de diagnóstico serão orçados após avaliação.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nome *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Seu nome"
              className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border ${
                errors.name ? 'border-rose-500' : 'border-slate-800 focus:border-blue-500'
              } text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
            />
            {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name}</p>}
          </div>

          {/* Veículo */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Veículo (modelo e ano) *
            </label>
            <input
              type="text"
              value={formData.vehicle}
              onChange={e => setFormData({ ...formData, vehicle: e.target.value })}
              placeholder="Ex: Palio 2015"
              className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border ${
                errors.vehicle ? 'border-rose-500' : 'border-slate-800 focus:border-blue-500'
              } text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
            />
            {errors.vehicle && <p className="text-xs text-rose-400 mt-1">{errors.vehicle}</p>}
          </div>

          {/* Serviço */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Serviço desejado *
            </label>
            <select
              value={formData.serviceName}
              onChange={e => setFormData({ ...formData, serviceName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {services
                .filter(s => s.active)
                .map(srv => (
                  <option key={srv.id} value={srv.title}>
                    {srv.title}
                  </option>
                ))}
              <option value="Outro serviço mecânico">Outro serviço mecânico</option>
            </select>
          </div>

          {/* Descrição do problema */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Descrição do problema *
            </label>
            <textarea
              rows={3}
              value={formData.issueDescription}
              onChange={e => setFormData({ ...formData, issueDescription: e.target.value })}
              placeholder="Ex: Barulho na roda dianteira ao frear, luz da injeção acesa, revisão antes de viajar..."
              className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border ${
                errors.issueDescription ? 'border-rose-500' : 'border-slate-800 focus:border-blue-500'
              } text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
            />
            {errors.issueDescription && (
              <p className="text-xs text-rose-400 mt-1">{errors.issueDescription}</p>
            )}
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span>
              Ao clicar no botão abaixo, a conversa no WhatsApp oficial da oficina será aberta com seus dados preenchidos.
            </span>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              <span>Enviar Orçamento no WhatsApp</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
