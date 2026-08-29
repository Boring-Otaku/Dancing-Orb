// Placeholder for Spotify integration
// Requires Spotify Web Playback SDK to be loaded separately.
export class SpotifyManager {
  constructor(mainInstance) {
    this.main = mainInstance;
    this.player = null;
    this.accessToken = null; // set after OAuth
  }

  init() {
    if (!window.Spotify) {
      console.warn('Spotify SDK not loaded');
      return;
    }
    this.player = new Spotify.Player({
      name: 'Dancing Orb Player',
      getOAuthToken: cb => { cb(this.accessToken); }
    });
    this.player.addListener('ready', ({ device_id }) => {
      console.log('Spotify ready with device_id', device_id);
      this.main.audio.setMediaElement(this.player.getMediaElement ? this.player.getMediaElement() : null);
    });
    this.player.addListener('not_ready', ({ device_id }) => console.log('Spotify not ready', device_id));
    this.player.connect();
  }

  setToken(token) {
    this.accessToken = token;
  }
}
