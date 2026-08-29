import { AudioManager } from './AudioManager.js';
import { Orb } from './Orb.js';
import { Stage } from './Stage.js';
// import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';


export class Main {
  constructor() {
    // Scene setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.camera.position.set(0, 10, 20);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(5, 10, 7.5);
    this.scene.add(dir);

    // Audio
    this.audio = new AudioManager();
    // Example: use <audio> element with id='audio'
    const mediaEl = document.getElementById('audio');
    if (mediaEl) this.audio.setMediaElement(mediaEl);

    // Game objects
    this.orb = new Orb();
    this.stage = new Stage();
    this.scene.add(this.stage.mesh);
    this.scene.add(this.orb.mesh);

    window.addEventListener('resize', this.onResize.bind(this));
    this.animate();
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    if (!this.audio.sourceNode) return; // wait for media
    const data = this.audio.update();
    const bass = this.audio.getBass();
    const mid = this.audio.getMid();
    const treble = this.audio.getTreble();
    this.orb.update(bass, mid, treble);
    this.stage.update(bass, mid, treble);
    this.renderer.render(this.scene, this.camera);
  }
}

// Start once page loads
window.addEventListener('load', () => {
  new Main();
});
