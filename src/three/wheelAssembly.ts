import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/** Illustrative 225/45 R18 assembly. Axle is Z; dimensions are relative. */
export function createWheelAssembly() {
  const root = new THREE.Group();
  const wheel = new THREE.Group();
  const brake = new THREE.Group();
  root.add(wheel, brake);
  const rubber = new THREE.MeshStandardMaterial({ color: '#17191c', roughness: .94, metalness: 0 });
  const treadMaterial = new THREE.MeshStandardMaterial({ color: '#202226', roughness: .92 });
  const aluminum = new THREE.MeshPhysicalMaterial({ color: '#b9c1ca', metalness: 1, roughness: .26, clearcoat: .18 });
  const graphite = new THREE.MeshStandardMaterial({ color: '#323840', metalness: .85, roughness: .34 });
  const steel = new THREE.MeshStandardMaterial({ color: '#a4a7aa', metalness: 1, roughness: .43 });
  const dark = new THREE.MeshStandardMaterial({ color: '#202328', metalness: .7, roughness: .5 });
  const paint = new THREE.MeshPhysicalMaterial({ color: '#a8241e', metalness: .35, roughness: .29, clearcoat: .7, clearcoatRoughness: .2 });
  const boltMaterial = new THREE.MeshStandardMaterial({ color: '#acafb6', metalness: 1, roughness: .22 });

  function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, parent: THREE.Object3D, x=0, y=0, z=0) {
    const obj = new THREE.Mesh(geo, mat);
    obj.position.set(x,y,z); obj.castShadow = true; obj.receiveShadow = true; parent.add(obj); return obj;
  }
  function cylinder(radius: number, length: number, material: THREE.Material, parent: THREE.Object3D, z: number, segments=80) {
    const obj = mesh(new THREE.CylinderGeometry(radius,radius,length,segments), material,parent,0,0,z);
    obj.rotation.x = Math.PI/2; return obj;
  }
  function ring(radius: number, tube: number, parent: THREE.Object3D, material: THREE.Material, z: number) {
    return mesh(new THREE.TorusGeometry(radius,tube,12,112),material,parent,0,0,z);
  }

  // Lathed cross section: flatter tread crown, rounded shoulder, sidewall and bead.
  const tireProfile = [
    [.965,-.29],[1.02,-.36],[1.18,-.40],[1.34,-.38],[1.43,-.31],
    [1.47,-.24],[1.48,-.15],[1.485,0],[1.48,.15],[1.47,.24],
    [1.43,.31],[1.34,.38],[1.18,.40],[1.02,.36],[.965,.29],[.965,-.29],
  ].map(([r,z])=>new THREE.Vector2(r,z));
  const tire = mesh(new THREE.LatheGeometry(new THREE.SplineCurve(tireProfile).getPoints(96),128),rubber,wheel);
  tire.rotation.x = Math.PI/2;
  [-1,1].forEach(side => {
    ring(1.05,.012,wheel,rubber,side*.368);
    ring(1.32,.008,wheel,treadMaterial,side*.383);
  });

  // Individual tread blocks with longitudinal channels and alternating shoulder cuts.
  const treadGeo = new RoundedBoxGeometry(.088,.022,.108,1,.007);
  const blocks = new THREE.InstancedMesh(treadGeo,treadMaterial,84*5);
  blocks.castShadow = true; blocks.receiveShadow = true;
  const dummy = new THREE.Object3D();
  for(let row=0;row<5;row++) for(let i=0;i<84;i++) {
    const a=(i+(row%2)*.5)*Math.PI*2/84;
    const z=(row-2)*.126;
    const radius=1.477 - Math.abs(row-2)*.006;
    dummy.position.set(Math.sin(a)*radius,Math.cos(a)*radius,z);
    dummy.rotation.set(0,0,-a);
    dummy.rotateY((row<2 ? 1 : -1)*.18);
    dummy.updateMatrix(); blocks.setMatrixAt(row*84+i,dummy.matrix);
  }
  wheel.add(blocks);

  // Raised sidewall markings without invented manufacturer branding.
  const labelCanvas = document.createElement('canvas'); labelCanvas.width=1024; labelCanvas.height=1024;
  const ctx = labelCanvas.getContext('2d');
  if(ctx) {
    ctx.translate(512,512); ctx.fillStyle='#626468';
    function arcText(text:string, radius:number, start:number, step:number) {
      [...text].forEach((char,i)=>{ctx!.save();ctx!.rotate(start+i*step);ctx!.translate(0,-radius);ctx!.font='bold 26px Arial';ctx!.textAlign='center';ctx!.fillText(char,0,0);ctx!.restore();});
    }
    arcText('225 / 45 R18',422,-.45,.077);
    arcText('RADIAL · TUBELESS',422,2.55,.06);
    arcText('ROTATION  ›',422,1.05,.06);
  }
  const lettering = new THREE.CanvasTexture(labelCanvas); lettering.colorSpace=THREE.SRGBColorSpace;
  const letteringMat = new THREE.MeshStandardMaterial({map:lettering,transparent:true,roughness:.98,polygonOffset:true,polygonOffsetFactor:-1});
  mesh(new THREE.PlaneGeometry(2.96,2.96),letteringMat,wheel,0,0,.404);

  const barrel = mesh(new THREE.CylinderGeometry(.985,.985,.59,96,1,true),graphite,wheel);
  barrel.rotation.x=Math.PI/2; graphite.side=THREE.DoubleSide;
  ring(.984,.031,wheel,aluminum,.332); ring(.974,.016,wheel,aluminum,.295);
  ring(.974,.026,wheel,graphite,-.28);
  cylinder(.29,.17,graphite,wheel,.285);
  cylinder(.135,.035,aluminum,wheel,.394);
  ring(.14,.009,wheel,graphite,.413);

  // Tapered, swept and beveled split spokes; machined faces over darker pockets.
  for(let i=0;i<5;i++) for(const side of [-1,1]) {
    const shape = new THREE.Shape();
    shape.moveTo(side*.055,.22); shape.lineTo(side*.105,.30);
    shape.lineTo(side*.24,.93); shape.lineTo(side*.145,.958);
    shape.lineTo(side*.038,.39); shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape,{depth:.072,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.014,bevelThickness:.015,curveSegments:8});
    const spoke=mesh(geometry,aluminum,wheel,0,0,.252);spoke.rotation.z=i*Math.PI*2/5;
  }
  for(let i=0;i<5;i++) {
    const a=i*Math.PI*2/5;
    const socket=cylinder(.055,.045,dark,wheel,.377,32);socket.position.x=Math.sin(a)*.218;socket.position.y=Math.cos(a)*.218;
    const bolt=cylinder(.034,.04,boltMaterial,wheel,.408,6);bolt.position.x=socket.position.x;bolt.position.y=socket.position.y;
  }
  const valve=cylinder(.018,.09,rubber,wheel,.29,12);valve.position.set(.52,.78,.29);valve.rotation.x=.65;

  // Rotor uses real through-holes and two friction plates separated by cooling vanes.
  const discShape = new THREE.Shape(); discShape.absarc(0,0,.79,0,Math.PI*2,false);
  const centerHole = new THREE.Path(); centerHole.absarc(0,0,.32,0,Math.PI*2,true);discShape.holes.push(centerHole);
  for(let row=0;row<3;row++) for(let i=0;i<24;i++) {
    const a=(i+row*.25)*Math.PI*2/24; const r=.48+row*.105;
    const hole=new THREE.Path();hole.absarc(Math.cos(a)*r,Math.sin(a)*r,.014,0,Math.PI*2,true);discShape.holes.push(hole);
  }
  const discGeo=new THREE.ExtrudeGeometry(discShape,{depth:.023,bevelEnabled:false,curveSegments:96});
  mesh(discGeo,steel,brake,0,0,-.11);mesh(discGeo,steel,brake,0,0,-.025);
  const vaneGeo=new THREE.BoxGeometry(.32,.012,.065);
  for(let i=0;i<42;i++) { const a=i*Math.PI*2/42;const vane=mesh(vaneGeo,dark,brake,Math.cos(a)*.57,Math.sin(a)*.57,-.055);vane.rotation.z=a+.15; }
  cylinder(.33,.14,graphite,brake,-.055);
  cylinder(.16,.18,boltMaterial,brake,-.045);
  for(let i=0;i<5;i++) {const a=i*Math.PI*2/5;const b=cylinder(.022,.027,boltMaterial,brake,.031,6); b.position.set(Math.sin(a)*.265,Math.cos(a)*.265,.031);}
  // Fine concentric machining marks on the braking surface.
  for(let i=0;i<14;i++) ring(.37+i*.029,.0009,brake,i%2?steel:graphite,.0005);

  const caliper = new THREE.Group(); caliper.position.set(.69,.08,-.04);caliper.rotation.z=-.12;brake.add(caliper);
  mesh(new RoundedBoxGeometry(.25,.74,.22,4,.07),paint,caliper,.015,0,.055);
  mesh(new RoundedBoxGeometry(.29,.18,.26,3,.04),paint,caliper,-.035,.24,-.035);
  mesh(new RoundedBoxGeometry(.29,.18,.26,3,.04),paint,caliper,-.035,-.24,-.035);
  for(const y of [-.19,.19]) {
    const housing=cylinder(.088,.026,paint,caliper,.178,40);housing.position.set(.015,y,.178);
    const fastener=cylinder(.022,.025,boltMaterial,caliper,.2,6);fastener.position.set(.015,y,.2);
  }
  mesh(new THREE.BoxGeometry(.055,.48,.012),aluminum,caliper,-.105,0,.18);
  const hoseCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(.67,.4,-.15),new THREE.Vector3(.5,.69,-.24),new THREE.Vector3(.2,.75,-.36)]);
  mesh(new THREE.TubeGeometry(hoseCurve,24,.016,8,false),rubber,brake);
  return {root,wheel,brake};
}
