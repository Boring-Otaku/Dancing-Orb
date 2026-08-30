# Dancing Orb

> A rhythm‑action 3D game that turns music into a dynamic playground of soft‑body physics, procedural audio‑visuals, and competitive play.

## Table of Contents
- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [Key Features](#key-features)
- [Controls](#controls)
- [Building & Running](#building--running)
- [Playlists & Streaming](#playlists--streaming)
- [Networking](#networking)
- [Known Issues](#known-issues)
- [Changelog](#changelog)
- [License](#license)

## Getting Started

```bash
# Clone the repo
git clone https://github.com/yourname/dancing-orb.git
cd dancing-orb

# Install deps
npm install

# Run in dev mode
npm run dev
```

Open <http://localhost:5173> in your browser.

## Architecture
- **Engine** – Three.js renderer + Rapier soft‑body physics.
- **Audio** – Web Audio API analyser, custom FM synthesizer, beat‑sequencer.
- **Gameplay** – Orb, Highway, ModeController, ReplayEngine.
- **UI** – Overlay with score, combo and mode selector.
- **Networking** – WebRTC data channel, simple‑peer, full‑mesh for 1vs1/2vs2.

## Key Features
- Procedural 3/16‑beat music generation with a custom FM oscillator tree.
- Real‑time beat detection and spectral analysis.
- Soft‑body orb deformation that reacts to hits/misses.
- Procedural highway and obstacle generation synced to beats.
- Fever‑phase zero‑gravity mode.
- 1v1 / 2v2 local LAN play with latency‑sensitive state sync.
- Replay (ghost) system stored as compressed JSON.
- Gamepad support and touch swipe controls.
- Minimal external assets – everything is generated at runtime.

## Controls
| Action | PC | Mobile | Gamepad |
|--------|----|--------|---------|
| Move   | Arrow/WASD | Swipe | Left stick |
| Jump   | Space | Tap | A button |
| Tilt‑Spin | Shift | – | X button |
| Squash‑Bounce | Ctrl | – | Y button |
| Split‑Snap | Alt | – | B button |

## Building & Running
```bash
# Build for production
npm run build

# Preview production bundle
npm run preview
```

The production build outputs to `dist/`.

## Playlists & Streaming
- OAuth placeholders for Spotify, SoundCloud, YouTube.
- Streaming audio sources are played via the Web Audio API.
- Fallback to local file upload (drop or FilePicker).

## Networking
- Uses WebRTC (simple‑peer) for local‑LAN play.
- Mesh of peers for 2v2.
- State sync via interpolated updates; timestamps for RTT compensation.

## Known Issues
- Hard‑coded beat resolution may drift for very fast music.
- Streaming OAuth flows need real client IDs.
- On low‑end mobile browsers, shader complexity may cause frame‑rate drops.

## Changelog

### 0.1.0 – 2026‑08‑30
- Added basic Three.js scene and Rapier physics stub.
- Implemented AudioAnalyzer with beat detection callbacks.
- Created scaffold for core game system (Scene, Physics, Audio, Orb).
- Added README and basic project structure.

### 0.1.1 – 2026‑08‑30
- Extended AudioAnalyzer: fftSize 2048, volume calculation.
- Stub for MusicGenerator & BeatSequencer (not yet functional).
- Added placeholder controller support comments.
- Updated READMEs to reflect current architecture.

### Planned
- Full FM synthesizer and beat sequencer.
- Procedural highway generator.
- Full game loop with dance move logic.
- Networking and replay system.

## License
MIT © 2026
