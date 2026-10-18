import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Disc, Flame } from 'lucide-react';

const DUMMY_LYRICS = [
  { time: 0, text: "♪ Intro Instrumental ♪" },
  { time: 3, text: "Tiap detik masih merindukanmu, oh-oh" },
  { time: 7, text: "Nama jadi nadaku, lirikmu jadi kisahku" },
  { time: 11, text: "Mungkin ini siklusnya, sudah garis jalannya" },
  { time: 15, text: "Walau jauh di sana, tetap kau yang pertama" },
  { time: 19, text: "Bayangmu masih menetap di sela waktu" },
];

export default function App() {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(4);
  const duration = 24;

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTime((prev) => (prev >= duration ? 0 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (window.electronAPI) window.electronAPI.setIgnoreMouseEvents(false);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (window.electronAPI) window.electronAPI.setIgnoreMouseEvents(true, { forward: true });
  };

  const activeLyricIndex = DUMMY_LYRICS.reduce((acc, curr, idx) => {
    return currentTime >= curr.time ? idx : acc;
  }, 0);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="w-screen h-screen flex justify-center items-start pt-0 pointer-events-none">
      <motion.div
        layout
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        initial={{ borderRadius: 24 }}
        animate={{
          width: isHovered ? 560 : 170,
          height: isHovered ? 195 : 36,
          borderBottomLeftRadius: isHovered ? 28 : 18,
          borderBottomRightRadius: isHovered ? 28 : 18,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="pointer-events-auto relative bg-[#0a0a0c]/95 text-white overflow-hidden border-x border-b border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col justify-between"
      >
        {/* Ambient Glow */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              exit={{ opacity: 0 }}
              className="absolute -top-12 -left-12 w-48 h-48 bg-rose-600 rounded-full blur-3xl pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* IDLE PILL — saat notch tertutup */}
        {!isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full px-3.5 flex items-center justify-between text-xs font-sans font-semibold tracking-wide"
          >
            <div className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />

            {/* Jam digital */}
            <span className="text-white/90 font-mono font-medium text-[13px]">19:25</span>

            {/* Mini waveform */}
            <div className="flex items-center gap-[2.5px] h-3">
              {[0.5, 1, 0.6, 0.9, 0.4].map((h, i) => (
                <motion.span
                  key={i}
                  animate={{ height: isPlaying ? ["30%", "100%", "40%"] : "25%" }}
                  transition={{ repeat: Infinity, duration: 0.6 + i * 0.1, ease: "easeInOut" }}
                  className="w-[2.5px] bg-rose-400 rounded-full"
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* EXPANDED ISLAND — saat notch dibuka */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className="w-full h-full p-4 flex flex-col justify-between z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between text-[11px] text-white/60 border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  {/* Nama app — font-sans semibold */}
                  <span className="font-sans font-semibold text-white/80">ryflow</span>
                </div>
                {/* Tanggal & jam — font-mono */}
                <span className="font-mono text-white/80">Sun 18 Oct 2026 • 19:25</span>
                <div className="flex items-center gap-1 text-rose-400 font-sans font-medium">
                  <Flame size={13} />
                  <span>Lyrics Live</span>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4 items-center my-auto py-1">

                {/* KIRI: Info lagu + kontrol */}
                <div className="col-span-7 flex flex-col gap-2.5 pr-2 border-r border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-lg shrink-0 bg-gradient-to-br from-rose-500 to-purple-700 flex items-center justify-center">
                      <Disc
                        size={26}
                        className={`text-white/90 ${isPlaying ? "animate-spin" : ""}`}
                        style={{ animationDuration: "6s" }}
                      />
                    </div>
                    <div className="overflow-hidden">
                      {/* Judul lagu — font-bold */}
                      <h3 className="text-sm font-sans font-bold text-white truncate">
                        Kok Masih Rindu?
                      </h3>
                      {/* Artis — default weight */}
                      <p className="text-xs font-sans text-white/60 truncate">
                        Akbar Chalay • Single
                      </p>
                    </div>
                  </div>

                  {/* Progress bar + timer — font-mono */}
                  <div className="flex items-center gap-2 text-[10px] font-mono text-white/60">
                    <span>{formatTime(currentTime)}</span>
                    <div className="flex-1 h-1.5 bg-white/15 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-rose-500 to-amber-400 rounded-full"
                        animate={{ width: `${(currentTime / duration) * 100}%` }}
                        transition={{ ease: "linear", duration: 0.3 }}
                      />
                    </div>
                    <span>-{formatTime(duration - currentTime)}</span>
                  </div>

                  {/* Tombol kontrol */}
                  <div className="flex items-center justify-center gap-5 pt-0.5">
                    <button
                      onClick={() => setCurrentTime(0)}
                      className="text-white/70 hover:text-white transition transform active:scale-90 cursor-pointer"
                    >
                      <SkipBack size={17} />
                    </button>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-md cursor-pointer"
                    >
                      {isPlaying ? <Pause size={16} fill="black" /> : <Play size={16} fill="black" className="ml-0.5" />}
                    </button>
                    <button
                      onClick={() => setCurrentTime((prev) => Math.min(duration, prev + 4))}
                      className="text-white/70 hover:text-white transition transform active:scale-90 cursor-pointer"
                    >
                      <SkipForward size={17} />
                    </button>
                  </div>
                </div>

                {/* KANAN: Synced Lyrics */}
                <div className="col-span-5 h-28 flex flex-col justify-center overflow-hidden relative px-1">
                  <div className="flex flex-col gap-2 transition-all duration-500">
                    {DUMMY_LYRICS.map((line, index) => {
                      const isActive = index === activeLyricIndex;
                      const isNear = Math.abs(index - activeLyricIndex) === 1;

                      if (Math.abs(index - activeLyricIndex) > 1) return null;

                      return (
                        <motion.p
                          key={index}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{
                            opacity: isActive ? 1 : isNear ? 0.35 : 0,
                            scale: isActive ? 1.03 : 0.95,
                            filter: isActive ? "blur(0px)" : "blur(1px)",
                          }}
                          transition={{ duration: 0.35 }}
                          className={`font-lyric italic text-xs leading-snug transition-colors ${isActive
                            ? "font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"  /* lirik aktif */
                            : "font-medium text-white/60"                                          /* lirik sekitar */
                            }`}
                        >
                          {line.text}
                        </motion.p>
                      );
                    })}
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}