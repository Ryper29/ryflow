import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Disc,
  Loader2,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Wind,
  Plus,
  Check,
  Trash2,
  Pin,
  Sparkles,
} from 'lucide-react';

function parseLrc(lrcText) {
  if (!lrcText) return [];
  const lines = lrcText.split('\n');
  const parsed = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;

  for (const line of lines) {
    const matches = [...line.matchAll(timeRegex)];
    const text = line.replace(timeRegex, '').trim();
    if (!text) continue;

    for (const match of matches) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const ms = parseInt(match[3].padEnd(3, '0'), 10);
      const totalSeconds = minutes * 60 + seconds + ms / 1000;
      parsed.push({ time: totalSeconds, text });
    }
  }

  return parsed.sort((a, b) => a.time - b.time);
}

// ---------------------------------------------------------------------------
// Helper untuk membandingkan judul/artis saat memilih hasil pencarian lirik
// ---------------------------------------------------------------------------

// Kunci perbandingan: huruf/angka saja, tanpa aksen/spasi/tanda baca, huruf kecil.
const normKey = (s) =>
  String(s ?? '').replace(/\s+/g, ' ').trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '');

// Kunci judul: abaikan kurung dan akhiran " - versi"
const titleKey = (s) =>
  normKey(String(s ?? '').replace(/[([（【][^)\]）】]*[)\]）】]/g, ' ').replace(/\s+-\s+.*$/, '')) || normKey(s);

// Pilih hasil /search yang benar-benar lagu yang dicari:
// judul sama DAN artis cocok dengan salah satu petunjuk.
// Lebih baik "lirik tidak tersedia" daripada lirik lagu lain yang kebetulan berjudul sama.
function pickBestMatch(results, title, hints) {
  const wanted = titleKey(title);
  if (!wanted) return null;
  const wantedArtists = hints.map(normKey).filter((h) => h.length >= 2);
  const matches = results.filter((r) => {
    if (!r || !(r.syncedLyrics || r.plainLyrics) || titleKey(r.trackName) !== wanted) return false;
    const ra = normKey(r.artistName);
    return wantedArtists.some(
      (h) => h === ra || (h.length >= 3 && ra.length >= 3 && (ra.includes(h) || h.includes(ra)))
    );
  });
  // Utamakan lirik tersinkron, lalu judul yang persis sama (bukan varian live/remaster)
  const score = (r) => (r.syncedLyrics ? 2 : 0) + (normKey(r.trackName) === normKey(title) ? 1 : 0);
  return matches.sort((a, b) => score(b) - score(a))[0] || null;
}

function cleanTrackTitle(title) {
  if (!title) return '';
  return title
    .replace(/\s*\(.*?(remaster\vert{}version\vert{}edit\vert{}live\vert{}feat\vert{}ft\.).*?\)/gi, '')
    .replace(/\s*-\s*.*?(remaster|version|edit|live|acoustic).*$/gi, '')
    .replace(/\s+(?:feat\.?|ft\.?)\s+.*$/gi, '')
    .trim();
}

