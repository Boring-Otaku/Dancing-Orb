import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AudioAnalyzer } from './audio/AudioAnalyzer.js';
import { Orb } from './game/Orb.js';

class Main {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.camera.position.set(0, 10, 20);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(5, 10, 7.5);
    this.scene.add(dir);

    this.analyzer = new AudioAnalyzer();
    const audioEl = document.getElementById('audio');
    if (audioEl) this.analyzer.setMediaElement(audioEl);

    this.orb = new Orb(this.scene);

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
    const volume = this.analyzer.getVolume();
    this.orb.update(volume);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('load', () => {
  new Main();
});
