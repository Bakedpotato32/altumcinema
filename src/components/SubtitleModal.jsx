import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Subtitles, Upload, Clock, Type, Palette, RotateCcw } from 'lucide-react';
import { parseSubtitles } from '../services/subtitles';
import { triggerHaptic } from '../services/haptics';

const COLOR_PRESETS = [
  { label: 'White', value: '#ffffff' },
  { label: 'Cinema Yellow', value: '#facc15' },
  { label: 'Electric Cyan', value: '#38bdf8' },
  { label: 'Soft Mint', value: '#4ade80' }
];

export const SubtitleModal = ({
  isOpen,
  onClose,
  subtitleSettings,
  onUpdateSettings,
  hasLoadedSubtitles,
  onSubtitlesLoaded
}) => {
  const fileInputRef = useRef(null);

  if (!isOpen || typeof document === 'undefined') return null;

  const {
    fontSize = 20,
    color = '#ffffff',
    bgOpacity = 70,
    offsetMs = 0,
    hasShadow = true
  } = subtitleSettings;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const parsed = parseSubtitles(event.target.result);
      onSubtitlesLoaded(parsed, file.name);
      triggerHaptic('success');
    };
    reader.readAsText(file);
  };

  const adjustOffset = (delta) => {
    triggerHaptic('light');
    onUpdateSettings({
      ...subtitleSettings,
      offsetMs: offsetMs + delta
    });
  };

  const resetOffset = () => {
    triggerHaptic('selection');
    onUpdateSettings({
      ...subtitleSettings,
      offsetMs: 0
    });
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/65 backdrop-blur-md"
        />

        {/* Bottom Drawer Card */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="relative z-10 w-full max-w-lg mx-auto bg-slate-900/95 backdrop-blur-3xl border-t border-white/15 rounded-t-[32px] p-6 pb-10 shadow-2xl max-h-[85vh] overflow-y-auto"
        >
          {/* Grab Handle */}
          <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4" />

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Subtitles size={18} />
              </div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Subtitle Studio
              </h3>
            </div>
            <button
              onClick={() => {
                triggerHaptic('selection');
                onClose();
              }}
              className="p-1.5 rounded-full bg-white/10 text-slate-300 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Load External Subtitle File */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-5 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white">
                {hasLoadedSubtitles ? 'Custom Subtitle Loaded' : 'No Subtitles Active'}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Supports .srt and .vtt local files
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20"
            >
              <Upload size={13} />
              <span>{hasLoadedSubtitles ? 'Replace File' : 'Import File'}</span>
            </motion.button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".srt,.vtt"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Live Preview Box */}
          <div className="mb-5 p-5 rounded-2xl bg-black/60 border border-white/10 text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[90px]">
            <span className="absolute top-2 left-2 text-[9px] font-mono font-bold text-slate-500 uppercase">
              Live Preview
            </span>
            <p
              style={{
                fontSize: `${fontSize}px`,
                color: color,
                backgroundColor: `rgba(0, 0, 0, ${bgOpacity / 100})`,
                textShadow: hasShadow ? '0px 2px 4px rgba(0,0,0,0.9)' : 'none'
              }}
              className="px-3.5 py-1.5 rounded-xl font-medium max-w-xs transition-all leading-snug"
            >
              This is how your subtitles will appear on screen.
            </p>
          </div>

          {/* Sync Calibration Section */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Clock size={14} className="text-amber-400" /> SYNC TIMING OFFSET
              </span>
              <span className="text-xs font-mono font-bold text-blue-400">
                {offsetMs > 0 ? `+${offsetMs} ms` : `${offsetMs} ms`}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              <button
                onClick={() => adjustOffset(-500)}
                className="py-2 rounded-xl bg-white/10 text-white text-xs font-bold font-mono hover:bg-white/15"
              >
                -0.5s
              </button>
              <button
                onClick={() => adjustOffset(-100)}
                className="py-2 rounded-xl bg-white/10 text-white text-xs font-bold font-mono hover:bg-white/15"
              >
                -0.1s
              </button>
              <button
                onClick={resetOffset}
                className="py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-center"
              >
                <RotateCcw size={12} />
              </button>
              <button
                onClick={() => adjustOffset(100)}
                className="py-2 rounded-xl bg-white/10 text-white text-xs font-bold font-mono hover:bg-white/15"
              >
                +0.1s
              </button>
              <button
                onClick={() => adjustOffset(500)}
                className="py-2 rounded-xl bg-white/10 text-white text-xs font-bold font-mono hover:bg-white/15"
              >
                +0.5s
              </button>
            </div>
          </div>

          {/* Typography & Color Customization */}
          <div className="space-y-4">
            {/* Font Size Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Type size={14} className="text-indigo-400" /> Font Size
                </span>
                <span className="font-mono text-white">{fontSize}px</span>
              </div>
              <input
                type="range"
                min="14"
                max="34"
                step="1"
                value={fontSize}
                onChange={(e) =>
                  onUpdateSettings({ ...subtitleSettings, fontSize: Number(e.target.value) })
                }
                className="w-full accent-blue-500 h-2 bg-white/15 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Background Pill Opacity Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1.5">
                <span>Background Pill Opacity</span>
                <span className="font-mono text-white">{bgOpacity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                value={bgOpacity}
                onChange={(e) =>
                  onUpdateSettings({ ...subtitleSettings, bgOpacity: Number(e.target.value) })
                }
                className="w-full accent-blue-500 h-2 bg-white/15 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Color Palette Chips */}
            <div>
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-2">
                <Palette size={14} className="text-rose-400" /> Text Color
              </span>
              <div className="grid grid-cols-4 gap-2">
                {COLOR_PRESETS.map((preset) => {
                  const isSelected = color === preset.value;
                  return (
                    <button
                      key={preset.value}
                      onClick={() => {
                        triggerHaptic('selection');
                        onUpdateSettings({ ...subtitleSettings, color: preset.value });
                      }}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                        isSelected
                          ? 'border-blue-400 bg-blue-600/30 text-white'
                          : 'border-white/10 bg-white/5 text-slate-300'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-black/40 shadow-sm"
                        style={{ backgroundColor: preset.value }}
                      />
                      <span className="truncate">{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
