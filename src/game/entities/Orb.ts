import * as THREE from 'three';

/**
 * Orb - A reactive 3D sphere that responds to audio input
 * Features soft-body-like deformation and emissive pulsing effects
 */
export class Orb {
  private readonly mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>;
  private readonly originalScale: number = 1.0;
  private rotationSpeed: number = 0.5;
  private pulseIntensity: number = 0.5;

  constructor(scene: THREE.Scene) {
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ffcc,
      emissive: 0x00ffcc,
      emissiveIntensity: 0.1,
      roughness: 0.2,
      metalness: 0.8,
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 2, 0);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    
    scene.add(this.mesh);
  }

  /**
   * Update the orb based on time and audio intensity
   * @param elapsedTime - Time elapsed since start in seconds
   * @param intensity - Normalized audio intensity (0-1)
   */
  public update(elapsedTime: number, intensity: number): void {
    // Scale based on intensity with smooth interpolation
    const targetScale = this.originalScale + intensity * this.pulseIntensity;
    this.mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    
    // Pulsing emissive intensity synced to audio
    this.mesh.material.emissiveIntensity = 0.1 + intensity * 0.9;
    
    // Continuous rotation with subtle wobble
    this.mesh.rotation.y = elapsedTime * this.rotationSpeed;
    this.mesh.rotation.x = Math.sin(elapsedTime * 0.3) * 0.2;
    this.mesh.rotation.z = Math.cos(elapsedTime * 0.5) * 0.1;
  }

  /**
   * Get the underlying mesh for external manipulation
   */
  public getMesh(): THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial> {
    return this.mesh;
  }

  /**
   * Change the orb's base color
   * @param color - New color as hex value
   */
  public setColor(color: number): void {
    this.mesh.material.color.setHex(color);
    this.mesh.material.emissive.setHex(color);
  }

  /**
   * Set the orb's rotation speed
   * @param speed - Rotation speed multiplier
   */
  public setRotationSpeed(speed: number): void {
    this.rotationSpeed = Math.max(0, speed);
  }

  /**
   * Set how much the orb pulses with audio
   * @param intensity - Pulse intensity multiplier (0-1)
   */
  public setPulseIntensity(intensity: number): void {
    this.pulseIntensity = THREE.MathUtils.clamp(intensity, 0, 1);
  }

  /**
   * Make the orb jump upward
   * @param force - Jump force magnitude
   */
  public jump(force: number = 0.5): void {
    const currentY = this.mesh.position.y;
    const targetY = currentY + force;
    this.mesh.position.y = Math.min(targetY, 5);
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.mesh.removeFromParent();
  }
}
