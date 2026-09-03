import * as THREE from 'three';

export class SceneManager {
  constructor(container) {
    this.container = container;

    // 1. Scene setup with futuristic cyberpunk atmospheric fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x04050d);
    this.scene.fog = new THREE.FogExp2(0x04050d, 0.012);

    // 2. Camera setup with dynamic FOV
    this.baseFov = 68;
    this.camera = new THREE.PerspectiveCamera(
      this.baseFov,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.cameraOffset = new THREE.Vector3(0, 3.8, 7.5);
    this.cameraLookOffset = new THREE.Vector3(0, 1.2, -15.0);

    // 3. WebGL Renderer with tone mapping
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting setup
    const ambientLight = new THREE.AmbientLight(0x1a1e36, 1.5);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00f3ff, 2.0);
    dirLight.position.set(10, 20, 10);
    this.scene.add(dirLight);

    // Window resize handler
    window.addEventListener('resize', () => this.onResize());
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  updateCamera(playerOrb, dt, isFever = false) {
    // Dynamic FOV expands from 68 up to 92 based on player speed and Fever mode
    const speedRatio = THREE.MathUtils.clamp((playerOrb.speed - 28.0) / 20.0, 0, 1);
    const targetFov = this.baseFov + speedRatio * 18.0 + (isFever ? 8.0 : 0.0);
    this.camera.fov += (targetFov - this.camera.fov) * Math.min(1.0, dt * 5.0);
    this.camera.updateProjectionMatrix();

    // Camera follow player position smoothly
    const targetCamPos = new THREE.Vector3(
      playerOrb.position.x * 0.45,
      playerOrb.position.y + this.cameraOffset.y,
      playerOrb.position.z + this.cameraOffset.z
    );

    // Camera shake when destabilized wobble is active
    if (playerOrb.physics.wobbleIntensity > 0.08) {
      const shake = playerOrb.physics.wobbleIntensity * 0.2;
      targetCamPos.x += (Math.random() - 0.5) * shake;
      targetCamPos.y += (Math.random() - 0.5) * shake;
    }

    this.camera.position.lerp(targetCamPos, Math.min(1.0, dt * 10.0));

    const lookTarget = new THREE.Vector3(
      playerOrb.position.x * 0.2,
      playerOrb.position.y + 0.8,
      playerOrb.position.z + this.cameraLookOffset.z
    );
    this.camera.lookAt(lookTarget);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
