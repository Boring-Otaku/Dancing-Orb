import * as THREE from 'three';
import { HighwayVertexShader, HighwayFragmentShader, KaleidoscopeTunnelShader } from './Shaders.js';

export class Highway {
  constructor(scene) {
    this.scene = scene;

    this.segmentLength = 300.0;
    this.trackWidth = 8.5;
    this.numSegments = 3; // 3 looping chunks for infinite scrolling

    // Parametric ribbon plane (X = width, Y = length forward, Z = height)
    // Subdivided vertices: 64 wide x 240 long for audio vertex displacement
    this.geometry = new THREE.PlaneGeometry(this.trackWidth, this.segmentLength, 64, 240);
    this.geometry.rotateX(-Math.PI / 2); // Lay flat on X-Z plane

    this.material = new THREE.ShaderMaterial({
      vertexShader: HighwayVertexShader,
      fragmentShader: HighwayFragmentShader,
      uniforms: {
        u_time: { value: 0 },
        u_speed: { value: 28.0 },
        u_bass: { value: 0 },
        u_mid: { value: 0 },
        u_treble: { value: 0 },
        u_curvature: { value: 0 },
        u_fever: { value: 0 }
      },
      transparent: true,
      side: THREE.DoubleSide
    });

    this.segments = [];
    for (let i = 0; i < this.numSegments; i++) {
      const mesh = new THREE.Mesh(this.geometry, this.material);
      mesh.position.z = -i * this.segmentLength;
      this.scene.add(mesh);
      this.segments.push(mesh);
    }

    // Fever Phase Kaleidoscope Tunnel (Cylinder surrounding track)
    const tunnelGeo = new THREE.CylinderGeometry(18, 18, this.segmentLength * 2, 32, 1, true);
    tunnelGeo.rotateX(Math.PI / 2);

    this.tunnelMaterial = new THREE.ShaderMaterial({
      vertexShader: /* glsl */`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: KaleidoscopeTunnelShader,
      uniforms: {
        u_time: { value: 0 },
        u_speed: { value: 28.0 },
        u_fever: { value: 0 },
        u_bass: { value: 0 },
        u_treble: { value: 0 }
      },
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.tunnelMesh = new THREE.Mesh(tunnelGeo, this.tunnelMaterial);
    this.tunnelMesh.visible = false;
    this.scene.add(this.tunnelMesh);

    // Neon Track Guard Rails (instanced side pylons)
    this.createGuardRails();
  }

  createGuardRails() {
    this.railGroup = new THREE.Group();
    const pylonGeo = new THREE.BoxGeometry(0.15, 1.5, 0.15);
    const pylonMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });

    this.pylons = [];
    const count = 80;
    for (let i = 0; i < count; i++) {
      const pLeft = new THREE.Mesh(pylonGeo, pylonMat);
      const pRight = new THREE.Mesh(pylonGeo, pylonMat);
      pLeft.position.set(-this.trackWidth / 2, 0.75, -i * 10);
      pRight.position.set(this.trackWidth / 2, 0.75, -i * 10);
      this.railGroup.add(pLeft);
      this.railGroup.add(pRight);
      this.pylons.push(pLeft, pRight);
    }
    this.scene.add(this.railGroup);
  }

  update(time, playerZ, speed, audioData, feverProgress) {
    // 1. Update shader uniforms
    this.material.uniforms.u_time.value = time;
    this.material.uniforms.u_speed.value = speed;
    this.material.uniforms.u_bass.value = audioData.bass || 0;
    this.material.uniforms.u_mid.value = audioData.mid || 0;
    this.material.uniforms.u_treble.value = audioData.treble || 0;
    this.material.uniforms.u_fever.value = feverProgress;

    // 2. Loop highway ribbon segments as player travels forward (negative Z)
    this.segments.forEach(mesh => {
      // If segment is behind player by segmentLength, shift forward
      if (mesh.position.z > playerZ + this.segmentLength * 0.7) {
        mesh.position.z -= this.segmentLength * this.numSegments;
      }
    });

    // 3. Fever kaleidoscope tunnel position & uniforms
    if (feverProgress > 0.01) {
      this.tunnelMesh.visible = true;
      this.tunnelMesh.position.z = playerZ - 50;
      this.tunnelMaterial.uniforms.u_time.value = time;
      this.tunnelMaterial.uniforms.u_speed.value = speed;
      this.tunnelMaterial.uniforms.u_fever.value = feverProgress;
      this.tunnelMaterial.uniforms.u_bass.value = audioData.bass || 0;
      this.tunnelMaterial.uniforms.u_treble.value = audioData.treble || 0;
    } else {
      this.tunnelMesh.visible = false;
    }

    // 4. Reposition guard rail pylons
    this.pylons.forEach(p => {
      if (p.position.z > playerZ + 20) {
        p.position.z -= 80 * 10;
      }
    });
  }
}
