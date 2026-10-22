import React, { useState, useEffect } from 'react';
import { 
  AppointmentRequest, 
  QuoteRequest, 
  ServerScheduleConfig, 
  BlockedPeriod,
  MaintenanceTip
} from '../../types';
import { StorageService } from '../../services/storage';
import { WORKSHOP_PHOTO_SLOTS } from '../../utils/imagePaths';
import { processAndCompressImage } from '../../utils/imageCompressor';
import { 
  LogOut, 
  Search, 
  Calendar as CalendarIcon, 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Plus, 
  Trash2, 
  X, 
  ShieldAlert, 
  CalendarCheck, 
  RefreshCw, 
  Phone, 
  Camera, 
  UploadCloud, 
  Eye,
  EyeOff,
  Key,
  FolderUp,
  Layers,
  BookOpen,
  Edit3,
  Check
} from 'lucide-react';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'appointments' | 'schedule' | 'blocks' | 'quotes' | 'photos' | 'tips';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  initialTab = 'photos',
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return StorageService.isAdminAuthenticated();
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<'appointments' | 'schedule' | 'blocks' | 'quotes' | 'photos' | 'tips'>(initialTab);
  const [draggingSlot, setDraggingSlot] = useState<string | null>(null);
  const [isBatchDragging, setIsBatchDragging] = useState(false);

  // Appointments from server
  const [appointments, setAppointments] = useState<AppointmentRequest[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Server workshop photos
  const [serverPhotos, setServerPhotos] = useState<{ photos: Record<string, string>; available: Record<string, boolean> }>({
    photos: {},
    available: {},
  });
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);

  // Schedule config from server
  const [scheduleConfig, setScheduleConfig] = useState<ServerScheduleConfig>({
    defaultCapacityPerSlot: 3,
    timeSlots: ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
    workDays: [1, 2, 3, 4, 5, 6],
    blockedPeriods: [],
  });

  // Modal for new manual appointment (WhatsApp agreed)
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    clientName: '',
    whatsapp: '',
    vehicleModel: '',
    vehicleYear: '',
    serviceName: 'Revisão preventiva',
    preferredDate: new Date().toISOString().split('T')[0],
    preferredTime: '08:00',
    notes: '',
  });

  // Modal for rescheduling
  const [reschedulingApt, setReschedulingApt] = useState<AppointmentRequest | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('08:00');

  // Blocking period form
  const [newBlockDate, setNewBlockDate] = useState(new Date().toISOString().split('T')[0]);
  const [newBlockSlot, setNewBlockSlot] = useState(''); // empty = all day
  const [newBlockReason, setNewBlockReason] = useState('');

  // Quotes list
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);

  // Maintenance Tips list & form state
  const [tips, setTips] = useState<MaintenanceTip[]>([]);
  const [showTipModal, setShowTipModal] = useState(false);
  const [editingTip, setEditingTip] = useState<Partial<MaintenanceTip> | null>(null);
  const [tipFormErrors, setTipFormErrors] = useState<string>('');
  const [savingTip, setSavingTip] = useState(false);

  // Toast notice
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const loadAllData = async () => {
    setLoadingAppointments(true);
    try {
      const [apts, cfg, photosData, tipsData] = await Promise.all([
        StorageService.fetchAdminAppointments(),
        StorageService.fetchScheduleConfig(),
        StorageService.fetchPhotos(),
        StorageService.fetchTips(true),
      ]);
      setAppointments(apts);
      setScheduleConfig(cfg);
      setServerPhotos(photosData);
      setTips(tipsData);
      setQuotes(StorageService.getQuotes());
    } catch (e) {
      console.warn('Erro ao carregar dados do servidor:', e);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const handlePhotoUpload = async (slotKey: string, filename: string, file: File) => {
    setUploadingSlot(slotKey);
    try {
      const base64 = await processAndCompressImage(file, 1600, 1600, 0.9);
      await StorageService.uploadPhoto(slotKey, filename, base64);
      showToast(`Fotografia salva no servidor como "${filename}"!`);
      const refreshed = await StorageService.fetchPhotos();
      setServerPhotos(refreshed);
      // Dispatch event to inform other components
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('workshop_photos_changed'));
    } catch (err: any) {
      showToast(err.message || 'Erro ao enviar foto para o servidor');
    } finally {
      setUploadingSlot(null);
    }
  };

  const matchSlotKeyFromFileName = (fileName: string): { slotKey: string; filename: string; title: string } | null => {
    const lower = fileName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (lower.includes('fachada') || lower.includes('frente') || lower.includes('principal')) {
      return { slotKey: 'heroFacade', filename: 'fachada_mineiro_autocenter_2749.jpg', title: 'Fachada Principal' };
    }
    if (lower.includes('chave') || lower.includes('entrega') || lower.includes('cliente')) {
      return { slotKey: 'clientKey', filename: 'atendimento_entrega_chave_cliente.jpg', title: 'Atendimento (Entrega de Chave)' };
    }
    if (lower.includes('alinh') || lower.includes('balanc') || lower.includes('geometria')) {
      return { slotKey: 'wheelAlignment', filename: 'alinhamento_balanceamento_computadorizado.jpg', title: 'Alinhamento e Balanceamento' };
    }
    if (lower.includes('amortec') || lower.includes('suspens') || lower.includes('mural')) {
      return { slotKey: 'suspension', filename: 'suspensao_amortecedores_mural_azul.jpg', title: 'Suspensão e Amortecedores' };
    }
    if (lower.includes('motor') || lower.includes('mecanic') || lower.includes('revis')) {
      return { slotKey: 'mechanicEngine', filename: 'mecanica_revisao_motor.jpg', title: 'Mecânica e Revisão (Motor)' };
    }
    if (lower.includes('profissional') || lower.includes('carro') || lower.includes('capo') || lower.includes('sobre')) {
      return { slotKey: 'aboutWorkshop', filename: 'oficina_mecanica_capo_aberto.jpg', title: 'Sobre a Oficina (Profissional ao lado do carro)' };
    }
    if (lower.includes('telefone') || lower.includes('contato')) {
      return { slotKey: 'contactPhone', filename: 'atendimento_telefone_oficina.jpg', title: 'Atendimento por Telefone' };
    }
    if (lower.includes('roda') || lower.includes('pneu') || (lower.includes('alinh') && lower.includes('3d'))) {
      return { slotKey: 'wheel3D', filename: 'roda_3d_ilustracao.jpg', title: 'Roda 3D (Ilustração)' };
    }
    if (lower.includes('suspensao 3d') || (lower.includes('amortec') && lower.includes('3d'))) {
      return { slotKey: 'suspension3D', filename: 'suspensao_3d_ilustracao.jpg', title: 'Suspensão 3D (Ilustração)' };
    }
    if (lower.includes('freio') || lower.includes('disco') || lower.includes('pinca')) {
      return { slotKey: 'brakes3D', filename: 'freios_3d_ilustracao.jpg', title: 'Freios 3D (Ilustração)' };
    }
    return null;
  };

  const handleBatchPhotoUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploadingSlot('batch');
    let successCount = 0;
    const processedTitles: string[] = [];
    const unrecognized: string[] = [];

    for (const file of fileArray) {
      const matched = matchSlotKeyFromFileName(file.name);
      if (matched) {
        try {
          const base64 = await processAndCompressImage(file, 1600, 1600, 0.9);
          await StorageService.uploadPhoto(matched.slotKey, matched.filename, base64);
          successCount++;
          processedTitles.push(matched.title);
        } catch (err: any) {
          console.error('Erro ao enviar', file.name, err);
        }
      } else {
        unrecognized.push(file.name);
      }
    }

    const refreshed = await StorageService.fetchPhotos();
    setServerPhotos(refreshed);
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('workshop_photos_changed'));
    setUploadingSlot(null);

    if (successCount > 0) {
      showToast(`${successCount} fotografia(s) associada(s) e salva(s): ${processedTitles.join(', ')}!`);
    }
    if (unrecognized.length > 0) {
      showToast(`Arquivos não identificados automaticamente: ${unrecognized.join(', ')}. Use o botão de envio em cada cartão.`);
    }
  };

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadAllData();

      // Listen to real-time events
      const unsubscribe = StorageService.subscribeToScheduleEvents(event => {
        loadAllData();
      });

      return () => {
        unsubscribe();
      };
    }
  }, [isOpen, isAuthenticated]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const ok = await StorageService.adminLogin(passwordInput);
    if (ok) {
      setIsAuthenticated(true);
      setPasswordInput('');
    } else {
      setAuthError('Senha administrativa incorreta.');
    }
  };

  const handleLogout = () => {
    StorageService.setAdminAuthenticated(false);
    setIsAuthenticated(false);
  };

  // Appointment Actions
  const handleUpdateStatus = async (id: string, status: AppointmentRequest['status']) => {
    try {
      await StorageService.updateAppointmentStatus(id, { status });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      showToast(`Status atualizado para "${status}".`);
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar agendamento');
    }
  };

  const handleConfirmReschedule = async () => {
    if (!reschedulingApt) return;
    try {
      await StorageService.updateAppointmentStatus(reschedulingApt.id, {
        preferredDate: rescheduleDate,
        preferredTime: rescheduleTime,
        status: 'remarcado',
      });
      setAppointments(prev => prev.map(a => a.id === reschedulingApt.id ? {
        ...a,
        preferredDate: rescheduleDate,
        preferredTime: rescheduleTime,
        status: 'remarcado',
      } : a));
      setReschedulingApt(null);
      showToast('Agendamento remarcado com sucesso.');
    } catch (err: any) {
      showToast(err.message || 'Erro ao remarcar agendamento');
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    try {
      await StorageService.deleteAppointment(id);
      setAppointments(prev => prev.filter(a => a.id !== id));
      showToast('Agendamento excluído.');
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir agendamento');
    }
  };

  // Manual WhatsApp Appointment Registration
  const handleCreateManualAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.clientName || !manualForm.vehicleModel || !manualForm.preferredDate) {
      showToast('Preencha os campos obrigatórios.');
      return;
    }

    try {
      const created = await StorageService.submitAppointment({
        ...manualForm,
        source: 'whatsapp_manual',
      });
      setAppointments(prev => [created, ...prev]);
      setShowManualModal(false);
      setManualForm({
        clientName: '',
        whatsapp: '',
        vehicleModel: '',
        vehicleYear: '',
        serviceName: 'Revisão preventiva',
        preferredDate: new Date().toISOString().split('T')[0],
        preferredTime: '08:00',
        notes: '',
      });
      showToast('Atendimento do WhatsApp registrado na agenda.');
    } catch (err: any) {
      showToast(err.message || 'Erro ao registrar agendamento');
    }
  };

  // Save Schedule Config
  const handleSaveScheduleConfig = async () => {
    try {
      const updated = await StorageService.updateScheduleConfig({
        defaultCapacityPerSlot: scheduleConfig.defaultCapacityPerSlot,
        timeSlots: scheduleConfig.timeSlots,
        workDays: scheduleConfig.workDays,
      });
      setScheduleConfig(updated);
      showToast('Configurações de horários e capacidade salvas no servidor.');
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar configurações');
    }
  };

  // Add Blocked Period
  const handleAddBlockedPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockDate) return;

    const newBlock: BlockedPeriod = {
      id: 'BLK-' + Date.now(),
      date: newBlockDate,
      timeSlot: newBlockSlot || undefined,
      reason: newBlockReason || 'Indisponível',
    };

    const updatedBlocks = [...scheduleConfig.blockedPeriods, newBlock];
    try {
      const updated = await StorageService.updateScheduleConfig({
        blockedPeriods: updatedBlocks,
      });
      setScheduleConfig(updated);
      setNewBlockReason('');
      setNewBlockSlot('');
      showToast('Período bloqueado com sucesso.');
    } catch (err: any) {
      showToast(err.message || 'Erro ao bloquear período');
    }
  };

  const handleRemoveBlockedPeriod = async (id: string) => {
    const updatedBlocks = scheduleConfig.blockedPeriods.filter(b => b.id !== id);
    try {
      const updated = await StorageService.updateScheduleConfig({
        blockedPeriods: updatedBlocks,
      });
      setScheduleConfig(updated);
      showToast('Bloqueio removido.');
    } catch (err: any) {
      showToast(err.message || 'Erro ao remover bloqueio');
    }
  };

  // Maintenance Tips Handlers
  const handleToggleTipActive = async (tip: MaintenanceTip) => {
    try {
      const updated = await StorageService.saveTip({
        ...tip,
        active: !tip.active,
      });
      setTips(prev => prev.map(t => (t.id === updated.id ? updated : t)));
      showToast(`Dica "${updated.title}" ${updated.active ? 'ativada' : 'desativada'}.`);
    } catch (err: any) {
      showToast(err.message || 'Erro ao alterar visibilidade da dica');
    }
  };

  const handleDeleteTip = async (id: string, title: string) => {
    if (!window.confirm(`Deseja realmente excluir a dica "${title}"?`)) return;
    try {
      await StorageService.deleteTip(id);
      setTips(prev => prev.filter(t => t.id !== id));
      showToast('Dica de manutenção excluída.');
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir dica');
    }
  };

  const handleOpenNewTipModal = () => {
    setEditingTip({
      id: '',
      slug: '',
      title: '',
      category: 'oleo' as any,
      categoryLabel: 'Óleo & Filtros',
      summary: '',
      readTime: '3 min',
      author: 'Equipe Técnica Mineiro Auto Center',
      keyPoints: [''],
      content: [''],
      symptoms: [''],
      recommendedInterval: '',
      relatedServiceId: 'oleo-filtros',
      active: true,
    });
    setTipFormErrors('');
    setShowTipModal(true);
  };

  const handleOpenEditTipModal = (tip: MaintenanceTip) => {
    setEditingTip({
      ...tip,
      keyPoints: [...(tip.keyPoints || [''])],
      content: [...(tip.content || [''])],
      symptoms: [...(tip.symptoms || [''])],
    });
    setTipFormErrors('');
    setShowTipModal(true);
  };

  const handleSaveTipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTip || !editingTip.title?.trim() || !editingTip.summary?.trim()) {
      setTipFormErrors('Preencha ao menos o título e resumo da orientação.');
      return;
    }

    setSavingTip(true);
    setTipFormErrors('');
    try {
      const cleanSymptoms = (editingTip.symptoms || []).map(s => s.trim()).filter(Boolean);
      const cleanKeyPoints = (editingTip.keyPoints || []).map(k => k.trim()).filter(Boolean);
      const cleanContent = (editingTip.content || []).map(c => c.trim()).filter(Boolean);

      const categoryLabels: Record<string, string> = {
        oleo: 'Óleo & Filtros',
        freios: 'Freios & Segurança',
        pneus: 'Geometria & Pneus',
        suspensao: 'Suspensão & Barulhos',
        mecanica: 'Mecânica Geral',
      };

      const category = (editingTip.category as any) || 'oleo';
      const categoryLabel = categoryLabels[category] || editingTip.categoryLabel || 'Manutenção Preventiva';

      const slug =
        editingTip.slug?.trim() ||
        editingTip.title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

      const payload: Partial<MaintenanceTip> = {
        ...editingTip,
        title: editingTip.title.trim(),
        summary: editingTip.summary.trim(),
        category,
        categoryLabel,
        slug,
        readTime: editingTip.readTime || '3 min',
        author: editingTip.author || 'Equipe Técnica Mineiro Auto Center',
        symptoms: cleanSymptoms,
        keyPoints: cleanKeyPoints.length > 0 ? cleanKeyPoints : ['Inspeção preventiva no Mineiro Auto Center.'],
        content: cleanContent.length > 0 ? cleanContent : [editingTip.summary.trim()],
        active: editingTip.active !== false,
      };

      const saved = await StorageService.saveTip(payload);
      setTips(prev => {
        const idx = prev.findIndex(t => t.id === saved.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [saved, ...prev];
      });

      setShowTipModal(false);
      setEditingTip(null);
      showToast(`Dica "${saved.title}" salva no servidor com sucesso!`);
    } catch (err: any) {
      setTipFormErrors(err.message || 'Erro ao salvar dica no servidor');
    } finally {
      setSavingTip(false);
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    const matchStatus = statusFilter === 'todos' || apt.status === statusFilter;
    const term = searchFilter.toLowerCase();
    const matchSearch = 
      apt.clientName.toLowerCase().includes(term) ||
      apt.vehicleModel.toLowerCase().includes(term) ||
      apt.id.toLowerCase().includes(term) ||
      apt.whatsapp.includes(term);
    return matchStatus && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-6 my-4 text-slate-100 flex flex-col max-h-[92vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-950 border border-blue-800 rounded-lg text-blue-400">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-heading">
                Painel Administrativo da Oficina
              </h2>
              <p className="text-xs text-slate-400">
                Agenda compartilhada no servidor e gestão de atendimento
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className="my-2 p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toast}</span>
          </div>
        )}

        {!isAuthenticated ? (
          /* Login Screen */
          <div className="py-8 max-w-sm mx-auto text-center space-y-4">
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-blue-400">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Painel da Oficina & Gerenciador de Fotos</h3>
              <p className="text-xs text-slate-400 mt-1">
                Acesse para adicionar ou trocar as fotografias do site e gerenciar a agenda.
              </p>
            </div>

            {/* Password banner with quick fill */}
            <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-xl text-left text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-blue-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" /> Senha da Oficina:
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 font-medium">
                  Ativa no sistema
                </span>
              </div>
              <div className="flex items-center justify-between font-mono bg-slate-900/90 px-3 py-2 rounded-lg border border-slate-800 text-xs">
                <span className="text-emerald-400 font-bold select-all tracking-wider">melhoroficina26</span>
                <button
                  type="button"
                  onClick={() => setPasswordInput('melhoroficina26')}
                  className="text-[11px] text-blue-400 hover:text-blue-300 underline font-sans font-medium"
                >
                  Preencher
                </button>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-3 pt-1">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="Digite a senha (melhoroficina26)"
                  autoFocus
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {authError && <p className="text-xs text-rose-400">{authError}</p>}
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <span>Entrar no Painel</span>
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="flex-1 flex flex-col min-h-0 pt-3">
            {/* Tab navigation */}
            <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto shrink-0">
              <button
                onClick={() => setActiveTab('appointments')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'appointments'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Solicitações ({appointments.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('schedule')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'schedule'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Capacidade & Horários</span>
              </button>

              <button
                onClick={() => setActiveTab('blocks')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'blocks'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Bloquear Períodos ({scheduleConfig.blockedPeriods.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('quotes')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'quotes'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Orçamentos ({quotes.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('photos')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'photos'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Fotos Reais da Oficina</span>
              </button>

              <button
                onClick={() => setActiveTab('tips')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'tips'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Dicas de Manutenção ({tips.length})</span>
              </button>
            </div>

            {/* TAB CONTENT: APPOINTMENTS */}
            {activeTab === 'appointments' && (
              <div className="flex-1 flex flex-col min-h-0 pt-3">
                {/* Actions bar */}
                <div className="flex flex-col sm:flex-row gap-2 justify-between mb-3 shrink-0">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="relative flex-1 max-w-xs">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={searchFilter}
                        onChange={e => setSearchFilter(e.target.value)}
                        placeholder="Buscar cliente, carro ou ID..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
                    >
                      <option value="todos">Todos os status</option>
                      <option value="novo">Novos</option>
                      <option value="confirmado">Confirmados</option>
                      <option value="remarcado">Remarcados</option>
                      <option value="cancelado">Cancelados</option>
                      <option value="concluido">Concluídos</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowManualModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
                      title="Registrar atendimento combinado diretamente pelo WhatsApp ou balcão"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Atendimento WhatsApp</span>
                    </button>
                    <button
                      onClick={loadAllData}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                      title="Atualizar"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingAppointments ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Appointments list */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {filteredAppointments.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-500">
                      Nenhum agendamento encontrado.
                    </div>
                  ) : (
                    filteredAppointments.map(apt => (
                      <div
                        key={apt.id}
                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-all text-xs space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{apt.clientName}</span>
                              <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                {apt.id}
                              </span>
                              {apt.source === 'whatsapp_manual' && (
                                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/60">
                                  Via WhatsApp
                                </span>
                              )}
                            </div>
                            <p className="text-slate-300 font-medium mt-0.5">
                              {apt.vehicleModel} ({apt.vehicleYear}) — <span className="text-blue-400">{apt.serviceName}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                              apt.status === 'confirmado' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                              apt.status === 'remarcado' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                              apt.status === 'cancelado' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                              apt.status === 'concluido' ? 'bg-slate-800 text-slate-300' :
                              'bg-amber-950 text-amber-400 border border-amber-800'
                            }`}>
                              {apt.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-slate-400 text-[11px] pt-1 border-t border-slate-900">
                          <span className="text-slate-200 font-semibold flex items-center gap-1">
                            <CalendarIcon className="w-3.5 h-3.5 text-blue-400" />
                            {apt.preferredDate} às {apt.preferredTime}
                          </span>
                          {apt.whatsapp && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-500" />
                              {apt.whatsapp}
                            </span>
                          )}
                          {apt.notes && (
                            <span className="text-slate-400 italic">
                              Obs: "{apt.notes}"
                            </span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-900/80">
                          {apt.status !== 'confirmado' && (
                            <button
                              onClick={() => handleUpdateStatus(apt.id, 'confirmado')}
                              className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 hover:bg-emerald-900 border border-emerald-800 text-[11px] font-semibold"
                            >
                              Confirmar
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setReschedulingApt(apt);
                              setRescheduleDate(apt.preferredDate);
                              setRescheduleTime(apt.preferredTime);
                            }}
                            className="px-2.5 py-1 rounded bg-slate-900 text-blue-400 hover:bg-slate-800 border border-slate-700 text-[11px] font-semibold"
                          >
                            Remarcar
                          </button>

                          {apt.status !== 'cancelado' && (
                            <button
                              onClick={() => handleUpdateStatus(apt.id, 'cancelado')}
                              className="px-2.5 py-1 rounded bg-rose-950/60 text-rose-400 hover:bg-rose-900 border border-rose-900/60 text-[11px] font-semibold"
                            >
                              Cancelar
                            </button>
                          )}

                          {apt.status !== 'concluido' && (
                            <button
                              onClick={() => handleUpdateStatus(apt.id, 'concluido')}
                              className="px-2.5 py-1 rounded bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800 text-[11px]"
                            >
                              Concluir
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteAppointment(apt.id)}
                            className="p-1 text-slate-600 hover:text-rose-400 ml-auto"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: SCHEDULE & CAPACITY */}
            {activeTab === 'schedule' && (
              <div className="flex-1 overflow-y-auto space-y-4 pt-3 pr-1 text-xs">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="font-bold text-white text-sm">Capacidade de Atendimento</h4>
                  <p className="text-slate-400">
                    Defina quantos veículos podem ser atendidos simultaneamente por horário. O sistema valida essa capacidade em tempo real e impede novos agendamentos quando o limite for atingido.
                  </p>
                  <div className="flex items-center gap-3">
                    <label className="text-slate-300 font-medium">Veículos por horário:</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={scheduleConfig.defaultCapacityPerSlot}
                      onChange={e => setScheduleConfig({
                        ...scheduleConfig,
                        defaultCapacityPerSlot: parseInt(e.target.value) || 1,
                      })}
                      className="w-20 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold"
                    />
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="font-bold text-white text-sm">Horários Configurados</h4>
                  <p className="text-slate-400">
                    Horários oferecidos aos clientes no site:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {scheduleConfig.timeSlots.map(t => (
                      <span key={t} className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-semibold">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSaveScheduleConfig}
                    className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
                  >
                    Salvar Alterações de Capacidade
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: BLOCKED PERIODS */}
            {activeTab === 'blocks' && (
              <div className="flex-1 overflow-y-auto space-y-4 pt-3 pr-1 text-xs">
                {/* Add block form */}
                <form onSubmit={handleAddBlockedPeriod} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="font-bold text-white text-sm">Bloquear Período na Agenda</h4>
                  <p className="text-slate-400">
                    Bloqueie um dia inteiro (feriado, recesso, manutenção) ou um horário específico. O horário ficará imediatamente indisponível para os visitantes.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Data:</label>
                      <input
                        type="date"
                        value={newBlockDate}
                        onChange={e => setNewBlockDate(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Horário (opcional):</label>
                      <select
                        value={newBlockSlot}
                        onChange={e => setNewBlockSlot(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                      >
                        <option value="">O dia todo</option>
                        {scheduleConfig.timeSlots.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Motivo:</label>
                      <input
                        type="text"
                        placeholder="Ex: Feriado municipal, reformas..."
                        value={newBlockReason}
                        onChange={e => setNewBlockReason(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="py-2 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors"
                  >
                    Adicionar Bloqueio
                  </button>
                </form>

                {/* Active blocks list */}
                <div className="space-y-2">
                  <h4 className="font-bold text-white text-sm">Bloqueios Ativos ({scheduleConfig.blockedPeriods.length})</h4>
                  {scheduleConfig.blockedPeriods.length === 0 ? (
                    <p className="text-slate-500 text-xs py-4 text-center">Nenhum período bloqueado atualmente.</p>
                  ) : (
                    scheduleConfig.blockedPeriods.map(blk => (
                      <div
                        key={blk.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                      >
                        <div>
                          <span className="font-bold text-white">{blk.date}</span>
                          {blk.timeSlot ? (
                            <span className="text-blue-400 ml-2">às {blk.timeSlot}</span>
                          ) : (
                            <span className="text-amber-400 ml-2">(Dia todo)</span>
                          )}
                          <span className="text-slate-400 ml-3">— {blk.reason}</span>
                        </div>

                        <button
                          onClick={() => handleRemoveBlockedPeriod(blk.id)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                          title="Remover bloqueio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: QUOTES */}
            {activeTab === 'quotes' && (
              <div className="flex-1 overflow-y-auto space-y-2 pt-3 pr-1 text-xs">
                {quotes.length === 0 ? (
                  <p className="text-center py-10 text-slate-500">Nenhum orçamento registrado ainda.</p>
                ) : (
                  quotes.map(q => (
                    <div key={q.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{q.clientName}</span>
                        <span className="text-[10px] text-slate-500">{q.id}</span>
                      </div>
                      <p className="text-slate-300">
                        {q.vehicleModel} — <span className="text-blue-400">{q.serviceName}</span>
                      </p>
                      <p className="text-slate-400 italic">
                        "{q.issueDescription}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB CONTENT: PHOTOS */}
            {activeTab === 'photos' && (
              <div className="flex-1 overflow-y-auto space-y-4 pt-3 pr-1 text-xs">
                {/* Header Information */}
                <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-900/60 text-slate-300 space-y-1.5">
                  <div className="flex items-center gap-2 text-blue-400 font-bold">
                    <Camera className="w-4 h-4" />
                    <span>Gestão Permanente de Fotografias Reais da Oficina</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Você pode adicionar as fotos de forma manual utilizando o botão de seleção em cada cartão, arrastando o arquivo diretamente para o cartão correspondente ou utilizando o envio em lote abaixo. As fotos são salvas de forma permanente no servidor e atualizadas instantaneamente em todas as seções do site.
                  </p>
                </div>

                {/* Batch Upload Area */}
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsBatchDragging(true); }}
                  onDragLeave={() => setIsBatchDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsBatchDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleBatchPhotoUpload(e.dataTransfer.files);
                    }
                  }}
                  className={`p-4 rounded-xl border-2 border-dashed transition-all text-center space-y-2.5 ${
                    isBatchDragging 
                      ? 'border-blue-400 bg-blue-950/60 shadow-lg shadow-blue-500/20' 
                      : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-950/90 border border-blue-800 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
                    <FolderUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-xs">
                      Envio em Lote de Fotografias (Automático)
                    </h4>
                    <p className="text-slate-400 text-[11px] mt-0.5 max-w-xl mx-auto leading-relaxed">
                      Selecione ou arraste os arquivos de uma vez. O sistema identifica os nomes dos anexos: <span className="text-blue-300 font-mono">fachada.png</span>, <span className="text-blue-300 font-mono">entrega da chave ao cliente.png</span>, <span className="text-blue-300 font-mono">Alinhamento.png</span>, <span className="text-blue-300 font-mono">amortecedor.png</span>, <span className="text-blue-300 font-mono">motor.png</span>, <span className="text-blue-300 font-mono">profissional ao lado do carro.png</span>, <span className="text-blue-300 font-mono">Roda 3D.png</span>, <span className="text-blue-300 font-mono">Suspensão 3D.png</span> e <span className="text-blue-300 font-mono">Freios 3D.png</span>.
                    </p>
                  </div>

                  <div className="pt-1 flex items-center justify-center gap-3">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md transition-colors">
                      <UploadCloud className="w-4 h-4" />
                      <span>{uploadingSlot === 'batch' ? 'Processando e salvando fotos...' : 'Selecionar Múltiplas Fotos do Computador'}</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        disabled={uploadingSlot !== null}
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleBatchPhotoUpload(e.target.files);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Grid of Individual Slots */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {WORKSHOP_PHOTO_SLOTS.map(slot => {
                    const isAvailable = serverPhotos.available[slot.key];
                    const photoUrl = serverPhotos.photos[slot.key] || slot.url;
                    const isDraggingThis = draggingSlot === slot.key;

                    return (
                      <div 
                        key={slot.key}
                        onDragOver={(e) => { e.preventDefault(); setDraggingSlot(slot.key); }}
                        onDragLeave={() => setDraggingSlot(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDraggingSlot(null);
                          const file = e.dataTransfer.files?.[0];
                          if (file) {
                            handlePhotoUpload(slot.key, slot.filename, file);
                          }
                        }}
                        className={`p-3.5 rounded-xl bg-slate-950 border transition-all flex flex-col justify-between space-y-3 ${
                          isDraggingThis 
                            ? 'border-blue-400 bg-blue-950/40 shadow-lg ring-2 ring-blue-500/30' 
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex gap-3">
                            {/* Live Thumbnail Preview */}
                            {photoUrl && (
                              <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 relative group">
                                <img
                                  key={photoUrl}
                                  src={photoUrl}
                                  alt={slot.title}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.opacity = '0.4';
                                  }}
                                />
                                <a
                                  href={photoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity text-[10px] font-medium"
                                  title="Ver foto em tamanho completo"
                                >
                                  <Eye className="w-4 h-4" />
                                </a>
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-1.5">
                                <div className="min-w-0">
                                  <h4 className="font-bold text-white text-xs truncate">{slot.title}</h4>
                                  <span className="text-[10px] text-blue-400 block mt-0.5 truncate">{slot.section}</span>
                                </div>
                                {slot.missingInUpload ? (
                                  <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-300 text-[10px] whitespace-nowrap font-medium shrink-0">
                                    Pendente
                                  </span>
                                ) : isAvailable ? (
                                  <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[10px] whitespace-nowrap font-medium flex items-center gap-1 shrink-0">
                                    <CheckCircle2 className="w-3 h-3" /> No Servidor
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 text-[10px] whitespace-nowrap shrink-0">
                                    Aguardando
                                  </span>
                                )}
                              </div>

                              <p className="text-slate-400 text-[11px] mt-1.5 leading-relaxed line-clamp-2">
                                {slot.description}
                              </p>

                              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                                <span className="px-2 py-0.5 rounded bg-blue-950/70 border border-blue-800 text-blue-300 font-semibold font-mono">
                                  Anexo: {slot.attachmentName}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Upload Controls */}
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors">
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>{uploadingSlot === slot.key ? 'Enviando...' : 'Selecionar Foto'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingSlot !== null}
                              className="hidden"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handlePhotoUpload(slot.key, slot.filename, file);
                                }
                              }}
                            />
                          </label>

                          <span className="text-[10px] text-slate-500 hidden sm:inline">
                            ou arraste a foto aqui
                          </span>

                          {photoUrl && (
                            <a
                              href={photoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-slate-400 hover:text-white text-[11px] transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ver atual</span>
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT: MAINTENANCE TIPS */}
            {activeTab === 'tips' && (
              <div className="flex-1 flex flex-col min-h-0 pt-3 overflow-y-auto pr-1">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 shrink-0 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-400" />
                      Artigos e Dicas de Manutenção
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Orientações automotivas exibidas na página inicial e estruturadas em Schema.org FAQPage para SEO local em Uberlândia.
                    </p>
                  </div>
                  <button
                    onClick={handleOpenNewTipModal}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nova Dica</span>
                  </button>
                </div>

                {tips.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
                    <BookOpen className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="text-sm">Nenhuma dica de manutenção cadastrada.</p>
                    <button
                      onClick={handleOpenNewTipModal}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                    >
                      Cadastrar Primeira Dica
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 pb-6">
                    {tips.map(tip => (
                      <div
                        key={tip.id}
                        className={`p-4 rounded-xl border transition-all ${
                          tip.active
                            ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                            : 'bg-slate-950/30 border-slate-800/50 opacity-60'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-950 text-blue-300 border border-blue-800">
                                {tip.categoryLabel || tip.category}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                                  tip.active
                                    ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                {tip.active ? 'Ativo no site' : 'Oculto'}
                              </span>
                              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {tip.readTime}
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-white leading-snug">
                              {tip.title}
                            </h4>
                            <p className="text-xs text-slate-300 line-clamp-2">
                              {tip.summary}
                            </p>

                            {tip.recommendedInterval && (
                              <p className="text-[11px] text-blue-400 bg-blue-950/40 px-2 py-1 rounded border border-blue-900/60 inline-block">
                                <strong>Intervalo recomendado:</strong> {tip.recommendedInterval}
                              </p>
                            )}

                            {tip.symptoms && tip.symptoms.length > 0 && (
                              <div className="pt-1">
                                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                  Sintomas citados:
                                </span>
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {tip.symptoms.slice(0, 3).map((symp, i) => (
                                    <span
                                      key={i}
                                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800"
                                    >
                                      {symp}
                                    </span>
                                  ))}
                                  {tip.symptoms.length > 3 && (
                                    <span className="text-[10px] text-slate-500 self-center">
                                      +{tip.symptoms.length - 3} mais
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 sm:self-start shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                            <button
                              onClick={() => handleOpenEditTipModal(tip)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors"
                              title="Editar conteúdo"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                              <span>Editar</span>
                            </button>

                            <button
                              onClick={() => handleToggleTipActive(tip)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                                tip.active
                                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300'
                                  : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800'
                              }`}
                              title={tip.active ? 'Ocultar do site' : 'Publicar no site'}
                            >
                              {tip.active ? (
                                <>
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span>Ocultar</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Publicar</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleDeleteTip(tip.id, tip.title)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                              title="Excluir dica"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Modal: New Manual WhatsApp Appointment */}
        {showManualModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs text-slate-100 shadow-2xl">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-sm">Registrar Atendimento do WhatsApp</h4>
                <button onClick={() => setShowManualModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateManualAppointment} className="space-y-3">
                <div>
                  <label className="block text-slate-400 mb-1">Nome do Cliente *</label>
                  <input
                    type="text"
                    required
                    value={manualForm.clientName}
                    onChange={e => setManualForm({ ...manualForm, clientName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">WhatsApp</label>
                  <input
                    type="tel"
                    value={manualForm.whatsapp}
                    onChange={e => setManualForm({ ...manualForm, whatsapp: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">Veículo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Gol 1.6"
                      value={manualForm.vehicleModel}
                      onChange={e => setManualForm({ ...manualForm, vehicleModel: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Ano</label>
                    <input
                      type="text"
                      placeholder="Ex: 2018"
                      value={manualForm.vehicleYear}
                      onChange={e => setManualForm({ ...manualForm, vehicleYear: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Serviço</label>
                  <input
                    type="text"
                    value={manualForm.serviceName}
                    onChange={e => setManualForm({ ...manualForm, serviceName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">Data *</label>
                    <input
                      type="date"
                      required
                      value={manualForm.preferredDate}
                      onChange={e => setManualForm({ ...manualForm, preferredDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Horário *</label>
                    <select
                      value={manualForm.preferredTime}
                      onChange={e => setManualForm({ ...manualForm, preferredTime: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                    >
                      {scheduleConfig.timeSlots.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Observações</label>
                  <input
                    type="text"
                    value={manualForm.notes}
                    onChange={e => setManualForm({ ...manualForm, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                  >
                    Salvar na Agenda
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowManualModal(false)}
                    className="px-4 py-2.5 rounded-lg bg-slate-800 text-slate-300"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Reschedule */}
        {reschedulingApt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs text-slate-100 shadow-2xl">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-sm">Remarcar Agendamento</h4>
                <button onClick={() => setReschedulingApt(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-slate-300">
                Cliente: <strong className="text-white">{reschedulingApt.clientName}</strong> ({reschedulingApt.vehicleModel})
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-400 mb-1">Nova Data:</label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={e => setRescheduleDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Novo Horário:</label>
                  <select
                    value={rescheduleTime}
                    onChange={e => setRescheduleTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  >
                    {scheduleConfig.timeSlots.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={handleConfirmReschedule}
                    className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                  >
                    Confirmar Remarcação
                  </button>
                  <button
                    onClick={() => setReschedulingApt(null)}
                    className="px-4 py-2.5 rounded-lg bg-slate-800 text-slate-300"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
