import { AudioAnalyzer } from '../audio/AudioAnalyzer';

export class UIManager {
    private container: HTMLElement;
    private analyzer: AudioAnalyzer;
    private fileInput: HTMLInputElement | null = null;

    constructor(container: HTMLElement, analyzer: AudioAnalyzer) {
        this.container = container;
        this.analyzer = analyzer;
        this.setupUI();
    }

    private setupUI() {
        const uploadSection = document.createElement('div');
        uploadSection.style.position = 'absolute';
        uploadSection.style.top = '20px';
        uploadSection.style.left = '20px';
        uploadSection.style.zIndex = '100';
        uploadSection.style.pointerEvents = 'auto';

        // Use the file input from index.html
        this.fileInput = document.getElementById('file-input') as HTMLInputElement;
        
        if (this.fileInput) {
            this.fileInput.addEventListener('change', async (e) => {
                const target = e.target as HTMLInputElement;
                if (target.files && target.files[0]) {
                    await this.analyzer.loadAudio(target.files[0]);
                    // Hide the start hint when file is loaded
                    const hint = document.getElementById('start-hint');
                    if (hint) hint.style.display = 'none';
                }
            });
        }

        const volumeMeterContainer = document.createElement('div');
        volumeMeterContainer.id = 'volume-meter-container';
        volumeMeterContainer.style.width = '200px';
        volumeMeterContainer.style.height = '20px';
        volumeMeterContainer.style.backgroundColor = '#333';
        volumeMeterContainer.style.border = '1px solid #fff';
        volumeMeterContainer.style.marginTop = '10px';

        const volumeMeter = document.createElement('div');
        volumeMeter.id = 'volume-meter';
        volumeMeter.style.width = '0%';
        volumeMeter.style.height = '100%';
        volumeMeter.style.backgroundColor = '#00ff00';

        volumeMeterContainer.appendChild(volumeMeter);
        uploadSection.appendChild(this.fileInput!);
        uploadSection.appendChild(volumeMeterContainer);
        this.container.appendChild(uploadSection);

        // Update volume meter in the animation loop
        const update = () => {
            const volume = this.analyzer.getVolume();
            // Scale volume (0-1) to 0-100%
            const percent = Math.min(100, volume * 100);
            volumeMeter.style.width = `${percent}%`;
            requestAnimationFrame(update);
        };
        update();
    }
}
