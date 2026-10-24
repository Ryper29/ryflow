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
  Send,
  KeyRound,
  Copy,
  RotateCcw,
  AlertCircle,
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

const normKey = (s) =>
  String(s ?? '').replace(/\s+/g, ' ').trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '');

const titleKey = (s) =>
  normKey(String(s ?? '').replace(/[([（【][^)\]）】]*[)\]）】]/g, ' ').replace(/\s+-\s+.*$/, '')) || normKey(s);

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
  const score = (r) => (r.syncedLyrics ? 2 : 0) + (normKey(r.trackName) === normKey(title) ? 1 : 0);
  return matches.sort((a, b) => score(b) - score(a))[0] || null;
}

function cleanTrackTitle(title) {
  if (!title) return '';
  return title
    .replace(/\s*\(.*?(remaster|version|edit|live|feat|ft\.).*?\)/gi, '')
    .replace(/\s*-\s*.*?(remaster|version|edit|live|acoustic).*$/gi, '')
    .replace(/\s+(?:feat\.?|ft\.?)\s+.*$/gi, '')
    .trim();
}

function stripVideoSuffixes(str) {
  if (!str) return '';
  let s = str;

  s = s.replace(/\s*[([{\u3010\u300C\u300E]\s*(?:official\s+)?(?:music\s+|lyric\s+|lyrics\s+)?(?:video|audio|lyrics?|visualizer|hd|4k|m\/?v|performance|live|clip|remaster(?:ed)?|version).*?[)\]}\u3011\u300D\u300F]/gi, '');
  s = s.replace(/\s*[([{\u3010\u300C\u300E]\s*(?:official|lyrics?|audio|visualizer|hd|4k|mv|m\/v|clip|live)\s*[)\]}\u3011\u300D\u300F]/gi, '');
  s = s.replace(/\s+(?:m\/?v|mv)\s*$/gi, '');
  s = s.replace(/\s*[|/]{1,2}\s*(?:official\s+)?(?:music\s+|lyric\s+|lyrics\s+)?(?:video|audio|lyrics?|visualizer|hd|4k|m\/?v|clip).*$/gi, '');
  s = s.replace(/\s*\|\s*.*$/gi, '');
  s = s.replace(/\s*-\s*(?:official\s+)?(?:music\s+|lyric\s+|lyrics\s+)?(?:video|audio|lyrics?|visualizer|mv|m\/?v|clip).*$/gi, '');
  s = s.trim().replace(/^['"“‘](.*)['"”’]$/, '$1').trim();

  return s;
}

function cleanChannelArtist(artist) {
  if (!artist) return '';
  let cleaned = artist.trim();
  cleaned = cleaned.replace(/\s*-\s*Topic$/i, '');
  cleaned = cleaned.replace(/VEVO$/i, '');
  cleaned = cleaned.replace(/\s*(?:Official\s*Channel|Official\s*Music|Official|Channel)$/i, '');
  cleaned = cleaned.replace(/Official$/i, '');
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

// ---------------------------------------------------------------------------
// Konfigurasi Urutan & Animasi Directional Tab
// ---------------------------------------------------------------------------
const TAB_ORDER = ['music', 'today', 'ai'];

const tabContentVariants = {
  enter: (direction) => ({
    opacity: 0,
    x: direction > 0 ? 18 : direction < 0 ? -18 : 0,
    scale: 0.97,
  }),
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.22,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction > 0 ? -18 : direction < 0 ? 18 : 0,
    scale: 0.97,
    transition: {
      duration: 0.14,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

// ---------------------------------------------------------------------------
// Helper Multi-Provider AI & Validasi API Key
// ---------------------------------------------------------------------------
const DEFAULT_GEMINI_MODELS = [
  'gemini-3-flash-preview',
  'gemini-flash-latest',
  'gemini-2.5-flash-lite',
  'gemini-pro-latest',
  'gemini-2.5-flash',
];

// Mengambil daftar model Gemini yang benar-benar aktif untuk API Key pengguna via ListModels API
let cachedDiscoveredModels = null;
let cachedKeyForModels = '';

async function fetchAvailableGeminiModels(cleanKey) {
  if (cachedDiscoveredModels && cachedKeyForModels === cleanKey) {
    return cachedDiscoveredModels;
  }
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(cleanKey)}`
    );
    if (!res.ok) return DEFAULT_GEMINI_MODELS;
    const data = await res.json();
    if (!Array.isArray(data.models)) return DEFAULT_GEMINI_MODELS;

    const validModels = data.models
      .filter(
        (m) =>
          m.name?.startsWith('models/gemini') &&
          Array.isArray(m.supportedGenerationMethods) &&
          m.supportedGenerationMethods.includes('generateContent') &&
          !/embedding|imagen|veo|tts|audio|robotics|computer-use|aqa|learnlm/i.test(m.name)
      )
      .map((m) => m.name.replace(/^models\//, ''));

    // Urutkan agar varian Flash terbaru (3-flash / flash-latest) berada di prioritas paling atas
    const scoreModel = (id) => {
      if (id.includes('gemini-3') && id.includes('flash')) return 100;
      if (id === 'gemini-flash-latest') return 90;
      if (id.includes('2.5-flash-lite')) return 80;
      if (id.includes('flash')) return 70;
      if (id.includes('gemini-3') && id.includes('pro')) return 60;
      if (id === 'gemini-pro-latest') return 50;
      return 10;
    };

    validModels.sort((a, b) => scoreModel(b) - scoreModel(a));

    if (validModels.length > 0) {
      cachedDiscoveredModels = validModels;
      cachedKeyForModels = cleanKey;
      return validModels;
    }
  } catch {}
  return DEFAULT_GEMINI_MODELS;
}

function validateApiKey(key) {
  const k = (key || '').trim();
  if (!k) {
    return { valid: false, message: 'API Key tidak boleh kosong.' };
  }
  if (/\s/.test(k)) {
    return { valid: false, message: 'API Key tidak boleh mengandung spasi.' };
  }
  if (k.length < 10) {
    return { valid: false, message: 'API Key terlalu pendek (minimal 10 karakter).' };
  }
  return { valid: true };
}

function detectAiProvider(key, geminiModel = DEFAULT_GEMINI_MODELS[0]) {
  const k = (key || '').trim();
  if (!k) return { id: 'gemini', name: geminiModel, model: geminiModel };

  if (k.startsWith('sk-ant-')) {
    return { id: 'anthropic', name: 'Claude 3.5 Haiku', model: 'claude-3-5-haiku-latest' };
  }
  if (k.startsWith('AQ') || k.startsWith('AIza')) {
    return { id: 'gemini', name: geminiModel, model: geminiModel };
  }
  if (k.startsWith('grok_') || k.startsWith('xai-')) {
    return { id: 'grok', name: 'Grok', model: 'grok-2-latest' };
  }
  if (k.startsWith('gsk_')) {
    return { id: 'groq', name: 'Groq Llama 3.3', model: 'llama-3.3-70b-versatile' };
  }
  if (k.startsWith('sk-')) {
    return { id: 'openai', name: 'OpenAI GPT-4o Mini', model: 'gpt-4o-mini' };
  }

  return { id: 'gemini', name: geminiModel, model: geminiModel };
}

function mapAiHttpError(status, rawMessage = '') {
  const msg = String(rawMessage).toLowerCase();
  if (status === 401 || status === 403 || msg.includes('api key not valid') || msg.includes('invalid api key') || msg.includes('authentication')) {
    return 'API Key salah atau sudah kedaluwarsa. Coba ganti API Key.';
  }
  if (status === 429 || msg.includes('quota') || msg.includes('rate limit')) {
    return 'Terlalu banyak permintaan. Coba lagi beberapa saat.';
  }
  if (status >= 500) {
    return 'Server AI sedang bermasalah. Coba beberapa menit lagi.';
  }
  return rawMessage || 'Gagal memproses permintaan AI.';
}

async function callAiAgent({ apiKey, prompt, systemPrompt, geminiModel = DEFAULT_GEMINI_MODELS[0] }) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('Tidak ada koneksi internet.');
  }

  const cleanKey = (apiKey || '').trim();
  const validation = validateApiKey(cleanKey);
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  const provider = detectAiProvider(cleanKey, geminiModel);

  try {
    // 1. Gemini (AQ... / AIza...) dengan Auto-Discovery ListModels
    if (provider.id === 'gemini') {
      const discovered = await fetchAvailableGeminiModels(cleanKey);
      const modelsToTry = [
        ...(discovered.includes(geminiModel) ? [geminiModel] : []),
        ...discovered.filter((m) => m !== geminiModel),
      ];

      let lastError = null;

      for (const modelName of modelsToTry) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(cleanKey)}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.6, maxOutputTokens: 350 },
          }),
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Tidak ada respons.';
          return { text: replyText, usedModel: modelName, availableModels: discovered };
        }

        const errMsg = data.error?.message || '';
        // Jika model ditolak karena tidak tersedia / deprecated untuk akun baru, lanjut coba model aktif berikutnya
        if (res.status === 404 || /no longer available|not found|not supported|deprecated/i.test(errMsg)) {
          lastError = new Error(errMsg);
          continue;
        }

        throw new Error(mapAiHttpError(res.status, errMsg));
      }

      throw lastError || new Error('Tidak ada model Gemini yang tersedia untuk API Key ini.');
    }

    // 2. Grok (grok_ / xai-)
    if (provider.id === 'grok') {
      const endpoints = [
        { url: 'https://api.x.ai/v1/chat/completions', model: 'grok-2-latest' },
        { url: 'https://api.groq.com/openai/v1/chat/completions', model: 'llama-3.3-70b-versatile' },
      ];
      let lastErr = null;

      for (const ep of endpoints) {
        const res = await fetch(ep.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cleanKey}`,
          },
          body: JSON.stringify({
            model: ep.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt },
            ],
            temperature: 0.6,
            max_tokens: 350,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          return { text: data.choices?.[0]?.message?.content || 'Tidak ada respons.' };
        }
        lastErr = new Error(mapAiHttpError(res.status, data.error?.message));
      }
      throw lastErr;
    }

    // 3. Groq (gsk_)
    if (provider.id === 'groq') {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: 0.6,
          max_tokens: 350,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(mapAiHttpError(res.status, data.error?.message));
      }
      return { text: data.choices?.[0]?.message?.content || 'Tidak ada respons.' };
    }

    // 4. Anthropic (sk-ant-)
    if (provider.id === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': cleanKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-latest',
          max_tokens: 350,
          system: systemPrompt,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(mapAiHttpError(res.status, data.error?.message));
      }
      return { text: data.content?.[0]?.text || 'Tidak ada respons.' };
    }

    // 5. OpenAI (sk-)
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cleanKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 350,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(mapAiHttpError(res.status, data.error?.message));
    }
    return { text: data.choices?.[0]?.message?.content || 'Tidak ada respons.' };
  } catch (err) {
    if (err.name === 'TypeError' || /failed to fetch|network/i.test(err.message)) {
      throw new Error('Tidak ada koneksi internet.');
    }
    throw err;
  }
}

