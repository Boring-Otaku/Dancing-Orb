// Audio synthesis engine providing a built-in high-energy cyberpunk/synthwave procedural soundtrack
export class SynthTrack {
  constructor(audioCtx, destination) {
    this.ctx = audioCtx;
    this.destination = destination;
    this.isPlaying = false;
    this.bpm = 128;
    this.stepTime = 60 / this.bpm / 4; // 16th notes
    this.currentStep = 0;
    this.timerId = null;

    // Musical scales (Cyberpunk Aeolian / Dorian D-minor)
    this.rootFreq = 73.42; // D2
    this.bassNotes = [36.71, 41.20, 43.65, 48.99]; // D1, E1, F1, G1
    this.leadScale = [
      146.83, 164.81, 174.61, 196.00, 220.00, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00
    ];

    // Master bus for procedural track
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = 0.85;
    this.gainNode.connect(this.destination);

    // Reverb / delay node
    this.delayNode = this.ctx.createDelay();
    this.delayNode.delayTime.value = (60 / this.bpm) * 0.75;
    this.feedback = this.ctx.createGain();
    this.feedback.gain.value = 0.35;
    this.delayNode.connect(this.feedback);
    this.feedback.connect(this.delayNode);
    this.delayNode.connect(this.gainNode);
  }

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.schedule();
  }

  stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  schedule() {
    if (!this.isPlaying) return;

    while (this.nextNoteTime < this.ctx.currentTime + 0.2) {
      this.playStep(this.currentStep, this.nextNoteTime);
      this.nextNoteTime += this.stepTime;
      this.currentStep = (this.currentStep + 1) % 64;
    }

    this.timerId = setTimeout(() => this.schedule(), 50);
  }

  playStep(step, time) {
    const beat = step % 16;
    const bar = Math.floor(step / 16);

    // 1. Kick drum on beats 0, 4, 8, 12 (four on the floor)
    if (beat % 4 === 0) {
      this.playKick(time);
    }

    // 2. Snare / Clap on beats 4 and 12
    if (beat === 4 || beat === 12) {
      this.playSnare(time);
    }

    // 3. Hi-Hats on off-beats and 16th variations
    if (beat % 2 === 1 || (bar >= 2 && beat % 4 === 2)) {
      this.playHiHat(time, beat % 4 === 2);
    }

    // 4. Rolling Synthwave Bassline (16th notes with octave jumps)
    this.playBassline(step, time);

    // 5. Arpeggio / Lead melody
    if (bar >= 1) {
      this.playLeadArp(step, time);
    }
  }

  playKick(time) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);

    gain.gain.setValueAtTime(1.0, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    osc.connect(gain);
    gain.connect(this.gainNode);

    osc.start(time);
    osc.stop(time + 0.26);
  }

  playSnare(time) {
    // Noise buffer for snap
    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 800;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.gainNode);
    gain.connect(this.delayNode);

    noise.start(time);
    noise.stop(time + 0.18);
  }

  playHiHat(time, accent = false) {
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 6500;

    const gain = this.ctx.createGain();
    const volume = accent ? 0.45 : 0.22;
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + (accent ? 0.08 : 0.04));

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.gainNode);

    noise.start(time);
    noise.stop(time + 0.08);
  }

  playBassline(step, time) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';

    // Bass note progression (D -> F -> G -> A#)
    const chordIndex = Math.floor(step / 16);
    const chordRoots = [73.42, 87.31, 98.00, 116.54];
    let freq = chordRoots[chordIndex % chordRoots.length];

    // Octave alternate on 16th notes
    if (step % 2 === 1) freq *= 2;

    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, time);
    filter.frequency.exponentialRampToValueAtTime(1400, time + 0.03);
    filter.frequency.exponentialRampToValueAtTime(250, time + this.stepTime * 0.9);

    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + this.stepTime * 0.95);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.gainNode);

    osc.start(time);
    osc.stop(time + this.stepTime);
  }

  playLeadArp(step, time) {
    // 16th note rolling synth lead
    const noteIdx = (step * 3) % this.leadScale.length;
    const freq = this.leadScale[noteIdx];

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, time);
    filter.Q.value = 4.0;

    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + this.stepTime * 0.8);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.gainNode);
    gain.connect(this.delayNode);

    osc.start(time);
    osc.stop(time + this.stepTime);
  }
}