function stripVideoSuffixes(str) {
  if (!str) return '';
  let s = str;

  // 1. Tag kurung video / audio / lyrics / visualizer / mv / live / remaster (termasuk bracket Asia)
  s = s.replace(/\s*[([{\u3010\u300C\u300E]\s*(?:official\s+)?(?:music\s+|lyric\s+|lyrics\s+)?(?:video|audio|lyrics?|visualizer|hd|4k|m\/?v|performance|live|clip|remaster(?:ed)?|version).*?[)\]}\u3011\u300D\u300F]/gi, '');

  // 2. Kurung sederhana: (Official), [Official], (Lyrics), (Audio), (Visualizer), dll.
  s = s.replace(/\s*[([{\u3010\u300C\u300E]\s*(?:official|lyrics?|audio|visualizer|hd|4k|mv|m\/v|clip|live)\s*[)\]}\u3011\u300D\u300F]/gi, '');

  // 3. M/V atau MV di akhir kata
  s = s.replace(/\s+(?:m\/?v|mv)\s*$/gi, '');

  // 4. Suffix setelah delimiter pipe atau slash: | Official Video, // Official Audio, dll.
  s = s.replace(/\s*[|/]{1,2}\s*(?:official\s+)?(?:music\s+|lyric\s+|lyrics\s+)?(?:video|audio|lyrics?|visualizer|hd|4k|m\/?v|clip).*$/gi, '');

  // 5. Pipe umum di akhir
  s = s.replace(/\s*\|\s*.*$/gi, '');

  // 6. Suffix dash di akhir: - Official Video, - Audio, dll.
  s = s.replace(/\s*-\s*(?:official\s+)?(?:music\s+|lyric\s+|lyrics\s+)?(?:video|audio|lyrics?|visualizer|mv|m\/?v|clip).*$/gi, '');

  // 7. Hapus tanda petik pembungkus judul: 'Song Title' -> Song Title
  s = s.trim().replace(/^['"“‘](.*)['"”’]$/, '$1').trim();

  return s;
}

function cleanChannelArtist(artist) {
  if (!artist) return '';
  let cleaned = artist.trim();
  // Strip " - Topic" (YouTube auto-generated music channels)
  cleaned = cleaned.replace(/\s*-\s*Topic$/i, '');
  // Strip "VEVO" di akhir (mis. ColdplayVEVO -> Coldplay)
  cleaned = cleaned.replace(/VEVO$/i, '');
  // Strip "Official Channel", "Official Music", "Official", "Channel"
  cleaned = cleaned.replace(/\s*(?:Official\s*Channel|Official\s*Music|Official|Channel)$/i, '');
  cleaned = cleaned.replace(/Official$/i, '');
  // Strip "Music" di akhir jika diawali spasi
  cleaned = cleaned.replace(/\s+Music$/i, '');
  return cleaned.trim();
}

function isLikelyChannelName(artist) {
  if (!artist) return false;
  const a = artist.trim();
  if (/VEVO$/i.test(a)) return true;
  if (/-\s*Topic$/i.test(a)) return true;
  if (/(?:Official|Channel)$/i.test(a)) return true;
  if (/^(?:YouTube|YouTubeMusic|Chrome|Edge)$/i.test(a)) return true;
  return false;
}

function parseYouTubeTitle(title, artist) {
  if (!title) return { title: '', artist: artist || '', isYouTubeLike: false };

  const rawTitle = title.trim();
  const rawArtist = (artist || '').trim();
  const cleanedChannel = cleanChannelArtist(rawArtist);

  // Cek apakah ada pemisah seperti " - ", " – ", " — "
  const separatorMatch = rawTitle.match(/\s+[-–—]\s+/);

  if (separatorMatch) {
    const parts = rawTitle.split(/\s+[-–—]\s+/);
    if (parts.length >= 2) {
      const leftPart = parts[0].trim();
      const rightPart = parts.slice(1).join(' - ').trim();

      const hasVideoSuffix = /official|video|audio|lyrics?|visualizer|m\/?v|clip/i.test(rawTitle);
      const isChannelLike = isLikelyChannelName(rawArtist);
      const artistMatchesLeft = Boolean(cleanedChannel && leftPart.toLowerCase().includes(cleanedChannel.toLowerCase()));
      const leftMatchesArtist = Boolean(cleanedChannel && cleanedChannel.toLowerCase().includes(leftPart.toLowerCase()));

      if (hasVideoSuffix || isChannelLike || artistMatchesLeft || leftMatchesArtist) {
        const cleanedTitle = cleanTrackTitle(stripVideoSuffixes(rightPart));
        const extractedArtist = leftPart;
        return {
          title: cleanedTitle || stripVideoSuffixes(rightPart),
          artist: extractedArtist || cleanedChannel || rawArtist,
          isYouTubeLike: true,
        };
      }
    }
  }

  // Jika tidak berformat "Artis - Judul", bersihkan video suffixes dari judul
  const cleanedTitle = cleanTrackTitle(stripVideoSuffixes(rawTitle));
  const finalArtist = cleanedChannel || rawArtist;
  const isYouTubeLike = /official|video|audio|lyrics?|visualizer|m\/?v|clip/i.test(rawTitle) || isLikelyChannelName(rawArtist);

  return {
    title: cleanedTitle || rawTitle,
    artist: finalArtist,
    isYouTubeLike,
  };
}

async function queryLrcLib(trackName, artistName, signal, hints = []) {
  let lrcData = null;
  const cleanTrack = (trackName || '').trim();
  const cleanArt = (artistName || '').trim();

  // 1. Coba endpoint /api/get jika artistName dan trackName ada (exact match)
  if (cleanTrack && cleanArt) {
    try {
      const primary = cleanArt.split(',')[0].split('&')[0].split(/\s+x\s+/i)[0].trim();
      const getUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(primary)}&track_name=${encodeURIComponent(cleanTrack)}`;
      const getRes = await fetch(getUrl, { signal });
      if (getRes.ok) {
        lrcData = await getRes.json();
      }
    } catch (e) {
      if (e.name === 'AbortError') throw e;
    }
  }

  // 2. Coba endpoint /api/search jika belum dapat synced lyrics.
  // Pakai parameter track_name + artist_name (lebih spesifik dari ?q=)
  // dan validasi artis via pickBestMatch agar tidak salah ambil lirik
  // lagu lain yang kebetulan berjudul sama.
  if (!lrcData || !lrcData.syncedLyrics) {
    try {
      if (cleanTrack) {
        let searchUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTrack)}`;
        if (cleanArt) searchUrl += `&artist_name=${encodeURIComponent(cleanArt)}`;
        const searchRes = await fetch(searchUrl, { signal });
        if (searchRes.ok) {
          const results = await searchRes.json();
          if (Array.isArray(results) && results.length > 0) {
            const allHints = hints.length > 0 ? hints : (cleanArt ? [cleanArt] : []);
            const best = allHints.length > 0
              ? pickBestMatch(results, cleanTrack, allHints)
              : (results.find((item) => item.syncedLyrics) || results.find((item) => item.plainLyrics) || results[0]);
            if (best && (best.syncedLyrics || best.plainLyrics) && (!lrcData || best.syncedLyrics)) {
              lrcData = best;
            }
          }
        }
      }
    } catch (e) {
      if (e.name === 'AbortError') throw e;
    }
  }

  return lrcData;
}

