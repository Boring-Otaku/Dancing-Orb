export class AudioAnalyzer {
  constructor() {
    this.audioContext = null;
    this.analyzer = null;
    this.source = null;
    this.dataArray = null;
    this.bufferLength = 0;
    this.beatCallbacks = [];
  }
  async init() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.analyzer = this.audioContext.createAnalyser();
    this.analyzer.fftSize = 2048;
    this.bufferLength = this.analyzer.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
  }
  async loadAudio(file) {
    if (!this.audioContext) await this.init();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    this.source?.stop();
    this.source = this.audioContext.createBufferSource();
    this.source.buffer = audioBuffer;
    this.source.connect(this.analyzer);
    this.analyzer.connect(this.audioContext.destination);
    this.source.start(0);
  }
  getFrequencyData() {
    if (!this.analyzer || !this.dataArray) return null;
    this.analyzer.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }
  getVolume() {
    const arr = this.getFrequencyData();
    if (!arr) return 0;
    let sum = 0;
    for (let i = 0; i < arr.length; i++) sum += arr[i];
    return sum / arr.length;
  }
  onBeat(cb) {
    this.beatCallbacks.push(cb);
  }
}
