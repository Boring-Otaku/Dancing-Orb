

export class Orb {
  constructor() {
    const geometry = new THREE.SphereGeometry(2, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ffcc,
      metalness: 0.5,
      roughness: 0.2
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 1, 0);
    // Store original scale for morphing reference
    this.originalScale = 1.0;
  }

  update(bass, mid, treble) {
    const scale = 1 + (bass / 255) * 0.5; // 1.0-1.5
    this.mesh.scale.set(scale, scale, scale);
    // Color change based on mid
    const hue = (mid / 255) * 0.5 + 0.1; // slight variation
    this.mesh.material.color.setHSL(hue, 0.8, 0.6);
  }
}
