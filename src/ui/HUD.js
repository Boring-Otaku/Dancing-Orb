export class HUD {
  constructor(container) {
    this.container = container;
    this.createDom();
    this.timingFadeTimeout = null;
  }

  createDom() {
    this.dom = document.createElement('div');
    this.dom.className = 'hud-overlay';
    this.dom.innerHTML = `
      <!-- Top Status Bar -->
      <div class="hud-top-bar">
        <div class="hud-stat-box">
          <span class="hud-label">SCORE</span>
          <span id="hud-score" class="hud-value neon-cyan">0</span>
        </div>
        <div class="hud-stat-box">
          <span class="hud-label">COMBO</span>
          <span id="hud-combo" class="hud-value neon-magenta">0x</span>
        </div>
        <div class="hud-stat-box" id="hud-timer-container" style="display:none;">
          <span class="hud-label">TIME</span>
          <span id="hud-time" class="hud-value neon-yellow">60.0s</span>
        </div>
        <div class="hud-stat-box" id="hud-strikes-container" style="display:none;">
          <span class="hud-label">STRIKES</span>
          <span id="hud-strikes" class="hud-value neon-red">0 / 3</span>
        </div>
      </div>

      <!-- Center Dynamic Timing Accuracy Flash -->
      <div id="hud-timing-popup" class="hud-timing-feedback"></div>

      <!-- Circular Groove Meter & Core Reticle -->
      <div class="groove-meter-container">
        <svg class="groove-svg" viewBox="0 0 160 160">
          <circle class="groove-bg" cx="80" cy="80" r="70" />
          <circle id="groove-circle-fill" class="groove-fill" cx="80" cy="80" r="70" />
        </svg>
        <div class="groove-text-box">
          <span class="groove-label">GROOVE</span>
          <span id="groove-percent" class="groove-num">0%</span>
        </div>
      </div>

      <!-- Bottom Audio Reactive Status & Controls Help -->
      <div class="hud-bottom-bar">
        <div class="audio-spectrum-bars">
          <div class="eq-bar" id="eq-bass"></div>
          <div class="eq-bar" id="eq-mid"></div>
          <div class="eq-bar" id="eq-treble"></div>
        </div>
        <div class="current-track-tag">
          <span class="pulse-dot"></span>
          <span id="hud-track-title">Neon Circuit (128 BPM)</span>
        </div>
        <div class="hud-keys-hint">
          <span class="key-tag">W: Squash</span>
          <span class="key-tag">A/D: Tilt</span>
          <span class="key-tag">S: Split</span>
          <span class="key-tag">Mouse: Steer</span>
        </div>
      </div>

      <!-- Fever Phase Banner -->
      <div id="fever-banner" class="fever-banner">
        FEVER PHASE - ZERO GRAVITY MULTIPLIER!
      </div>

      <!-- Game Over / Victory Modal -->
      <div id="modal-gameover" class="modal-backdrop" style="display:none;">
        <div class="modal-card">
          <h2 id="modal-title" class="neon-magenta">RUN COMPLETE</h2>
          <div class="modal-grade" id="modal-grade">S</div>
          <div class="modal-details">
            <p>FINAL SCORE: <strong id="modal-final-score" class="neon-cyan">0</strong></p>
            <p>MAX COMBO: <strong id="modal-final-combo" class="neon-yellow">0</strong></p>
          </div>
          <button id="modal-btn-restart" class="btn-neon">PLAY AGAIN</button>
        </div>
      </div>
    `;

    this.container.appendChild(this.dom);

    // Cache elements
    this.elScore = this.dom.querySelector('#hud-score');
    this.elCombo = this.dom.querySelector('#hud-combo');
    this.elTimerCont = this.dom.querySelector('#hud-timer-container');
    this.elTime = this.dom.querySelector('#hud-time');
    this.elStrikesCont = this.dom.querySelector('#hud-strikes-container');
    this.elStrikes = this.dom.querySelector('#hud-strikes');
    this.elTiming = this.dom.querySelector('#hud-timing-popup');
    this.elGrooveFill = this.dom.querySelector('#groove-circle-fill');
    this.elGroovePercent = this.dom.querySelector('#groove-percent');
    this.elFeverBanner = this.dom.querySelector('#fever-banner');
    this.elEqBass = this.dom.querySelector('#eq-bass');
    this.elEqMid = this.dom.querySelector('#eq-mid');
    this.elEqTreble = this.dom.querySelector('#eq-treble');
    this.elTrackTitle = this.dom.querySelector('#hud-track-title');
    this.modalGameOver = this.dom.querySelector('#modal-gameover');
    this.modalTitle = this.dom.querySelector('#modal-title');
    this.modalGrade = this.dom.querySelector('#modal-grade');
    this.modalFinalScore = this.dom.querySelector('#modal-final-score');
    this.modalFinalCombo = this.dom.querySelector('#modal-final-combo');
    this.btnRestart = this.dom.querySelector('#modal-btn-restart');
  }

  update(score, combo, grooveMeter, audioData, mode, timer, strikes) {
    this.elScore.textContent = score.toLocaleString();
    this.elCombo.textContent = `${combo}x`;

    // Groove circle circumference = 2 * PI * 70 = ~439.8
    const circumference = 439.8;
    const progress = Math.min(1.0, Math.max(0.0, grooveMeter / 100));
    const offset = circumference * (1 - progress);
    this.elGrooveFill.style.strokeDasharray = `${circumference}`;
    this.elGrooveFill.style.strokeDashoffset = `${offset}`;
    this.elGroovePercent.textContent = `${Math.round(grooveMeter)}%`;

    if (grooveMeter >= 100) {
      this.elGrooveFill.style.stroke = '#ffff00';
    } else {
      this.elGrooveFill.style.stroke = '#00f3ff';
    }

    // Mode-specific displays
    if (mode === 'CHOREO') {
      this.elTimerCont.style.display = 'flex';
      this.elStrikesCont.style.display = 'flex';
      this.elTime.textContent = `${timer.toFixed(1)}s`;
      this.elStrikes.textContent = `${strikes} / 3`;
    } else {
      this.elTimerCont.style.display = 'none';
      this.elStrikesCont.style.display = 'none';
    }

    // Audio equalizer bars
    if (audioData) {
      this.elEqBass.style.height = `${Math.round((audioData.bass || 0) * 100)}%`;
      this.elEqMid.style.height = `${Math.round((audioData.mid || 0) * 100)}%`;
      this.elEqTreble.style.height = `${Math.round((audioData.treble || 0) * 100)}%`;
    }
  }

  showTimingFeedback(rating) {
    if (this.timingFadeTimeout) clearTimeout(this.timingFadeTimeout);

    this.elTiming.className = 'hud-timing-feedback show ' + rating.toLowerCase();
    this.elTiming.textContent = rating === 'PERFECT' ? '✦ PERFECT ✦' :
                               rating === 'GREAT' ? 'GREAT' : 'DESTABILIZED!';

    this.timingFadeTimeout = setTimeout(() => {
      this.elTiming.className = 'hud-timing-feedback';
    }, 600);
  }

  setFever(active) {
    if (active) {
      this.elFeverBanner.classList.add('active');
    } else {
      this.elFeverBanner.classList.remove('active');
    }
  }

  setTrackTitle(name) {
    this.elTrackTitle.textContent = name;
  }

  showGameOver(info, onRestart) {
    this.modalGameOver.style.display = 'flex';
    this.modalTitle.textContent = info.success ? 'CHALLENGE CLEARED!' : 'ORB DESTABILIZED';
    this.modalTitle.className = info.success ? 'neon-cyan' : 'neon-red';
    this.modalGrade.textContent = info.grade;
    this.modalFinalScore.textContent = info.score.toLocaleString();
    this.modalFinalCombo.textContent = `${info.maxCombo}x`;

    this.btnRestart.onclick = () => {
      this.modalGameOver.style.display = 'none';
      if (onRestart) onRestart();
    };
  }
}
