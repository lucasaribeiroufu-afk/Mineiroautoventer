import React, { useState } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { Logo } from './Logo';

interface NavbarProps {
  onOpenQuote: () => void;
  onOpenAppointment: () => void;
  onOpenAdmin?: () => void;
}
const links = [['#servicos', 'Serviços'], ['#equipamentos', 'Equipamentos'], ['#tecnologia', 'Tecnologia'], ['#processo', 'Como funciona'], ['#duvidas', 'Dúvidas'], ['#contato', 'Contato']];
export const Navbar: React.FC<NavbarProps> = ({ onOpenAppointment }) => {
  const [open, setOpen] = useState(false);
  return (
    <header className="mineiro-nav">
      <div className="mineiro-nav-inner">
        <a href="#inicio" aria-label="Mineiro Auto Center — início"><Logo size="md" /></a>
        <nav className="desktop-links" aria-label="Navegação principal">{links.map(([href, label]) => <a key={href} href={href}>{label}</a>)}</nav>
        <button className="nav-book" onClick={onOpenAppointment}>Agendar <ArrowUpRight size={16} /></button>
        <button className="nav-toggle" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? 'Fechar menu' : 'Abrir menu'}>{open ? <X /> : <Menu />}</button>
      </div>
      {open && <nav id="mobile-navigation" className="mobile-links" aria-label="Navegação móvel">{links.map(([href, label]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}<ArrowUpRight size={17} /></a>)}</nav>}
    </header>
  );
};
