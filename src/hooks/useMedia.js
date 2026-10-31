import { useState, useEffect, useRef } from 'react';
import {
  parseLrc,
  queryLrcLib,
  parseYouTubeTitle,
  cleanTrackTitle,
  cleanChannelArtist,
} from '../services/lyrics.js';

const INITIAL_MEDIA = {
  hasMedia: false,
  title: 'Belum ada musik',
  artist: 'Putar lagu di Spotify / Browser',
  isPlaying: false,
  position: 0,
  duration: 1,
  thumbnail: null,
};

export function useMedia() {
  const [media, setMedia] = useState(INITIAL_MEDIA);
  const [lyrics, setLyrics] = useState([]);
  const [lyricStatus, setLyricStatus] = useState('idle');
  const [fallbackCover, setFallbackCover] = useState(null);
  const lastFetchedTrack = useRef('');

  // Subscribe to Electron media updates
  useEffect(() => {
    if (!window.electronAPI?.onMediaUpdate) return;
    const unsubscribe = window.electronAPI.onMediaUpdate((data) => {
      if (!data.hasMedia) {
        setMedia((prev) => ({
          ...prev,
          hasMedia: false,
          isPlaying: false,
        }));
      } else {
        setMedia((prev) => {
          const diff = Math.abs(prev.position - data.position);
          const smoothPos = (prev.title === data.title && diff <= 1.5) ? prev.position : data.position;
          return {
            ...data,
            thumbnail: data.thumbnail ?? prev.thumbnail,
            position: smoothPos,
          };
        });
      }
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  // Position interpolation when playing
  useEffect(() => {
    if (!media.isPlaying) return;
    const timer = setInterval(() => {
      setMedia((prev) => ({
        ...prev,
        position: Math.min(prev.duration, +(prev.position + 0.3).toFixed(2)),
      }));
    }, 300);
    return () => clearInterval(timer);
  }, [media.isPlaying]);

  // Fetch lyrics and cover art when track changes
  useEffect(() => {
    if (!media.hasMedia || !media.title || media.title === 'Tidak ada judul' || media.title === 'Belum ada musik') {
      return;
    }

    const trackKey = `${media.title}___${media.artist}`;
    if (trackKey === lastFetchedTrack.current) return;
    lastFetchedTrack.current = trackKey;

    const controller = new AbortController();
    setFallbackCover(null);
    let finished = false;

    async function fetchTrackExtras() {
      setLyricStatus('loading');
      setLyrics([]);

      const parsedYT = parseYouTubeTitle(media.title, media.artist);
      const cleanTitle = cleanTrackTitle(media.title);
      const primaryArtist = media.artist.split(',')[0].split('&')[0].trim();

      const searchTitle = parsedYT.title || cleanTitle;
      const searchArtist = parsedYT.artist || primaryArtist;

      const hints = [
        primaryArtist,
        media.artist,
        ...(parsedYT.isYouTubeLike ? [parsedYT.artist, cleanChannelArtist(media.artist)] : []),
      ].filter((h) => h && h.length > 1);

      try {
        const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(`${searchTitle} ${searchArtist}`.trim())}&entity=song&limit=1`;
        const resArt = await fetch(itunesUrl, { signal: controller.signal });
        const dataArt = await resArt.json();
        if (dataArt.results?.[0]?.artworkUrl100) {
          setFallbackCover(dataArt.results[0].artworkUrl100.replace('100x100bb', '300x300bb'));
        }
      } catch { }

      try {
        let lrcData = null;

        lrcData = await queryLrcLib(parsedYT.title, parsedYT.artist, controller.signal, hints);

        if (!lrcData || (!lrcData.syncedLyrics && !lrcData.plainLyrics)) {
          if (cleanTitle !== parsedYT.title || primaryArtist !== parsedYT.artist) {
            lrcData = await queryLrcLib(cleanTitle, primaryArtist, controller.signal, hints);
          }
        }

        if (!lrcData || (!lrcData.syncedLyrics && !lrcData.plainLyrics)) {
          const fallbackTitle = parsedYT.title || cleanTitle;
          if (fallbackTitle) {
            lrcData = await queryLrcLib(fallbackTitle, '', controller.signal, hints);
          }
        }

        if (lrcData?.syncedLyrics) {
          const parsed = parseLrc(lrcData.syncedLyrics);
          if (parsed.length > 0) {
            setLyrics(parsed);
            setLyricStatus('synced');
            return;
          }
        }

        if (lrcData?.plainLyrics) {
          const plainLines = lrcData.plainLyrics
            .split('\n')
            .map((t) => t.trim())
            .filter(Boolean)
            .map((text, idx) => ({ time: idx * 4, text }));
          setLyrics(plainLines);
          setLyricStatus('plain');
          return;
        }

        setLyricStatus('not_found');
      } catch (err) {
        if (err.name !== 'AbortError') {
          setLyricStatus('not_found');
        }
      }
    }

    fetchTrackExtras().then(() => {
      finished = !controller.signal.aborted;
    });
    return () => {
      controller.abort();
      if (!finished && lastFetchedTrack.current === trackKey) {
        lastFetchedTrack.current = '';
      }
    };
  }, [media.title, media.artist, media.hasMedia]);

  const triggerControl = (action) => {
    if (window.electronAPI?.sendMediaControl) {
      window.electronAPI.sendMediaControl(action);
    }
  };

  const handleSeek = (e) => {
    if (!media.hasMedia || media.duration <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSeconds = Math.floor(percentage * media.duration);
    setMedia((prev) => ({ ...prev, position: targetSeconds }));
    triggerControl(`seek:${targetSeconds}`);
  };

  const displayCover = media.thumbnail || fallbackCover;

  return {
    media,
    setMedia,
    lyrics,
    lyricStatus,
    fallbackCover,
    displayCover,
    triggerControl,
    handleSeek,
  };
}