export interface ImageSlotMeta {
  key: keyof typeof REAL_IMAGE_FILENAMES;
  filename: string;
  attachmentName: string;
  url: string;
  title: string;
  description: string;
  section: string;
  aspectRatio: string;
  missingInUpload?: boolean;
}

export const REAL_IMAGE_FILENAMES = {
  heroFacade: '/assets/images/fachada_mineiro_autocenter_2749.jpg',
  clientKey: '/assets/images/oficina_galpao_interno.jpg',
  wheelAlignment: '/assets/images/alinhamento_balanceamento_computadorizado.jpg',
  mechanicEngine: '/assets/images/mecanica_revisao_motor.jpg',
  suspension: '/assets/images/oficina_rampa_alinhamento.jpg',
  aboutWorkshop: '/assets/images/oficina_mecanica_capo_aberto.jpg',
  contactPhone: '/assets/images/fachada_mineiro_autocenter_2749.jpg',
  wheel3D: '/assets/images/roda_3d_ilustracao.jpg',
  suspension3D: '/assets/images/suspensao_3d_ilustracao.jpg',
  brakes3D: '/assets/images/freios_3d_ilustracao.jpg',
  instagram: '/assets/images/equipe-instagram.webp',
};

export const WORKSHOP_PHOTO_SLOTS: ImageSlotMeta[] = [
  {
    key: 'heroFacade',
    filename: 'fachada_mineiro_autocenter_2749.jpg',
    attachmentName: 'IMG_3590 (1).PNG',
    url: REAL_IMAGE_FILENAMES.heroFacade,
    title: '1. Fotografia Principal da 1ª Seção (Fachada)',
    description: 'Fachada oficial com letreiro Mineiro Auto Center, telefones, nº 2749 e baia com elevador.',
    section: 'Primeira seção (Hero) & Localização',
    aspectRatio: '9:16 vertical (aspect-[9/16])',
  },
  {
    key: 'clientKey',
    filename: 'oficina_galpao_interno.jpg',
    attachmentName: 'IMG_9971.PNG',
    url: REAL_IMAGE_FILENAMES.clientKey,
    title: '2. Estrutura Interna e Elevadores',
    description: 'Galpão interno da oficina com múltiplos elevadores, iluminação e veículos em atendimento.',
    section: 'Seção Sobre a Oficina — Destaque de instalações e capacidade técnica',
    aspectRatio: '4:5 ou vertical',
  },
  {
    key: 'wheelAlignment',
    filename: 'alinhamento_balanceamento_computadorizado.jpg',
    attachmentName: 'IMG_9968.PNG',
    url: REAL_IMAGE_FILENAMES.wheelAlignment,
    title: '3. Alinhamento e Geometria Computadorizada',
    description: 'Profissional operando equipamento de medição a laser e alvo 3D na roda.',
    section: 'Galeria Técnica — Geometria e Alinhamento',
    aspectRatio: '3:4 vertical',
  },
  {
    key: 'suspension',
    filename: 'oficina_rampa_alinhamento.jpg',
    attachmentName: 'IMG_9972.PNG',
    url: REAL_IMAGE_FILENAMES.suspension,
    title: '4. Rampa Técnica de Alinhamento',
    description: 'Rampa especializada de alinhamento com equipamento ao fundo.',
    section: 'Galeria Técnica — Estrutura e Equipamentos',
    aspectRatio: '3:4 vertical',
  },
  {
    key: 'mechanicEngine',
    filename: 'mecanica_revisao_motor.jpg',
    attachmentName: 'IMG_9969.PNG',
    url: REAL_IMAGE_FILENAMES.mechanicEngine,
    title: '5. Mecânica e Revisão (Motor)',
    description: 'Profissional trabalhando diretamente no compartimento do motor e revisão preventiva.',
    section: 'Galeria Técnica — Mecânica e Motor',
    aspectRatio: '3:4 vertical',
  },
  {
    key: 'aboutWorkshop',
    filename: 'oficina_mecanica_capo_aberto.jpg',
    attachmentName: 'IMG_3592 (1).PNG',
    url: REAL_IMAGE_FILENAMES.aboutWorkshop,
    title: '6. Manutenção no Veículo Elevado (Elevador)',
    description: 'Profissional com uniforme oficial trabalhando no veículo elevado com conjunto de suspensão e freio em evidência.',
    section: 'Oficina em Fotografias — Destaque principal',
    aspectRatio: 'Vertical 9:13 proporcional',
  },
  {
    key: 'contactPhone',
    filename: 'fachada_mineiro_autocenter_2749.jpg',
    attachmentName: 'IMG_3590 (1).PNG',
    url: REAL_IMAGE_FILENAMES.contactPhone,
    title: '7. Fachada e Acesso Oficial',
    description: 'Fachada oficial da oficina no Bairro Brasil para orientação e localização.',
    section: 'Contato e Localização — Miniatura de canais diretos',
    aspectRatio: '1:1 (quadrada sem corte)',
  },
  {
    key: 'wheel3D',
    filename: 'roda_3d_ilustracao.jpg',
    attachmentName: 'Roda 3D.png',
    url: REAL_IMAGE_FILENAMES.wheel3D,
    title: '8. Roda 3D (Ilustração Automotiva)',
    description: 'Ilustração 3D da roda com pneu esportivo e freio a disco, usada no Hero e Alinhamento.',
    section: 'Hero (1ª Seção) & Serviços (Alinhamento e Balanceamento)',
    aspectRatio: '1:1 (quadrada isolada)',
  },
  {
    key: 'suspension3D',
    filename: 'suspensao_3d_ilustracao.jpg',
    attachmentName: 'Suspensão 3D.png',
    url: REAL_IMAGE_FILENAMES.suspension3D,
    title: '9. Suspensão 3D (Ilustração Automotiva)',
    description: 'Ilustração 3D do conjunto amortecedor e mola coilover de alta precisão.',
    section: 'Serviços — Cartão Suspensão e Amortecedores',
    aspectRatio: '1:1 (quadrada isolada)',
  },
  {
    key: 'brakes3D',
    filename: 'freios_3d_ilustracao.jpg',
    attachmentName: 'Freios 3D.png',
    url: REAL_IMAGE_FILENAMES.brakes3D,
    title: '10. Freios 3D (Ilustração Automotiva)',
    description: 'Ilustração 3D de disco ventilado e pinça esportiva de freio.',
    section: 'Serviços — Cartão Freios e Segurança',
    aspectRatio: '1:1 (quadrada isolada)',
  },
  {
    key: 'instagram',
    filename: 'equipe-instagram.webp',
    attachmentName: '4C40EB47-63C4-47CD-B121-240B93C48AA5.png',
    url: REAL_IMAGE_FILENAMES.instagram,
    title: '11. Rotina da Equipe (Card Instagram)',
    description: 'Profissional com camisa preta Mineiro Auto Center ao lado do veículo com capô aberto olhando para a câmera.',
    section: 'Instagram Oficial — Acompanhe a rotina da nossa equipe',
    aspectRatio: '3:4 ou 4:5 vertical (profissional e motor visíveis)',
  },
];
