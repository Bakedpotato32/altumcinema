import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sliders, Zap } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';
import { triggerHaptic } from '../services/haptics';

const PRESETS = {
  flat: [0, 0, 0, 0, 0],
  bassHeavy: [8, 4, -1, 1, 2],
  vocal: [-2, 2, 7, 3, -1],
  cinema: [6, 2, -2, 4, 5],
  electronic: [7, 5, 0, 4, 6]
};

export const AudioEQModal = ({ isOpen, onClose, currentSettings, onSaveSettings }) => {
  const [bassBoost, setBassBoost] = useState(currentSettings?.audio?.bassBoost || 0);
  const [bands, setBands] = useState(currentSettings?.audio?.eqBands || [0, 0, 0, 0, 0]);
  const [activePreset, setActivePreset] = useState(currentSettings?.audio?.preset || 'flat');

  const handleBassChange = (val) => {
    const num = Number(val);
    setBassBoost(num);
    audioEngine.setBassBoost(num);
  };

  const handleBandChange = (index, val) => {
    const num = Number(val);
    const newBands = [...bands];
    newBands[index] = num;
    setBands(newBands);
    audioEngine.setBandGain(index, num);
    setActivePreset('custom');
  };

  const selectPreset = (key) => {
    triggerHaptic('selection');
    setActivePreset(key);
    const gains = PRESETS[key];
    if (gains) {
      setBands(gains);
      audioEngine.applyPreset(gains, bassBoost);
    }
  };

  const handleClose = () => {
    onSaveSettings({
      ...currentSettings,
      audio: {
        bassBoost,
        eqBands: bands,
        preset: activePreset
      }
    });
    onClose();
  };

  if (!isOpen || typeof document === 'undefined') return null;

  const bandLabels = ['60Hz', '250Hz', '1kHz', '4kHz', '12kHz'];

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="relative z-10 w-full max-w-lg mx-auto bg-slate-900/95 backdrop-blur-2xl border-t border-white/15 rounded-t-3xl p-6 pb-10 shadow-2xl"
        >
          <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4" />

          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-2">
              <Sliders size={20} className="text-indigo-400" />
              <h3 className="text-lg font-bold text-white">Audio EQ & Bass Boost</h3>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-full bg-white/10 text-slate-300 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 border border-indigo-400/30 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Zap size={14} className="text-amber-400" /> BASS BOOST AMPLIFIER
              </span>
              <span className="text-xs font-mono font-bold text-white">+{bassBoost} dB</span>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              step="1"
              value={bassBoost}
              onChange={(e) => handleBassChange(e.target.value)}
              className="w-full accent-indigo-400 h-2 bg-white/15 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
            {Object.keys(PRESETS).map((pKey) => (
              <button
                key={pKey}
                onClick={() => selectPreset(pKey)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all ${
                  activePreset === pKey
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 border border-blue-400'
                    : 'bg-white/5 text-slate-300 border border-white/10'
                }`}
              >
                {pKey.replace(/([A-Z])/g, ' $1')}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-5 gap-3 h-44 items-end bg-black/40 p-4 rounded-2xl border border-white/5">
            {bands.map((gain, idx) => (
              <div key={idx} className="flex flex-col items-center h-full justify-between">
                <span className="text-[10px] font-mono text-slate-300 font-bold">
                  {gain > 0 ? `+${gain}` : gain}
                </span>
                <div className="relative h-28 flex items-center justify-center">
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="1"
                    value={gain}
                    onChange={(e) => handleBandChange(idx, e.target.value)}
                    className="w-28 -rotate-90 accent-blue-500 bg-white/15 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <span className="text-[10px] font-semibold text-slate-400">{bandLabels[idx]}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
