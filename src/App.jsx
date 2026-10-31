import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Disc,
  Loader2,
  Plus,
  Check,
  Trash2,
  Send,
  KeyRound,
  Copy,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { Header } from './components/Header';
import { useClock } from './hooks/useClock';
import { useMedia } from './hooks/useMedia';
import { useWeather } from './hooks/useWeather';
import { useTodos } from './hooks/useTodos';
import { useAiAgent } from './hooks/useAiAgent';

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

export default function App() {
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [activeTab, setActiveTab] = useState('music');
  const [tabDirection, setTabDirection] = useState(0);

  const handleTabChange = (nextTab) => {
    if (nextTab === activeTab) return;
    const prevIdx = TAB_ORDER.indexOf(activeTab);
    const nextIdx = TAB_ORDER.indexOf(nextTab);
    setTabDirection(nextIdx > prevIdx ? 1 : -1);
    setActiveTab(nextTab);
  };

  const { now, timeString, dateHeaderString } = useClock();
  const {
    media,
    lyrics,
    lyricStatus,
    displayCover,
    triggerControl,
    handleSeek,
  } = useMedia();
  const { weather, weatherLabel, WeatherIcon, weekDays } = useWeather(now);
  const { todos, newTodo, setNewTodo, handleAddTodo, toggleTodo, deleteTodo, completedTodos } = useTodos();
  const {
    aiApiKey,
    keyInput,
    setKeyInput,
    keyValidationError,
    setKeyValidationError,
    isEditingKey,
    setIsEditingKey,
    aiPrompt,
    setAiPrompt,
    aiResponse,
    setAiResponse,
    aiLastQuestion,
    setAiLastQuestion,
    aiLoading,
    aiError,
    setAiError,
    copiedAi,
    activeProvider,
    cycleGeminiModel,
    handleSaveApiKey,
    handleRemoveApiKey,
    askAi,
    handleCopyAi,
    handleAiSubmit,
  } = useAiAgent({ media, weather, weatherLabel, todos });

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

  const activeLyricIndex = lyrics.reduce((acc, curr, idx) => {
    return (media.position + 0.25) >= curr.time ? idx : acc;
  }, 0);

  const prevLine = activeLyricIndex > 0 ? lyrics[activeLyricIndex - 1]?.text : "";
  const currentLine = lyrics[activeLyricIndex]?.text || "• • •";
  const nextLine = activeLyricIndex < lyrics.length - 1 ? lyrics[activeLyricIndex + 1]?.text : "";

  const formatTime = (sec) => {
    const safeSec = Math.max(0, Math.floor(sec || 0));
    const m = Math.floor(safeSec / 60).toString().padStart(2, '0');
    const s = (safeSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="w-screen h-screen flex justify-center items-start pt-0 pointer-events-none">
      {/* Container Siluet MacBook Notch dengan Liquid Ears */}
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
        className="pointer-events-auto relative bg-[#0a0a0c]/95 text-white border-x border-b border-t-0 border-white/8 shadow-[0_12px_36px_rgba(0,0,0,0.85)] backdrop-blur-2xl origin-top"
      >
        {/* Lekukan Bahu Kiri Atas (MacBook Left Ear) */}
        <svg
          className="absolute -left-3 top-0 w-3 h-3 pointer-events-none"
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
          className="absolute -right-3 top-0 w-3 h-3 pointer-events-none"
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
              <Header
                media={media}
                isExpanded={false}
                timeString={timeString}
                displayCover={displayCover}
              />
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
                className="absolute top-0 left-1/2 -translate-x-1/2 w-145 h-49 px-4 py-3 flex flex-col justify-between z-10"
              >
                {/* Header Bar Atas dengan Micro-Tabs */}
                <Header
                  media={media}
                  activeTab={activeTab}
                  isPinned={isPinned}
                  isExpanded={true}
                  dateHeaderString={dateHeaderString}
                  handleTabChange={handleTabChange}
                  togglePin={togglePin}
                />

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
                            <div className="relative w-11 h-11 rounded-lg overflow-hidden shadow-md shrink-0 bg-white/6 ring-1 ring-white/10 flex items-center justify-center">
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
                          <div className="flex items-center justify-between bg-white/4 border border-white/6 rounded-xl px-3 py-2">
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
                                <p className="text-[10px] font-sans text-white/40 truncate max-w-33.75 mt-0.5">
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
                                    : "bg-white/3 text-white/60 border-white/5"
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

                          <div className="flex-1 overflow-y-auto my-1.5 pr-1 flex flex-col gap-1 max-h-17">
                            {todos.length === 0 ? (
                              <p className="text-[11px] font-sans text-white/30 my-auto">
                                Belum ada agenda. Ketik di bawah untuk menambah.
                              </p>
                            ) : (
                              todos.map((item) => (
                                <div
                                  key={item.id}
                                  className="group flex items-center justify-between gap-2 px-2 py-1 rounded-md bg-white/3 hover:bg-white/6 transition"
                                >
                                  <button
                                    onClick={() => toggleTodo(item.id)}
                                    className="flex items-center gap-2 text-left flex-1 overflow-hidden cursor-pointer"
                                  >
                                    <div
                                      className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center shrink-0 border transition ${item.done
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
                              className="flex-1 bg-white/5 border border-white/8 focus:border-white/25 rounded-lg px-2.5 py-1 text-[11px] font-sans text-white placeholder-white/30 outline-none transition"
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
                                <div className="w-6 h-6 rounded-md bg-white/8 flex items-center justify-center text-white/85">
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
                                className={`flex-1 bg-white/5 border ${keyValidationError ? 'border-rose-500/50' : 'border-white/8 focus:border-white/25'
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
                                  className={`px-2 py-0.5 rounded-md bg-white/[0.07] border border-white/6 text-[10px] font-mono text-white/75 shrink-0 ${activeProvider.id === 'gemini' ? 'hover:bg-white/[0.14] hover:text-white cursor-pointer transition' : ''
                                    }`}
                                >
                                  {activeProvider.name}
                                </button>

                                {media.hasMedia && (
                                  <button
                                    onClick={() => askAi(`Jelaskan secara singkat makna lagu "${media.title}" dari ${media.artist}`)}
                                    className="px-2 py-0.5 rounded-md bg-white/4 hover:bg-white/9 border border-white/6 text-[10px] font-sans text-white/60 hover:text-white transition cursor-pointer shrink-0"
                                  >
                                    🎵 Makna lagu ini
                                  </button>
                                )}

                                <button
                                  onClick={() => askAi('Berikan 1 kalimat motivasi singkat untuk menyelesaikan agendaku hari ini.')}
                                  className="px-2 py-0.5 rounded-md bg-white/4 hover:bg-white/9 border border-white/6 text-[10px] font-sans text-white/60 hover:text-white transition cursor-pointer shrink-0"
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
                                      className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/6 transition cursor-pointer"
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
                                      className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/6 transition cursor-pointer"
                                    >
                                      <RotateCcw size={11} />
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={handleRemoveApiKey}
                                  title="Ganti API Key"
                                  className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/6 transition cursor-pointer"
                                >
                                  <KeyRound size={11} />
                                </button>
                              </div>
                            </div>

                            {/* Area Jawaban AI */}
                            <div className="flex-1 my-1.5 px-2.5 py-1.5 rounded-lg bg-white/3 border border-white/5 overflow-y-auto max-h-17 flex flex-col justify-center">
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
                                className="flex-1 bg-white/5 border border-white/8 focus:border-white/25 rounded-lg px-2.5 py-1 text-[11px] font-sans text-white placeholder-white/30 outline-none transition"
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
