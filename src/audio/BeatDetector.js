// Real-time transient, spectral flux, and beat onset detection
export class BeatDetector {
  constructor() {
    this.prevEnergy = 0;
    this.energyHistory = [];
    this.historySize = 40;
    this.lastBeatTime = 0;
    this.minBeatInterval = 0.22; // max ~270 BPM

    // Dynamic threshold multiplier
    this.thresholdMultiplier = 1.35;
  }

  // Detect transients from current frequency subbands
  update(currentTime, bassEnergy, midEnergy, trebleEnergy) {
    const totalEnergy = bassEnergy * 0.6 + midEnergy * 0.3 + trebleEnergy * 0.1;

    // Calculate energy moving average
    let avgEnergy = 0;
    if (this.energyHistory.length > 0) {
      const sum = this.energyHistory.reduce((a, b) => a + b, 0);
      avgEnergy = sum / this.energyHistory.length;
    }

    this.energyHistory.push(totalEnergy);
    if (this.energyHistory.length > this.historySize) {
      this.energyHistory.shift();
    }

    // Peak threshold test
    const threshold = avgEnergy * this.thresholdMultiplier;
    const isPeak = totalEnergy > threshold && totalEnergy > 0.25;
    const delta = totalEnergy - this.prevEnergy;
    this.prevEnergy = totalEnergy;

    let isBeat = false;
    let beatType = 'normal';

    if (isPeak && delta > 0.08 && (currentTime - this.lastBeatTime > this.minBeatInterval)) {
      this.lastBeatTime = currentTime;
      isBeat = true;

      if (bassEnergy > 0.65) {
        beatType = 'bass'; // Kick or drop -> Squash ramp
      } else if (trebleEnergy > 0.5) {
        beatType = 'treble'; // Snare/hat -> Split gate
      } else if (midEnergy > 0.55) {
        beatType = 'mid'; // Lead/vocal -> Tilt gate
      }
    }

    return {
      isBeat,
      beatType,
      energy: totalEnergy,
      bass: bassEnergy,
      mid: midEnergy,
      treble: trebleEnergy
    };
  }

  // Pre-computes beat transients for uploaded audio buffer
  static preScanBuffer(audioBuffer) {
    const data = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const stepSize = Math.floor(sampleRate * 0.02); // 20ms steps
    const peaks = [];

    let prevE = 0;
    for (let i = 0; i < data.length; i += stepSize) {
      let sum = 0;
      const end = Math.min(i + stepSize, data.length);
      for (let j = i; j < end; j++) {
        sum += data[j] * data[j];
      }
      const e = Math.sqrt(sum / (end - i));
      const delta = e - prevE;
      prevE = e;

      if (e > 0.15 && delta > 0.05) {
        peaks.push({
          time: i / sampleRate,
          energy: e
        });
      }
    }

    // Estimate BPM from inter-peak intervals
    let bpm = 120;
    if (peaks.length > 5) {
      const intervals = [];
      for (let i = 1; i < Math.min(peaks.length, 50); i++) {
        const dt = peaks[i].time - peaks[i - 1].time;
        if (dt > 0.3 && dt < 1.0) {
          intervals.push(dt);
        }
      }
      if (intervals.length > 0) {
        const avgDt = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        bpm = Math.round(60 / avgDt);
        if (bpm < 75) bpm *= 2;
        if (bpm > 180) bpm = Math.round(bpm / 2);
      }
    }

    return { bpm, peaks, duration: audioBuffer.duration };
  }
}
