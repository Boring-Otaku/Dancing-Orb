export class AudioAnalyzer {
  private audioContext: AudioContext | null = null
  private analyzer: AnalyserNode | null = null
  private source: AudioBufferSourceNode | null = null
  private dataArray: Uint8Array | null = null
  private bufferLength: number = 0
  private beatCallbacks: Array<() => void> = []

  constructor() {}

  public async init() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    this.analyzer = this.audioContext.createAnalyser()
    this.analyzer.fftSize = 2048
    this.bufferLength = this.analyzer.frequencyBinCount
    this.dataArray = new Uint8Array(this.bufferLength)
  }

  public async loadAudio(file: File): Promise<void> {
    if (!this.audioContext) await this.init()
    const arrayBuffer = await file.arrayBuffer()
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
    this.source?.stop()
    this.source = this.audioContext.createBufferSource()
    this.source.buffer = audioBuffer
    this.source.connect(this.analyzer!)
    this.analyzer!.connect(this.audioContext.destination)
    this.source.start(0)
  }

  public getFrequencyData(): Uint8Array | null {
    if (!this.analyzer || !this.dataArray) return null
    this.analyzer.getByteFrequencyData(this.dataArray)
    return this.dataArray
  }

  public getVolume(): number {
    const arr = this.getFrequencyData()
    if (!arr) return 0
    let sum = 0
    for (let i = 0; i < arr.length; i++) sum += arr[i]
    return sum / arr.length
  }

  public onBeat(cb: () => void) {
    this.beatCallbacks.push(cb)
  }
}
