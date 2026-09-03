import * as THREE from 'three';
import { GelatinousPhysics } from './Physics.js';

export class PlayerOrb {
  constructor(scene) {
    this.scene = scene;
    this.physics = new GelatinousPhysics();

    // Position in world space (Highway along Z, Steer along X, Jump along Y)
    this.position = new THREE.Vector3(0, 1.2, 0);
    this.targetX = 0; // Lateral steering target [-3.5, +3.5]
    this.speed = 28.0; // Units per second forward speed
    this.baseSpeed = 28.0;
    this.feverSpeed = 48.0;
    this.momentum = 1.0; // Multiplier affected by misses & fever

    // Acrobatics states: 'NORMAL', 'SQUASH', 'TILT_LEFT', 'TILT_RIGHT', 'SPLIT'
    this.moveState = 'NORMAL';
    this.moveTimer = 0;
    this.moveDuration = 0.38; // Duration of an acrobatic move

    // Jump physics for Squash-Bounce
    this.verticalVelocity = 0;
    this.gravity = -45.0;
    this.groundY = 1.2;
    this.isAirborne = false;

    // Rotation orientation
    this.rotation = new THREE.Euler(0, 0, 0);
  }

  // Execute Acrobatics Dance Move
  performMove(moveName) {
    this.moveState = moveName;
    this.moveTimer = this.moveDuration;

    switch (moveName) {
      case 'SQUASH':
        this.physics.triggerSquash();
        // High jump launch if near ground
        if (this.position.y <= this.groundY + 0.15) {
          this.verticalVelocity = 14.5;
          this.isAirborne = true;
        }
        break;

      case 'TILT_LEFT':
        this.physics.triggerTilt('left');
        break;

      case 'TILT_RIGHT':
        this.physics.triggerTilt('right');
        break;

      case 'SPLIT':
        this.physics.triggerSplit();
        break;

      default:
        this.physics.release();
        break;
    }
  }

  // Steer / Drift input [-1.0 to 1.0]
  steer(lateralInput) {
    const trackHalfWidth = 3.6;
    this.targetX = THREE.MathUtils.clamp(lateralInput * trackHalfWidth, -trackHalfWidth, trackHalfWidth);
  }

  update(dt, isFever = false) {
    // 1. Move timer and recovery
    if (this.moveTimer > 0) {
      this.moveTimer -= dt;
      if (this.moveTimer <= 0) {
        this.moveState = 'NORMAL';
        this.physics.release();
      }
    }

    // 2. Physics internal spring update
    this.physics.update(dt);

    // 3. Lateral steering smoothing (sway / drift)
    const steerResponsiveness = this.physics.surfaceTension * 14.0;
    this.position.x += (this.targetX - this.position.x) * Math.min(1.0, dt * steerResponsiveness);

    // Apply wobble lateral noise when destabilized
    if (this.physics.wobbleIntensity > 0.05) {
      this.position.x += (Math.random() - 0.5) * this.physics.wobbleIntensity * 0.15;
    }

    // 4. Vertical jump physics (Squash-Bounce)
    if (this.isAirborne || this.position.y > this.groundY) {
      this.verticalVelocity += this.gravity * dt;
      this.position.y += this.verticalVelocity * dt;

      if (this.position.y <= this.groundY) {
        this.position.y = this.groundY;
        this.verticalVelocity = 0;
        this.isAirborne = false;
        // Impact squish upon landing
        this.physics.velocity.y -= 10.0;
      }
    }

    // 5. Forward progression speed
    const targetSpeed = (isFever ? this.feverSpeed : this.baseSpeed) * this.momentum;
    this.speed += (targetSpeed - this.speed) * Math.min(1.0, dt * 5.0);
    this.position.z -= this.speed * dt;

    // 6. Mesh tilt banking & spin
    if (this.moveState === 'TILT_LEFT') {
      this.rotation.z += (0.55 - this.rotation.z) * dt * 15.0;
      this.rotation.y += dt * 12.0;
    } else if (this.moveState === 'TILT_RIGHT') {
      this.rotation.z += (-0.55 - this.rotation.z) * dt * 15.0;
      this.rotation.y -= dt * 12.0;
    } else {
      this.rotation.z += (0.0 - this.rotation.z) * dt * 8.0;
      // Rolling forward spin
      this.rotation.x -= (this.speed * 0.12) * dt;
    }
  }

  // Momentum penalties & bonuses
  onMiss() {
    this.momentum = Math.max(0.4, this.momentum - 0.18); // 18% momentum loss
    this.physics.applyWobblePenalty();
  }

  onHit(isPerfect = true) {
    this.physics.boostSurfaceTension(isPerfect ? 0.35 : 0.18);
    this.momentum = Math.min(1.4, this.momentum + (isPerfect ? 0.1 : 0.05));
  }
}
