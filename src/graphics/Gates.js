import * as THREE from 'three';

// Gate Types:
// 1. 'SQUASH': Horizontal low bar / ramp that requires Squash-Bounce jump
// 2. 'TILT_L': Slanted left bank gate that requires Tilt-Spin Left
// 3. 'TILT_R': Slanted right bank gate that requires Tilt-Spin Right
// 4. 'SPLIT': Dual vertical narrow channel requiring Split-Snap bilateral morph
// 5. 'FEVER_RING': Hypersonic floating multiplier ring in Fever Phase
export class Gates {
  constructor(scene) {
    this.scene = scene;
    this.activeGates = [];
    this.gatePool = [];

    // Shared Materials with bright emissive colors
    this.matSquash = new THREE.MeshBasicMaterial({ color: 0xffaa00, wireframe: true });
    this.matTilt = new THREE.MeshBasicMaterial({ color: 0x00ffcc, wireframe: true });
    this.matSplit = new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true });
    this.matFeverRing = new THREE.MeshBasicMaterial({ color: 0xffff00 });

    // Geometries
    this.geoTorus = new THREE.TorusGeometry(1.8, 0.15, 12, 32);
    this.geoHurdle = new THREE.BoxGeometry(7.0, 0.5, 0.5);
    this.geoSplit = new THREE.BoxGeometry(0.5, 4.0, 0.5);
  }

  // Spawn gate synchronized with audio transient at forward distance Z
  spawnGate(type, targetZ, targetX = 0) {
    const gateGroup = new THREE.Group();
    gateGroup.userData = {
      type: type,
      targetZ: targetZ,
      cleared: false,
      evaluated: false,
      requiredMove: this.getRequiredMove(type)
    };

    if (type === 'SQUASH') {
      // Horizontal hurdle bar with pulsing neon glow
      const hurdle = new THREE.Mesh(this.geoHurdle, this.matSquash);
      hurdle.position.y = 0.9;
      gateGroup.add(hurdle);

      // Warning chevron / arrow pointing up
      const arrow = new THREE.Mesh(
        new THREE.ConeGeometry(0.6, 1.2, 4),
        new THREE.MeshBasicMaterial({ color: 0xffaa00 })
      );
      arrow.position.y = 2.4;
      gateGroup.add(arrow);

    } else if (type === 'TILT_L' || type === 'TILT_R') {
      // Slanted angled ring
      const ring = new THREE.Mesh(this.geoTorus, this.matTilt);
      ring.position.y = 1.6;
      ring.rotation.z = type === 'TILT_L' ? 0.6 : -0.6;
      gateGroup.add(ring);

    } else if (type === 'SPLIT') {
      // Twin vertical pillar barrier with center narrow gap
      const p1 = new THREE.Mesh(this.geoSplit, this.matSplit);
      const p2 = new THREE.Mesh(this.geoSplit, this.matSplit);
      p1.position.set(-1.4, 2.0, 0);
      p2.position.set(1.4, 2.0, 0);
      gateGroup.add(p1);
      gateGroup.add(p2);

    } else if (type === 'FEVER_RING') {
      // Golden multiplier hoop
      const hoop = new THREE.Mesh(this.geoTorus, this.matFeverRing);
      hoop.position.y = 1.8;
      gateGroup.add(hoop);
    }

    gateGroup.position.set(targetX, 0, targetZ);
    this.scene.add(gateGroup);
    this.activeGates.push(gateGroup);
  }

  getRequiredMove(type) {
    switch (type) {
      case 'SQUASH': return 'SQUASH';
      case 'TILT_L': return 'TILT_LEFT';
      case 'TILT_R': return 'TILT_RIGHT';
      case 'SPLIT': return 'SPLIT';
      case 'FEVER_RING': return 'ANY';
      default: return 'NORMAL';
    }
  }

  update(playerZ) {
    // Animate gates and remove gates far behind player
    for (let i = this.activeGates.length - 1; i >= 0; i--) {
      const gate = this.activeGates[i];

      // Subtle rotation idle spin
      gate.rotation.y += 0.02;

      // Despawn once 30 units behind player
      if (gate.position.z > playerZ + 30) {
        this.scene.remove(gate);
        this.activeGates.splice(i, 1);
      }
    }
  }

  clearAll() {
    this.activeGates.forEach(gate => this.scene.remove(gate));
    this.activeGates = [];
  }
}
