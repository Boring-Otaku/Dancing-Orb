import * as THREE from 'three';

// Ghost Dance PvP & Run Replay system
export class GhostSystem {
  constructor(scene) {
    this.scene = scene;
    this.recordedFrames = [];
    this.ghostMesh = null;
    this.playbackIndex = 0;
    this.isReplaying = false;

    this.createGhostMesh();
  }

  createGhostMesh() {
    const geo = new THREE.IcosahedronGeometry(0.9, 3);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      wireframe: true,
      transparent: true,
      opacity: 0.4
    });
    this.ghostMesh = new THREE.Mesh(geo, mat);
    this.ghostMesh.visible = false;
    this.scene.add(this.ghostMesh);
  }

  recordFrame(time, position, moveState) {
    this.recordedFrames.push({
      t: time,
      x: position.x,
      y: position.y,
      z: position.z,
      move: moveState
    });
  }

  saveRun(songId) {
    try {
      const data = JSON.stringify(this.recordedFrames);
      localStorage.setItem(`dancing_orb_ghost_${songId}`, data);
    } catch (e) {
      console.warn('Failed to save ghost run', e);
    }
  }

  loadRun(songId) {
    try {
      const data = localStorage.getItem(`dancing_orb_ghost_${songId}`);
      if (data) {
        this.recordedFrames = JSON.parse(data);
        this.playbackIndex = 0;
        this.isReplaying = true;
        this.ghostMesh.visible = true;
        return true;
      }
    } catch (e) {
      console.warn('Failed to load ghost run', e);
    }
    return false;
  }

  updatePlayback(songTime) {
    if (!this.isReplaying || this.recordedFrames.length === 0) {
      this.ghostMesh.visible = false;
      return;
    }

    while (
      this.playbackIndex < this.recordedFrames.length - 1 &&
      this.recordedFrames[this.playbackIndex + 1].t < songTime
    ) {
      this.playbackIndex++;
    }

    const frame = this.recordedFrames[this.playbackIndex];
    if (frame) {
      this.ghostMesh.visible = true;
      this.ghostMesh.position.set(frame.x, frame.y, frame.z);
      this.ghostMesh.rotation.y += 0.05;
    }
  }

  clear() {
    this.recordedFrames = [];
    this.playbackIndex = 0;
    this.isReplaying = false;
    this.ghostMesh.visible = false;
  }
}
