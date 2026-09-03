// Spring-Mass Damper system modeling gelatinous internal pressure, surface tension & wobble
export class GelatinousPhysics {
  constructor() {
    // Current deformation scales [X, Y, Z]
    this.scale = { x: 1.0, y: 1.0, z: 1.0 };
    this.targetScale = { x: 1.0, y: 1.0, z: 1.0 };
    this.velocity = { x: 0.0, y: 0.0, z: 0.0 };

    // Spring-mass parameters
    this.stiffness = 140.0;   // Spring constant k
    this.damping = 10.5;      // Damping coefficient c
    this.mass = 1.0;

    // Surface tension & momentum
    this.surfaceTension = 1.0;  // 1.0 = optimal, drops on miss
    this.wobbleIntensity = 0.0; // Instability factor [0 - 1]
    this.splitProgress = 0.0;   // [0 - 1] for bilateral split
    this.targetSplit = 0.0;
  }

  // Trigger Squash-Bounce deformation
  triggerSquash() {
    // Flatten along Y, expand radially along X and Z
    this.targetScale.x = 1.6;
    this.targetScale.z = 1.6;
    this.targetScale.y = 0.45;
    this.velocity.y -= 15.0; // Spring compression snap
  }

  // Trigger Tilt-Spin deformation (carve left or right)
  triggerTilt(direction = 'left') {
    const sign = direction === 'left' ? -1 : 1;
    this.targetScale.x = 1.7; // Disc rim flattening
    this.targetScale.y = 0.6;
    this.targetScale.z = 1.4;
    this.velocity.x += sign * 12.0;
  }

  // Trigger Split-Snap bilateral bifurcation
  triggerSplit() {
    this.targetSplit = 1.0;
    this.targetScale.x = 1.5;
    this.targetScale.y = 0.7;
    this.targetScale.z = 1.8;
  }

  // Release acrobatics back to rest state
  release() {
    this.targetScale.x = 1.0;
    this.targetScale.y = 1.0;
    this.targetScale.z = 1.0;
    this.targetSplit = 0.0;
  }

  // Apply destabilization penalty on rhythm miss
  applyWobblePenalty() {
    this.surfaceTension = Math.max(0.2, this.surfaceTension - 0.4);
    this.wobbleIntensity = 1.0;
    // Chaotic impulse
    this.velocity.x += (Math.random() - 0.5) * 20.0;
    this.velocity.y += (Math.random() - 0.5) * 20.0;
    this.velocity.z += (Math.random() - 0.5) * 20.0;
  }

  // Boost surface tension on perfect/great hit
  boostSurfaceTension(amount = 0.3) {
    this.surfaceTension = Math.min(1.5, this.surfaceTension + amount);
    this.wobbleIntensity = Math.max(0.0, this.wobbleIntensity - 0.5);
  }

  update(dt) {
    if (dt > 0.1) dt = 0.1; // Clamp step for numerical stability

    // Axis spring simulation: F = -k*(x - target) - c*v
    const axes = ['x', 'y', 'z'];
    axes.forEach(axis => {
      const displacement = this.scale[axis] - this.targetScale[axis];
      const springForce = -this.stiffness * displacement;
      const dampingForce = -this.damping * this.velocity[axis];
      const accel = (springForce + dampingForce) / this.mass;

      this.velocity[axis] += accel * dt;
      this.scale[axis] += this.velocity[axis] * dt;
    });

    // Ease split progress
    this.splitProgress += (this.targetSplit - this.splitProgress) * Math.min(1.0, dt * 15.0);

    // Decay wobble penalty towards equilibrium
    this.wobbleIntensity *= Math.pow(0.25, dt);

    // Slowly restore baseline surface tension
    if (this.surfaceTension < 1.0) {
      this.surfaceTension += dt * 0.15;
    }
  }
}
