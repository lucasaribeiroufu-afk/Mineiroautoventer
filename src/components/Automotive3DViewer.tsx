import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Pause, Play, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { createWheelAssembly } from '../three/wheelAssembly';

interface Automotive3DViewerProps { onOpenQuoteWithService?: (serviceName: string) => void; }
type View = 'perspective' | 'front' | 'brakes';

export const Automotive3DViewer: React.FC<Automotive3DViewerProps> = ({ onOpenQuoteWithService }) => {
  const mount = useRef<HTMLDivElement>(null);
  const api = useRef<{ view: (v: View) => void; zoom: (factor: number) => void; rotate: (value: boolean) => void; reset: () => void } | null>(null);
  const [rotating, setRotating] = useState(false);
  const [view, setView] = useState<View>('perspective');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'default' }); }
    catch { setFailed(true); return; }
    const small = window.matchMedia('(max-width: 760px)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#111923');
    scene.fog = new THREE.Fog('#111923',12,22);
    const camera = new THREE.PerspectiveCamera(small ? 43 : 37,1,.1,40);
    const initial = new THREE.Vector3(3.35,1.7,small?6.4:5.5);
    camera.position.copy(initial);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,small?1.3:1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute('aria-label','Modelo 3D interativo de roda e freio; use os botões para mudar a vista e ampliar');
    renderer.domElement.setAttribute('role','img');
    host.appendChild(renderer.domElement);

    const environment = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTarget = pmrem.fromScene(environment,.04);
    scene.environment = envTarget.texture;
    scene.environmentIntensity = .75;
    environment.dispose(); pmrem.dispose();
    scene.add(new THREE.HemisphereLight('#e1edff','#333537',2));
    const key = new THREE.DirectionalLight('#fff4e5',4.2); key.position.set(3,6,5);key.castShadow=true;
    key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-4;key.shadow.camera.right=4;key.shadow.camera.top=4;key.shadow.camera.bottom=-4;key.shadow.normalBias=.025;
    scene.add(key);
    const rim=new THREE.DirectionalLight('#b5cfff',3);rim.position.set(-4,3,-2);scene.add(rim);
    const fill=new THREE.DirectionalLight('#ffffff',1.5);fill.position.set(-3,1,5);scene.add(fill);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'#252d38',roughness:.64,metalness:.15}));
    floor.rotation.x=-Math.PI/2;floor.position.y=-1.505;floor.receiveShadow=true;scene.add(floor);
    const assembly=createWheelAssembly();scene.add(assembly.root);

    const controls=new OrbitControls(camera,renderer.domElement);
    controls.enableDamping=true; controls.dampingFactor=.07;controls.enablePan=false;
    controls.minDistance=3.8;controls.maxDistance=12;controls.minPolarAngle=.35;controls.maxPolarAngle=Math.PI/2+.06;
    controls.autoRotate=false;controls.autoRotateSpeed=.55;
    // Vertical touch gestures continue to scroll the page; horizontal gestures inspect the wheel.
    renderer.domElement.style.touchAction='pan-y';
    controls.enableZoom=false; // Dedicated accessible buttons avoid trapping page scroll.
    const targetPosition=initial.clone();const targetLook=new THREE.Vector3();
    let moving=false;let exploded=false;let auto=false;
    const pause=()=>{auto=false;controls.autoRotate=false;moving=false;setRotating(false);};
    controls.addEventListener('start',pause);
    const transition=(position: THREE.Vector3,look: THREE.Vector3)=> {
      auto=false;controls.autoRotate=false;setRotating(false);
      targetPosition.copy(position);targetLook.copy(look);moving=true;
      if(reduced.matches){camera.position.copy(position);controls.target.copy(look);moving=false;}
    };
    api.current={
      view(v) {
        exploded=v==='brakes';
        if(v==='front') transition(new THREE.Vector3(0,.15,6.2),new THREE.Vector3(0,0,0));
        else if(v==='brakes') transition(new THREE.Vector3(3.6,1.65,small?10.3:6.8),new THREE.Vector3(1.25,0,.1));
        else transition(initial,new THREE.Vector3());
      },
      zoom(factor) {const offset=camera.position.clone().sub(controls.target);offset.setLength(THREE.MathUtils.clamp(offset.length()*factor,controls.minDistance,controls.maxDistance)); transition(controls.target.clone().add(offset),controls.target.clone());},
      rotate(value) {auto=value;controls.autoRotate=value;moving=false;},
      reset() {exploded=false;transition(initial,new THREE.Vector3());},
    };
    const onReducedChange=()=>{if(reduced.matches)pause();};reduced.addEventListener('change',onReducedChange);
    const resize=new ResizeObserver(()=>{const w=host.clientWidth;const h=host.clientHeight;if(w&&h){renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}});resize.observe(host);
    let visible=false;let frame=0;let previous=0;let disposed=false;
    const tick=(time:number)=>{
      frame=0;if(disposed||!visible||document.hidden)return;
      const dt=Math.min((time-previous)/1000,.05)||.016;previous=time;
      if(moving) {
        const blend=1-Math.exp(-dt*7);
        camera.position.lerp(targetPosition,blend);controls.target.lerp(targetLook,blend);
        if(camera.position.distanceTo(targetPosition)<.008){camera.position.copy(targetPosition);controls.target.copy(targetLook);moving=false;}
      }
      const separation=exploded?2.65:0;
      assembly.wheel.position.x=THREE.MathUtils.damp(assembly.wheel.position.x,separation,6,reduced.matches?1:dt);
      // The brake assembly stays stationary while the wheel is separated for inspection.
      controls.autoRotate=auto&&!moving; controls.update(dt);renderer.render(scene,camera);
      frame=requestAnimationFrame(tick);
    };
    const start=()=>{if(!frame&&!disposed&&visible&&!document.hidden){previous=performance.now();frame=requestAnimationFrame(tick);}};
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)start();else{cancelAnimationFrame(frame);frame=0;}},{threshold:.01});observer.observe(host);
    const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else start();};document.addEventListener('visibilitychange',visibility);
    const lost=(e:Event)=>{e.preventDefault();setFailed(true);cancelAnimationFrame(frame);frame=0;};renderer.domElement.addEventListener('webglcontextlost',lost);
    return ()=>{
      disposed=true;cancelAnimationFrame(frame);api.current=null;resize.disconnect();observer.disconnect();document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',onReducedChange);
      renderer.domElement.removeEventListener('webglcontextlost',lost);controls.removeEventListener('start',pause);controls.dispose();
      const geometries=new Set<THREE.BufferGeometry>();const materials=new Set<THREE.Material>();const textures=new Set<THREE.Texture>();
      scene.traverse(obj=>{if(obj instanceof THREE.Mesh){geometries.add(obj.geometry);const list=Array.isArray(obj.material)?obj.material:[obj.material];list.forEach(mat=>{materials.add(mat);Object.values(mat).forEach(value=>{if(value instanceof THREE.Texture)textures.add(value);});});}});
      geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());envTarget.dispose();key.shadow.map?.dispose();renderer.dispose();renderer.domElement.remove();
    };
  },[]);

  const selectView=(next:View)=>{setView(next);api.current?.view(next);};
  return <div className="wheel-viewer">
    <div className="wheel-viewer-caption"><span>ESTÚDIO 3D / RODA & FREIO</span><span>Arraste para explorar</span></div>
    <div ref={mount} className="wheel-canvas" />
    {failed && <div className="wheel-fallback"><img src="/assets/images/roda_3d_ilustracao.jpg" alt="Ilustração do conjunto de roda e freio" /><p role="status">Visualização estática: o 3D não está disponível neste dispositivo.</p></div>}
    <div className="wheel-controls" aria-label="Controles do modelo 3D">
      <div className="wheel-view-buttons">{([['perspective','Conjunto'],['front','Vista frontal'],['brakes','Inspecionar freio']] as const).map(([id,label])=><button key={id} disabled={failed} aria-pressed={view===id} onClick={()=>selectView(id)}>{label}</button>)}</div>
      <div className="wheel-action-buttons">
        <button disabled={failed} aria-label={rotating?'Pausar rotação':'Iniciar rotação'} aria-pressed={rotating} onClick={()=>{api.current?.rotate(!rotating);setRotating(!rotating);}}>{rotating?<Pause size={17}/>:<Play size={17}/>}<span>{rotating?'Pausar':'Girar'}</span></button>
        <button disabled={failed} aria-label="Ampliar modelo" onClick={()=>api.current?.zoom(.85)}><ZoomIn size={18}/></button>
        <button disabled={failed} aria-label="Reduzir modelo" onClick={()=>api.current?.zoom(1.18)}><ZoomOut size={18}/></button>
        <button disabled={failed} aria-label="Restaurar vista inicial" onClick={()=>{api.current?.reset();setView('perspective');}}><RotateCcw size={17}/></button>
      </div>
    </div>
    <p className="wheel-note" aria-live="polite">{view==='brakes'?'Vista separada: a roda se desloca para revelar disco ventilado, cubo e pinça.':'Modelo ilustrativo de roda e freio. Arraste na horizontal ou use as vistas acima.'} Não representa uma peça ou equipamento específico da oficina.</p>
    {onOpenQuoteWithService && <button className="wheel-quote" onClick={()=>onOpenQuoteWithService('Freios e pastilhas')}>Consultar manutenção de freios ↗</button>}
  </div>;
};
