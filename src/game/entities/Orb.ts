import * as THREE from 'three';

export class Orb {
  private mesh: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ffcc });
    this.mesh = new THREE.Mesh(geometry, material);
    scene.add(this.mesh);
  }

  public update(volume: number) {
    const wobble = Math.sin(Date.now() * 0.001) * 0.1 * volume;
    this.mesh.scale.set(1 + wobble, 1 + wobble * 0.8, 1 + wobble);
  }
}