// Konversi WMO Weather Code dari Open-Meteo ke Label & Ikon
function getWeatherInfo(code) {
  if (code === 0) return { label: 'Cerah', Icon: Sun };
  if (code >= 1 && code <= 3) return { label: 'Berawan', Icon: Cloud };
  if (code === 45 || code === 48) return { label: 'Berkabut', Icon: Wind };
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return { label: 'Hujan', Icon: CloudRain };
  }
  if (code >= 95) return { label: 'Badai Petir', Icon: CloudLightning };
  return { label: 'Berawan', Icon: Cloud };
}

export default function App() {
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [activeTab, setActiveTab] = useState('music'); // 'music' | 'today' | 'ai'

  const [media, setMedia] = useState({
    hasMedia: false,
    title: "Belum ada musik",
    artist: "Putar lagu di Spotify / Browser",
    isPlaying: false,
    position: 0,
    duration: 1,
    thumbnail: null,
  });

  const [lyrics, setLyrics] = useState([]);
  const [lyricStatus, setLyricStatus] = useState('idle');
  const [fallbackCover, setFallbackCover] = useState(null);
  const lastFetchedTrack = useRef("");

  const [now, setNow] = useState(new Date());

  // State Cuaca (Open-Meteo)
  const [weather, setWeather] = useState({
    temp: '--',
    code: 1,
    humidity: '--',
    city: 'Memuat...',
    loading: true,
  });

  // State To-Do List (Disimpan di localStorage)
  const [todos, setTodos] = useState(() => {
    try {
      const saved = localStorage.getItem('ryflow_todos');
      return saved
        ? JSON.parse(saved)
        : [
          { id: 1, text: 'Cek jadwal & agenda hari ini', done: false },
          { id: 2, text: 'Eksplor fitur baru Ryflow', done: true },
        ];
    } catch {
      return [];
    }
  });
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('ryflow_todos', JSON.stringify(todos));
    } catch { }
  }, [todos]);

  useEffect(() => {
    const clockInterval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Fetch Lokasi & Cuaca Real-Time (Setiap 15 Menit)
  useEffect(() => {
    let isMounted = true;

    async function fetchWeather() {
      let lat = -5.4292;
      let lon = 105.261;
      let cityName = 'Bandar Lampung';

      try {
        const geoRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.latitude && geoData.longitude) {
            lat = parseFloat(geoData.latitude);
            lon = parseFloat(geoData.longitude);
            cityName = geoData.city || geoData.region || cityName;
          }
        }
      } catch { }

      try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`;
        const wRes = await fetch(weatherUrl);
        if (wRes.ok && isMounted) {
          const wData = await wRes.json();
          setWeather({
            temp: Math.round(wData.current.temperature_2m),
            humidity: Math.round(wData.current.relative_humidity_2m),
            code: wData.current.weather_code,
            city: cityName,
            loading: false,
          });
        }
      } catch {
        if (isMounted) {
          setWeather((prev) => ({ ...prev, loading: false }));
        }
      }
    }

    fetchWeather();
    const weatherInterval = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(weatherInterval);
    };
  }, []);

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

  useEffect(() => {
    if (!media.hasMedia || !media.title || media.title === "Tidak ada judul" || media.title === "Belum ada musik") {
      return;
    }

    const trackKey = `${media.title}___${media.artist}`;
    if (trackKey === lastFetchedTrack.current) return;
    lastFetchedTrack.current = trackKey;

    const controller = new AbortController();
    // Reset fallbackCover saat lagu berganti agar cover lama tidak nempel,
    // tapi thumbnail dari PowerShell (jika ada) tetap tampil via media.thumbnail
    setFallbackCover(null);
    // Flag untuk cleanup: jika fetch terpotong (mis. metadata berkedip jadi "Tidak ada judul"),
    // lepaskan kunci supaya lagu yang sama boleh di-fetch ulang nanti.
    let finished = false;

    async function fetchTrackExtras() {
      setLyricStatus('loading');
      setLyrics([]);
      // Jangan reset fallbackCover dulu — biarkan cover lama tampil
      // sampai cover baru berhasil di-fetch (mencegah flicker ke ijo)

      const parsedYT = parseYouTubeTitle(media.title, media.artist);
      const cleanTitle = cleanTrackTitle(media.title);
      const primaryArtist = media.artist.split(',')[0].split('&')[0].trim();

      const searchTitle = parsedYT.title || cleanTitle;
      const searchArtist = parsedYT.artist || primaryArtist;

      // Petunjuk artis untuk memvalidasi hasil pencarian (lihat pickBestMatch).
      // Untuk Spotify, cukup nama artis asli. Untuk YouTube, tambahkan hasil parse channel.
      const hints = [
        primaryArtist,
        media.artist,
        ...(parsedYT.isYouTubeLike ? [parsedYT.artist, cleanChannelArtist(media.artist)] : []),
      ].filter((h) => h && h.length > 1);

      try {
        const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(`${searchTitle}${searchArtist}`.trim())}&entity=song&limit=1`;
        const resArt = await fetch(itunesUrl, { signal: controller.signal });
        const dataArt = await resArt.json();
        if (dataArt.results?.[0]?.artworkUrl100) {
          setFallbackCover(dataArt.results[0].artworkUrl100.replace('100x100bb', '300x300bb'));
        }
      } catch { }

      try {
        let lrcData = null;

        // 1. Coba fetch lirik dengan judul/artis hasil parse YouTube terlebih dahulu
        lrcData = await queryLrcLib(parsedYT.title, parsedYT.artist, controller.signal, hints);

        // 2. Jika tidak ketemu, fallback ke query original
        if (!lrcData || (!lrcData.syncedLyrics && !lrcData.plainLyrics)) {
          if (cleanTitle !== parsedYT.title || primaryArtist !== parsedYT.artist) {
            lrcData = await queryLrcLib(cleanTitle, primaryArtist, controller.signal, hints);
          }
        }

        // 3. Fallback kedua: coba query hanya dari judul yang sudah dibersihkan tanpa artis
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
      // Kalau fetch terpotong sebelum selesai (mis. metadata sempat berkedip jadi
      // "Tidak ada judul"), lepaskan kunci supaya lagu yang sama boleh di-fetch ulang.
      // Tanpa ini status "Memuat lirik..." bisa nyangkut selamanya.
      if (!finished && lastFetchedTrack.current === trackKey) {
        lastFetchedTrack.current = "";
      }
    };
  }, [media.title, media.artist, media.hasMedia]);

  // Status apakah Notch sedang terbuka
  const isExpanded = isHovered || isPinned || isInputFocused;

  // Top-Bezel Trigger Instan (Tanpa Delay)
  const handleMouseMove = (e) => {
    if (isExpanded) return;

    if (e.clientY <= 6) {
      setIsHovered(true);
      if (window.electronAPI) {
        window.electronAPI.setIgnoreMouseEvents(false);
      }
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (!isPinned && !isInputFocused) {
      if (window.electronAPI) {
        window.electronAPI.setIgnoreMouseEvents(true, { forward: true });
      }
    }
  };

  const togglePin = () => {
    const nextPin = !isPinned;
    setIsPinned(nextPin);
    if (!nextPin && !isHovered && window.electronAPI) {
      window.electronAPI.setIgnoreMouseEvents(true, { forward: true });
    }
  };

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

  // Fungsi To-Do List
  const handleAddTodo = (e) => {
    e.preventDefault();
    const trimmed = newTodo.trim();
    if (!trimmed) return;
    setTodos((prev) => [...prev, { id: Date.now(), text: trimmed, done: false }]);
    setNewTodo('');
  };

  const toggleTodo = (id) => {
    setTodos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const deleteTodo = (id) => {
    setTodos((prev) => prev.filter((item) => item.id !== id));
  };

  const activeLyricIndex = lyrics.reduce((acc, curr, idx) => {
    return (media.position + 0.25) >= curr.time ? idx : acc;
  }, 0);

  const prevLine = activeLyricIndex > 0 ? lyrics[activeLyricIndex - 1]?.text : "";
  const currentLine = lyrics[activeLyricIndex]?.text || "• • •";
  const nextLine = activeLyricIndex < lyrics.length - 1 ? lyrics[activeLyricIndex + 1]?.text : "";

  const displayCover = media.thumbnail || fallbackCover;

  const formatTime = (sec) => {
    const safeSec = Math.max(0, Math.floor(sec || 0));
    const m = Math.floor(safeSec / 60).toString().padStart(2, '0');
    const s = (safeSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const timeString = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const dateHeaderString = `${now.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  })} • ${timeString}`;

  // Susunan 7 Hari Minggu Ini (Senin - Minggu) untuk Kalender Mini
  const getWeekDays = () => {
    const current = new Date(now);
    const dayOfWeek = current.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(current);
    monday.setDate(current.getDate() + diffToMonday);

    const dayLabels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isToday = d.toDateString() === now.toDateString();
      return {
        label: dayLabels[i],
        dateNum: d.getDate(),
        isToday,
      };
    });
  };

  const weekDays = getWeekDays();
  const { label: weatherLabel, Icon: WeatherIcon } = getWeatherInfo(weather.code);
  const completedTodos = todos.filter((t) => t.done).length;

  return (
    <div className="w-screen h-screen flex justify-center items-start pt-0 pointer-events-none">
      {/* Wrapper Notch MacBook (Tanpa prop 'layout' agar tidak bentrok dengan spring width/height) */}
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={false}
        animate={{
          width: isExpanded ? 580 : 172,
          height: isExpanded ? 196 : 34,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: isExpanded ? 22 : 14,
          borderBottomRightRadius: isExpanded ? 22 : 14,
        }}
        transition={{
          type: "spring",
          stiffness: 380,
          damping: 24,
        }}
        className="pointer-events-auto relative bg-[#0a0a0c]/95 text-white border-x border-b border-t-0 border-white/[0.08] shadow-[0_12px_36px_rgba(0,0,0,0.85)] backdrop-blur-2xl origin-top"
      >
        {/* Lekukan Bahu Kiri Atas (MacBook Left Ear) */}
        <svg
          className="absolute -left-[12px] top-0 w-[12px] h-[12px] pointer-events-none"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M 0 0 L 12 0 L 12 12 C 12 5.37 6.63 0 0 0 Z"
            fill="rgba(10, 10, 12, 0.95)"
          />
        </svg>

        {/* Lekukan Bahu Kanan Atas (MacBook Right Ear) */}
        <svg
          className="absolute -right-[12px] top-0 w-[12px] h-[12px] pointer-events-none"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M 0 0 L 12 0 C 5.37 0 0 5.37 0 12 Z"
            fill="rgba(10, 10, 12, 0.95)"
          />
        </svg>

        {/* Inner Container (Relative + Overflow Hidden) */}
        <div className="relative w-full h-full overflow-hidden rounded-[inherit]">
          <AnimatePresence initial={false}>
            {/* TAMPILAN SAAT MENUTUP (IDLE NOTCH - Dikunci Absolute w-[172px] h-[34px]) */}
            {!isExpanded ? (
              <motion.div
                key="idle-view"
                initial={{ opacity: 0, y: -8 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    opacity: { duration: 0.14, delay: 0.06 },
                    y: { type: "spring", stiffness: 360, damping: 22, delay: 0.05 },
                  },
                }}
                exit={{
                  opacity: 0,
                  y: -4,
                  transition: { duration: 0.08 },
                }}
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[172px] h-[34px] px-3.5 flex items-center justify-between text-xs font-sans font-semibold tracking-wide"
              >
                {/* Vinyl Cover Art */}
                {displayCover ? (
                  <img
                    src={displayCover}
                    alt="cover"
                    className="w-4 h-4 rounded-full object-cover ring-1 ring-white/15 animate-spin"
                    style={{
                      animationDuration: "8s",
                      animationPlayState: media.isPlaying ? "running" : "paused",
                    }}
                  />
                ) : (
                  <div
                    className="w-4 h-4 rounded-full bg-white/10 ring-1 ring-white/15 flex items-center justify-center animate-spin"
                    style={{
                      animationDuration: "8s",
                      animationPlayState: media.isPlaying ? "running" : "paused",
                    }}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${media.isPlaying ? "bg-emerald-400" : "bg-white/40"
                        }`}
                    />
                  </div>
                )}

                {/* Jam Digital */}
                <span className="text-white/90 font-mono font-medium text-[12.5px] tracking-tight">
                  {timeString}
                </span>

                {/* Minimalist Monochrome Waveform */}
                <div className="flex items-center gap-[2px] h-3">
                  {[0.45, 0.95, 0.55, 0.85, 0.4].map((h, i) => (
                    <motion.span
                      key={i}
                      animate={{
                        height: media.isPlaying ? ["25%", "95%", "35%"] : "20%",
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.65 + i * 0.12,
                        ease: "easeInOut",
                      }}
                      className="w-[2px] bg-white/75 rounded-full"
                    />
                  ))}
                </div>
              </motion.div>
            ) : (
              /* TAMPILAN SAAT MEMBUKA (EXPANDED NOTCH - Dikunci Absolute w-[580px] h-[196px]) */
              <motion.div
                key="expanded-view"
                initial={{ opacity: 0, y: -4 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.18, delay: 0.04 },
                }}
                exit={{
                  opacity: 0,
                  y: -4,
                  transition: { duration: 0.08, delay: 0 },
                }}
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[580px] h-[196px] px-4 py-3 flex flex-col justify-between z-10"
              >
                {/* Header Bar Atas dengan Micro-Tabs */}
                <div className="flex items-center justify-between text-[11px] text-white/50 border-b border-white/[0.07] pb-2">
                  {/* Kiri: Brand Ryflow + Tombol Pin */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${media.isPlaying ? "bg-emerald-400" : "bg-white/30"
                        }`}
                    />
                    <span className="font-sans font-semibold text-white/85 tracking-tight">
                      Ryflow
                    </span>
                    <button
                      onClick={togglePin}
                      title={isPinned ? "Lepas sematan" : "Sematkan agar tetap terbuka"}
                      className={`p-1 rounded-md transition cursor-pointer ${isPinned
                          ? "bg-white/20 text-white"
                          : "text-white/35 hover:text-white/75 hover:bg-white/[0.06]"
                        }`}
                    >
                      <Pin size={11} className={isPinned ? "rotate-45" : ""} />
                    </button>
                  </div>

                  {/* Tengah: Micro Pill-Tabs (Music | Today | AI) */}
                  <div className="flex items-center gap-1 bg-white/[0.05] p-0.5 rounded-full border border-white/[0.06]">
                    {[
                      { id: 'music', label: 'Music' },
                      { id: 'today', label: 'Today' },
                      { id: 'ai', label: 'AI' },
                    ].map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`relative px-2.5 py-0.5 rounded-full text-[10.5px] font-sans font-semibold transition-colors cursor-pointer ${isActive ? "text-black" : "text-white/55 hover:text-white/85"
                            }`}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="activeTabPill"
                              transition={{ type: "spring", stiffness: 450, damping: 32 }}
                              className="absolute inset-0 bg-white rounded-full"
                            />
                          )}
                          <span className="relative z-10">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Kanan: Tanggal & Jam */}
                  <span className="font-mono text-white/60 text-[10.5px]">
                    {dateHeaderString}
                  </span>
                </div>

                {/* ISI KONTEN BERDASARKAN TAB AKTIF */}
                <div className="flex-1 flex items-center overflow-hidden pt-1">
                  <AnimatePresence mode="wait">
                    {/* ================= TAB 1: MUSIC & LYRICS ================= */}
                    {activeTab === 'music' && (
                      <motion.div
                        key="tab-music"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.16 }}
                        className="w-full grid grid-cols-12 gap-4 items-center my-auto py-0.5"
                      >
                        {/* KIRI: Info Lagu & Kontrol (5 Kolom) */}
                        <div className="col-span-5 flex flex-col gap-2.5 pr-3 border-r border-white/[0.07]">
                          <div className="flex items-center gap-3">
                            <div className="relative w-11 h-11 rounded-lg overflow-hidden shadow-md shrink-0 bg-white/[0.06] ring-1 ring-white/10 flex items-center justify-center">
                              {displayCover ? (
                                <img
                                  src={displayCover}
                                  alt={media.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Disc size={22} className="text-white/40" />
                              )}
                            </div>
                            <div className="overflow-hidden">
                              <h3 className="text-[13px] font-sans font-bold text-white truncate leading-tight">
                                {media.title}
                              </h3>
                              <p className="text-[11.5px] font-sans text-white/55 truncate mt-0.5">
                                {media.artist}
                              </p>
                            </div>
                          </div>

                          {/* Progress Bar Bersih */}
                          <div className="flex items-center gap-2 text-[10px] font-mono text-white/45">
                            <span className="w-7">{formatTime(media.position)}</span>
                            <div
                              onClick={handleSeek}
                              className="group flex-1 h-1 hover:h-1.5 bg-white/15 rounded-full overflow-hidden cursor-pointer transition-all"
                            >
                              <motion.div
                                className="h-full bg-white/90 group-hover:bg-white rounded-full"
                                animate={{
                                  width: `${Math.min(
                                    100,
                                    (media.position / Math.max(1, media.duration)) * 100
                                  )}%`,
                                }}
                                transition={{ ease: "linear", duration: 0.25 }}
                              />
                            </div>
                            <span className="w-8 text-right">
                              -{formatTime(media.duration - media.position)}
                            </span>
                          </div>

                          {/* Tombol Kontrol */}
                          <div className="flex items-center justify-center gap-5 pt-0.5">
                            <button
                              onClick={() => triggerControl('prev')}
                              className="text-white/60 hover:text-white transition transform active:scale-90 cursor-pointer"
                            >
                              <SkipBack size={16} />
                            </button>
                            <button
                              onClick={() => triggerControl('playpause')}
                              className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-sm cursor-pointer"
                            >
                              {media.isPlaying ? (
                                <Pause size={14} fill="black" />
                              ) : (
                                <Play size={14} fill="black" className="ml-0.5" />
                              )}
                            </button>
                            <button
                              onClick={() => triggerControl('next')}
                              className="text-white/60 hover:text-white transition transform active:scale-90 cursor-pointer"
                            >
                              <SkipForward size={16} />
                            </button>
                          </div>
                        </div>

                        {/* KANAN: Synced Lyrics (7 Kolom) */}
                        <div className="col-span-7 h-28 flex flex-col justify-center overflow-hidden relative pl-1">
                          {lyricStatus === 'loading' && (
                            <div className="flex items-center gap-2 text-xs font-sans text-white/40">
                              <Loader2 size={13} className="animate-spin text-white/60" />
                              <span>Memuat lirik...</span>
                            </div>
                          )}

                          {lyricStatus === 'not_found' && (
                            <p className="text-xs font-sans font-medium text-white/35">
                              Lirik tidak tersedia
                            </p>
                          )}

                          {(lyricStatus === 'synced' || lyricStatus === 'plain') && (
                            <AnimatePresence mode="popLayout">
                              <motion.div
                                key={activeLyricIndex}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.22, ease: "easeOut" }}
                                className="flex flex-col justify-center gap-1.5 font-sans"
                              >
                                <p className="text-[11.5px] font-medium text-white/30 line-clamp-1 leading-normal">
                                  {prevLine || "\u00A0"}
                                </p>
                                <p className="text-[13.5px] font-bold text-white leading-snug line-clamp-2">
                                  {currentLine}
                                </p>
                                <p className="text-[11.5px] font-medium text-white/35 line-clamp-1 leading-normal">
                                  {nextLine || "\u00A0"}
                                </p>
                              </motion.div>
                            </AnimatePresence>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* ================= TAB 2: TODAY (CUACA & KALENDER + AGENDA) ================= */}
                    {activeTab === 'today' && (
                      <motion.div
                        key="tab-today"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.16 }}
                        className="w-full grid grid-cols-12 gap-4 items-center h-full py-0.5"
                      >
                        {/* KIRI: Cuaca Real-Time & Kalender Mingguan (5 Kolom) */}
                        <div className="col-span-5 flex flex-col justify-between h-full pr-3 border-r border-white/[0.07]">
                          {/* Kartu Cuaca Ringkas */}
                          <div className="flex items-center justify-between bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-white/[0.07] flex items-center justify-center text-white/85">
                                <WeatherIcon size={18} />
                              </div>
                              <div>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-base font-mono font-medium text-white leading-none">
                                    {weather.temp}°C
                                  </span>
                                  <span className="text-[11px] font-sans font-medium text-white/60">
                                    {weatherLabel}
                                  </span>
                                </div>
                                <p className="text-[10px] font-sans text-white/40 truncate max-w-[125px] mt-0.5">
                                  {weather.city} • Lembap {weather.humidity}%
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Strip Kalender 7 Hari (Senin - Minggu) */}
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-sans font-medium text-white/40 uppercase tracking-wider">
                              Minggu Ini
                            </span>
                            <div className="grid grid-cols-7 gap-1">
                              {weekDays.map((d, index) => (
                                <div
                                  key={index}
                                  className={`flex flex-col items-center justify-center py-1.5 rounded-lg border transition ${d.isToday
                                      ? "bg-white text-black border-white font-bold shadow-sm"
                                      : "bg-white/[0.03] text-white/60 border-white/[0.05]"
                                    }`}
                                >
                                  <span
                                    className={`text-[9px] font-sans ${d.isToday ? "text-black/70 font-semibold" : "text-white/35"
                                      }`}
                                  >
                                    {d.label}
                                  </span>
                                  <span className="text-[11px] font-mono mt-0.5 leading-none">
                                    {d.dateNum}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* KANAN: Agenda / Quick To-Do List (7 Kolom) */}
                        <div className="col-span-7 flex flex-col justify-between h-full pl-1 overflow-hidden">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-sans font-semibold text-white/75">
                              Agenda Hari Ini
                            </span>
                            <span className="text-[10px] font-mono text-white/40">
                              {completedTodos}/{todos.length} selesai
                            </span>
                          </div>

                          <div className="flex-1 overflow-y-auto my-1.5 pr-1 flex flex-col gap-1 max-h-[68px]">
                            {todos.length === 0 ? (
                              <p className="text-[11px] font-sans text-white/30 my-auto">
                                Belum ada agenda. Ketik di bawah untuk menambah.
                              </p>
                            ) : (
                              todos.map((item) => (
                                <div
                                  key={item.id}
                                  className="group flex items-center justify-between gap-2 px-2 py-1 rounded-md bg-white/[0.03] hover:bg-white/[0.06] transition"
                                >
                                  <button
                                    onClick={() => toggleTodo(item.id)}
                                    className="flex items-center gap-2 text-left flex-1 overflow-hidden cursor-pointer"
                                  >
                                    <div
                                      className={`w-3.5 h-3.5 rounded-[4px] flex items-center justify-center shrink-0 border transition ${item.done
                                          ? "bg-white border-white text-black"
                                          : "border-white/30 hover:border-white/60"
                                        }`}
                                    >
                                      {item.done && <Check size={10} strokeWidth={3} />}
                                    </div>
                                    <span
                                      className={`text-[11.5px] font-sans truncate transition ${item.done ? "line-through text-white/30" : "text-white/85"
                                        }`}
                                    >
                                      {item.text}
                                    </span>
                                  </button>
                                  <button
                                    onClick={() => deleteTodo(item.id)}
                                    className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-white/80 transition cursor-pointer"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>

                          <form onSubmit={handleAddTodo} className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={newTodo}
                              onChange={(e) => setNewTodo(e.target.value)}
                              onFocus={() => setIsInputFocused(true)}
                              onBlur={() => setIsInputFocused(false)}
                              placeholder="Tambah agenda baru lalu tekan Enter..."
                              className="flex-1 bg-white/[0.05] border border-white/[0.08] focus:border-white/25 rounded-lg px-2.5 py-1 text-[11px] font-sans text-white placeholder-white/30 outline-none transition"
                            />
                            <button
                              type="submit"
                              className="p-1.5 rounded-lg bg-white text-black hover:bg-white/90 transition cursor-pointer shrink-0"
                            >
                              <Plus size={12} />
                            </button>
                          </form>
                        </div>
                      </motion.div>
                    )}

                    {/* ================= TAB 3: AI AGENT (SIAP UNTUK TAHAP B) ================= */}
                    {activeTab === 'ai' && (
                      <motion.div
                        key="tab-ai"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.16 }}
                        className="w-full h-full flex flex-col items-center justify-center text-center gap-1.5"
                      >
                        <div className="w-8 h-8 rounded-full bg-white/[0.07] border border-white/10 flex items-center justify-center text-white/80">
                          <Sparkles size={15} />
                        </div>
                        <p className="text-xs font-sans font-semibold text-white/85">
                          Ryflow AI Agent
                        </p>
                        <p className="text-[11px] font-sans text-white/40 max-w-xs">
                          Siap dihubungkan dengan API Key pada Tahap B.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}