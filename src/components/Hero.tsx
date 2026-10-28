import React from 'react';
import { ArrowDown, ArrowUpRight, MapPin } from 'lucide-react';
import { CompanySettings } from '../types';
import { REAL_IMAGE_FILENAMES } from '../utils/imagePaths';

interface HeroProps {
  settings: CompanySettings;
  onOpenQuote: () => void;
  onOpenAppointment: () => void;
  onOpenAdmin?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ settings, onOpenQuote, onOpenAppointment }) => (
  <>
    <section id="inicio" className="mineiro-hero">
      <div className="hero-watermark" aria-hidden="true">MINEIRO</div>
      <div className="hero-image-panel">
        <img src={settings.workshopPhotos?.heroFacade || REAL_IMAGE_FILENAMES.heroFacade}
          alt="Fachada do Mineiro Auto Center e Mecânica, no bairro Brasil em Uberlândia"
          fetchPriority="high" decoding="async" />
        <a href="#oficina" className="hero-photo-caption">NOSSA OFICINA. NOSSO COMPROMISSO. <ArrowUpRight size={18} /></a>
      </div>
      <div className="hero-content">
        <span className="editorial-eyebrow"><span className="status-dot" /> BAIRRO BRASIL · UBERLÂNDIA, MG</span>
        <h1>Seu carro.<br />Nossa <em>responsabilidade.</em></h1>
        <p>Mecânica, alinhamento, freios e suspensão. Do diagnóstico à revisão, o cuidado que acompanha você em cada quilômetro.</p>
        <div className="hero-actions">
          <button className="editorial-button primary" onClick={onOpenAppointment}>Agendar serviço <ArrowUpRight size={19} /></button>
          <button className="editorial-button secondary" onClick={onOpenQuote}>Solicitar orçamento <ArrowUpRight size={19} /></button>
        </div>
        <a className="hero-address" href={settings.googleMapsDestinationUrl} target="_blank" rel="noopener noreferrer"><MapPin size={16} /> {settings.street}, nº {settings.number}</a>
      </div>
      <div className="hero-bottom"><span>AUTO CENTER & MECÂNICA</span><a href="#servicos">Conheça nossos serviços <ArrowDown size={16} /></a></div>
    </section>
    <div className="service-ribbon" aria-label="Especialidades">ALINHAMENTO 3D <span>✦</span> FREIOS <span>✦</span> SUSPENSÃO <span>✦</span> REVISÃO PREVENTIVA <span>✦</span> MECÂNICA</div>
  </>
);
