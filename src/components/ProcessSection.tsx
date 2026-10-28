import React from 'react';
import { ArrowUpRight } from 'lucide-react';
const steps = [
  ['Conversa', 'Conte o que seu carro precisa e solicite um horário com a equipe.'],
  ['Diagnóstico', 'A avaliação técnica identifica os cuidados indicados para o veículo.'],
  ['Orçamento', 'Converse com a oficina sobre os serviços e valores antes de autorizar.'],
  ['Cuidado', 'Com os serviços aprovados, seguimos para a manutenção e a entrega.'],
];
export const ProcessSection: React.FC<{ onOpenAppointment: () => void }> = ({ onOpenAppointment }) => (
  <section id="processo" className="editorial-process">
    <div className="editorial-section-head"><span className="editorial-eyebrow">— DO PRIMEIRO CONTATO À ENTREGA</span><h2>Mais clareza.<br /><em>Em cada etapa.</em></h2><p>Entenda o caminho do seu veículo dentro da nossa oficina.</p></div>
    <ol className="process-grid">{steps.map(([title, text], i) => <li key={title}><span className="step-number">0{i + 1}</span><h3>{title}</h3><p>{text}</p></li>)}</ol>
    <button className="editorial-button primary" onClick={onOpenAppointment}>Começar pelo agendamento <ArrowUpRight size={18} /></button>
  </section>
);
