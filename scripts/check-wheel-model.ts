import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createWheelAssembly } from '../src/three/wheelAssembly';

// Geometry-only checks: no GPU or rendering context is required.
Object.defineProperty(globalThis,'document',{value:{createElement:()=>({width:0,height:0,getContext:()=>null})},configurable:true});
const {root,wheel,brake}=createWheelAssembly();
assert.equal(root.children.length,2,'wheel and brake must be separate assemblies');
let meshes=0;let holes=0;let instances=0;
root.traverse(object=>{
  if(!(object instanceof THREE.Mesh))return;
  meshes++;
  const positions=object.geometry.getAttribute('position');
  for(const coordinate of positions.array)assert.ok(Number.isFinite(coordinate),'geometry must have finite coordinates');
  const normals=object.geometry.getAttribute('normal');
  if(normals)for(const value of normals.array)assert.ok(Number.isFinite(value),'geometry must have finite normals');
  if(object instanceof THREE.InstancedMesh)instances+=object.count;
  if(object.geometry instanceof THREE.ExtrudeGeometry) {
    const shape=object.geometry.parameters.shapes as THREE.Shape;
    holes=Math.max(holes,shape.holes.length);
  }
});
assert.ok(meshes>100,'assembly includes mechanical details');
assert.equal(instances,420,'tread has 420 instanced blocks');
assert.equal(holes,73,'rotor has 72 through-holes plus central opening');
const bounds=new THREE.Box3().setFromObject(root);
const size=bounds.getSize(new THREE.Vector3());
assert.ok(size.x>2.9&&size.x<3.1,'tire diameter must match the cross section');
assert.ok(size.z>.7&&size.z<1,'tire width must match the cross section');
const originalBrake=brake.position.clone();
wheel.position.x=2.65;
assert.ok(brake.position.equals(originalBrake),'separating the wheel must keep brakes in place');
assert.ok(new THREE.Box3().setFromObject(wheel).min.x>new THREE.Box3().setFromObject(brake).max.x,'inspection view must expose the brake assembly');
console.log(`Wheel geometry passed: ${meshes} meshes, ${instances} tread blocks, ${holes} rotor openings, dimensions ${size.toArray().map(v=>v.toFixed(3)).join(' × ')}.`);
