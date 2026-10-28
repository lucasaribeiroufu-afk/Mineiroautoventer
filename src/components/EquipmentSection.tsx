import React, { lazy, Suspense, useState } from 'react';
import { ArrowUpRight, Maximize2, Box } from 'lucide-react';
import { ImageLightboxModal } from './ImageLightboxModal';
const Viewer=lazy(()=>import('./Automotive3DViewer').then(module=>({default:module.Automotive3DViewer})));
const photos=[
  {src:'/assets/images/corghi-alinhamento-veiculo.webp',title:'Alinhamento em uso',description:'Veículo na rampa com alvo de medição instalado na roda.'},
  {src:'/assets/images/corghi-alinhador-estacao.webp',title:'Estação de medição',description:'Estação Corghi Exact Linear Standard e monitor de alinhamento.'},
  {src:'/assets/images/corghi-estrutura-completa.webp',title:'Estrutura e acessórios',description:'Conjunto de medição, suportes e equipamentos da oficina.'},
  {src:'/assets/images/corghi-detalhes-equipamento.webp',title:'Tecnologia de perto',description:'Detalhes do alinhador Corghi e da estação de trabalho.'},
];
export const EquipmentSection:React.FC<{onOpenQuoteWithService:(service:string)=>void}>=({onOpenQuoteWithService})=>{
  const [photo,setPhoto]=useState<(typeof photos)[number]|null>(null);
  const [interactive,setInteractive]=useState(false);
  return <section id="equipamentos" className="editorial-equipment">
    <div className="editorial-section-head"><span className="editorial-eyebrow">— ESTRUTURA REAL. CUIDADO DE PERTO.</span><h2>Tecnologia na oficina.<br/><em>Precisão no cuidado.</em></h2><p>Conheça o equipamento Corghi e veja o alinhamento na rotina do Mineiro Auto Center. Fotografias da nossa estrutura.</p></div>
    <div className="equipment-gallery">{photos.map((item,i)=><figure key={item.src}><button className="equipment-photo" aria-label={'Ampliar fotografia: '+item.title} onClick={()=>setPhoto(item)}><img src={item.src} alt={item.description} loading="lazy" width="960" height="1280"/><span><Maximize2 size={18}/></span></button><figcaption><span>0{i+1}</span><div><h3>{item.title}</h3><p>{item.description}</p></div></figcaption></figure>)}</div>
    <div className="equipment-3d-head"><div><span className="editorial-eyebrow">— EXPLORE OS COMPONENTES</span><h3>O cuidado também está <em>nos detalhes.</em></h3><p>Explore uma representação de roda e freio, aproxime a câmera e separe os componentes para entender o conjunto.</p></div><button onClick={()=>onOpenQuoteWithService('Alinhamento 3D e balanceamento')}>Consultar alinhamento <ArrowUpRight size={18}/></button></div>
    {interactive ? <Suspense fallback={<div className="wheel-loading" role="status">Preparando o modelo 3D…</div>}><Viewer onOpenQuoteWithService={onOpenQuoteWithService}/></Suspense> : <button className="wheel-launch" onClick={()=>setInteractive(true)}><img src="/assets/images/roda_3d_ilustracao.jpg" alt="Prévia ilustrativa de uma roda com freio" loading="lazy"/><span><Box size={24}/>Explorar em 3D <ArrowUpRight size={22}/><small>Roda, pneu e freio · arraste e amplie</small></span></button>}
    <ImageLightboxModal isOpen={!!photo} onClose={()=>setPhoto(null)} imageSrc={photo?.src||''} imageAlt={photo?.description||''} title={photo?.title||''} subtitle="Equipamentos do Mineiro Auto Center e Mecânica"/>
  </section>;
};
