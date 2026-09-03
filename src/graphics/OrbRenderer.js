import * as THREE from 'three';
import { OrbVertexShader, OrbFragmentShader } from './Shaders.js';

export class OrbRenderer {
  constructor(scene) {
    this.scene = scene;

    // High subdivision Icosahedron for smooth fluid displacement
    this.geometry = new THREE.IcosahedronGeometry(1.0, 5);

    this.material = new THREE.ShaderMaterial({
      vertexShader: OrbVertexShader,
      fragmentShader: OrbFragmentShader,
      uniforms: {
        u_time: { value: 0 },
        u_bass: { value: 0 },
        u_mid: { value: 0 },
        u_treble: { value: 0 },
        u_wobble: { value: 0 },
        u_scale: { value: new THREE.Vector3(1, 1, 1) },
        u_splitProgress: { value: 0 },
        u_fever: { value: 0 },
        u_baseColor: { value: new THREE.Color(0x00f3ff) }, // Neon cyan
        u_glowColor: { value: new THREE.Color(0xff0077) }  // Hot magenta
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);

    // Inner glowing energetic sphere core
    const coreGeo = new THREE.SphereGeometry(0.55, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95
    });
    this.coreMesh = new THREE.Mesh(coreGeo, coreMat);
    this.mesh.add(this.coreMesh);

    // Dynamic point light cast by the orb
    this.light = new THREE.PointLight(0x00f3ff, 3.5, 12);
    this.mesh.add(this.light);
  }

  update(time, playerOrb, audioData, feverProgress) {
    // Sync position & rotation
    this.mesh.position.copy(playerOrb.position);
    this.mesh.rotation.copy(playerOrb.rotation);

    // Update uniform values
    this.material.uniforms.u_time.value = time;
    this.material.uniforms.u_bass.value = audioData.bass || 0;
    this.material.uniforms.u_mid.value = audioData.mid || 0;
    this.material.uniforms.u_treble.value = audioData.treble || 0;
    this.material.uniforms.u_wobble.value = playerOrb.physics.wobbleIntensity;
    this.material.uniforms.u_scale.value.set(
      playerOrb.physics.scale.x,
      playerOrb.physics.scale.y,
      playerOrb.physics.scale.z
    );
    this.material.uniforms.u_splitProgress.value = playerOrb.physics.splitProgress;
    this.material.uniforms.u_fever.value = feverProgress;

    // Core pulsing scale
    const coreScale = 0.55 + (audioData.bass || 0) * 0.25;
    this.coreMesh.scale.set(coreScale, coreScale, coreScale);

    // Fever mode light color shift
    if (feverProgress > 0.01) {
      this.light.color.setHSL((time * 0.5) % 1, 1, 0.6);
      this.light.intensity = 5.0 + feverProgress * 4.0;
    } else {
      this.light.color.setHex(0x00f3ff);
      this.light.intensity = 3.5 + (audioData.bass || 0) * 3.0;
    }
  }
}
