import * as THREE from 'three';

/**
 * Scene - Manages the Three.js scene, camera, and renderer
 * Handles 3D rendering setup and lifecycle
 */
export class Scene {
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.WebGLRenderer;
  private animationId: number | null = null;
  private isRunning: boolean = false;

  constructor(container: HTMLElement) {
    // Create scene with black background
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // Setup camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 3, 8);
    this.camera.lookAt(0, 2, 0);

    // Setup renderer with optimized settings
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    // Add lights
    this.setupLights();

    // Handle resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  /**
   * Setup scene lighting with ambient, directional, and point lights
   */
  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    this.scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x00ffcc, 0.5);
    pointLight.position.set(0, 5, 0);
    this.scene.add(pointLight);
  }

  /**
   * Handle window resize events to maintain aspect ratio
   */
  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Get the Three.js scene instance
   */
  public getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Get the perspective camera
   */
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Get the WebGL renderer
   */
  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Start the render loop
   */
  public start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.animate();
    }
  }

  /**
   * Internal animation loop for continuous rendering
   */
  private animate(): void {
    if (!this.isRunning) return;
    
    this.animationId = requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Stop the render loop and cleanup animation frame
   */
  public stop(): void {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Add an object to the scene
   * @param object - Three.js object to add
   */
  public add(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  /**
   * Remove an object from the scene
   * @param object - Three.js object to remove
   */
  public remove(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  /**
   * Cleanup all resources
   */
  public dispose(): void {
    this.stop();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
