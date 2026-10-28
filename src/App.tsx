import { WorkshopManifesto, CareScenarios, TechnologyStory, FAQSection, FinalContact } from './components/ModernSections';
import { useState, useEffect } from 'react';
import { CompanySettings, ServiceItem } from './types';
import { StorageService } from './services/storage';
import { EquipmentSection } from './components/EquipmentSection';
import { ProcessSection } from './components/ProcessSection';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ServicesSection } from './components/ServicesSection';
import { AboutSection } from './components/AboutSection';
import { SchedulingBanner } from './components/SchedulingBanner';
import { ReviewsSection } from './components/ReviewsSection';
import { MaintenanceTipsSection } from './components/MaintenanceTipsSection';
import { InstagramSection } from './components/InstagramSection';
import { LocationSection } from './components/LocationSection';
import { Footer } from './components/Footer';
import { QuoteModal } from './components/QuoteModal';
import { AppointmentModal } from './components/AppointmentModal';
import { PrivacyModal } from './components/PrivacyModal';
import { WhatsAppFloatingButton } from './components/WhatsAppFloatingButton';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ScrollReveal } from './components/ScrollReveal';

export default function App() {
  const [settings, setSettings] = useState<CompanySettings>(() => StorageService.getSettings());
  const [services] = useState<ServiceItem[]>(() => StorageService.getServices());

  // Keep settings synchronized with server photos & storage changes
  useEffect(() => {
    const syncPhotos = async () => {
      try {
        const serverData = await StorageService.fetchPhotos();
        if (serverData && serverData.photos) {
          setSettings(prev => ({
            ...prev,
            workshopPhotos: {
              ...prev.workshopPhotos,
              ...serverData.photos,
            },
          }));
        }
      } catch (err) {
        console.warn('Erro ao sincronizar fotos da oficina:', err);
      }
    };

    syncPhotos();

    const handleStorageChange = () => {
      setSettings(StorageService.getSettings());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('workshop_photos_changed', syncPhotos);

    // Real-time SSE synchronization from server
    const unsubscribeSSE = StorageService.subscribeToScheduleEvents(event => {
      if (event.type === 'photos_updated') {
        syncPhotos();
      }
    });

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('workshop_photos_changed', syncPhotos);
      unsubscribeSSE();
    };
  }, []);

  // Modal states
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(() => window.location.hash === '#admin');

  useEffect(() => {
    const syncAdminHash = () => setIsAdminOpen(window.location.hash === '#admin');
    window.addEventListener('hashchange', syncAdminHash);
    return () => window.removeEventListener('hashchange', syncAdminHash);
  }, []);

  const openAdmin = () => {
    window.location.hash = 'admin';
    setIsAdminOpen(true);
  };
  const closeAdmin = () => {
    setIsAdminOpen(false);
    if (window.location.hash === '#admin') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  };
  const [preSelectedService, setPreSelectedService] = useState<ServiceItem | null>(null);

  const handleOpenQuoteWithService = (service: ServiceItem) => {
    setPreSelectedService(service);
    setIsQuoteOpen(true);
  };

  const handleOpenQuoteWithNamedService = (serviceName?: string) => {
    if (serviceName) {
      const matched = services.find(s => 
        s.title.toLowerCase().includes(serviceName.toLowerCase().split(' ')[0]) ||
        serviceName.toLowerCase().includes(s.title.toLowerCase().split(' ')[0])
      ) || {
        id: 'servico-dica-' + Date.now(),
        title: serviceName,
        shortDescription: serviceName,
        fullDescription: '',
        category: 'preventiva',
        iconName: 'Wrench',
        priceType: 'diagnostic_required',
        includedItems: [],
        active: true,
      } as ServiceItem;
      setPreSelectedService(matched);
    } else {
      setPreSelectedService(null);
    }
    setIsQuoteOpen(true);
  };

  const handleOpenQuoteGeneral = () => {
    setPreSelectedService(null);
    setIsQuoteOpen(true);
  };

  return (
    <div className="mineiro-site min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white pb-16 sm:pb-0">
      {/* Navigation: Início, Serviços, Sobre, Agendamento e Contato */}
      <Navbar
        onOpenQuote={handleOpenQuoteGeneral}
        onOpenAppointment={() => setIsAppointmentOpen(true)}
        onOpenAdmin={openAdmin}
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* 1. Início (Hero) */}
        <Hero
          settings={settings}
          onOpenQuote={handleOpenQuoteGeneral}
          onOpenAppointment={() => setIsAppointmentOpen(true)}
          onOpenAdmin={openAdmin}
        />

        <WorkshopManifesto onOpenQuote={handleOpenQuoteGeneral} />
        <CareScenarios onService={handleOpenQuoteWithNamedService} />

        {/* 2. Serviços */}
        <ScrollReveal>
          <ServicesSection
            services={services}
            settings={settings}
            onSelectServiceForQuote={handleOpenQuoteWithService}
          />
        </ScrollReveal>

        <TechnologyStory />

        <EquipmentSection onOpenQuoteWithService={handleOpenQuoteWithNamedService} />

        {/* 3. Oficina em Fotografias */}
        <ScrollReveal>
          <AboutSection 
            settings={settings} 
          />
        </ScrollReveal>

        <ProcessSection onOpenAppointment={() => setIsAppointmentOpen(true)} />

        {/* 4. Faixa de Agendamento (Vamos cuidar do seu carro?) */}
        <ScrollReveal>
          <SchedulingBanner
            settings={settings}
            onOpenAppointment={() => setIsAppointmentOpen(true)}
          />
        </ScrollReveal>

        {/* Avaliações do Google */}
        <ScrollReveal>
          <ReviewsSection settings={settings} />
        </ScrollReveal>

        {/* 5. Dicas de Manutenção (SEO Local & Engajamento) */}
        <ScrollReveal>
          <MaintenanceTipsSection 
            onOpenAppointmentWithService={() => setIsAppointmentOpen(true)}
            onOpenQuoteWithService={handleOpenQuoteWithNamedService}
          />
        </ScrollReveal>

        {/* 6. Acompanhe no Instagram */}
        <ScrollReveal>
          <InstagramSection settings={settings} />
        </ScrollReveal>

        <FAQSection />

        {/* 7. Localização & Contato */}
        <ScrollReveal>
          <LocationSection 
            settings={settings} 
            onOpenAppointment={() => setIsAppointmentOpen(true)}
          />
        </ScrollReveal>
        <FinalContact settings={settings} onOpenAppointment={() => setIsAppointmentOpen(true)} />
      </main>

      {/* Footer */}
      <Footer
        settings={settings}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenAdmin={openAdmin}
        onOpenAppointment={() => setIsAppointmentOpen(true)}
      />

      {/* Mobile Fixed Bar & Desktop WhatsApp Float */}
      <WhatsAppFloatingButton 
        settings={settings} 
        onOpenAppointment={() => setIsAppointmentOpen(true)}
      />

      {/* Modal: Solicitar Orçamento */}
      <QuoteModal
        isOpen={isQuoteOpen}
        onClose={() => setIsQuoteOpen(false)}
        settings={settings}
        services={services}
        preSelectedService={preSelectedService}
        onOpenPrivacyPolicy={() => {
          setIsQuoteOpen(false);
          setIsPrivacyOpen(true);
        }}
      />

      {/* Modal: Agendar Serviço */}
      <AppointmentModal
        isOpen={isAppointmentOpen}
        onClose={() => setIsAppointmentOpen(false)}
        settings={settings}
        services={services}
        onOpenPrivacyPolicy={() => {
          setIsAppointmentOpen(false);
          setIsPrivacyOpen(true);
        }}
      />

      {/* Modal: Aviso de Privacidade LGPD */}
      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        settings={settings}
      />

      {/* Painel Administrativo com Acesso Protegido */}
      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={closeAdmin}
        initialTab="appointments"
      />
    </div>
  );
}
