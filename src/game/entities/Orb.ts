import * as THREE from 'three';

const vertexShader = `
  varying vec2 vUv;
  varying float vDisplacement;
  uniform float uTime;
  uniform float uAudioIntensity;

  // Classic Perlin noise or similar would be better, but let's start with sine waves
  float noise(vec3 p) {
    return sin(p.x * 10.0 + uTime) * cos(p.y * 10.0 + uTime) * sin(p.z * 10.0 + uTime);
  }

  void main() {
    vUv = uv;
    vDisplacement = noise(position) * uAudioIntensity;
    vec3 newPosition = position + normal * vDisplacement;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  varying float vDisplacement;
  uniform vec3 uColor;
  uniform float uAudioIntensity;

  void main() {
    float colorStrength = clamp(vDisplacement * 2.0 + uAudioIntensity, 0.0, 1.0);
    vec3 finalColor = mix(uColor, vec3(1.0, 1.0, 1.0), colorStrength);
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export class Orb {
    private mesh: THREE.Mesh;
    private material: THREE.ShaderMaterial;
    private uTime: THREE.Uniform<number>;
    private uAudioIntensity: THREE.Uniform<number>;
    private uColor: THREE.Uniform<THREE.Color>;

    constructor(scene: THREE.Scene, world: RAPIER.World) {
        const geometry = new THREE.SphereGeometry(1, 64, 64);
        
        this.uTime = new THREE.Uniform(0);
        this.uAudioIntensity = new THREE.Uniform(0);
        this.uColor = new THREE.Uniform(new THREE.Color(0x00ffff));

        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: this.uTime,
                uAudioIntensity: this.uAudioIntensity,
                uColor: this.uColor
            }
        });

        this.mesh = new THREE.Mesh(geometry, this.material);
        scene.add(this.mesh);

        // Physics body
        let rbDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(0.0, 5.0, 0.0)
            .setCanSleep(false);
        this.rigidBody = world.createRigidBody(rbDesc);

        let colliderDesc = RAPIER.ColliderDesc.ball(1.0);
        world.createCollider(colliderDesc, this.rigidBody);
    }

    public getMesh(): THREE.Mesh {
        return this.mesh;
    }

    public getRigidBody(): RAPIER.RigidBody {
        return this.rigidBody;
    }

    public update(time: number, audioIntensity: number) {
        this.uTime.value = time;
        this.uAudioIntensity.value = audioIntensity;

        // Update mesh position from rigid body
        const translation = this.rigidBody.translation();
        this.mesh.position.set(translation.x, translation.y, translation.z);
    }

    public setColor(color: THREE.Color) {
        this.uColor.value.copy(color);
    }
}
