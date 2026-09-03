// Rhythm Engine: Evaluates timing accuracy, gate collisions, Groove Meter, Fever Mode & scoring
export class RhythmEngine {
  constructor(audioManager, gates, particles, onEvent) {
    this.audio = audioManager;
    this.gates = gates;
    this.particles = particles;
    this.onEvent = onEvent; // Callback for UI popups (score, combo, timing)

    // Scoring & Groove
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.grooveMeter = 0; // [0 - 100]
    this.feverActive = false;
    this.feverDuration = 10.0;
    this.feverTimer = 0;

    // Choreo-Challenge mode tracking
    this.gameMode = 'ENDLESS'; // 'ENDLESS', 'CHOREO', 'GHOST'
    this.strikes = 0;
    this.maxStrikes = 3;
    this.challengeTimer = 60.0;
    this.isGameOver = false;

    // Lookahead spawn settings
    this.lookaheadTime = 2.2; // Spawn gates 2.2s ahead of beat
  }

  setGameMode(mode) {
    this.gameMode = mode;
    this.reset();
  }

  reset() {
    this.score = 0;
    this.combo = 0;
    this.grooveMeter = 0;
    this.feverActive = false;
    this.feverTimer = 0;
    this.strikes = 0;
    this.challengeTimer = 60.0;
    this.isGameOver = false;
    this.gates.clearAll();
  }

  // Called when audio detector flags a transient beat
  handleBeatEvent(beatInfo, playerOrb) {
    if (this.isGameOver) return;

    // Calculate spawn position along Z based on player speed and lookahead
    const forwardDist = playerOrb.speed * this.lookaheadTime;
    const spawnZ = playerOrb.position.z - forwardDist;

    // In Fever mode, spawn multiplier hoops
    if (this.feverActive) {
      const ringX = (Math.random() - 0.5) * 4.0;
      this.gates.spawnGate('FEVER_RING', spawnZ, ringX);
      return;
    }

    // Determine gate type from audio spectral band
    let type = 'SQUASH';
    let targetX = 0;

    if (beatInfo.beatType === 'bass') {
      type = 'SQUASH';
    } else if (beatInfo.beatType === 'mid') {
      const isLeft = Math.random() > 0.5;
      type = isLeft ? 'TILT_L' : 'TILT_R';
      targetX = isLeft ? -1.8 : 1.8;
    } else if (beatInfo.beatType === 'treble') {
      type = 'SPLIT';
      targetX = (Math.random() - 0.5) * 1.5;
    }

    this.gates.spawnGate(type, spawnZ, targetX);
  }

  update(dt, playerOrb) {
    if (this.isGameOver) return;

    // 1. Choreo-Challenge mode countdown
    if (this.gameMode === 'CHOREO') {
      this.challengeTimer -= dt;
      if (this.challengeTimer <= 0) {
        this.challengeTimer = 0;
        this.endGame(true, 'CHALLENGE CLEARED!');
        return;
      }
    }

    // 2. Fever Phase Timer
    if (this.feverActive) {
      this.feverTimer -= dt;
      this.grooveMeter = Math.max(0, (this.feverTimer / this.feverDuration) * 100);

      if (this.feverTimer <= 0) {
        this.feverActive = false;
        this.grooveMeter = 0;
        this.onEvent('FEVER_END');
      }
    }

    // 3. Evaluate Rhythm Gate Intersections
    const hitZThreshold = 1.8; // Z distance tolerance for pass/hit
    const gates = this.gates.activeGates;

    for (let i = 0; i < gates.length; i++) {
      const gate = gates[i];
      if (gate.userData.evaluated) continue;

      const dz = gate.position.z - playerOrb.position.z;

      // Gate has arrived at the player orb plane
      if (Math.abs(dz) <= hitZThreshold) {
        this.evaluateGatePass(gate, playerOrb, Math.abs(dz));
      } else if (dz > hitZThreshold) {
        // Player missed the gate completely
        this.evaluateMiss(gate, playerOrb);
      }
    }
  }