export default function App() {
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [activeTab, setActiveTab] = useState('music'); // 'music' | 'today' | 'ai'
  const [tabDirection, setTabDirection] = useState(0);

  const handleTabChange = (nextTab) => {
    if (nextTab === activeTab) return;
    const prevIdx = TAB_ORDER.indexOf(activeTab);
    const nextIdx = TAB_ORDER.indexOf(nextTab);
    setTabDirection(nextIdx > prevIdx ? 1 : -1);
    setActiveTab(nextTab);
  };

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

  // State AI Agent (Multi-Provider)
  const [aiApiKey, setAiApiKey] = useState(() => {
    try {
      const savedKey = localStorage.getItem('ryflow_ai_key') || '';
      return validateApiKey(savedKey).valid ? savedKey : '';
    } catch {
      return '';
    }
  });
  const [geminiModelsList, setGeminiModelsList] = useState(DEFAULT_GEMINI_MODELS);
  const [geminiModel, setGeminiModel] = useState(() => {
    try {
      const savedModel = localStorage.getItem('ryflow_gemini_model');
      return savedModel || DEFAULT_GEMINI_MODELS[0];
    } catch {
      return DEFAULT_GEMINI_MODELS[0];
    }
  });
  const [keyInput, setKeyInput] = useState('');
  const [keyValidationError, setKeyValidationError] = useState('');
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLastQuestion, setAiLastQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [copiedAi, setCopiedAi] = useState(false);

  // Sinkronkan daftar model Gemini yang tersedia saat API Key Gemini dipasang
  useEffect(() => {
    if (!aiApiKey) return;
    const prov = detectAiProvider(aiApiKey, geminiModel);
    if (prov.id === 'gemini') {
      fetchAvailableGeminiModels(aiApiKey).then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setGeminiModelsList(list);
          if (!list.includes(geminiModel)) {
            setGeminiModel(list[0]);
            try {
              localStorage.setItem('ryflow_gemini_model', list[0]);
            } catch {}
          }
        }
      });
    }
  }, [aiApiKey]);

  const cycleGeminiModel = () => {
    const currentIndex = geminiModelsList.indexOf(geminiModel);
    const nextModel = geminiModelsList[(currentIndex + 1) % geminiModelsList.length];
    setGeminiModel(nextModel);
    setAiError('');
    try {
      localStorage.setItem('ryflow_gemini_model', nextModel);
    } catch {}
  };

  useEffect(() => {
    try {
      localStorage.setItem('ryflow_todos', JSON.stringify(todos));
    } catch { }
  }, [todos]);

  useEffect(() => {
    const clockInterval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Fetch Lokasi Akurat & Cuaca Real-Time
  useEffect(() => {
    let isMounted = true;

    const getBrowserCoordinates = () =>
      new Promise((resolve, reject) => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
          return reject(new Error('Geolocation tidak didukung'));
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 10 * 60 * 1000 }
        );
      });

    async function fetchWeather() {
      let lat = -5.4292;
      let lon = 105.261;
      let cityName = 'Bandar Lampung';
      let gotCoords = false;

      try {
        const coords = await getBrowserCoordinates();
        if (coords && typeof coords.lat === 'number' && typeof coords.lon === 'number') {
          lat = coords.lat;
          lon = coords.lon;
          gotCoords = true;
        }
      } catch { }

      if (!gotCoords) {
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
      }

      try {
        const nomUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=id`;
        const nomRes = await fetch(nomUrl, {
          headers: { Accept: 'application/json' },
        });
        if (nomRes.ok) {
          const nomData = await nomRes.json();
          const addr = nomData.address || {};
          const resolvedCity =
            addr.city ||
            addr.town ||
            addr.municipality ||
            addr.city_district ||
            addr.county ||
            addr.state;
          if (resolvedCity) {
            cityName = resolvedCity.replace(/^(?:Kota|Kabupaten)\s+/i, '').trim();
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
        lastFetchedTrack.current = "";
      }
    };
  }, [media.title, media.artist, media.hasMedia]);

  const isExpanded = isHovered || isPinned || isInputFocused;

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

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    const trimmed = keyInput.trim();
    const check = validateApiKey(trimmed);

    if (!check.valid) {
      setKeyValidationError(check.message);
      return;
    }

    setAiApiKey(trimmed);
    try {
      localStorage.setItem('ryflow_ai_key', trimmed);
    } catch { }
    setKeyInput('');
    setKeyValidationError('');
    setIsEditingKey(false);
    setAiError('');
  };

  const handleRemoveApiKey = () => {
    setAiApiKey('');
    setKeyInput('');
    setKeyValidationError('');
    setIsEditingKey(true);
    try {
      localStorage.removeItem('ryflow_ai_key');
    } catch { }
  };

  const askAi = async (customQuestion) => {
    const question = (customQuestion ?? aiPrompt).trim();
    if (!question || !aiApiKey || aiLoading) return;

    setAiPrompt('');
    setAiLastQuestion(question);
    setAiLoading(true);
    setAiError('');

    const currentMoment = new Date();
    const fullDateString = currentMoment.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const fullTimeString = currentMoment.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const { label: wLabel } = getWeatherInfo(weather.code);
    const pendingList = todos.filter((t) => !t.done).map((t) => t.text).join(', ') || 'Tidak ada agenda tertunda';
    const currentSongContext = media.hasMedia
      ? `${media.title} oleh ${media.artist} (${media.isPlaying ? 'Sedang diputar' : 'Dijeda'})`
      : 'Tidak ada lagu yang diputar';

    const systemPrompt = [
      'Kamu adalah Ryflow AI, asisten pintar yang tinggal di dalam smart notch di bagian atas layar Windows milik Ryper.',
      'Jawablah selalu dalam bahasa Indonesia yang santai, cerdas, langsung ke inti, dan ringkas (maksimal 2-3 kalimat pendek) agar muat dan nyaman dibaca di layar notch kecil.',
      'Jangan gunakan markdown heading (#) berlebihan.',
      `Konteks waktu & sistem saat ini -> Hari/Tanggal: ${fullDateString} | Jam: ${fullTimeString} WIB | Lokasi & Cuaca: ${weather.city}, ${weather.temp}°C (${wLabel}, kelembapan ${weather.humidity}%) | Lagu diputar: ${currentSongContext} | Agenda belum selesai: ${pendingList}.`,
    ].join(' ');

    try {
      const result = await callAiAgent({
        apiKey: aiApiKey,
        prompt: question,
        systemPrompt,
        geminiModel,
      });
      setAiResponse((result.text || '').trim());
      if (result.availableModels?.length) {
        setGeminiModelsList(result.availableModels);
      }
      if (result.usedModel && result.usedModel !== geminiModel) {
        setGeminiModel(result.usedModel);
        try {
          localStorage.setItem('ryflow_gemini_model', result.usedModel);
        } catch {}
      }
    } catch (err) {
      setAiError(err.message || 'Gagal memproses permintaan AI.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiSubmit = (e) => {
    e.preventDefault();
    askAi();
  };

  const handleCopyAi = () => {
    if (!aiResponse) return;
    navigator.clipboard.writeText(aiResponse);
    setCopiedAi(true);
    setTimeout(() => setCopiedAi(false), 1500);
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
  const activeProvider = detectAiProvider(aiApiKey, geminiModel);

  return (
    <div className="w-screen h-screen flex justify-center items-start pt-0 pointer-events-none">
      {/* Wrapper Notch MacBook */}
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

        {/* Inner Container */}
        <div className="relative w-full h-full overflow-hidden rounded-[inherit]">
          <AnimatePresence initial={false}>
            {/* TAMPILAN SAAT MENUTUP (IDLE NOTCH) */}
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
              /* TAMPILAN SAAT MEMBUKA (EXPANDED NOTCH) */
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
                          onClick={() => handleTabChange(tab.id)}
                          className={`relative px-2.5 py-0.5 rounded-full text-[10.5px] font-sans font-semibold transition-colors cursor-pointer ${isActive ? "text-black" : "text-white/55 hover:text-white/85"
                            }`}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="activeTabPill"
                              transition={{
                                type: "spring",
                                stiffness: 380,
                                damping: 30,
                                mass: 0.8,
                              }}
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
                  <AnimatePresence mode="wait" custom={tabDirection}>
                    {/* ================= TAB 1: MUSIC & LYRICS ================= */}
                    {activeTab === 'music' && (
                      <motion.div
                        key="tab-music"
                        custom={tabDirection}
                        variants={tabContentVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="w-full grid grid-cols-12 gap-4 items-center my-auto py-0.5"
                      >
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
                        custom={tabDirection}
                        variants={tabContentVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="w-full grid grid-cols-12 gap-4 items-center h-full py-0.5"
                      >
                        <div className="col-span-5 flex flex-col justify-between h-full pr-3 border-r border-white/[0.07]">
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
                                <p className="text-[10px] font-sans text-white/40 truncate max-w-[135px] mt-0.5">
                                  {weather.city} • Lembap {weather.humidity}%
                                </p>
                              </div>
                            </div>
                          </div>

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

                    {/* ================= TAB 3: AI AGENT (MULTI-PROVIDER) ================= */}
                    {activeTab === 'ai' && (
                      <motion.div
                        key="tab-ai"
                        custom={tabDirection}
                        variants={tabContentVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="w-full h-full flex flex-col justify-between py-0.5"
                      >
                        {/* KONDISI 1: BELUM ADA API KEY ATAU SEDANG EDIT KEY */}
                        {!aiApiKey || isEditingKey ? (
                          <div className="my-auto flex flex-col gap-1.5 px-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-md bg-white/[0.08] flex items-center justify-center text-white/85">
                                  <KeyRound size={13} />
                                </div>
                                <div>
                                  <p className="text-[11.5px] font-sans font-semibold text-white/90 leading-none">
                                    Hubungkan API Key AI
                                  </p>
                                  <p className="text-[10px] font-sans text-white/40 mt-0.5">
                                    Gemini (<code className="font-mono text-white/60">AQ...</code>/<code className="font-mono text-white/60">AIza...</code>), Grok (<code className="font-mono text-white/60">grok_...</code>), OpenAI (<code className="font-mono text-white/60">sk-...</code>), Anthropic (<code className="font-mono text-white/60">sk-ant-...</code>)
                                  </p>
                                </div>
                              </div>
                              {aiApiKey && (
                                <button
                                  onClick={() => {
                                    setIsEditingKey(false);
                                    setKeyValidationError('');
                                  }}
                                  className="text-[10px] font-sans text-white/45 hover:text-white cursor-pointer"
                                >
                                  Batal
                                </button>
                              )}
                            </div>

                            <form onSubmit={handleSaveApiKey} className="flex items-center gap-1.5 mt-0.5">
                              <input
                                type="password"
                                value={keyInput}
                                onChange={(e) => {
                                  setKeyInput(e.target.value);
                                  if (keyValidationError) setKeyValidationError('');
                                }}
                                onFocus={() => setIsInputFocused(true)}
                                onBlur={() => setIsInputFocused(false)}
                                placeholder="Tempel API Key lalu tekan Enter..."
                                className={`flex-1 bg-white/[0.05] border ${keyValidationError ? 'border-rose-500/50' : 'border-white/[0.08] focus:border-white/25'
                                  } rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-white placeholder-white/30 outline-none transition`}
                              />
                              <button
                                type="submit"
                                className="px-3 py-1.5 rounded-lg bg-white text-black text-[11px] font-sans font-semibold hover:bg-white/90 transition cursor-pointer shrink-0"
                              >
                                Simpan
                              </button>
                            </form>

                            {keyValidationError && (
                              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] font-sans">
                                <AlertCircle size={11} className="shrink-0 text-rose-400" />
                                <span className="truncate">{keyValidationError}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* KONDISI 2: SIAP DIGUNAKAN (CHAT & QUICK ACTIONS) */
                          <>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                                {/* Klik badge untuk mengganti model Gemini (2.5-flash / 2.0-flash / 1.5-flash / 1.5-pro) */}
                                <button
                                  type="button"
                                  onClick={activeProvider.id === 'gemini' ? cycleGeminiModel : undefined}
                                  title={activeProvider.id === 'gemini' ? 'Klik untuk ganti model Gemini' : activeProvider.name}
                                  className={`px-2 py-0.5 rounded-md bg-white/[0.07] border border-white/[0.06] text-[10px] font-mono text-white/75 shrink-0 ${activeProvider.id === 'gemini' ? 'hover:bg-white/[0.14] hover:text-white cursor-pointer transition' : ''
                                    }`}
                                >
                                  {activeProvider.name}
                                </button>

                                {media.hasMedia && (
                                  <button
                                    onClick={() => askAi(`Jelaskan secara singkat makna lagu "${media.title}" dari ${media.artist}`)}
                                    className="px-2 py-0.5 rounded-md bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.06] text-[10px] font-sans text-white/60 hover:text-white transition cursor-pointer shrink-0"
                                  >
                                    🎵 Makna lagu ini
                                  </button>
                                )}

                                <button
                                  onClick={() => askAi('Berikan 1 kalimat motivasi singkat untuk menyelesaikan agendaku hari ini.')}
                                  className="px-2 py-0.5 rounded-md bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.06] text-[10px] font-sans text-white/60 hover:text-white transition cursor-pointer shrink-0"
                                >
                                  ⚡ Fokus hari ini
                                </button>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {aiResponse && (
                                  <>
                                    <button
                                      onClick={handleCopyAi}
                                      title="Salin jawaban"
                                      className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
                                    >
                                      {copiedAi ? <Check size={11} /> : <Copy size={11} />}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setAiResponse('');
                                        setAiLastQuestion('');
                                        setAiError('');
                                      }}
                                      title="Bersihkan"
                                      className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
                                    >
                                      <RotateCcw size={11} />
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={handleRemoveApiKey}
                                  title="Ganti API Key"
                                  className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
                                >
                                  <KeyRound size={11} />
                                </button>
                              </div>
                            </div>

                            {/* Area Jawaban AI */}
                            <div className="flex-1 my-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05] overflow-y-auto max-h-[68px] flex flex-col justify-center">
                              {aiLoading ? (
                                <div className="flex items-center gap-2 text-[11px] font-sans text-white/45">
                                  <Loader2 size={12} className="animate-spin text-white/70" />
                                  <span>Sedang berpikir...</span>
                                </div>
                              ) : aiError ? (
                                <div className="flex items-center justify-between gap-2 px-2 py-1 rounded-md bg-rose-500/10 border border-rose-500/20">
                                  <div className="flex items-center gap-1.5 overflow-hidden">
                                    <AlertCircle size={12} className="text-rose-400 shrink-0" />
                                    <p className="text-[10.5px] font-sans text-rose-300 leading-snug truncate">
                                      {aiError}
                                    </p>
                                  </div>
                                  {aiError.includes('API Key') && (
                                    <button
                                      onClick={handleRemoveApiKey}
                                      className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-[10px] font-sans font-medium shrink-0 cursor-pointer transition"
                                    >
                                      Ganti Key
                                    </button>
                                  )}
                                </div>
                              ) : aiResponse ? (
                                <div className="flex flex-col gap-0.5">
                                  {aiLastQuestion && (
                                    <p className="text-[10px] font-sans text-white/35 truncate">
                                      Q: {aiLastQuestion}
                                    </p>
                                  )}
                                  <p className="text-[11.5px] font-sans text-white/90 leading-relaxed whitespace-pre-wrap">
                                    {aiResponse}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-[11px] font-sans text-white/30">
                                  Tanya apa saja, kode singkat, atau klik tombol di atas untuk membedah lagu yang sedang diputar.
                                </p>
                              )}
                            </div>

                            {/* Baris Input Prompt */}
                            <form onSubmit={handleAiSubmit} className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                onFocus={() => setIsInputFocused(true)}
                                onBlur={() => setIsInputFocused(false)}
                                placeholder="Ketik pertanyaan lalu tekan Enter..."
                                className="flex-1 bg-white/[0.05] border border-white/[0.08] focus:border-white/25 rounded-lg px-2.5 py-1 text-[11px] font-sans text-white placeholder-white/30 outline-none transition"
                              />
                              <button
                                type="submit"
                                disabled={aiLoading}
                                className="p-1.5 rounded-lg bg-white text-black hover:bg-white/90 disabled:opacity-40 transition cursor-pointer shrink-0"
                              >
                                <Send size={12} />
                              </button>
                            </form>
                          </>
                        )}
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