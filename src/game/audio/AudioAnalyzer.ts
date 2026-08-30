export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private bufferLength: number = 0;

  constructor() {}

  async init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(this.bufferLength);
    }
  }

  async setMediaElement(el: HTMLMediaElement) {
    await this.init();
    const source = this.audioContext!.createMediaElementSource(el);
    source.connect(this.analyser!).connect(this.audioContext!.destination);
  }

  async loadAudio(file: File) {
    await this.init();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
    
    const source = this.audioContext!.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.analyser!).connect(this.audioContext!.destination);
    source.start(0);
    
    // Also connect to an audio element for controls
    const audioEl = document.getElementById('audio') as HTMLAudioElement;
    if (audioEl) {
      audioEl.src = URL.createObjectURL(file);
      audioEl.play();
    }
  }

  getFrequencyData(): Uint8Array | null {
    if (!this.analyser || !this.dataArray) return null;
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }

  getVolume(): number {
    const data = this.getFrequencyData();
    if (!data) return 0;
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    return sum / data.length / 255;
  }
}
