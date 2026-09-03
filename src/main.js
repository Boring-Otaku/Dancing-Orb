import './style.css';
import * as THREE from 'three';
import { AudioManager } from './audio/AudioManager.js';
import { SceneManager } from './graphics/SceneManager.js';
import { OrbRenderer } from './graphics/OrbRenderer.js';
import { Highway } from './graphics/Highway.js';
import { Gates } from './graphics/Gates.js';
import { ParticleSystem } from './graphics/Particles.js';
import { PlayerOrb } from './gameplay/PlayerOrb.js';
import { RhythmEngine } from './gameplay/RhythmEngine.js';
import { GhostSystem } from './gameplay/GhostSystem.js';
import { Controls } from './ui/Controls.js';
import { HUD } from './ui/HUD.js';
import { AudioUI } from './ui/AudioUI.js';

class Game {
  constructor() {
    this.container = document.getElementById('canvas-container');

    // 1. Graphics & Audio Pipelines
    this.sceneManager = new SceneManager(this.container);
    this.audio = new AudioManager();

    // 2. World Entities & Shaders
    this.highway = new Highway(this.sceneManager.scene);
    this.orbRenderer = new OrbRenderer(this.sceneManager.scene);
    this.gates = new Gates(this.sceneManager.scene);
    this.particles = new ParticleSystem(this.sceneManager.scene);
    this.ghostSystem = new GhostSystem(this.sceneManager.scene);

    // 3. Gameplay Systems
    this.player = new PlayerOrb(this.sceneManager.scene);
    this.hud = new HUD(document.body);

    this.rhythmEngine = new RhythmEngine(
      this.audio,
      this.gates,
      this.particles,
      (event, data) => this.handleGameplayEvent(event, data)
    );

    // 4. Input & UI Controls
    this.controls = new Controls(
      (action) => this.onPlayerAction(action),
      (steerX) => this.player.steer(steerX)
    );

    this.audioUI = new AudioUI(
      this.audio,
      (mode) => this.onGameModeChange(mode),
      () => this.restartGame()
    );

    this.clock = new THREE.Clock();
    this.hasStarted = false;

    this.setupStartOverlay();
  }

  setupStartOverlay() {
    const startOverlay = document.createElement('div');
    startOverlay.className = 'modal-backdrop';
    startOverlay.id = 'start-screen';
    startOverlay.innerHTML = `
      <div class="modal-card" style="text-align:center; align-items:center;">
        <h1 class="neon-cyan" style="font-family:'Orbitron',sans-serif; font-size:42px; margin-bottom:6px;">DANCING ORB</h1>
        <p style="color:#8fa0c2; font-size:16px; margin-bottom:20px;">AUDIO-REACTIVE RHYTHM-ACTION RUNNER</p>
        
        <div style="background:rgba(255,255,255,0.04); padding:16px; border-radius:8px; width:100%; margin-bottom:20px; font-size:14px; line-height:1.6; text-align:left;">
          <p><strong class="neon-yellow">W / Up / Swipe Up:</strong> Squash-Bounce (Jump hurdles)</p>
          <p><strong class="neon-cyan">A/D / Left/Right:</strong> Tilt-Spin (Carve banked gates)</p>
          <p><strong class="neon-magenta">S / Down / Swipe Down:</strong> Split-Snap (Thread dual lanes)</p>
          <p><strong class="neon-cyan">Mouse / Drag:</strong> Lateral Fluid Steer</p>
        </div>

        <button class="btn-neon primary" id="btn-start" style="font-size:18px; padding:14px 38px;">ENTER FLOW</button>
      </div>
    `;
    document.body.appendChild(startOverlay);

    startOverlay.querySelector('#btn-start').onclick = async () => {
      startOverlay.style.display = 'none';
      await this.audio.init();
      await this.audio.resume();
      this.audio.startProcedural();
      this.hasStarted = true;
      this.clock.start();
      this.animate();
    };
  }

  onPlayerAction(action) {
    this.player.performMove(action);
  }

  onGameModeChange(mode) {
    this.rhythmEngine.setGameMode(mode);
    if (mode === 'GHOST') {
      const loaded = this.ghostSystem.loadRun(this.audio.trackName);
      if (!loaded) {
        console.log('No recorded ghost found for this track. Playing new ghost run.');
      }
    } else {
      this.ghostSystem.clear();
    }
  }

  handleGameplayEvent(event, data) {
    if (event === 'HIT_EVAL') {
      this.hud.showTimingFeedback(data.rating);
    } else if (event === 'FEVER_START') {
      this.hud.setFever(true);
    } else if (event === 'FEVER_END') {
      this.hud.setFever(false);
    } else if (event === 'GAME_OVER') {
      if (this.rhythmEngine.gameMode === 'GHOST' && data.success) {
        this.ghostSystem.saveRun(this.audio.trackName);
      }
      this.hud.showGameOver(data, () => this.restartGame());
    }
  }

  restartGame() {
    this.player.position.set(0, 1.2, 0);
    this.player.speed = 28.0;
    this.player.momentum = 1.0;
    this.rhythmEngine.reset();
    this.hud.setFever(false);
    this.hud.setTrackTitle(this.audio.trackName);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const dt = THREE.MathUtils.clamp(this.clock.getDelta(), 0, 0.1);
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Controls polling
    this.controls.update();

    // 2. Audio update & beat transient detection
    const beatInfo = this.audio.update();
    if (beatInfo.isBeat) {
      this.rhythmEngine.handleBeatEvent(beatInfo, this.player);
    }

    // 3. Gameplay physics & rhythm engine updates
    const isFever = this.rhythmEngine.feverActive;
    this.player.update(dt, isFever);
    this.rhythmEngine.update(dt, this.player);

    // Record ghost run frame
    if (this.hasStarted && !this.rhythmEngine.isGameOver) {
      this.ghostSystem.recordFrame(this.audio.getCurrentSongTime(), this.player.position, this.player.moveState);
    }

    // Ghost playback update
    if (this.rhythmEngine.gameMode === 'GHOST') {
      this.ghostSystem.updatePlayback(this.audio.getCurrentSongTime());
    }

    // 4. Graphics & Shader updates
    const feverProgress = isFever ? THREE.MathUtils.clamp(this.rhythmEngine.feverTimer / this.rhythmEngine.feverDuration, 0, 1) : 0;
    this.orbRenderer.update(elapsedTime, this.player, beatInfo, feverProgress);
    this.highway.update(elapsedTime, this.player.position.z, this.player.speed, beatInfo, feverProgress);
    this.gates.update(this.player.position.z);
    this.particles.update(dt, this.player.position.z, this.player.speed, isFever);

    // 5. Camera update
    this.sceneManager.updateCamera(this.player, dt, isFever);

    // 6. HUD update
    this.hud.update(
      this.rhythmEngine.score,
      this.rhythmEngine.combo,
      this.rhythmEngine.grooveMeter,
      beatInfo,
      this.rhythmEngine.gameMode,
      this.rhythmEngine.challengeTimer,
      this.rhythmEngine.strikes
    );

    // 7. Render scene
    this.sceneManager.render();
  }
}

// Start Game on load
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
