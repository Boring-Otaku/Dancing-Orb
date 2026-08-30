import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d';

/**
 * Vertex shader for the reactive highway
 * Uses simplex noise to create wave-like deformations based on audio
 */
const vertexShader = `
  varying vec2 vUv;
  varying float vHeight;
  uniform float uTime;
  uniform float uAudioIntensity;

  // Simplex noise function for procedural terrain generation
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
      + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
      dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vUv = uv;
    float noiseVal = snoise(position.xz * 0.1 + vec2(0.0, uTime * 0.5));
    float height = noiseVal * uAudioIntensity * 2.0;
    vHeight = height;
    vec3 newPosition = position + normal * height;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

/**
 * Fragment shader for the highway material
 * Colors the highway based on vertex height and audio intensity
 */
const fragmentShader = `
  varying vec2 vUv;
  varying float vHeight;
  uniform vec3 uColor;
  uniform float uAudioIntensity;

  void main() {
    float colorMod = vHeight * 0.5 + 0.5;
    vec3 finalColor = mix(uColor, vec3(1.0), colorMod * uAudioIntensity);
    float alpha = 0.7 + uAudioIntensity * 0.3;
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

/**
 * Highway - A reactive highway/road that responds to audio
 * Uses custom GLSL shaders for real-time visual effects
 */
export class Highway {
  private readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private readonly uTime: THREE.Uniform<number>;
  private readonly uAudioIntensity: THREE.Uniform<number>;
  private readonly uColor: THREE.Uniform<THREE.Color>;
  private readonly physicsWorld: RAPIER.World;
  private groundBody: RAPIER.RigidBody | null = null;

  constructor(scene: THREE.Scene, world: RAPIER.World) {
    this.physicsWorld = world;

    const geometry = new THREE.PlaneGeometry(20, 100, 100, 100);

    this.uTime = new THREE.Uniform(0);
    this.uAudioIntensity = new THREE.Uniform(0);
    this.uColor = new THREE.Uniform(new THREE.Color(0x333333));

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      uniforms: {
        uTime: this.uTime,
        uAudioIntensity: this.uAudioIntensity,
        uColor: this.uColor,
      },
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.z = -40;
    this.mesh.receiveShadow = true;
    
    scene.add(this.mesh);

    // Create physics ground collider
    this.createGroundCollider();
  }

  /**
   * Create a static physics collider for the ground
   */
  private createGroundCollider(): void {
    try {
      const rbDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(0.0, -1.0, -40.0);
      this.groundBody = this.physicsWorld.createRigidBody(rbDesc);
      const colliderDesc = RAPIER.ColliderDesc.cuboid(10.0, 0.5, 50.0);
      this.physicsWorld.createCollider(colliderDesc, this.groundBody);
    } catch (error) {
      console.warn('Failed to create ground collider:', error);
    }
  }

  /**
   * Update the highway based on time and audio intensity
   * @param time - Elapsed time in seconds
   * @param audioIntensity - Normalized audio intensity (0-1)
   */
  public update(time: number, audioIntensity: number): void {
    this.uTime.value = time;
    this.uAudioIntensity.value = THREE.MathUtils.clamp(audioIntensity, 0, 1);
  }

  /**
   * Get the underlying mesh for external manipulation
   */
  public getMesh(): THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> {
    return this.mesh;
  }

  /**
   * Change the highway's base color
   * @param color - New color as hex value
   */
  public setColor(color: number): void {
    this.uColor.value.setHex(color);
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.mesh.removeFromParent();
    
    // Note: Physics cleanup would require access to world methods
    this.groundBody = null;
  }
}
