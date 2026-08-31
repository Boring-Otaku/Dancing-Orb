/**
 * AudioAnalyzer - Analyzes audio using the Web Audio API
 * Provides frequency data and volume calculations for visualizations
 */
export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;
  private sourceNode: AudioBufferSourceNode | MediaElementAudioSourceNode | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialize the audio context and analyzer
   * Must be called after user interaction due to browser autoplay policies
   */
  public async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array<ArrayBuffer>(bufferLength);
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize AudioAnalyzer:', error);
      throw new Error('Audio initialization failed');
    }
  }

  /**
   * Connect to a media element (audio or video)
   * @param mediaElement - The HTMLMediaElement to analyze
   */
  public async connectToMediaElement(mediaElement: HTMLMediaElement): Promise<void> {
    await this.init();
    
    if (!this.audioContext || !this.analyser) {
      throw new Error('AudioContext not initialized');
    }

    // Disconnect existing source if present
    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }

    this.sourceNode = this.audioContext.createMediaElementSource(mediaElement);
    this.sourceNode.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
  }

  /**
   * Load and play an audio file from a File object
   * @param file - The audio file to load
   */
  public async loadAudio(file: File): Promise<void> {
    await this.init();
    
    if (!this.audioContext || !this.analyser) {
      throw new Error('AudioContext not initialized');
    }

    // Disconnect existing source if present
    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      this.sourceNode = this.audioContext.createBufferSource();
      this.sourceNode.buffer = audioBuffer;
      this.sourceNode.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
      this.sourceNode.start(0);

      // Update audio element for controls display
      const audioElement = document.getElementById('audio') as HTMLAudioElement | null;
      if (audioElement) {
        audioElement.src = URL.createObjectURL(file);
        audioElement.play().catch(err => console.warn('Audio playback failed:', err));
      }
    } catch (error) {
      console.error('Failed to load audio file:', error);
      throw new Error('Failed to decode audio file');
    }
  }

  /**
   * Get current frequency data
   * @returns Uint8Array of frequency values (0-255) or null if not initialized
   */
  public getFrequencyData(): Uint8Array<ArrayBuffer> | null {
    if (!this.analyser || !this.dataArray || !this.isInitialized) {
      return null;
    }
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }

  /**
   * Calculate average volume from frequency data
   * @returns Normalized volume value between 0 and 1
   */
  public getVolume(): number {
    const data = this.getFrequencyData();
    if (!data || data.length === 0) return 0;
    
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    return sum / data.length / 255;
  }

  /**
   * Get bass frequency range average (lowest 10 bins)
   * @returns Average bass value (0-255)
   */
  public getBass(): number {
    return this.getFrequencyRangeAverage(0, 10);
  }

  /**
   * Get mid frequency range average (bins 10-30)
   * @returns Average mid value (0-255)
   */
  public getMid(): number {
    return this.getFrequencyRangeAverage(10, 30);
  }

  /**
   * Get treble frequency range average (bins 30-60)
   * @returns Average treble value (0-255)
   */
  public getTreble(): number {
    return this.getFrequencyRangeAverage(30, 60);
  }

  /**
   * Get average of a specific frequency range
   * @param startBin - Starting bin index
   * @param endBin - Ending bin index (exclusive)
   * @returns Average value in range (0-255)
   */
  private getFrequencyRangeAverage(startBin: number, endBin: number): number {
    const data = this.getFrequencyData();
    if (!data || data.length === 0) return 0;
    
    const actualEnd = Math.min(endBin, data.length);
    const actualStart = Math.min(startBin, actualEnd);
    
    if (actualStart >= actualEnd) return 0;
    
    let sum = 0;
    for (let i = actualStart; i < actualEnd; i++) {
      sum += data[i];
    }
    return sum / (actualEnd - actualStart);
  }

  /**
   * Check if the analyzer is ready to use
   */
  public isReady(): boolean {
    return this.isInitialized && this.audioContext !== null && this.analyser !== null;
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    this.audioContext = null;
    this.dataArray = null;
    this.isInitialized = false;
  }
}
