import { BeatDetector } from './BeatDetector.js';
import { HitSounds } from './HitSounds.js';
import { SynthTrack } from './SynthTrack.js';

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.analyser = null;
    this.freqData = null;
    this.timeData = null;
    this.bufferLength = 0;

    this.hitSounds = null;
    this.synthTrack = null;
    this.beatDetector = new BeatDetector();

    this.sourceNode = null;
    this.audioBuffer = null;
    this.isPlaying = false;
    this.isProcedural = true;
    this.trackName = 'Neon Circuit (Procedural 128 BPM)';
    this.trackBpm = 128;
    this.trackDuration = 0;
    this.startTime = 0;
    this.pauseOffset = 0;

    // Sub-band energy levels [0.0 - 1.0]
    this.bassEnergy = 0;
    this.midEnergy = 0;
    this.trebleEnergy = 0;
    this.overallEnergy = 0;

    // Latency calibration offset in seconds (user adjustable)
    this.audioOffset = 0.0; // seconds
  }

  async init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.75;
    this.bufferLength = this.analyser.frequencyBinCount;
    this.freqData = new Uint8Array(this.bufferLength);
    this.timeData = new Uint8Array(this.bufferLength);

    this.analyser.connect(this.ctx.destination);

    this.hitSounds = new HitSounds(this.ctx, this.ctx.destination);
    this.synthTrack = new SynthTrack(this.ctx, this.analyser);
  }

  async resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  startProcedural() {
    this.init();
    this.resume();
    this.stopAudioFile();
    this.isProcedural = true;
    this.trackName = 'Neon Circuit (Procedural 128 BPM)';
    this.trackBpm = 128;
    this.synthTrack.start();
    this.isPlaying = true;
    this.startTime = this.ctx.currentTime;
  }

  async loadAudioFile(file) {
    await this.init();
    await this.resume();

    if (this.isProcedural) {
      this.synthTrack.stop();
      this.isProcedural = false;
    }
    this.stopAudioFile();

    const arrayBuffer = await file.arrayBuffer();
    this.audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
    this.trackName = file.name;
    this.trackDuration = this.audioBuffer.duration;

    // Scan for BPM and transient peaks
    const scan = BeatDetector.preScanBuffer(this.audioBuffer);
    this.trackBpm = scan.bpm;
    this.preScannedPeaks = scan.peaks;

    this.playAudioFile();
  }

  playAudioFile() {
    if (!this.audioBuffer) return;
    this.sourceNode = this.ctx.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.connect(this.analyser);

    this.startTime = this.ctx.currentTime - this.pauseOffset;
    this.sourceNode.start(0, this.pauseOffset);
    this.isPlaying = true;

    this.sourceNode.onended = () => {
      this.isPlaying = false;
      this.pauseOffset = 0;
    };
  }

  stopAudioFile() {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch (e) {}
      this.sourceNode = null;
    }
    this.isPlaying = false;
  }

  togglePlay() {
    if (this.isPlaying) {
      if (this.isProcedural) {
        this.synthTrack.stop();
        this.isPlaying = false;
      } else {
        this.pauseOffset = this.ctx.currentTime - this.startTime;
        this.stopAudioFile();
      }
    } else {
      if (this.isProcedural) {
        this.synthTrack.start();
        this.isPlaying = true;
      } else {
        this.playAudioFile();
      }
    }
  }

  update() {
    if (!this.analyser) return { isBeat: false, bass: 0, mid: 0, treble: 0, energy: 0 };

    this.analyser.getByteFrequencyData(this.freqData);
    this.analyser.getByteTimeDomainData(this.timeData);

    // Split FFT frequency bins into 3 functional bands:
    // FFT Size 512, sampleRate 44100 -> ~86Hz per bin.
    // Low / Bass (0 - 3 bins ~ 0-258Hz)
    let bassSum = 0;
    const bassBins = 4;
    for (let i = 0; i < bassBins; i++) {
      bassSum += this.freqData[i];
    }
    this.bassEnergy = (bassSum / bassBins) / 255;

    // Mid (4 - 40 bins ~ 300 - 3500Hz)
    let midSum = 0;
    const midBinsStart = 4;
    const midBinsEnd = 40;
    for (let i = midBinsStart; i < midBinsEnd; i++) {
      midSum += this.freqData[i];
    }
    this.midEnergy = (midSum / (midBinsEnd - midBinsStart)) / 255;

    // High / Treble (41 - 180 bins ~ 3500 - 15000Hz)
    let trebleSum = 0;
    const trebleStart = 41;
    const trebleEnd = 160;
    for (let i = trebleStart; i < trebleEnd; i++) {
      trebleSum += this.freqData[i];
    }
    this.trebleEnergy = (trebleSum / (trebleEnd - trebleStart)) / 255;

    this.overallEnergy = (this.bassEnergy * 0.5 + this.midEnergy * 0.35 + this.trebleEnergy * 0.15);

    const currentTime = this.ctx ? this.ctx.currentTime : 0;
    const beatInfo = this.beatDetector.update(currentTime, this.bassEnergy, this.midEnergy, this.trebleEnergy);

    return beatInfo;
  }

  getCurrentSongTime() {
    if (!this.ctx) return 0;
    return (this.ctx.currentTime - this.startTime) + this.audioOffset;
  }
}
