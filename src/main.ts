import './style.css';
import * as THREE from 'three';
import { Scene } from './game/engine/Scene';
import { AudioAnalyzer } from './game/audio/AudioAnalyzer';
import { UIManager } from './game/ui/UIManager';
import { Orb } from './game/entities/Orb';
import { Highway } from './game/entities/Highway';
import { Physics } from './game/engine/Physics';

/**
 * Dancing Orb - Main Application Entry Point
 * A rhythm-action 3D game that turns music into a dynamic playground
 * 
 * Features:
 * - Real-time audio analysis with frequency spectrum visualization
 * - Procedural highway with custom GLSL shaders reacting to music
 * - Soft-body orb deformation synced to audio intensity
 * - Dynamic volume meter with color-coded feedback
 */

// Application state
interface AppState {
  scene: Scene;
  analyzer: AudioAnalyzer;
  ui: UIManager;
  physics: Physics;
  orb: Orb;
  highway: Highway;
  clock: THREE.Clock;
  isRunning: boolean;
}

// Initialize core systems
const appContainer = document.querySelector<HTMLDivElement>('#app')!;
const uiContainer = document.getElementById('ui-layer')!;

// Create application state
const app: AppState = {
  scene: new Scene(appContainer),
  analyzer: new AudioAnalyzer(),
  ui: new UIManager(uiContainer, new AudioAnalyzer()),
  physics: new Physics(),
  orb: null as unknown as Orb,
  highway: null as unknown as Highway,
  clock: new THREE.Clock(),
  isRunning: false,
};

// Re-create UI with correct analyzer instance
app.ui = new UIManager(uiContainer, app.analyzer);

/**
 * Start the application
 * Initializes all systems and begins the animation loop
 */
async function start(): Promise<void> {
  try {
    // Initialize physics engine
    await app.physics.init();
    
    // Create game entities after physics is ready
    app.orb = new Orb(app.scene.getScene());
    app.highway = new Highway(app.scene.getScene(), app.physics.getWorld());
    
    // Start the render loop
    app.scene.start();
    
    // Begin animation loop
    animate();
    
    app.isRunning = true;
    console.log('Dancing Orb initialized successfully!');
  } catch (error) {
    console.error('Failed to initialize Dancing Orb:', error);
    app.ui.showMessage('Initialization failed. Please refresh the page.', 5000);
    app.isRunning = false;
  }
}

/**
 * Main animation loop
 * Updates physics, game entities, and UI based on audio input
 */
function animate(): void {
  if (!app.isRunning) return;
  
  requestAnimationFrame(animate);
  
  const elapsedTime = app.clock.getElapsedTime();
  const volume = app.analyzer.getVolume();
  const intensity = THREE.MathUtils.clamp(volume, 0, 1);
  
  // Update physics simulation
  if (app.physics.isReady()) {
    app.physics.step();
  }
  
  // Update game entities
  app.orb.update(elapsedTime, intensity);
  app.highway.update(elapsedTime, intensity);
  
  // Update UI elements
  app.ui.updateVolumeMeter(volume);
}

/**
 * Stop the application and cleanup resources
 */
function stop(): void {
  app.isRunning = false;
  app.scene.stop();
  app.orb?.dispose();
  app.highway?.dispose();
  app.physics.dispose();
  app.analyzer.dispose();
  app.ui.dispose();
  app.scene.dispose();
}

// Handle page unload
window.addEventListener('beforeunload', () => {
  stop();
});

// Start the application
start();
