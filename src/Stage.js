

export class Stage {
  constructor() {
    const geometry = new THREE.PlaneGeometry(100, 100, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0x222222,
      side: THREE.DoubleSide,
      roughness: 0.9,
      metalness: 0.1
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.x = -Math.PI / 2;
  }

  update(bass, mid, treble) {
    const waveHeight = (mid / 255) * 2;
    this.mesh.scale.y = 1 + waveHeight;
  }
}
