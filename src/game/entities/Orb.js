import * as THREE from 'three';
export class Orb {
  constructor(scene) {
    this.scene = scene;
    const geometry = new THREE.SphereGeometry(2, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff00ff,
      emissive: 0xff00ff,
      emissiveIntensity: 0.1,
      roughness: 0.2,
      metalness: 0.8,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);
  }

  update(volume) {
    const scale = 1 + volume * 2;
    this.mesh.scale.set(scale, scale, scale);
    this.mesh.material.emissiveIntensity = 0.1 + volume * 0.9;
  }
}

