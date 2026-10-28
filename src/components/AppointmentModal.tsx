import React, { useState, useEffect } from 'react';
import { CompanySettings, ServiceItem, AppointmentRequest, ScheduleAvailability } from '../types';
import { StorageService, OFFICIAL_WHATSAPP_PHONE } from '../services/storage';
import { fetchVerifiedAvailability, workshopDate, workshopTomorrow } from '../services/bookingAvailability';
import { X, Calendar, MessageSquare, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CompanySettings;
  services: ServiceItem[];
  onOpenPrivacyPolicy: () => void;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  settings,
  services,
  onOpenPrivacyPolicy,
}) => {
  const getTomorrowString = () => workshopTomorrow();

  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    vehicleModel: '',
    vehicleYear: '',
    serviceName: services[0]?.title || 'Revisão preventiva',
    preferredDate: getTomorrowString(),
    preferredTime: '08:00',
    notes: '',
  });

  const [availability, setAvailability] = useState<ScheduleAvailability | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedApt, setSubmittedApt] = useState<AppointmentRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Fetch real-time server availability whenever selected date changes
  useEffect(() => {
    if (!isOpen || !formData.preferredDate) return;

    let isMounted = true;
    setLoadingAvailability(true);
    setAvailability(null);
    setAvailabilityError(null);
    setServerError(null);

    fetchVerifiedAvailability(formData.preferredDate)
      .then(res => {
        if (!isMounted) return;
        setAvailability(res);
        // If current preferredTime is unavailable, select the first available slot
        const availableSlots = res.slots.filter(s => s.available);
        if (availableSlots.length > 0 && !availableSlots.some(s => s.time === formData.preferredTime)) {
          setFormData(prev => ({ ...prev, preferredTime: availableSlots[0].time }));
        }
      })
      .catch(err => {
        if (isMounted) { setAvailability(null); setAvailabilityError(err.message || 'Não foi possível consultar a agenda. Fale com a equipe pelo WhatsApp.'); }
      })
      .finally(() => {
        if (isMounted) setLoadingAvailability(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, formData.preferredDate]);

  // Subscribe to real-time events while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = StorageService.subscribeToScheduleEvents(event => {
      // Refresh availability if an appointment was created/updated or config changed
      if (formData.preferredDate) {
        fetchVerifiedAvailability(formData.preferredDate).then(result => { setAvailability(result); setAvailabilityError(null); }).catch(() => { setAvailability(null); setAvailabilityError('A consulta à agenda foi interrompida. Tente outra data ou consulte a equipe.'); });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, formData.preferredDate]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Informe seu nome.';
    
    const cleanPhone = formData.whatsapp.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      errs.whatsapp = 'Informe um WhatsApp com DDD válido.';
    }

    if (!formData.vehicleModel.trim()) {
      errs.vehicleModel = 'Informe o modelo do veículo.';
    }

    if (!formData.vehicleYear.trim()) {
      errs.vehicleYear = 'Informe o ano do veículo.';
    }

    if (!formData.serviceName.trim()) {
      errs.serviceName = 'Selecione o serviço desejado.';
    }

    if (!formData.preferredDate) {
      errs.preferredDate = 'Selecione uma data pretendida.';
    }

    if (!formData.preferredTime) {
      errs.preferredTime = 'Selecione um horário pretendido.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;
    if (loadingAvailability || availabilityError || !availability?.slots.some(slot => slot.time === formData.preferredTime && slot.available)) { setServerError('Consulte e selecione um horário disponível antes de enviar.'); return; }

    setIsSubmitting(true);

    try {
      const latest = await fetchVerifiedAvailability(formData.preferredDate);
      if (!latest.slots.some(slot => slot.time === formData.preferredTime && slot.available)) { setAvailability(latest); throw new Error('Este horário não está mais disponível. Selecione outro horário.'); }
      const created = await StorageService.submitAppointment({
        clientName: formData.name.trim(),
        whatsapp: formData.whatsapp.trim(),
        vehicleModel: formData.vehicleModel.trim(),
        vehicleYear: formData.vehicleYear.trim(),
        serviceName: formData.serviceName.trim(),
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime,
        notes: formData.notes.trim(),
        source: 'site',
      });

      setSubmittedApt(created);
    } catch (err: any) {
      setServerError(err.message || 'Erro ao registrar agendamento no servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenWhatsAppContinuar = () => {
    if (!submittedApt) return;

    // Formatting date DD/MM/AAAA
    const [y, m, d] = submittedApt.preferredDate.split('-');
    const formattedDate = `${d}/${m}/${y}`;
    const dateTimeStr = `${formattedDate} às ${submittedApt.preferredTime}`;

    const vehicleInfo = `${submittedApt.vehicleModel} (${submittedApt.vehicleYear})`;
    const obsText = submittedApt.notes?.trim() || 'Nenhuma';

    const message = 
      `Olá! Solicitei um agendamento pelo site do Mineiro Auto Center.\n` +
      `Solicitação: ${submittedApt.id}\n` +
      `Nome: ${submittedApt.clientName}\n` +
      `Veículo: ${vehicleInfo}\n` +
      `Serviço: ${submittedApt.serviceName}\n` +
      `Data e horário pretendidos: ${dateTimeStr}\n` +
      `Observações: ${obsText}`;

    const cleanPhone = settings.whatsappPhone.replace(/\D/g, '') || OFFICIAL_WHATSAPP_PHONE;
    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  const handleResetAndClose = () => {
    setSubmittedApt(null);
    setServerError(null);
    setFormData({
      name: '',
      whatsapp: '',
      vehicleModel: '',
      vehicleYear: '',
      serviceName: services[0]?.title || 'Revisão preventiva',
      preferredDate: getTomorrowString(),
      preferredTime: '08:00',
      notes: '',
    });
    setErrors({});
    onClose();
  };

  const todayStr = workshopDate();
  const hasAvailableSlot = !!availability?.slots.some(slot => slot.available);
  const contactForAvailability = () => {
    const phone = settings.whatsappPhone.replace(/\D/g, '') || OFFICIAL_WHATSAPP_PHONE;
    const destination = phone.startsWith('55') && phone.length >= 12 ? phone : '55' + phone;
    window.open(`https://wa.me/${destination}?text=${encodeURIComponent('Olá! Gostaria de consultar disponibilidade para ' + formData.serviceName + ' no Mineiro Auto Center.')}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 my-8 text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-apt-title"
      >
        <button
          onClick={handleResetAndClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Fechar janela"
        >
          <X className="w-5 h-5" />
        </button>

        {!submittedApt ? (
          <div>
            <div className="mb-6 space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5" />
                <span>Agendar Serviço</span>
              </div>
              <h2 id="modal-apt-title" className="text-xl sm:text-2xl font-bold text-white font-heading">
                Solicitação de Agendamento
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Preencha os dados e escolha a data e horário pretendidos para o atendimento.
              </p>
            </div>

            {serverError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            {availabilityError && <div role="alert" className="mb-4 p-4 rounded-xl bg-amber-950/40 border border-amber-800 text-sm text-amber-100"><p>{availabilityError}</p><button type="button" onClick={contactForAvailability} className="mt-3 underline font-semibold">Consultar disponibilidade pelo WhatsApp ↗</button></div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome completo *
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

              {/* WhatsApp */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  WhatsApp com DDD *
                </label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="(34) 99999-9999"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border ${
                    errors.whatsapp ? 'border-rose-500' : 'border-slate-800 focus:border-blue-500'
                  } text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
                {errors.whatsapp && <p className="text-xs text-rose-400 mt-1">{errors.whatsapp}</p>}
              </div>

              {/* Veículo: Modelo e Ano */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Modelo do veículo *
                  </label>
                  <input
                    type="text"
                    value={formData.vehicleModel}
                    onChange={e => setFormData({ ...formData, vehicleModel: e.target.value })}
                    placeholder="Ex: Fiat Argo"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border ${
                      errors.vehicleModel ? 'border-rose-500' : 'border-slate-800 focus:border-blue-500'
                    } text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  />
                  {errors.vehicleModel && (
                    <p className="text-xs text-rose-400 mt-1">{errors.vehicleModel}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ano do veículo *
                  </label>
                  <input
                    type="text"
                    value={formData.vehicleYear}
                    onChange={e => setFormData({ ...formData, vehicleYear: e.target.value })}
                    placeholder="Ex: 2021"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border ${
                      errors.vehicleYear ? 'border-rose-500' : 'border-slate-800 focus:border-blue-500'
                    } text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  />
                  {errors.vehicleYear && (
                    <p className="text-xs text-rose-400 mt-1">{errors.vehicleYear}</p>
                  )}
                </div>
              </div>

              {/* Serviço Desejado */}
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

              {/* Data e Horário Pretendidos */}
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Data pretendida *
                    </label>
                    <input
                      type="date"
                      min={todayStr}
                      value={formData.preferredDate}
                      onChange={e => setFormData({ ...formData, preferredDate: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border ${
                        errors.preferredDate ? 'border-rose-500' : 'border-slate-800 focus:border-blue-500'
                      } text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    />
                    {errors.preferredDate && (
                      <p className="text-xs text-rose-400 mt-1">{errors.preferredDate}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Horário pretendido *
                      </label>
                      {loadingAvailability && (
                        <span className="text-[10px] text-blue-400 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Consultando...</span>
                        </span>
                      )}
                    </div>

                    <select
                      disabled={loadingAvailability || !availability || !!availabilityError || !hasAvailableSlot}
                      aria-label="Horário pretendido"
                      value={formData.preferredTime}
                      onChange={e => setFormData({ ...formData, preferredTime: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      {availability && availability.slots ? (
                        availability.slots.map(s => (
                          <option 
                            key={s.time} 
                            value={s.time}
                            disabled={!s.available}
                          >
                            {s.time} {s.available ? '' : `(${s.reason || 'Indisponível'})`}
                          </option>
                        ))
                      ) : (
                        <option value="">{loadingAvailability ? 'Consultando a agenda…' : 'Agenda indisponível'}</option>
                      )}
                    </select>
                  </div>
                </div>

                {availability && !availability.isOpen && (
                  <p className="text-xs text-amber-400 bg-amber-950/40 border border-amber-900/60 p-2.5 rounded-xl">
                    Data indisponível: {availability.blockedReason || 'Oficina não possui expediente nesta data.'}
                  </p>
                )}
              </div>

              {/* Observações Opcionais */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Observações (opcional)
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Detalhes ou sintomas do veículo (opcional)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Aviso obrigatório */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Agendamento sujeito à confirmação da oficina. O pedido é registrado em nossa agenda e nossa equipe confirmará a vaga do box com você.
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || loadingAvailability || !availability || !!availabilityError || !hasAvailableSlot}
                  className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Registrando no servidor...</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      <span>Salvar Pedido de Agendamento</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Step 2: Confirmation state with "Continuar no WhatsApp" */
          <div className="text-center py-6 space-y-6">
            <div className="w-16 h-16 bg-blue-950/80 border border-blue-800 text-blue-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white font-heading">
                Pedido registrado com sucesso!
              </h3>
              
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 text-left space-y-1.5">
                <div><span className="text-slate-400">Solicitação:</span> <strong className="text-white">{submittedApt.id}</strong></div>
                <div><span className="text-slate-400">Nome:</span> <span className="text-white">{submittedApt.clientName}</span></div>
                <div><span className="text-slate-400">Veículo:</span> <span className="text-white">{submittedApt.vehicleModel} ({submittedApt.vehicleYear})</span></div>
                <div><span className="text-slate-400">Serviço:</span> <span className="text-white">{submittedApt.serviceName}</span></div>
                <div><span className="text-slate-400">Data e horário pretendidos:</span> <span className="text-white">{submittedApt.preferredDate} às {submittedApt.preferredTime}</span></div>
                {submittedApt.notes && <div><span className="text-slate-400">Observações:</span> <span className="text-white">{submittedApt.notes}</span></div>}
              </div>

              {/* Mandatory notice specified by user */}
              <p className="text-xs font-semibold text-amber-300 pt-2">
                Agendamento sujeito à confirmação da oficina.
              </p>
              <p className="text-xs text-slate-400">
                Solicitação recebida. O envio da mensagem pelo WhatsApp é manual: toque no botão abaixo e envie a mensagem no aplicativo. A oficina ainda precisa confirmar o atendimento.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={handleOpenWhatsAppContinuar}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4 fill-white" />
                <span>Continuar no WhatsApp</span>
              </button>

              <button
                onClick={handleResetAndClose}
                className="text-xs text-slate-400 hover:text-white transition-colors py-2"
              >
                Fechar janela
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
