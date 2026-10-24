import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Volume2, VolumeX, Zap, FastForward, Rewind } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

export const GestureOverlay = ({
  videoRef,
  onSingleTap,
  onDoubleTapSkip,
  brightness,
  setBrightness,
  volume,
  setVolume,
  duration,
  currentTime,
  onSeekCommit,
  zoomScale,
  setZoomScale
}) => {
  const containerRef = useRef(null);
  const touchStartRef = useRef(null);
  const pinchStartRef = useRef(null);
  const lastTapRef = useRef({ time: 0, x: 0 });

  const [activeGesture, setActiveGesture] = useState(null); // 'brightness' | 'volume' | 'seek' | 'pinch'
  const [seekOffset, setSeekOffset] = useState(0);
  const [doubleTapSide, setDoubleTapSide] = useState(null);

  // Measure distance between 2 touch points
  const getPinchDistance = (e) => {
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  };

  const handleTouchStart = (e) => {
    // 2-Finger Pinch to Zoom Detection
    if (e.touches.length === 2) {
      pinchStartRef.current = {
        dist: getPinchDistance(e),
        initialScale: zoomScale
      };
      setActiveGesture('pinch');
      triggerHaptic('light');
      return;
    }

    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    touchStartRef.current = {
      x,
      y,
      width: rect.width,
      height: rect.height,
      initialBrightness: brightness,
      initialVolume: volume,
      initialTime: currentTime,
      isLeft: x < rect.width / 2,
      moved: false
    };
  };

  const handleTouchMove = (e) => {
    // Pinch to Zoom scaling
    if (e.touches.length === 2 && pinchStartRef.current) {
      const currentDist = getPinchDistance(e);
      const factor = currentDist / pinchStartRef.current.dist;
      const nextScale = Math.min(3.0, Math.max(0.8, pinchStartRef.current.initialScale * factor));
      setZoomScale(Number(nextScale.toFixed(2)));
      return;
    }

    if (!touchStartRef.current || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = touch.clientX - rect.left;
    const currentY = touch.clientY - rect.top;

    const deltaX = currentX - touchStartRef.current.x;
    const deltaY = touchStartRef.current.y - currentY; // Up is positive

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (!touchStartRef.current.moved) {
      if (absX > 14 || absY > 14) {
        touchStartRef.current.moved = true;
        if (absX > absY) {
          setActiveGesture('seek');
          triggerHaptic('light');
        } else {
          setActiveGesture(touchStartRef.current.isLeft ? 'brightness' : 'volume');
          triggerHaptic('light');
        }
      } else {
        return;
      }
    }

    if (activeGesture === 'brightness') {
      const deltaPercent = (deltaY / (rect.height * 0.65)) * 100;
      const nextVal = Math.min(100, Math.max(10, touchStartRef.current.initialBrightness + deltaPercent));
      setBrightness(Math.round(nextVal));
    } else if (activeGesture === 'volume') {
      // 0 to 200% volume scale
      const deltaPercent = (deltaY / (rect.height * 0.65)) * 200;
      const nextVol = Math.min(200, Math.max(0, touchStartRef.current.initialVolume + deltaPercent));
      setVolume(Math.round(nextVol));
    } else if (activeGesture === 'seek') {
      const maxScrub = Math.min(180, Math.max(30, duration * 0.25 || 60));
      const scrubDelta = (deltaX / (rect.width * 0.8)) * maxScrub;
      setSeekOffset(Math.round(scrubDelta));
    }
  };

  const handleTouchEnd = () => {
    pinchStartRef.current = null;
    const start = touchStartRef.current;
    touchStartRef.current = null;

    if (activeGesture === 'seek') {
      const targetTime = Math.min(duration, Math.max(0, start.initialTime + seekOffset));
      onSeekCommit(targetTime);
      triggerHaptic('medium');
      setActiveGesture(null);
      setSeekOffset(0);
      return;
    }

    setActiveGesture(null);

    // Tap and Double-Tap Skip
    if (start && !start.moved) {
      const now = Date.now();
      const timeDiff = now - lastTapRef.current.time;
      const distDiff = Math.abs(start.x - lastTapRef.current.x);

      if (timeDiff < 320 && distDiff < 60) {
        const isRight = start.x > start.width / 2;
        setDoubleTapSide(isRight ? 'right' : 'left');
        triggerHaptic('medium');
        onDoubleTapSkip(isRight ? 10 : -10);

        setTimeout(() => setDoubleTapSide(null), 600);
        lastTapRef.current = { time: 0, x: 0 };
      } else {
        lastTapRef.current = { time: now, x: start.x };
        setTimeout(() => {
          if (Date.now() - lastTapRef.current.time >= 300 && lastTapRef.current.time !== 0) {
            onSingleTap();
          }
        }, 320);
      }
    }
  };

  const formatSeconds = (sec) => {
    const s = Math.abs(Math.round(sec));
    const m = Math.floor(s / 60);
    const remS = s % 60;
    return `${m}:${remS < 10 ? '0' : ''}${remS}`;
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="absolute inset-0 z-20 overflow-hidden flex items-center justify-center pointer-events-auto"
    >
      {/* Double Tap Skip Ripple HUD */}
      <AnimatePresence>
        {doubleTapSide === 'left' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.15 }}
            className="absolute left-8 flex flex-col items-center justify-center p-6 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 text-white shadow-2xl"
          >
            <Rewind size={34} className="text-sky-400 animate-pulse" />
            <span className="text-xs font-black mt-1">-10s</span>
          </motion.div>
        )}
        {doubleTapSide === 'right' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.15 }}
            className="absolute right-8 flex flex-col items-center justify-center p-6 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 text-white shadow-2xl"
          >
            <FastForward size={34} className="text-sky-400 animate-pulse" />
            <span className="text-xs font-black mt-1">+10s</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Brightness HUD Card */}
      <AnimatePresence>
        {activeGesture === 'brightness' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center space-x-3 px-5 py-3.5 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/20 text-white shadow-2xl"
          >
            <Sun size={24} className="text-amber-400" />
            <div className="w-28 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all"
                style={{ width: `${brightness}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold w-9 text-right">{brightness}%</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Volume HUD Card (Supports 200% Software Volume Boost) */}
      <AnimatePresence>
        {activeGesture === 'volume' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`flex items-center space-x-3 px-5 py-3.5 rounded-2xl backdrop-blur-xl border shadow-2xl ${
              volume > 100
                ? 'bg-gradient-to-r from-purple-950/90 via-slate-900/90 to-black/90 border-purple-400/50'
                : 'bg-black/80 border-white/20'
            }`}
          >
            {volume === 0 ? (
              <VolumeX size={24} className="text-rose-400" />
            ) : volume > 100 ? (
              <Zap size={24} className="text-fuchsia-400 animate-pulse" />
            ) : (
              <Volume2 size={24} className="text-blue-400" />
            )}

            <div className="w-28 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  volume > 100
                    ? 'bg-gradient-to-r from-blue-400 via-indigo-400 to-fuchsia-500'
                    : 'bg-gradient-to-r from-blue-400 to-indigo-500'
                }`}
                style={{ width: `${Math.min(100, (volume / 200) * 100)}%` }}
              />
            </div>

            <div className="text-right w-12">
              <span className={`text-xs font-mono font-bold ${volume > 100 ? 'text-fuchsia-300' : 'text-white'}`}>
                {volume}%
              </span>
              {volume > 100 && (
                <span className="block text-[8px] font-black uppercase text-fuchsia-400 leading-none">
                  BOOST
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Horizontal Seek Scrubbing HUD */}
      <AnimatePresence>
        {activeGesture === 'seek' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center px-6 py-4 rounded-3xl bg-black/85 backdrop-blur-2xl border border-white/20 text-white shadow-2xl"
          >
            <span className={`text-2xl font-black ${seekOffset >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {seekOffset >= 0 ? `+${formatSeconds(seekOffset)}` : `-${formatSeconds(seekOffset)}`}
            </span>
            <span className="text-xs text-slate-300 mt-1 font-semibold">
              Target: {formatSeconds(Math.min(duration, Math.max(0, currentTime + seekOffset)))}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pinch-to-Zoom Indicator */}
      <AnimatePresence>
        {activeGesture === 'pinch' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 py-2 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/20 text-white text-xs font-mono font-bold"
          >
            Zoom: {Math.round(zoomScale * 100)}%
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
