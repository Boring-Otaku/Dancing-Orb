import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;

    // 1. Prismatic Burst Particles (Hit feedback)
    this.maxBursts = 500;
    this.burstGeo = new THREE.BufferGeometry();
    this.burstPos = new Float32Array(this.maxBursts * 3);
    this.burstVel = new Float32Array(this.maxBursts * 3);
    this.burstCol = new Float32Array(this.maxBursts * 3);
    this.burstLife = new Float32Array(this.maxBursts); // [0, 1]

    this.burstGeo.setAttribute('position', new THREE.BufferAttribute(this.burstPos, 3));
    this.burstGeo.setAttribute('color', new THREE.BufferAttribute(this.burstCol, 3));

    this.burstMat = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });

    this.burstMesh = new THREE.Points(this.burstGeo, this.burstMat);
    this.scene.add(this.burstMesh);

    // 2. Hypersonic Speed Streaks (Tunnel / Fever effect)
    this.streakCount = 300;
    this.streakGeo = new THREE.BufferGeometry();
    const streakPositions = new Float32Array(this.streakCount * 3);
    for (let i = 0; i < this.streakCount; i++) {
      streakPositions[i * 3 + 0] = (Math.random() - 0.5) * 35;
      streakPositions[i * 3 + 1] = (Math.random() - 0.5) * 20 + 5;
      streakPositions[i * 3 + 2] = -Math.random() * 250;
    }
    this.streakGeo.setAttribute('position', new THREE.BufferAttribute(streakPositions, 3));

    this.streakMat = new THREE.PointsMaterial({
      color: 0x00f3ff,
      size: 0.35,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    this.streakMesh = new THREE.Points(this.streakGeo, this.streakMat);
    this.scene.add(this.streakMesh);
  }

  // Trigger burst at world point with custom color
  emitBurst(origin, count = 35, colorHex = 0x00f3ff) {
    const col = new THREE.Color(colorHex);
    let spawned = 0;

    for (let i = 0; i < this.maxBursts && spawned < count; i++) {
      if (this.burstLife[i] <= 0) {
        // Set position
        this.burstPos[i * 3 + 0] = origin.x;
        this.burstPos[i * 3 + 1] = origin.y;
        this.burstPos[i * 3 + 2] = origin.z;

        // Set explosion velocity
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const speed = 8.0 + Math.random() * 12.0;

        this.burstVel[i * 3 + 0] = Math.sin(phi) * Math.cos(theta) * speed;
        this.burstVel[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed + 2.0;
        this.burstVel[i * 3 + 2] = Math.cos(phi) * speed;

        // Colors
        this.burstCol[i * 3 + 0] = col.r + (Math.random() - 0.5) * 0.2;
        this.burstCol[i * 3 + 1] = col.g + (Math.random() - 0.5) * 0.2;
        this.burstCol[i * 3 + 2] = col.b + (Math.random() - 0.5) * 0.2;

        this.burstLife[i] = 1.0;
        spawned++;
      }
    }

    this.burstGeo.attributes.position.needsUpdate = true;
    this.burstGeo.attributes.color.needsUpdate = true;
  }

  update(dt, playerZ, speed, isFever = false) {
    // 1. Update active burst particles
    let activeAny = false;
    for (let i = 0; i < this.maxBursts; i++) {
      if (this.burstLife[i] > 0) {
        activeAny = true;
        this.burstLife[i] -= dt * 1.8;

        this.burstPos[i * 3 + 0] += this.burstVel[i * 3 + 0] * dt;
        this.burstPos[i * 3 + 1] += this.burstVel[i * 3 + 1] * dt;
        this.burstPos[i * 3 + 2] += this.burstVel[i * 3 + 2] * dt;

        // Gravity pull
        this.burstVel[i * 3 + 1] -= 9.8 * dt;

        if (this.burstLife[i] <= 0) {
          this.burstLife[i] = 0;
          this.burstPos[i * 3 + 1] = -999;
        }
      }
    }
    if (activeAny) {
      this.burstGeo.attributes.position.needsUpdate = true;
    }

    // 2. Update speed streaks relative to player
    const posArr = this.streakGeo.attributes.position.array;
    for (let i = 0; i < this.streakCount; i++) {
      // Loop streaks ahead of player
      if (posArr[i * 3 + 2] > playerZ + 20) {
        posArr[i * 3 + 2] = playerZ - 200 - Math.random() * 50;
      }
    }
    this.streakGeo.attributes.position.needsUpdate = true;

    // Intensify streaks in Fever mode
    if (isFever) {
      this.streakMat.color.setHex(0xffff00);
      this.streakMat.size = 0.65;
    } else {
      this.streakMat.color.setHex(0x00f3ff);
      this.streakMat.size = 0.35;
    }
  }
}
