import React from 'react';
import { motion } from 'framer-motion';
import { Pin } from 'lucide-react';

export function Header({
  media,
  activeTab,
  isPinned,
  isExpanded,
  dateHeaderString,
  timeString,
  displayCover,
  handleTabChange,
  togglePin,
}) {
  if (!isExpanded) {
    return (
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
        className="absolute top-0 left-1/2 -translate-x-1/2 w-43 h-8.5 px-3.5 flex items-center justify-between text-xs font-sans font-semibold tracking-wide"
      >
        {/* Vinyl Cover Art */}
        {displayCover ? (
          <img
            src={displayCover}
            alt="cover"
            className="w-4 h-4 rounded-full object-cover ring-1 ring-white/15 animate-spin"
            style={{
              animationDuration: "8s",
              animationPlayState: media?.isPlaying ? "running" : "paused",
            }}
          />
        ) : (
          <div
            className="w-4 h-4 rounded-full bg-white/10 ring-1 ring-white/15 flex items-center justify-center animate-spin"
            style={{
              animationDuration: "8s",
              animationPlayState: media?.isPlaying ? "running" : "paused",
            }}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${media?.isPlaying ? "bg-emerald-400" : "bg-white/40"}`}
            />
          </div>
        )}

        {/* Jam Digital */}
        <span className="text-white/90 font-mono font-medium text-[12.5px] tracking-tight">
          {timeString}
        </span>

        {/* Minimalist Monochrome Waveform */}
        <div className="flex items-center gap-0.5 h-3">
          {[0.45, 0.95, 0.55, 0.85, 0.4].map((_, i) => (
            <motion.span
              key={i}
              animate={{
                height: media?.isPlaying ? ["25%", "95%", "35%"] : "20%",
              }}
              transition={{
                repeat: Infinity,
                duration: 0.65 + i * 0.12,
                ease: "easeInOut",
              }}
              className="w-0.5 bg-white/75 rounded-full"
            />
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex items-center justify-between text-[11px] text-white/50 border-b border-white/[0.07] pb-2">
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${media?.isPlaying ? "bg-emerald-400" : "bg-white/30"}`}
        />
        <span className="font-sans font-semibold text-white/85 tracking-tight">
          Ryflow
        </span>
        <button
          onClick={togglePin}
          title={isPinned ? "Lepas sematan" : "Sematkan agar tetap terbuka"}
          className={`p-1 rounded-md transition cursor-pointer ${isPinned
            ? "bg-white/20 text-white"
            : "text-white/35 hover:text-white/75 hover:bg-white/6"
          }`}
        >
          <Pin size={11} className={isPinned ? "rotate-45" : ""} />
        </button>
      </div>

      {/* Tengah: Micro Pill-Tabs (Music | Today | AI) */}
      <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-full border border-white/6">
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
  );
}
