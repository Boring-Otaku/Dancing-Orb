export class AudioUI {
  constructor(audioManager, onModeChange, onRestart) {
    this.audio = audioManager;
    this.onModeChange = onModeChange;
    this.onRestart = onRestart;

    this.createDom();
  }

  createDom() {
    this.menuBtn = document.createElement('button');
    this.menuBtn.className = 'btn-top-menu';
    this.menuBtn.innerHTML = '⚙ TRACK / MODE';
    document.body.appendChild(this.menuBtn);

    this.modal = document.createElement('div');
    this.modal.className = 'modal-backdrop audio-settings-modal';
    this.modal.style.display = 'none';
    this.modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h2 class="neon-cyan">AUDIO & GAME MODES</h2>
          <button class="btn-close" id="btn-close-settings">&times;</button>
        </div>

        <div class="setting-section">
          <h3>SELECT GAME MODE</h3>
          <div class="mode-buttons-row">
            <button class="btn-mode active" data-mode="ENDLESS">
              <strong>Endless Flow</strong>
              <span>Ambient Zen Visualizer (Zero Fail)</span>
            </button>
            <button class="btn-mode" data-mode="CHOREO">
              <strong>Choreo-Challenge</strong>
              <span>60s Precision Puzzle (3 Strikes)</span>
            </button>
            <button class="btn-mode" data-mode="GHOST">
              <strong>Ghost Dance</strong>
              <span>Race Your Personal Best Ghost</span>
            </button>
          </div>
        </div>

        <div class="setting-section">
          <h3>AUDIO SOURCE</h3>
          <div class="audio-source-row">
            <button class="btn-neon" id="btn-procedural">Procedural Synth Track (128 BPM)</button>
            <label class="btn-neon file-label">
              <span>Upload Custom Song (.mp3, .wav)</span>
              <input type="file" id="input-audio-file" accept="audio/*" style="display:none;" />
            </label>
          </div>
        </div>

        <div class="setting-section">
          <h3>CALIBRATION & LATENCY OFFSET</h3>
          <div class="slider-row">
            <label>Offset: <span id="label-offset">0 ms</span></label>
            <input type="range" id="slider-offset" min="-150" max="150" value="0" step="5" />
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-neon primary" id="btn-resume-game">RESUME FLOW</button>
        </div>
      </div>
    `;
    document.body.appendChild(this.modal);

    // Event handlers
    this.menuBtn.onclick = () => {
      this.modal.style.display = 'flex';
    };

    this.modal.querySelector('#btn-close-settings').onclick = () => {
      this.modal.style.display = 'none';
    };

    this.modal.querySelector('#btn-resume-game').onclick = () => {
      this.modal.style.display = 'none';
    };

    // Mode selection
    const modeBtns = this.modal.querySelectorAll('.btn-mode');
    modeBtns.forEach(btn => {
      btn.onclick = () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-mode');
        this.onModeChange(mode);
      };
    });

    // Procedural track button
    this.modal.querySelector('#btn-procedural').onclick = () => {
      this.audio.startProcedural();
      this.modal.style.display = 'none';
      if (this.onRestart) this.onRestart();
    };

    // Audio file uploader
    const fileInput = this.modal.querySelector('#input-audio-file');
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        await this.audio.loadAudioFile(file);
        this.modal.style.display = 'none';
        if (this.onRestart) this.onRestart();
      }
    };

    // Latency offset slider
    const offsetSlider = this.modal.querySelector('#slider-offset');
    const offsetLabel = this.modal.querySelector('#label-offset');
    offsetSlider.oninput = (e) => {
      const val = parseInt(e.target.value);
      offsetLabel.textContent = `${val > 0 ? '+' : ''}${val} ms`;
      this.audio.audioOffset = val / 1000;
    };
  }
}
