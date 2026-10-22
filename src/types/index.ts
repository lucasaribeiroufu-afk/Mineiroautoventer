export type RequestStatus = 
  | 'novo' 
  | 'em_atendimento' 
  | 'aguardando_cliente' 
  | 'confirmado'
  | 'remarcado'
  | 'agendado' 
  | 'concluido' 
  | 'cancelado';

export interface QuoteRequest {
  id: string;
  clientName: string;
  whatsapp: string;
  vehicleModel: string;
  vehicleYear: string;
  serviceId: string;
  serviceName: string;
  issueDescription: string;
  status: RequestStatus;
  internalNotes?: string;
  estimatedValue?: number | null;
  allowPromo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentRequest {
  id: string;
  clientName: string;
  whatsapp: string;
  vehicleModel: string;
  vehicleYear: string;
  serviceId?: string;
  serviceName: string;
  preferredDate: string; // YYYY-MM-DD
  preferredTime: string; // HH:mm
  preferredPeriod?: 'manha' | 'tarde';
  notes?: string;
  status: RequestStatus;
  internalNotes?: string;
  source?: 'site' | 'whatsapp_manual';
  confirmedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleSlot {
  time: string;
  available: boolean;
  capacity: number;
  bookedCount: number;
  blocked: boolean;
  reason?: string;
}

export interface ScheduleAvailability {
  date: string;
  isOpen: boolean;
  blockedReason?: string;
  defaultCapacityPerSlot: number;
  slots: ScheduleSlot[];
}

export interface BlockedPeriod {
  id: string;
  date: string;
  timeSlot?: string;
  reason: string;
}

export interface ServerScheduleConfig {
  defaultCapacityPerSlot: number;
  timeSlots: string[];
  workDays: number[];
  blockedPeriods: BlockedPeriod[];
}

export type PriceType = 'fixed' | 'starting_at' | 'diagnostic_required';

export interface ServiceItem {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  category: 'mecanica' | 'preventiva' | 'geometria' | 'fluidos';
  iconName: string;
  priceType: PriceType;
  priceValue?: number | null; // Apenas se cadastrado pela oficina
  priceConditions?: string; // ex: "A partir de R$ 150 (inclui mão de obra)" ou "Após avaliação"
  includedItems: string[];
  active: boolean;
}

export interface OpeningHourDay {
  day: string;
  dayLabel: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface WorkshopPhotos {
  heroFacade?: string | null; // Fachada com letreiro, telefone, nº 2749 e profissional
  clientKey?: string | null; // Profissional entregando a chave ao cliente
  wheelAlignment?: string | null; // Profissional operando equipamento de alinhamento
  mechanicEngine?: string | null; // Profissional trabalhando no motor
  suspension?: string | null; // Profissional segurando amortecedor diante do mural azul
  aboutWorkshop?: string | null; // Profissional ao lado do carro com capô aberto
  contactPhone?: string | null; // Profissional ao telefone dentro da oficina
  wheel3D?: string | null; // Ilustração Roda 3D (Alinhamento / Hero)
  suspension3D?: string | null; // Ilustração Suspensão 3D
  brakes3D?: string | null; // Ilustração Freios e Pinça 3D
  instagram?: string | null; // Foto da rotina da equipe para o Instagram
}

export interface CompanySettings {
  name: string;
  legalName: string;
  cnpj?: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  instagramHandle: string;
  instagramUrl: string;
  whatsappPhone: string; // Official number, configurable in admin
  whatsappContactName?: string; // Augusto Ivan
  secondaryPhone: string;
  googleMapsDestinationUrl: string;
  googleReviewsUrl: string;
  googleRating: number;
  googleReviewCount: number;
  verifiedHours: boolean;
  openingHours: OpeningHourDay[];
  capacityPerPeriod: {
    manha: number;
    tarde: number;
  };
  unavailableDates: string[]; // YYYY-MM-DD
  adminPassword: string; // Configurable in admin panel
  workshopPhotos: WorkshopPhotos;
}

export interface AnalyticsEvent {
  id: string;
  type: 'whatsapp_click' | 'quote_submit' | 'appointment_submit' | 'maps_click' | 'phone_click';
  target: string;
  timestamp: string;
}

export interface InstagramPost {
  id: string;
  caption: string;
  postUrl: string;
  imageUrl?: string;
  type: 'video' | 'photo' | 'carousel';
  dateLabel: string;
  category: string;
}

export interface MaintenanceTip {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: 'oleo' | 'freios' | 'suspensao' | 'pneus' | 'motor';
  categoryLabel: string;
  readTime: string; // e.g. "3 min"
  publishedAt: string;
  author: string;
  keyPoints: string[];
  content: string[]; // Parágrafos detalhados
  symptoms: string[]; // Sinais de alerta para o motorista
  recommendedInterval: string; // e.g. "A cada 10.000 km ou 6 meses"
  relatedServiceId?: string; // id do serviço para pré-seleção no agendamento/orçamento
  active: boolean;
}
