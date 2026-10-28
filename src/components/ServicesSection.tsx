import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { ServiceItem, CompanySettings } from '../types';
import { REAL_IMAGE_FILENAMES } from '../utils/imagePaths';

interface ServicesSectionProps {
  services: ServiceItem[];
  settings?: CompanySettings;
  onSelectServiceForQuote: (service: ServiceItem) => void;
}
export const ServicesSection: React.FC<ServicesSectionProps> = ({ services, settings, onSelectServiceForQuote }) => {
  const featuredIds = ['alinhamento-balanceamento', 'suspensao-amortecedores', 'freios'];
  const active = services.filter(s => s.active);
  const photos = [settings?.workshopPhotos?.wheelAlignment || REAL_IMAGE_FILENAMES.wheelAlignment, settings?.workshopPhotos?.suspension || REAL_IMAGE_FILENAMES.suspension, settings?.workshopPhotos?.aboutWorkshop || REAL_IMAGE_FILENAMES.aboutWorkshop];
  return (
    <section id="servicos" className="editorial-services">
      <div className="editorial-section-head"><span className="editorial-eyebrow">— O QUE FAZEMOS</span><h2>Precisão no serviço.<br /><em>Confiança no caminho.</em></h2><p>Da manutenção preventiva ao reparo, encontre o cuidado que seu carro precisa.</p></div>
      <div className="featured-service-grid">{featuredIds.map((id, i) => {
        const service = active.find(s => s.id === id);
        return service && <article className="featured-service" key={id}><div className="service-photo"><img src={photos[i]} alt={service.title + ' na oficina Mineiro'} loading="lazy" /><span>0{i + 1}</span></div><div className="service-copy"><h3>{service.title}</h3><p>{service.shortDescription}</p><button onClick={() => onSelectServiceForQuote(service)}>Solicitar orçamento <ArrowUpRight size={20} /></button></div></article>;
      })}</div>
      <div className="other-services">{active.filter(s => !featuredIds.includes(s.id)).map(s => <button key={s.id} onClick={() => onSelectServiceForQuote(s)}><span>{s.title}</span><ArrowUpRight size={22} /></button>)}</div>
      <p className="service-note">Serviços e valores definidos após avaliação do veículo.</p>
    </section>
  );
};
