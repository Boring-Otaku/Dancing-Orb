// Placeholder for YouTube integration
export class YouTubeManager {
  constructor(mainInstance) {
    this.main = mainInstance;
    this.player = null;
  }

  // Load IFrame API if not already loaded
  loadAPI(callback) {
    if (window.YT && window.YT.Player) {
      callback();
      return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    window.onYouTubeIframeAPIReady = () => callback();
  }

  playVideo(videoId) {
    this.loadAPI(() => {
      this.player = new YT.Player('youtube-player', {
        height: '0',
        width: '0',
        videoId,
        events: {
          onReady: e => {
            const mediaEl = e.target.getIframe();
            if (mediaEl) {
              // Yt iframe returns video element inside it
              const video = mediaEl.contentWindow.document.querySelector('video');
              if (video) this.main.audio.setMediaElement(video);
            }
          }
        }
      });
    });
  }
}
