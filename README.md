# Dancing Orb

> A rhythm-action 3D game that turns music into a dynamic playground of soft-body physics, procedural audio-visuals, and competitive play.

## Table of Contents

- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [Key Features](#key-features)
- [Controls](#controls)
- [Building & Running](#building--running)
- [Playlists & Streaming](#playlists--streaming)
- [Known Issues](#known-issues)
- [License](#license)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Clone the repo
git clone https://github.com/yourname/dancing-orb.git
cd dancing-orb

# Install dependencies
npm install

# Run in development mode
npm run dev
```

Open <http://localhost:5173> in your browser.

## Architecture

The project is organized into modular components:

```
src/
├── main.ts                 # Application entry point
├── game/
│   ├── audio/
│   │   └── AudioAnalyzer.ts    # Web Audio API analyzer
│   ├── engine/
│   │   ├── Scene.ts            # Three.js scene management
│   │   └── Physics.ts          # Rapier physics integration
│   ├── entities/
│   │   ├── Orb.ts              # Main player character
│   │   └── Highway.ts          # Reactive highway with shaders
│   └── ui/
│       └── UIManager.ts        # UI components and interactions
```

### Core Components

- **Engine**: Three.js renderer + Rapier physics engine
- **Audio**: Web Audio API analyzer with real-time frequency analysis
- **Gameplay**: Orb entity with reactive visuals, procedural highway generation
- **UI**: Overlay with volume meter and file upload controls
- **Networking**: Planned WebRTC support for 1v1/2v2 multiplayer

## Key Features

- 🎵 Real-time audio analysis with frequency spectrum visualization
- 🎨 Procedural highway with custom GLSL shaders reacting to music
- 🔮 Soft-body orb deformation synced to audio intensity
- 📊 Dynamic volume meter with color-coded feedback
- 🎮 Gamepad support planned
- 🌐 Multiplayer LAN play planned (WebRTC)
- 📦 Minimal external assets - everything generated at runtime

## Controls

| Action | PC | Mobile | Gamepad |
|--------|----|--------|---------|
| Move | Arrow/WASD | Swipe | Left stick |
| Jump | Space | Tap | A button |
| Special Actions | Shift/Ctrl/Alt | – | X/Y/B buttons |

## Building & Running

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

The production build outputs to `dist/`.

### Preview Production Build

```bash
npm run preview
```

## Playlists & Streaming

Currently supports local audio file upload. Future versions will include:

- Spotify Web Playback SDK integration
- SoundCloud API integration
- YouTube IFrame API integration

## Known Issues

- Hard-coded beat resolution may drift for very fast music
- Streaming OAuth flows need real client IDs
- On low-end mobile browsers, shader complexity may cause frame-rate drops

## Changelog

### 0.2.0 – Current (Refactored)

- ✨ Complete TypeScript refactoring of all game modules
- 🧹 Removed duplicate and legacy JavaScript files
- 📝 Added comprehensive JSDoc documentation
- 🎨 Improved code organization and structure
- 🔧 Enhanced error handling and type safety
- 🎯 Better separation of concerns between modules

### 0.1.1 – 2026-08-30

- Extended AudioAnalyzer: fftSize 2048, volume calculation
- Stub for MusicGenerator & BeatSequencer (not yet functional)
- Added placeholder controller support comments

### 0.1.0 – 2026-08-30

- Added basic Three.js scene and Rapier physics stub
- Implemented AudioAnalyzer with beat detection callbacks
- Created scaffold for core game system (Scene, Physics, Audio, Orb)
- Added README and basic project structure

## Planned Features

- [ ] Full FM synthesizer and beat sequencer
- [ ] Procedural obstacle generation synced to beats
- [ ] Fever-phase zero-gravity mode
- [ ] Complete game loop with dance move logic
- [ ] Networking and replay system
- [ ] Score and combo system
- [ ] Multiple visual themes

## License

MIT © 2026
