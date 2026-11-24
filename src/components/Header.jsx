import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Pin } from 'lucide-react';

const TABS = [
  { id: 'music', label: 'Music' },
  { id: 'today', label: 'Today' },
  { id: 'ai', label: 'AI' },
];

function HeaderBase({
  isPlaying,
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
            y: { type: 'spring', stiffness: 360, damping: 22, delay: 0.05 },
          },
        }}
        exit={{
          opacity: 0,
          y: -4,
          transition: { duration: 0.08 },
        }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-43 h-8.5 px-3.5 flex items-center justify-between text-[12px] font-sans"
      >
        {/* Vinyl Cover Art */}
        {displayCover ? (
          <img
            src={displayCover}
            alt="cover"
            className="w-4 h-4 rounded-full object-cover ring-1 ring-white/15 animate-spin"
            style={{
              animationDuration: '8s',
              animationPlayState: isPlaying ? 'running' : 'paused',
            }}
          />
        ) : (
          <div
            className="w-4 h-4 rounded-full bg-white/10 ring-1 ring-white/15 flex items-center justify-center animate-spin"
            style={{
              animationDuration: '8s',
              animationPlayState: isPlaying ? 'running' : 'paused',
            }}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-white/60' : 'bg-white/25'}`}
            />
          </div>
        )}

        {/* Jam Digital */}
        <span className="font-sans tabular-nums font-medium text-[12px] text-white/92">
          {timeString}
        </span>

        {/* Minimalist Monochrome Waveform */}
        <div className="flex items-center gap-0.5 h-3" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="ryflow-eq-bar w-0.5 h-full origin-bottom bg-white/75 rounded-full"
              style={
                isPlaying
                  ? { animation: `ryflow-eq ${0.65 + i * 0.12}s ease-in-out ${-i * 0.17}s infinite` }
                  : { transform: 'scaleY(0.2)' }
              }
            />
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex items-center justify-between text-[11px] text-white/56 border-b border-white/[0.07] pb-2">
      <div className="flex items-center gap-1.5">
        <span className="font-sans font-medium text-[12px] text-white/88 tracking-[-0.01em]">
          Ryflow
        </span>
        <button
          type="button"
          onClick={togglePin}
          aria-label={isPinned ? 'Lepas sematan' : 'Sematkan agar tetap terbuka'}
          title={isPinned ? 'Lepas sematan' : 'Sematkan agar tetap terbuka'}
          className={`inline-flex items-center justify-center p-1 rounded-md transition cursor-pointer ${
            isPinned
              ? 'bg-white/12 text-white/92'
              : 'text-white/45 hover:text-white/85 hover:bg-white/[0.06]'
          }`}
        >
          <Pin size={11} className={isPinned ? 'rotate-45' : ''} />
        </button>
      </div>

      {/* Segmented Tabs (Music | Today | AI) */}
      <div
        role="tablist"
        aria-label="Navigasi tab"
        className="flex items-center gap-0.5 bg-white/[0.04] p-0.5 rounded-lg border border-white/[0.06]"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabChange(tab.id)}
              className={`relative inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-[11px] font-sans font-medium transition-colors cursor-pointer ${
                isActive ? 'text-white' : 'text-white/52 hover:text-white/85'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  transition={{
                    type: 'spring',
                    stiffness: 380,
                    damping: 30,
                    mass: 0.8,
                  }}
                  className="absolute inset-0 bg-white/[0.13] rounded-md"
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tanggal & Jam */}
      <span className="font-sans tabular-nums text-[11px] text-white/56">
        {dateHeaderString}
      </span>
    </div>
  );
}

export const Header = memo(HeaderBase);
