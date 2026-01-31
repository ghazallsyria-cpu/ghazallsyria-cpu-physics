
import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

// Singleton promise to ensure the script is loaded only once.
let ytApiPromise: Promise<any>;

function loadYouTubeAPI() {
  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve) => {
      // If API is already available, resolve immediately.
      if (window.YT && window.YT.Player) {
        return resolve(window.YT);
      }
      
      // The API will call this global function when ready.
      window.onYouTubeIframeAPIReady = () => {
        resolve(window.YT);
      };

      // Check if script tag already exists to avoid duplicates.
      // If it exists, the onYouTubeIframeAPIReady will still fire when it's done.
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    });
  }
  return ytApiPromise;
}


interface YouTubePlayerProps {
  videoId: string;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ videoId }) => {
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstance = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    const createPlayer = (YT: any) => {
      // Ensure component is still mounted and refs are valid
      if (!isMounted || !playerRef.current || playerInstance.current) {
        return;
      }
      playerInstance.current = new YT.Player(playerRef.current.id, {
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          playsinline: 1, // Crucial for inline playback on iOS and other mobile browsers
          modestbranding: 1,
          origin: window.location.origin,
        },
      });
    };

    // Load the API and then create the player
    loadYouTubeAPI().then(YT => {
      createPlayer(YT);
    });

    // Cleanup function
    return () => {
      isMounted = false;
      if (playerInstance.current && typeof playerInstance.current.destroy === 'function') {
        playerInstance.current.destroy();
        playerInstance.current = null;
      }
    };
  }, [videoId]); // Rerun effect if videoId changes

  // Use a random suffix for ID to avoid collisions if the same video is rendered twice
  const playerId = `yt-player-${videoId}-${Math.random().toString(36).substring(7)}`;
  return <div id={playerId} ref={playerRef} className="w-full h-full" />;
};

export default YouTubePlayer;
