import { AudioAnalyzer } from '../audio/AudioAnalyzer';

/**
 * UIManager - Handles UI elements and user interactions
 * Manages file uploads, volume meter display, and user messages
 */
export class UIManager {
  private readonly container: HTMLElement;
  private readonly analyzer: AudioAnalyzer;
  private fileInput: HTMLInputElement | null = null;
  private volumeMeter: HTMLDivElement | null = null;
  private isInitialized: boolean = false;

  constructor(container: HTMLElement, analyzer: AudioAnalyzer) {
    this.container = container;
    this.analyzer = analyzer;
    this.setupUI();
  }

  /**
   * Setup all UI elements including file input and volume meter
   */
  private setupUI(): void {
    // Create upload section container
    const uploadSection = document.createElement('div');
    Object.assign(uploadSection.style, {
      position: 'absolute',
      top: '20px',
      left: '20px',
      zIndex: '100',
      pointerEvents: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    });

    // File input
    this.fileInput = document.getElementById('file-input') as HTMLInputElement;

    if (this.fileInput) {
      this.fileInput.addEventListener('change', async (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files[0]) {
          try {
            await this.analyzer.loadAudio(target.files[0]);
            // Hide the start hint when file is loaded
            const hint = document.getElementById('start-hint');
            if (hint) hint.style.display = 'none';
          } catch (error) {
            console.error('Failed to load audio:', error);
            this.showMessage('Failed to load audio file. Please try another file.', 3000);
          }
        }
      });
    }

    // Volume meter container
    const volumeMeterContainer = document.createElement('div');
    Object.assign(volumeMeterContainer.style, {
      width: '200px',
      height: '20px',
      backgroundColor: '#333',
      border: '1px solid #fff',
      borderRadius: '10px',
      overflow: 'hidden',
    });

    // Volume meter bar
    this.volumeMeter = document.createElement('div');
    this.volumeMeter.id = 'volume-meter';
    Object.assign(this.volumeMeter.style, {
      width: '0%',
      height: '100%',
      backgroundColor: '#00ff00',
      transition: 'width 0.1s ease, background-color 0.1s ease',
    });

    volumeMeterContainer.appendChild(this.volumeMeter);
    uploadSection.appendChild(this.fileInput);
    uploadSection.appendChild(volumeMeterContainer);
    this.container.appendChild(uploadSection);

    this.isInitialized = true;
  }

  /**
   * Update the volume meter display based on current audio level
   * @param volume - Normalized volume value (0-1)
   */
  public updateVolumeMeter(volume: number): void {
    if (!this.volumeMeter) return;
    
    const percent = Math.min(100, Math.max(0, volume * 100));
    this.volumeMeter.style.width = `${percent}%`;
    
    // Change color based on volume level
    if (percent < 30) {
      this.volumeMeter.style.backgroundColor = '#00ff00'; // Green
    } else if (percent < 70) {
      this.volumeMeter.style.backgroundColor = '#ffff00'; // Yellow
    } else {
      this.volumeMeter.style.backgroundColor = '#ff0000'; // Red
    }
  }

  /**
   * Show a temporary message to the user
   * @param message - Message text to display
   * @param duration - Duration in milliseconds (optional, auto-remove if provided)
   */
  public showMessage(message: string, duration?: number): void {
    const msgEl = document.createElement('div');
    msgEl.textContent = message;
    Object.assign(msgEl.style, {
      position: 'absolute',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: '#fff',
      padding: '10px 20px',
      borderRadius: '5px',
      zIndex: '1000',
      fontFamily: 'sans-serif',
    });
    
    this.container.appendChild(msgEl);
    
    if (duration) {
      setTimeout(() => {
        msgEl.remove();
      }, duration);
    }
  }

  /**
   * Check if UI manager is initialized and ready
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Cleanup UI resources
   */
  public dispose(): void {
    if (this.fileInput) {
      this.fileInput.removeEventListener('change', () => {});
      this.fileInput = null;
    }
    if (this.volumeMeter) {
      this.volumeMeter.remove();
      this.volumeMeter = null;
    }
    this.container.innerHTML = '';
    this.isInitialized = false;
  }
}
