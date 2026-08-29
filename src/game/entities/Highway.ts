import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d';

const vertexShader = `
  varying vec2 vUv;
  varying float vHeight;
  uniform float uTime;
  uniform float uAudioIntensity;

  float noise(vec3 p) {
    return sin(p.x * 10.0 + uTime) * cos(p.y * 10.0 + uTime) * sin(p.z * 10.0 + uTime);
  }

  void main() {
    vUv = uv;
    float height = noise(position) * uAudioIntensity * 2.0;
    vHeight = height;
    vec3 newPosition = position + normal * height;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  varying float vHeight;
  uniform vec3 uColor;

  void main() {
    float colorMod = vHeight * 0.5 + 0.5;
    vec3 finalColor = mix(uColor, vec3(1.0), colorMod);
    gl_FragColor = vec4(finalColor, 0.8);
  }
`;

export class Highway {
    private mesh: THREE.Mesh;
    private material: THREE.ShaderMaterial;
    private uTime: THREE.Uniform<number>;
    private uAudioIntensity: THREE.Uniform<number>;
    private uColor: THREE.Uniform<THREE.Color>;

    constructor(scene: THREE.Scene, world: RAPIER.World) {
        const geometry = new THREE.PlaneGeometry(20, 100, 100, 100);
        
        this.uTime = new THREE.Uniform(0);
        this.uAudioIntensity = new THREE.Uniform(0);
        this.uColor = new THREE.Uniform(new THREE.Color(0x333333));

        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            transparent: true,
            uniforms: {
                uTime: this.uTime,
                uAudioIntensity: this.uAudioIntensity,
                uColor: this.uColor
            }
        });

        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.z = -40;
        scene.add(this.mesh);

        // Physics ground
        let rbDesc = RAPIER.RigidBodyDesc.fixed()
            .setTranslation(0.0, -1.0, -40.0);
        let rb = world.createRigidBody(rbDesc);
        let colliderDesc = RAPIER.ColliderDesc.cuboid(10.0, 0.5, 50.0);
        world.createCollider(colliderDesc, rb);
    }

    public getMesh(): THREE.Mesh {
        return this.mesh;
    }

    public update(time: number, audioIntensity: number) {
        this.uTime.value = time;
        this.uAudioIntensity.value = audioIntensity;
    }
}
