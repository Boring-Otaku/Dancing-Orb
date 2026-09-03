// Unified Cross-Platform Input Controller (Keyboard, Mouse, Touch Swipes, Gamepad)
export class Controls {
  constructor(onAction, onSteer) {
    this.onAction = onAction; // (action: 'SQUASH' | 'TILT_LEFT' | 'TILT_RIGHT' | 'SPLIT')
    this.onSteer = onSteer;   // (lateral: [-1.0 to 1.0])

    this.keys = {};
    this.steerX = 0;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.isPointerDown = false;

    this.initKeyboard();
    this.initMouse();
    this.initTouch();
    this.initGamepad();
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.keys[e.code] = true;

      if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        this.onAction('SQUASH');
      } else if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        this.onAction('TILT_LEFT');
        this.steerX = -0.8;
      } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        this.onAction('TILT_RIGHT');
        this.steerX = 0.8;
      } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        this.onAction('SPLIT');
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (
        (e.code === 'KeyA' || e.code === 'ArrowLeft') &&
        !this.keys['KeyD'] && !this.keys['ArrowRight']
      ) {
        this.steerX = 0;
      }
      if (
        (e.code === 'KeyD' || e.code === 'ArrowRight') &&
        !this.keys['KeyA'] && !this.keys['ArrowLeft']
      ) {
        this.steerX = 0;
      }
    });
  }

  initMouse() {
    window.addEventListener('mousemove', (e) => {
      // Normalize mouse X from center [-1 to 1]
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      this.steerX = normX;
    });
  }

  initTouch() {
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        this.isPointerDown = true;

        if (e.touches.length === 2) {
          // Two finger tap -> Split-Snap
          this.onAction('SPLIT');
        }
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const currentX = e.touches[0].clientX;
        const normX = (currentX / window.innerWidth) * 2 - 1;
        this.steerX = normX;
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (e.changedTouches.length > 0) {
        const dx = e.changedTouches[0].clientX - this.touchStartX;
        const dy = e.changedTouches[0].clientY - this.touchStartY;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        const swipeThreshold = 35;

        if (absX > swipeThreshold || absY > swipeThreshold) {
          if (absY > absX) {
            if (dy < 0) this.onAction('SQUASH'); // Swipe up
            else this.onAction('SPLIT');         // Swipe down
          } else {
            if (dx < 0) this.onAction('TILT_LEFT'); // Swipe left
            else this.onAction('TILT_RIGHT');       // Swipe right
          }
        }
      }
      this.isPointerDown = false;
    });
  }

  initGamepad() {
    this.gamepadConnected = false;
    window.addEventListener('gamepadconnected', () => {
      this.gamepadConnected = true;
    });
    window.addEventListener('gamepaddisconnected', () => {
      this.gamepadConnected = false;
    });
  }

  update() {
    // Poll gamepad if available
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    if (gamepads && gamepads[0]) {
      const gp = gamepads[0];

      // Left analog stick horizontal for steering
      if (Math.abs(gp.axes[0]) > 0.15) {
        this.steerX = gp.axes[0];
      }

      // Buttons / D-Pad
      if (gp.buttons[12]?.pressed || gp.buttons[0]?.pressed) {
        this.onAction('SQUASH'); // D-pad up / A
      } else if (gp.buttons[14]?.pressed || gp.buttons[4]?.pressed) {
        this.onAction('TILT_LEFT'); // D-pad left / LB
      } else if (gp.buttons[15]?.pressed || gp.buttons[5]?.pressed) {
        this.onAction('TILT_RIGHT'); // D-pad right / RB
      } else if (gp.buttons[13]?.pressed || gp.buttons[7]?.pressed) {
        this.onAction('SPLIT'); // D-pad down / RT
      }
    }

    this.onSteer(this.steerX);
  }
}
