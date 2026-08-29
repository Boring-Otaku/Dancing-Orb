

export class AudioManager {
  constructor() {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.sourceNode = null; // will be set when media element provided
  }

  /**
   * Provide the media element (HTMLAudioElement or HTMLVideoElement) to analyze.
   */
  setMediaElement(mediaEl) {
    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }
    this.sourceNode = this.audioCtx.createMediaElementSource(mediaEl);
    this.sourceNode.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination); // optional, allows sound to play
  }

  /**
   * Returns the current frequency data.
   */
  update() {
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }

  getBass() {
    // sum of lowest 10 bins
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += this.dataArray[i];
    }
    return sum / 10;
  }

  getMid() {
    let sum = 0;
    for (let i = 10; i < 30; i++) {
      sum += this.dataArray[i];
    }
    return sum / 20;
  }

  getTreble() {
    let sum = 0;
    for (let i = 30; i < 60; i++) {
      sum += this.dataArray[i];
    }
    return sum / 30;
  }
}
