import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { 
  RotateCcw, 
  Eye, 
  Layers, 
  Maximize2, 
  Sparkles, 
  CheckCircle2, 
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Automotive3DViewerProps {
  onOpenQuoteWithService?: (serviceName: string) => void;
}

export const Automotive3DViewer: React.FC<Automotive3DViewerProps> = ({
  onOpenQuoteWithService,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [activeView, setActiveView] = useState<'perspective' | 'front' | 'brakes'>('perspective');
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);

  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const isVisibleRef = useRef<boolean>(true);
  const isInteractingRef = useRef<boolean>(false);
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(3.2, 1.8, 3.8));
  const targetCamLook = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL to adapt graphics quality cleanly
    const isSoftwareGl = (() => {
      try {
        const testCanvas = document.createElement('canvas');
        const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : (gl as WebGLRenderingContext).RENDERER;
        const gpu = String((gl as WebGLRenderingContext).getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      50
    );
    camera.position.set(3.2, 1.8, 3.8);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Studio Environment map via RoomEnvironment for realistic PBR metal
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xe8f0ff, 0x081426, 0.7);
    scene.add(hemiLight);

    // Warm Key Light
    const keyLight = new THREE.DirectionalLight(0xfff5ea, 2.2);
    keyLight.position.set(4, 5, 4);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Cool Rim Light in Mineiro Blue
    const blueRimLight = new THREE.DirectionalLight(0x145cff, 2.8);
    blueRimLight.position.set(-4, 2, -3);
    scene.add(blueRimLight);

    // Subtle Front Fill
    const fillLight = new THREE.DirectionalLight(0xaac9ff, 1.2);
    fillLight.position.set(0, -2, 4);
    scene.add(fillLight);

    // Ground Contact Shadow Plane
    const shadowGeo = new THREE.PlaneGeometry(6, 6);
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(64, 64, 10, 64, 64, 60);
      gradient.addColorStop(0, 'rgba(8, 20, 38, 0.55)');
      gradient.addColorStop(0.5, 'rgba(8, 20, 38, 0.25)');
      gradient.addColorStop(1, 'rgba(8, 20, 38, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(canvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.45;
    scene.add(shadowPlane);

    // ==========================================
    // PROCEDURAL 3D AUTOMOTIVE ASSEMBLY (THREE.Group)
    // ==========================================
    const assemblyGroup = new THREE.Group();
    assemblyGroup.position.y = 0;

    // Materials
    const rubberMat = new THREE.MeshStandardMaterial({
      color: 0x181a1f,
      roughness: 0.88,
      metalness: 0.08,
    });

    const polishedAlloyMat = new THREE.MeshStandardMaterial({
      color: 0xdde4ec,
      roughness: 0.2,
      metalness: 0.92,
      envMapIntensity: 1.5,
    });

    const darkAlloyMat = new THREE.MeshStandardMaterial({
      color: 0x22262e,
      roughness: 0.35,
      metalness: 0.85,
    });

    const brakeRotorMat = new THREE.MeshStandardMaterial({
      color: 0xc8ced6,
      roughness: 0.28,
      metalness: 0.9,
    });

    const brakeHatMat = new THREE.MeshStandardMaterial({
      color: 0x2b313a,
      roughness: 0.45,
      metalness: 0.8,
    });

    const caliperBlueMat = new THREE.MeshPhysicalMaterial({
      color: 0x145cff,
      roughness: 0.2,
      metalness: 0.35,
      clearcoat: 0.85,
      clearcoatRoughness: 0.15,
      reflectivity: 0.9,
    });

    const goldHardwareMat = new THREE.MeshStandardMaterial({
      color: 0xe0ad38,
      roughness: 0.25,
      metalness: 0.95,
    });

    // 1. Tire
    const tireOuter = new THREE.Mesh(
      new THREE.TorusGeometry(1.3, 0.45, 24, 48),
      rubberMat
    );
    tireOuter.castShadow = !isSoftwareGl;
    tireOuter.receiveShadow = !isSoftwareGl;
    assemblyGroup.add(tireOuter);

    // Tire tread grooves (subtle rings)
    for (let r = 1.15; r <= 1.45; r += 0.1) {
      const groove = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.02, 12, 48),
        new THREE.MeshBasicMaterial({ color: 0x0d0e11 })
      );
      groove.position.z = 0.25;
      assemblyGroup.add(groove);
      const grooveBack = groove.clone();
      grooveBack.position.z = -0.25;
      assemblyGroup.add(grooveBack);
    }

    // 2. Wheel Rim Outer Barrel
    const rimBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(1.05, 1.05, 0.7, 40, 1, true),
      polishedAlloyMat
    );
    rimBarrel.rotation.x = Math.PI / 2;
    assemblyGroup.add(rimBarrel);

    // Rim Outer Lip ring
    const rimLip = new THREE.Mesh(
      new THREE.TorusGeometry(1.06, 0.06, 16, 40),
      polishedAlloyMat
    );
    rimLip.position.z = 0.32;
    assemblyGroup.add(rimLip);

    // 3. Center Hub & 5 Twin-Spokes
    const centerHub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.42, 0.22, 28),
      darkAlloyMat
    );
    centerHub.rotation.x = Math.PI / 2;
    centerHub.position.z = 0.25;
    assemblyGroup.add(centerHub);

    // Mineiro Center Emblem
    const emblem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.04, 24),
      caliperBlueMat
    );
    emblem.rotation.x = Math.PI / 2;
    emblem.position.z = 0.37;
    assemblyGroup.add(emblem);

    // 5 Lug Nuts
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5;
      const nut = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.035, 0.06, 6),
        goldHardwareMat
      );
      nut.rotation.x = Math.PI / 2;
      nut.position.set(
        Math.cos(angle) * 0.26,
        Math.sin(angle) * 0.26,
        0.36
      );
      assemblyGroup.add(nut);
    }

    // 5 Twin Spokes (10 sculpted blades)
    for (let s = 0; s < 5; s++) {
      const baseAngle = (s * Math.PI * 2) / 5;
      [-0.14, 0.14].forEach((offset) => {
        const spokeAngle = baseAngle + offset;
        const spokeLength = 0.72;
        const spoke = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, spokeLength, 0.07),
          polishedAlloyMat
        );
        spoke.castShadow = !isSoftwareGl;
        spoke.position.set(
          Math.cos(spokeAngle) * (spokeLength / 2 + 0.32),
          Math.sin(spokeAngle) * (spokeLength / 2 + 0.32),
          0.26
        );
        spoke.rotation.z = spokeAngle + Math.PI / 2;
        assemblyGroup.add(spoke);
      });
    }

    // 4. Ventilated Brake Rotor Behind Wheel
    const rotorOuter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.88, 0.88, 0.08, 48),
      brakeRotorMat
    );
    rotorOuter.rotation.x = Math.PI / 2;
    rotorOuter.position.z = 0.05;
    assemblyGroup.add(rotorOuter);

    // Ventilated Disc Center Air Slot
    const rotorCavity = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.85, 0.02, 32),
      new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.9 })
    );
    rotorCavity.rotation.x = Math.PI / 2;
    rotorCavity.position.z = 0.05;
    assemblyGroup.add(rotorCavity);

    // Drilled holes simulation on rotor face
    for (let h = 0; h < 24; h++) {
      const angle = (h * Math.PI * 2) / 24;
      const radius = 0.65 + (h % 3) * 0.07;
      const hole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.09, 8),
        new THREE.MeshBasicMaterial({ color: 0x1b1e24 })
      );
      hole.rotation.x = Math.PI / 2;
      hole.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.05);
      assemblyGroup.add(hole);
    }

    // Center Bell / Hat of Rotor
    const rotorHat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.46, 0.48, 0.14, 32),
      brakeHatMat
    );
    rotorHat.rotation.x = Math.PI / 2;
    rotorHat.position.z = 0.12;
    assemblyGroup.add(rotorHat);

    // 5. Multi-Piston Brake Caliper (Sporty Mineiro Blue)
    const caliperGroup = new THREE.Group();
    caliperGroup.position.set(0.68, 0.52, 0.06);
    caliperGroup.rotation.z = -Math.PI / 5;

    // Main Caliper Body
    const caliperBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.65, 0.22),
      caliperBlueMat
    );
    caliperBody.castShadow = !isSoftwareGl;
    caliperGroup.add(caliperBody);

    // Caliper Bridge / Curvature
    const caliperArch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.22, 16, 1, false, 0, Math.PI),
      caliperBlueMat
    );
    caliperArch.rotation.z = Math.PI / 2;
    caliperArch.position.x = 0.12;
    caliperGroup.add(caliperArch);

    // Caliper Bleeders & Bolts
    const bleeder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.08, 8),
      goldHardwareMat
    );
    bleeder.position.set(0.15, 0.32, 0.08);
    caliperGroup.add(bleeder);

    const bleeder2 = bleeder.clone();
    bleeder2.position.set(0.15, -0.32, 0.08);
    caliperGroup.add(bleeder2);

    assemblyGroup.add(caliperGroup);

    // Add all to scene
    scene.add(assemblyGroup);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.08;
    controls.minDistance = 2.0;
    controls.maxDistance = 6.5;
    controls.maxPolarAngle = Math.PI / 2 + 0.2;
    controls.minPolarAngle = Math.PI / 6;
    controlsRef.current = controls;

    controls.addEventListener('start', () => {
      isInteractingRef.current = true;
    });

    controls.addEventListener('end', () => {
      // Resume slow rotation after a short pause
      setTimeout(() => {
        isInteractingRef.current = false;
      }, 800);
    });

    // IntersectionObserver to pause loop when scrolled offscreen
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisibleRef.current = entry.isIntersecting;
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(container);

    // Resize Handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Only render when visible in viewport
      if (!isVisibleRef.current) return;

      const delta = clock.getDelta();

      // Smooth camera interpolation towards view targets
      camera.position.lerp(targetCamPos.current, 0.05);
      controls.target.lerp(targetCamLook.current, 0.05);

      // Gentle auto-rotation when user is not manually dragging
      if (isRotating && !isInteractingRef.current) {
        assemblyGroup.rotation.y += delta * 0.4;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // View switches
  const handleSetView = (view: 'perspective' | 'front' | 'brakes') => {
    setActiveView(view);
    if (view === 'perspective') {
      targetCamPos.current.set(3.2, 1.8, 3.8);
      targetCamLook.current.set(0, 0, 0);
      setActiveHighlight('Geometria e Alinhamento 3D');
    } else if (view === 'front') {
      targetCamPos.current.set(0, 0, 3.9);
      targetCamLook.current.set(0, 0, 0.1);
      setActiveHighlight('Face da Roda e Pneu');
    } else if (view === 'brakes') {
      targetCamPos.current.set(1.9, 1.4, 2.2);
      targetCamLook.current.set(0.65, 0.45, 0.1);
      setActiveHighlight('Freio a Disco Ventilado & Pinça Mineiro Blue');
    }
  };

  const handleResetRotation = () => {
    targetCamPos.current.set(3.2, 1.8, 3.8);
    targetCamLook.current.set(0, 0, 0);
    setIsRotating(true);
    setActiveView('perspective');
    setActiveHighlight(null);
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#060e1c] via-[#081426] to-[#040b17] border border-blue-900/50 shadow-2xl">
      
      {/* Top Header Badge & Instructions */}
      <div className="absolute top-4 inset-x-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#081426]/90 border border-blue-600/50 text-blue-300 text-xs font-semibold backdrop-blur-md shadow-md pointer-events-auto">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Visualizador 3D Interativo • Roda & Freios</span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/80 text-[11px] text-slate-300 backdrop-blur-sm shadow pointer-events-auto">
          <span>Arraste para girar em 360° • Role para zoom</span>
        </div>
      </div>

      {/* Center 3D Viewport Mount (Unobstructed) */}
      <div 
        ref={mountRef} 
        className="w-full h-[420px] sm:h-[480px] lg:h-[520px] cursor-grab active:cursor-grabbing"
      />

      {/* Active Component Feature Overlay (Subtle, Top Left) */}
      {activeHighlight && (
        <div className="absolute top-16 left-4 z-20 bg-blue-950/80 border border-blue-600/40 px-3 py-1.5 rounded-xl text-xs text-blue-200 backdrop-blur-md shadow-lg animate-fadeIn">
          <span className="font-semibold">{activeHighlight}</span>
        </div>
      )}

      {/* Bottom Collapsible Control Dock (Per Three.js Constitution) */}
      <div className="absolute bottom-4 inset-x-4 z-20 flex flex-col items-center">
        
        {/* Collapse / Expand Toggle Button */}
        <button
          onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}
          className="mb-2 px-3 py-1 rounded-full bg-[#081426]/90 hover:bg-[#0c1f3d] border border-slate-700 text-slate-300 hover:text-white text-[11px] font-medium backdrop-blur-md flex items-center gap-1.5 shadow transition-all"
          title={isControlsCollapsed ? 'Mostrar controles' : 'Ocultar controles'}
        >
          {isControlsCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Ver controles do 3D</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Ocultar controles</span>
            </>
          )}
        </button>

        {/* Horizontal Control Dock */}
        {!isControlsCollapsed && (
          <div className="w-full max-w-[820px] bg-[#081426]/95 border border-blue-900/60 rounded-2xl p-2.5 sm:p-3 backdrop-blur-xl shadow-2xl flex flex-wrap items-center justify-between gap-2.5">
            
            {/* Camera Angle Presets */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleSetView('perspective')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeView === 'perspective'
                    ? 'bg-[#145CFF] text-white shadow-md'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Perspectiva</span>
              </button>

              <button
                onClick={() => handleSetView('front')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeView === 'front'
                    ? 'bg-[#145CFF] text-white shadow-md'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Roda Frontal</span>
              </button>

              <button
                onClick={() => handleSetView('brakes')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeView === 'brakes'
                    ? 'bg-[#145CFF] text-white shadow-md'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                <span>Freio & Pinça</span>
              </button>
            </div>

            {/* Quick Actions: Auto-rotate & Reset */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsRotating(!isRotating)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  isRotating 
                    ? 'bg-blue-950/70 border-blue-700/60 text-blue-300' 
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
                title="Pausar ou retomar rotação automática"
              >
                {isRotating ? 'Giro Ativo' : 'Giro Pausado'}
              </button>

              <button
                onClick={handleResetRotation}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all shadow"
                title="Redefinir visualização"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {onOpenQuoteWithService && (
                <button
                  onClick={() => onOpenQuoteWithService('Alinhamento e Freios')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#145CFF] hover:bg-blue-600 text-white shadow-md hover:-translate-y-0.5 transition-all"
                >
                  Orçar este serviço
                </button>
              )}
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
