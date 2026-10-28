import { fetchVerifiedAvailability } from './bookingAvailability';
import {
  CompanySettings,
  ServiceItem,
  QuoteRequest,
  AppointmentRequest,
  AnalyticsEvent,
  ScheduleAvailability,
  ServerScheduleConfig,
  MaintenanceTip,
} from '../types';

export const OFFICIAL_WHATSAPP_PHONE = '34996342522';
export const OFFICIAL_WHATSAPP_LINK = 'https://wa.me/5534996342522';

export const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: 'oleo-filtros',
    title: 'Troca de óleo e filtros',
    shortDescription: 'Lubrificantes na especificação correta do fabricante e substituição dos filtros.',
    fullDescription: 'Substituição completa do óleo do motor conforme a viscosidade e norma técnica do seu veículo, com troca do filtro de óleo, filtro de combustível e filtro de ar.',
    category: 'fluidos',
    iconName: 'Droplets',
    priceType: 'diagnostic_required',
    priceValue: null,
    priceConditions: 'Orçamento após avaliação conforme a litragem e especificação do óleo.',
    includedItems: ['Drenagem do óleo usado', 'Substituição do filtro de óleo'],
    active: true,
  },
  {
    id: 'alinhamento-balanceamento',
    title: 'Alinhamento 3D e balanceamento',
    shortDescription: 'Geometria veicular computadorizada de alta precisão para evitar desgaste irregular de pneus.',
    fullDescription: 'Alinhamento computadorizado 3D de alta precisão nos eixos dianteiro e traseiro, aliado ao balanceamento de rodas.',
    category: 'geometria',
    iconName: 'Disc',
    priceType: 'diagnostic_required',
    priceValue: null,
    priceConditions: 'Orçamento após avaliação conforme modelo do veículo.',
    includedItems: ['Medição computadorizada 3D', 'Balanceamento de rodas'],
    active: true,
  },
  {
    id: 'freios',
    title: 'Freios e pastilhas',
    shortDescription: 'Inspeção e manutenção de pastilhas, discos, lonas, tambores e fluido de freio.',
    fullDescription: 'Manutenção rigorosa de todo o sistema de frenagem. Verificação de espessura de pastilhas e discos, teste de fluido de freio.',
    category: 'mecanica',
    iconName: 'ShieldAlert',
    priceType: 'diagnostic_required',
    priceValue: null,
    priceConditions: 'Orçamento após avaliação.',
    includedItems: ['Inspeção de pastilhas e discos', 'Checagem de fluido de freio'],
    active: true,
  },
  {
    id: 'suspensao-amortecedores',
    title: 'Suspensão e amortecedores',
    shortDescription: 'Diagnóstico de barulhos, amortecedores, molas, buchas, pivôs e estabilidade.',
    fullDescription: 'Revisão completa da suspensão com identificação precisa de ruídos em piso irregular e folgas.',
    category: 'mecanica',
    iconName: 'Sliders',
    priceType: 'diagnostic_required',
    priceValue: null,
    priceConditions: 'Orçamento após avaliação.',
    includedItems: ['Inspeção em elevador', 'Checagem de folgas e amortecedores'],
    active: true,
  },
  {
    id: 'injecao-eletronica',
    title: 'Diagnóstico de injeção eletrônica',
    shortDescription: 'Leitura com scanner automotivo para identificação de falhas e luz de injeção acesa.',
    fullDescription: 'Conexão via scanner profissional para leitura de códigos da central eletrônica (ECU) e testes de sensores.',
    category: 'mecanica',
    iconName: 'Cpu',
    priceType: 'diagnostic_required',
    priceValue: null,
    priceConditions: 'Orçamento após avaliação.',
    includedItems: ['Passagem de scanner automotivo', 'Leitura de parâmetros'],
    active: true,
  },
  {
    id: 'revisao-preventiva',
    title: 'Revisão preventiva',
    shortDescription: 'Checkup completo de itens de segurança e funcionamento antes de viajar ou por quilometragem.',
    fullDescription: 'Avaliação preventiva de freios, suspensão, arrefecimento, correias, fluidos e iluminação.',
    category: 'preventiva',
    iconName: 'CheckCircle2',
    priceType: 'diagnostic_required',
    priceValue: null,
    priceConditions: 'Orçamento após avaliação.',
    includedItems: ['Checagem de segurança', 'Inspeção de fluidos e correias'],
    active: true,
  },
  {
    id: 'mecanica-geral',
    title: 'Mecânica em geral',
    shortDescription: 'Serviços completos em motor, embreagem, arrefecimento e transmissão.',
    fullDescription: 'Solução técnica para problemas mecânicos em motor, embreagem, vazamentos e manutenção corretiva.',
    category: 'mecanica',
    iconName: 'Wrench',
    priceType: 'diagnostic_required',
    priceValue: null,
    priceConditions: 'Orçamento após avaliação.',
    includedItems: ['Diagnóstico mecânico', 'Reparo corretivo'],
    active: true,
  },
];

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  name: 'Mineiro Auto Center e Mecânica',
  legalName: 'Mineiro Auto Center e Mecânica',
  cnpj: '',
  street: 'Rua Ricardo Siquierolli Tucci',
  number: '2749',
  neighborhood: 'Bairro Brasil',
  city: 'Uberlândia',
  state: 'MG',
  zipCode: '38400-722',
  instagramHandle: '@autocentermineiro',
  instagramUrl: 'https://www.instagram.com/autocentermineiro/',
  whatsappPhone: OFFICIAL_WHATSAPP_PHONE,
  whatsappContactName: '',
  secondaryPhone: '', // Não publicado sem confirmação
  googleMapsDestinationUrl: 'https://maps.google.com/maps?q=Rua+Ricardo+Siquierolli+Tucci+2749+Bairro+Brasil+Uberl%C3%A2ndia+MG+38400-722',
  googleReviewsUrl: 'https://www.google.com/search?q=Mineiro+Auto+Center+e+Mecanica+Uberlandia+avaliacoes',
  googleRating: 4.5,
  googleReviewCount: 31,
  verifiedHours: false,
  openingHours: [],
  capacityPerPeriod: {
    manha: 4,
    tarde: 4,
  },
  unavailableDates: [],
  adminPassword: '',
  workshopPhotos: {
    heroFacade: null,
    clientKey: null,
    wheelAlignment: null,
    mechanicEngine: null,
    suspension: null,
    aboutWorkshop: null,
    contactPhone: null,
    wheel3D: null,
    suspension3D: null,
    brakes3D: null,
    instagram: null,
  },
};