  evaluateGatePass(gate, playerOrb, distanceOffset) {
    const requiredMove = gate.userData.requiredMove;
    const currentMove = playerOrb.moveState;

    // Calculate timing error in milliseconds
    const timingMs = (distanceOffset / playerOrb.speed) * 1000;

    let matched = false;
    if (requiredMove === 'ANY') {
      // In Fever mode, passing through ring is sufficient
      const dx = Math.abs(playerOrb.position.x - gate.position.x);
      if (dx < 2.0) matched = true;
    } else {
      matched = (currentMove === requiredMove);
      if (requiredMove === 'SQUASH' && playerOrb.isAirborne) {
        matched = true;
      }
    }

    if (matched) {
      gate.userData.evaluated = true;
      gate.userData.cleared = true;

      // Timing Windows: Perfect <= 30ms, Great <= 75ms
      if (timingMs <= 38.0) {
        this.registerHit('PERFECT', gate.position, playerOrb);
      } else if (timingMs <= 85.0) {
        this.registerHit('GREAT', gate.position, playerOrb);
      } else {
        this.registerHit('GREAT', gate.position, playerOrb);
      }
    }
  }

  evaluateMiss(gate, playerOrb) {
    gate.userData.evaluated = true;
    gate.userData.cleared = false;

    // Endless mode does not penalize strikes
    if (this.gameMode !== 'ENDLESS') {
      this.strikes++;
      if (this.strikes >= this.maxStrikes) {
        this.endGame(false, 'ORB DESTABILIZED - 3 STRIKES');
        return;
      }
    }

    this.combo = 0;
    this.grooveMeter = Math.max(0, this.grooveMeter - 15);
    playerOrb.onMiss();

    this.audio.hitSounds?.playMiss();
    this.particles.emitBurst(playerOrb.position, 20, 0xff0055);

    this.onEvent('HIT_EVAL', {
      rating: 'MISS',
      timingMs: 120,
      combo: this.combo,
      score: this.score,
      groove: this.grooveMeter
    });
  }

  registerHit(rating, position, playerOrb) {
    const isPerfect = rating === 'PERFECT';
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);

    const comboMultiplier = Math.min(8, 1 + Math.floor(this.combo / 10));
    const feverMultiplier = this.feverActive ? 3.0 : 1.0;
    const basePoints = isPerfect ? 100 : 50;

    const earned = Math.round(basePoints * comboMultiplier * feverMultiplier);
    this.score += earned;

    // Groove Meter increase
    const grooveAdd = isPerfect ? 12 : 6;
    this.grooveMeter = Math.min(100, this.grooveMeter + grooveAdd);

    playerOrb.onHit(isPerfect);

    // Audio & particles
    if (isPerfect) {
      this.audio.hitSounds?.playPerfect();
      this.particles.emitBurst(position, 40, 0x00ffff);
    } else {
      this.audio.hitSounds?.playGreat();
      this.particles.emitBurst(position, 25, 0x00ff88);
    }

    // Trigger Fever Phase upon 100% Groove Meter
    if (this.grooveMeter >= 100 && !this.feverActive) {
      this.triggerFever();
    }

    this.onEvent('HIT_EVAL', {
      rating: rating,
      score: this.score,
      combo: this.combo,
      groove: this.grooveMeter,
      points: earned
    });
  }

  triggerFever() {
    this.feverActive = true;
    this.feverTimer = this.feverDuration;
    this.audio.hitSounds?.playFever();
    this.onEvent('FEVER_START');
  }

  endGame(success, reason) {
    this.isGameOver = true;
    this.onEvent('GAME_OVER', {
      success: success,
      reason: reason,
      score: this.score,
      maxCombo: this.maxCombo,
      grade: this.calculateGrade()
    });
  }

  calculateGrade() {
    if (this.score > 25000) return 'S+';
    if (this.score > 18000) return 'S';
    if (this.score > 12000) return 'A';
    if (this.score > 6000) return 'B';
    return 'C';
  }
}
