import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Image, RotateCcw } from 'lucide-react';
import { loadSketchfabViewer, REALISTIC_WHEEL } from '../services/realisticWheel';

interface Automotive3DViewerProps { onOpenQuoteWithService?: (serviceName: string) => void; }

export const Automotive3DViewer: React.FC<Automotive3DViewerProps> = ({ onOpenQuoteWithService }) => {
  const frame = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [showImage, setShowImage] = useState(false);

  useEffect(() => {
    const iframe = frame.current;
    if (!iframe || showImage) return;
    let active = true;
    setStatus('loading');
    // Keep the same high-resolution poster visible until the textured model is ready.
    const fail = () => { if (active) { setStatus('error'); iframe.src = 'about:blank'; } };
    const timeout = window.setTimeout(fail, 45000);
    loadSketchfabViewer().then(Sketchfab => {
      if (!active) return;
      const client = new Sketchfab('1.12.1', iframe);
      client.init(REALISTIC_WHEEL.uid, {
        autostart: 1,
        camera: 0,
        autospin: 0,
        dnt: 1,
        success(api) {
          if (!active) return;
          api.addEventListener('viewerready', () => {
            if (active) { window.clearTimeout(timeout); setStatus('ready'); }
          });
          api.start();
        },
        error: (reason?: unknown) => { console.warn('Visualizador 3D indisponível:', reason); fail(); },
      });
    }).catch(fail);
    return () => { active = false; window.clearTimeout(timeout); iframe.src = 'about:blank'; };
  }, [attempt, showImage]);

  return <div className="realistic-wheel-viewer">
    <div className="realistic-wheel-stage" aria-busy={status === 'loading' && !showImage}>
      <iframe key={attempt} ref={frame} title="Roda e pneu realistas em 3D — gire e amplie" className={status === 'ready' && !showImage ? 'is-ready' : ''} allow="autoplay; fullscreen" allowFullScreen />
      {(status !== 'ready' || showImage) && <div className="realistic-wheel-poster"><img src={REALISTIC_WHEEL.poster} alt="Renderização do mesmo modelo 3D de roda e pneu que será aberto no visualizador" width="1920" height="1080" />
        {!showImage && <div className="realistic-wheel-status" role="status">{status === 'loading' ? 'Carregando a roda com todas as texturas…' : 'O 3D não carregou neste navegador. A imagem permanece disponível.'}</div>}
      </div>}
    </div>
    <div className="realistic-wheel-toolbar">
      <p>{showImage ? 'Imagem do modelo em alta resolução.' : status === 'error' ? 'Imagem preservada. Tente novamente ou abra o modelo no Sketchfab.' : 'Arraste para girar. Amplie com dois dedos ou pelo visualizador.'}</p>
      <div>
        {status === 'error' && !showImage && <button onClick={() => setAttempt(value => value + 1)}><RotateCcw size={16} />Tentar novamente</button>}
        <button onClick={() => setShowImage(value => !value)}><Image size={16} />{showImage ? 'Voltar ao 3D' : 'Ver imagem'}</button>
        <a href={REALISTIC_WHEEL.sourceUrl} target="_blank" rel="noopener noreferrer">Abrir no Sketchfab <ArrowUpRight size={16} /></a>
      </div>
    </div>
    <p className="realistic-wheel-credit"><a href={REALISTIC_WHEEL.sourceUrl} target="_blank" rel="noopener noreferrer">{REALISTIC_WHEEL.title}</a> por <a href={REALISTIC_WHEEL.authorUrl} target="_blank" rel="noopener noreferrer">{REALISTIC_WHEEL.author}</a> · <a href={REALISTIC_WHEEL.licenseUrl} target="_blank" rel="noopener noreferrer">CC BY 4.0</a> · Visualização ilustrativa; não indica marcas comercializadas pela oficina.</p>
    {onOpenQuoteWithService && <button className="wheel-quote" onClick={() => onOpenQuoteWithService('Alinhamento 3D e balanceamento')}>Consultar alinhamento e balanceamento ↗</button>}
  </div>;
};