const STORAGE_KEYS = {
  SETTINGS: 'mineiro_autocenter_settings_v2',
  SERVICES: 'mineiro_autocenter_services_v2',
  QUOTES: 'mineiro_autocenter_quotes_v2',
  APPOINTMENTS_CACHE: 'mineiro_autocenter_appointments_cache_v2',
  ANALYTICS: 'mineiro_autocenter_analytics_v2',
  ADMIN_SESSION: 'mineiro_autocenter_admin_auth_v2',
  ADMIN_PASSWORD: 'mineiro_autocenter_admin_pwd_v2',
};

export class StorageService {
  static getSettings(): CompanySettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...DEFAULT_COMPANY_SETTINGS,
          ...parsed,
          whatsappPhone: OFFICIAL_WHATSAPP_PHONE, // Sempre preserva número oficial confirmado
          workshopPhotos: parsed.workshopPhotos || DEFAULT_COMPANY_SETTINGS.workshopPhotos,
        };
      }
    } catch (e) {
      console.warn('Erro ao ler configurações locais:', e);
    }
    return DEFAULT_COMPANY_SETTINGS;
  }

  static saveSettings(settings: CompanySettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Erro ao salvar configurações:', e);
    }
  }

  static getServices(): ServiceItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SERVICES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Erro ao ler serviços:', e);
    }
    return DEFAULT_SERVICES;
  }

  static saveServices(services: ServiceItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
    } catch (e) {
      console.error('Erro ao salvar serviços:', e);
    }
  }

  // Quotes (Solicitação de Orçamento)
  static getQuotes(): QuoteRequest[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QUOTES);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Erro ao ler orçamentos:', e);
    }
    return [];
  }

  static addQuote(quote: Omit<QuoteRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>): QuoteRequest {
    const list = this.getQuotes();
    const newQuote: QuoteRequest = {
      ...quote,
      id: 'ORC-' + Math.floor(100000 + Math.random() * 900000),
      status: 'novo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.unshift(newQuote);
    try {
      localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(list));
    } catch (e) {
      console.error('Erro ao registrar orçamento:', e);
    }
    this.trackEvent('quote_submit', newQuote.id);
    return newQuote;
  }

  // ==================== SHARED SERVER-SIDE AGENDA ====================

  /**
   * Consulta disponibilidade em tempo real no servidor para a data escolhida.
   * Valida capacidade e bloqueios configurados no backend.
   */
  static async fetchAvailability(date: string): Promise<ScheduleAvailability> {
    return fetchVerifiedAvailability(date);
  }

  /**
   * Salva solicitação de agendamento no servidor compartilhado com validação de capacidade.
   */
  static async submitAppointment(payload: {
    clientName: string;
    whatsapp: string;
    vehicleModel: string;
    vehicleYear: string;
    serviceName: string;
    preferredDate: string;
    preferredTime: string;
    notes?: string;
    source?: 'site' | 'whatsapp_manual';
  }): Promise<AppointmentRequest> {
    const res = await fetch('/api/schedule/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro ao registrar no servidor' }));
      throw new Error(err.error || 'Erro ao processar agendamento.');
    }

    const created: AppointmentRequest = await res.json();
    this.trackEvent('appointment_submit', created.id);
    return created;
  }

  /**
   * Conecta ao stream Server-Sent Events do servidor para atualização em tempo real.
   */
  static subscribeToScheduleEvents(onUpdate: (event: { type: string; payload: any }) => void): () => void {
    try {
      const eventSource = new EventSource('/api/schedule/events');
      
      eventSource.addEventListener('schedule_update', (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          onUpdate(parsed);
        } catch (err) {
          console.error('Erro ao processar evento de agenda:', err);
        }
      });

      return () => {
        eventSource.close();
      };
    } catch (e) {
      console.warn('SSE indisponível:', e);
      return () => {};
    }
  }

  // ==================== ADMIN API CALLS ====================

  static async adminLogin(password: string): Promise<boolean> {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        sessionStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, 'true');
        sessionStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, password);
        return true;
      }
    } catch (e) {
      console.warn('Erro ao conectar com servidor no login:', e);
    }
    return false;
  }

  static getAdminPassword(): string {
    return sessionStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD) || 
           localStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD) || '';
  }

  static isAdminAuthenticated(): boolean {
    const isSession = sessionStorage.getItem(STORAGE_KEYS.ADMIN_SESSION) === 'true';
    const hasPassword = Boolean(this.getAdminPassword());
    return isSession && hasPassword;
  }

  static setAdminAuthenticated(val: boolean): void {
    if (!val) {
      sessionStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
      sessionStorage.removeItem(STORAGE_KEYS.ADMIN_PASSWORD);
      localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
      localStorage.removeItem(STORAGE_KEYS.ADMIN_PASSWORD);
    } else {
      sessionStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, 'true');
    }
  }

  static async fetchAdminAppointments(): Promise<AppointmentRequest[]> {
    const password = this.getAdminPassword();
    try {
      const res = await fetch('/api/admin/appointments', {
        headers: { 'x-admin-password': password },
      });
      if (res.ok) {
        const list = await res.json();
        localStorage.setItem(STORAGE_KEYS.APPOINTMENTS_CACHE, JSON.stringify(list));
        return list;
      }
    } catch (e) {
      console.warn('Erro ao carregar agendamentos do servidor:', e);
    }
    // Fallback cache
    const cached = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS_CACHE);
    return cached ? JSON.parse(cached) : [];
  }

  static async updateAppointmentStatus(
    id: string, 
    updates: { 
      status?: AppointmentRequest['status']; 
      preferredDate?: string; 
      preferredTime?: string; 
      internalNotes?: string 
    }
  ): Promise<AppointmentRequest> {
    const password = this.getAdminPassword();
    const res = await fetch(`/api/admin/appointments/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password,
      },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao atualizar agendamento');
    }

    return await res.json();
  }

  static async deleteAppointment(id: string): Promise<void> {
    const password = this.getAdminPassword();
    const res = await fetch(`/api/admin/appointments/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': password },
    });
    if (!res.ok) {
      throw new Error('Erro ao excluir agendamento');
    }
  }

  static async fetchScheduleConfig(): Promise<ServerScheduleConfig> {
    const password = this.getAdminPassword();
    try {
      const res = await fetch('/api/admin/schedule-config', {
        headers: { 'x-admin-password': password },
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Erro ao buscar configuração da agenda:', e);
    }
    return {
      defaultCapacityPerSlot: 3,
      timeSlots: ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
      workDays: [1, 2, 3, 4, 5, 6],
      blockedPeriods: [],
    };
  }

  static async updateScheduleConfig(payload: Partial<ServerScheduleConfig> & { newPassword?: string }): Promise<ServerScheduleConfig> {
    const password = this.getAdminPassword();
    const res = await fetch('/api/admin/schedule-config', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao atualizar configuração da agenda');
    }

    return await res.json();
  }

  // Analytics event tracker
  static trackEvent(type: AnalyticsEvent['type'], target: string): void {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ANALYTICS);
      const list: AnalyticsEvent[] = data ? JSON.parse(data) : [];
      list.push({
        id: 'EVT-' + Date.now(),
        type,
        target,
        timestamp: new Date().toISOString(),
      });
      const trimmed = list.slice(-500);
      localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Erro ao registrar métrica de navegação:', e);
    }
  }

  static getAnalytics(): AnalyticsEvent[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ANALYTICS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // Workshop Photos Management
  static async fetchPhotos(): Promise<{ photos: Record<string, string>; available: Record<string, boolean> }> {
    try {
      const res = await fetch(`/api/photos?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Erro ao carregar fotos da oficina:', e);
    }
    return { photos: {}, available: {} };
  }

  static async uploadPhoto(slotKey: string, filename: string, base64Data: string): Promise<any> {
    const password = this.getAdminPassword();
    const res = await fetch('/api/admin/photos/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password,
      },
      body: JSON.stringify({ slotKey, filename, base64Data }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao enviar fotografia');
    }

    const data = await res.json();

    // Cache locally in settings
    const settings = this.getSettings();
    if (!settings.workshopPhotos) {
      settings.workshopPhotos = {};
    }
    (settings.workshopPhotos as any)[slotKey] = data.url;
    this.saveSettings(settings);

    return data;
  }

  // ==================== MAINTENANCE TIPS API ====================

  static async fetchTips(includeInactive: boolean = false): Promise<MaintenanceTip[]> {
    try {
      const url = includeInactive ? '/api/tips?all=true' : '/api/tips';
      const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Erro ao buscar dicas de manutenção do servidor:', e);
    }

    // Fallback: carregar do localStorage ou lista padrão
    try {
      const cached = localStorage.getItem('mineiro_maintenance_tips_cache');
      if (cached) {
        const parsed: MaintenanceTip[] = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return includeInactive ? parsed : parsed.filter(t => t.active !== false);
        }
      }
    } catch {}

    return DEFAULT_MAINTENANCE_TIPS_FALLBACK;
  }

  static async saveTip(tip: Partial<MaintenanceTip>): Promise<MaintenanceTip> {
    const password = this.getAdminPassword();
    const res = await fetch('/api/admin/tips', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password,
      },
      body: JSON.stringify(tip),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao salvar dica de manutenção');
    }

    const data = await res.json();
    return data.tip;
  }

  static async deleteTip(id: string): Promise<void> {
    const password = this.getAdminPassword();
    const res = await fetch(`/api/admin/tips/${id}`, {
      method: 'DELETE',
      headers: {
        'x-admin-password': password,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao excluir dica de manutenção');
    }
  }
}

export const DEFAULT_MAINTENANCE_TIPS_FALLBACK: MaintenanceTip[] = [
  {
    id: 'dica-oleo-motor',
    slug: 'quando-trocar-oleo-motor-filtros',
    title: 'Quando trocar o óleo do motor: tempo ou quilometragem?',
    summary: 'Entenda a diferença entre rodagem urbana severa e rodovia, e por que esperar atingir 10.000 km no trânsito diário pode comprometer a vida útil do motor.',
    category: 'oleo',
    categoryLabel: 'Óleo & Filtros',
    readTime: '3 min',
    publishedAt: '2026-03-15',
    author: 'Equipe Técnica Mineiro Auto Center',
    keyPoints: [
      'O óleo lubrificante oxida por tempo, mesmo em veículos que rodam pouco.',
      'Uso urbano com anda-e-pára constante e trajetos curtos é classificado como uso severo.',
      'A cada troca de óleo, a substituição do filtro de óleo é indispensável para não contaminar o fluido novo.',
      'Respeite sempre a viscosidade (ex: 5W30, 0W20) e as normas API/ACEA exigidas pela montadora.'
    ],
    symptoms: [
      'Luz de óleo acesa ou piscando no painel de instrumentos.',
      'Ruído metálico ao ligar o veículo pela manhã (tuchos batendo).',
      'Óleo escuro demais, viscoso ou abaixo do nível mínimo na vareta de medição.',
      'Aumento repentino no consumo de combustível ou fumaça no escapamento.'
    ],
    recommendedInterval: 'A cada 5.000 km a 7.500 km em uso urbano severo, ou no máximo a cada 6 a 12 meses.',
    relatedServiceId: 'oleo-filtros',
    active: true,
    content: [
      'Muitos motoristas em Uberlândia acreditam que o óleo do motor só precisa ser trocado quando o odômetro atinge a marca dos 10.000 km. No entanto, o manual da maioria dos fabricantes estabelece duas condições distintas: uso normal (rodovias em velocidade de cruzeiro) e uso severo.',
      'No trânsito urbano — marcado por semáforos, arrancadas, paradas frequentes e trajetos de menos de 15 minutos onde o motor não atinge a temperatura ideal de trabalho —, o óleo degrada muito mais rapidamente pela diluição de combustível e condensação de umidade. Por isso, o intervalo ideal cai para cerca de 5.000 a 7.500 km ou 6 meses, o que ocorrer primeiro.',
      'Outro erro comum é trocar o óleo e deixar o filtro antigo. O filtro retém partículas abrasivas e resíduos metálicos; ao manter o filtro velho, até 400 ml de óleo sujo e contaminado entram em circulação imediata com o óleo novo, reduzindo sua capacidade de proteção antiatrito.',
      'No Mineiro Auto Center, realizamos a drenagem completa e conferimos o filtro correto para o motor do seu veículo no Bairro Brasil, com total transparência.'
    ]
  },
  {
    id: 'dica-freios-seguranca',
    slug: 'sinais-desgaste-pastilhas-discos-freio',
    title: 'Freios chiando ou pedal vibrando: como identificar o desgaste das pastilhas',
    summary: 'Aprenda a reconhecer os primeiros ruídos sonoros e mudanças no tato do pedal antes que o disco de freio seja danificado ou a segurança seja comprometida.',
    category: 'freios',
    categoryLabel: 'Freios & Segurança',
    readTime: '4 min',
    publishedAt: '2026-03-22',
    author: 'Equipe Técnica Mineiro Auto Center',
    keyPoints: [
      'Chiados agudos durante a frenagem geralmente indicam que o sensor sonoro da pastilha atingiu o limite de segurança.',
      'Vibração no pedal de freio ou no volante ao pisar em velocidades médias/altas indica empenamento do disco.',
      'O fluido de freio é higroscópico (absorve água do ar) e deve ser testado anualmente com caneta medidora de ponto de ebulição.',
      'Nunca complete o reservatório de freio sem verificar o desgaste das pastilhas: à medida que gastam, o nível desce naturalmente.'
    ],
    symptoms: [
      'Ruído agudo de atrito metálico (chiado) toda vez que aciona o pedal.',
      'Pedal de freio esponjoso ou descendo mais do que o normal até dar resposta.',
      'Carro puxando levemente para um dos lados durante frenagens mais fortes.',
      'Volante tremendo ao frear em descidas ou saídas de rodovia.'
    ],
    recommendedInterval: 'Inspeção visual preventiva a cada 10.000 km ou ao menor sinal de ruído e vibração.',
    relatedServiceId: 'freios',
    active: true,
    content: [
      'O sistema de freios é o item de segurança ativa mais crítico do veículo. As pastilhas possuem um material de atrito que se desgasta gradativamente a cada frenagem. Quando a espessura da pastilha atinge cerca de 2 a 3 milímetros, a base metálica começa a raspar no disco de freio, gerando ruído e danificando a pista do disco.',
      'Se você ouvir um assobio metálico agudo constante, é hora de parar na oficina imediatamente. Continuar rodando com pastilha no fim da vida útil pode riscar profundamente o disco, elevando consideravelmente o custo do reparo — já que além das pastilhas novas, será obrigatória a troca ou retífica dos discos.',
      'Outro sintoma frequente é a pulsação no pedal ao frear. Esse empenamento costuma ocorrer quando o disco quente entra em contato abrupto com poças d\'água (choque térmico) ou por excesso de torque nos parafusos de roda.',
      'Aqui no Mineiro Auto Center examinamos a espessura das pastilhas, os discos ventilados e medimos a umidade do fluido de freio em nosso elevador técnico.'
    ]
  },
  {
    id: 'dica-alinhamento-balanceamento',
    slug: "quando-fazer-alinhamento-3d-balanceamento",
    title: 'Alinhamento 3D e Balanceamento: quando fazer para não perder os pneus?',
    summary: 'Pancadas em buracos, volante torto e desgaste de ombro do pneu são alertas claros de desalinhamento de convergência e cáster.',
    category: 'pneus',
    categoryLabel: 'Geometria & Pneus',
    readTime: '3 min',
    publishedAt: '2026-03-28',
    author: 'Equipe Técnica Mineiro Auto Center',
    keyPoints: [
      'O alinhamento corrige os ângulos de cambagem, convergência e cáster para o veículo rodar em linha reta.',
      'O balanceamento equaliza a distribuição de peso da roda/pneu, eliminando vibrações na direção.',
      'Pneus desalinhados podem sofrer desgaste irregular em menos de 3.000 km de uso.',
      'Fazer o rodízio de pneus junto com o alinhamento 3D aumenta a durabilidade do jogo em até 30%.'
    ],
    symptoms: [
      'Volante torto em linha reta ou carro "puxando" para a direita ou esquerda.',
      'Desgaste excessivo nas bordas internas ou externas da banda de rodagem dos pneus.',
      'Volante vibrando intensamente em velocidades entre 80 km/h e 100 km/h.',
      'Ruído de rolagem ruidoso ou pneu cantando em curvas leves.'
    ],
    recommendedInterval: 'A cada 10.000 km, na troca de pneus ou sempre após impactos fortes contra buracos ou guias.',
    relatedServiceId: 'alinhamento-balanceamento',
    active: true,
    content: [
      'As vias urbanas com emendas de asfalto, quebra-molas e buracos exigem muito da geometria veicular. Quando uma roda atinge um desnível com impacto, os braços de direção e barras axiais podem sofrer microdeslocamentos suficientes para desregular a convergência.',
      'Um carro com divergência de apenas alguns milímetros é o equivalente a arrastar o pneu lateralmente pelo asfalto enquanto gira. O resultado é o desgaste precoce do ombro do pneu, forçando o motorista a trocar pneus muito antes do tempo.',
      'Já a vibração sentida no volante é sintoma característico de desbalanceamento das rodas dianteiras (ou nos bancos/assoalho se for nas traseiras). Pequenas perdas de chumbador de roda geram forças centrífugas que sobrecarregam rolamentos e caixas de direção.',
      'Em nossa rampa computadorizada de alta precisão 3D, conferimos os ângulos exatos estabelecidos pelo fabricante para garantir dirigibilidade suave e máxima economia de borracha e combustível.'
    ]
  },
  {
    id: 'dica-suspensao-amortecedores',
    slug: 'ruidos-suspensao-amortecedores-batendo',
    title: 'Ruídos na suspensão: como identificar batidas secas e instabilidade',
    summary: 'Barulhos metálicos ao passar por lombadas, rangidos e sensação de flutuação em curvas denunciam o fim da vida útil de amortecedores, buchas e pivôs.',
    category: 'suspensao',
    categoryLabel: 'Suspensão & Estabilidade',
    readTime: '4 min',
    publishedAt: '2026-04-02',
    author: 'Equipe Técnica Mineiro Auto Center',
    keyPoints: [
      'Amortecedores gastos aumentam a distância de frenagem em até 2,6 metros a 50 km/h.',
      'Vazamento de óleo na haste do amortecedor indica perda de vedação e perda total de eficiência hidráulica.',
      'Batidas secas ("toc-toc") em paralelepípedos ou quebra-molas costumam vir de bieletas ou buchas de barra estabilizadora.',
      'Folgas em pivôs e terminais de direção podem causar perda repentina de controle da roda.'
    ],
    symptoms: [
      'Batidas secas no assoalho ou na dianteira ao transitar em asfalto irregular.',
      'Carro balançando excessivamente para cima e para baixo após passar por ondulações.',
      'Pneus "pulando" ou perdendo contato com o solo em curvas e frenagens.',
      'Marcas evidentes de óleo escorrendo pelas torres dos amortecedores dianteiros ou traseiros.'
    ],
    recommendedInterval: 'Revisão preventiva a cada 20.000 km ou imediatamente se houver ruídos e vazamento de óleo.',
    relatedServiceId: 'suspensao-amortecedores',
    active: true,
    content: [
      'O sistema de suspensão não serve apenas para garantir o conforto dos passageiros; sua principal função é manter os quatro pneus em contato permanente com o solo sob qualquer condição de piso e velocidade.',
      'Amortecedores fadigados não conseguem frear o movimento oscilatório das molas. Com isso, o pneu quica sobre o asfalto, reduzindo drasticamente a área de contato da borracha. Isso amplia o risco de aquaplanagem na chuva e aumenta perigosamente a distância necessária para parar o veículo.',
      'Além dos amortecedores, componentes menores como bieletas, buchas de bandeja e pivôs sofrem constante torção. Buchas estouradas causam ruídos metálicos desagradáveis e alteram os ângulos da suspensão, tornando o veículo arisco e impreciso nas manobras.',
      'Na oficina Mineiro Auto Center, levantamos o carro em nossos elevadores para testar folgas de alavanca com equipamentos adequados, apontando com honestidade somente o que realmente precisa ser reparado.'
    ]
  }
];
