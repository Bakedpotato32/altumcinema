import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, ArrowLeft, RotateCcw, RotateCw, 
  Lock, Unlock, Sliders, Crop, PictureInPicture2,
  Subtitles, Gauge, Camera, Repeat, Check, Sparkles
} from 'lucide-react';
import { GestureOverlay } from './GestureOverlay';
import { GlassSelect } from './GlassSelect';
import { AudioEQModal } from './AudioEQModal';
import { SubtitleModal } from './SubtitleModal';
import { PlaybackSpeedModal } from './PlaybackSpeedModal';
import { ABLooperBar } from './ABLooperBar';
import { audioEngine } from '../services/audioEngine';
import { getActiveCue } from '../services/subtitles';
import { captureVideoFrame } from '../services/snapshot';
import { triggerHaptic } from '../services/haptics';
import { saveVideoProgress } from '../services/storage';

export const VideoPlayer = ({ video, onClose, settings, onUpdateSettings }) => {
  const videoRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [volume, setVolume] = useState(80);
  const [zoomScale, setZoomScale] = useState(1.0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [aspectRatio, setAspectRatio] = useState(settings.aspectRatio || 'fit');

  // Modals state
  const [isAspectSelectOpen, setIsAspectSelectOpen] = useState(false);
  const [isEQOpen, setIsEQOpen] = useState(false);
  const [isSubtitleModalOpen, setIsSubtitleModalOpen] = useState(false);
  const [isSpeedModalOpen, setIsSpeedModalOpen] = useState(false);
  const [isLooperOpen, setIsLooperOpen] = useState(false);

  // A-B Looper state
  const [loopA, setLoopA] = useState(null);
  const [loopB, setLoopB] = useState(null);

  // Snapshot flash & notification state
  const [isShutterFlashing, setIsShutterFlashing] = useState(false);
  const [recentSnapshot, setRecentSnapshot] = useState(null);

  // Subtitles state
  const [subtitles, setSubtitles] = useState([]);
  const [currentSubtitleText, setCurrentSubtitleText] = useState('');
  const [subtitleSettings, setSubtitleSettings] = useState(
    settings.subtitles || {
      fontSize: 20,
      color: '#ffffff',
      bgOpacity: 70,
      offsetMs: 0,
      hasShadow: true
    }
  );

  const controlsTimeoutRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      audioEngine.init(videoRef.current);
      audioEngine.setVolumeMultiplier(volume);
      if (settings?.audio) {
        audioEngine.applyPreset(settings.audio.eqBands, settings.audio.bassBoost);
      }
    }

    if ('mediaSession' in navigator && video) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: video.name || 'Local Video',
        artist: 'AltumCinema Pro',
        album: 'Video Vault'
      });
      navigator.mediaSession.setActionHandler('play', () => handleTogglePlay());
      navigator.mediaSession.setActionHandler('pause', () => handleTogglePlay());
      navigator.mediaSession.setActionHandler('seekbackward', () => handleSkip(-10));
      navigator.mediaSession.setActionHandler('seekforward', () => handleSkip(10));
    }

    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [video]);

  // Volume engine synchronization
  useEffect(() => {
    if (videoRef.current) {
      if (volume <= 100) {
        videoRef.current.volume = volume / 100;
        audioEngine.setVolumeMultiplier(100);
      } else {
        videoRef.current.volume = 1.0;
        audioEngine.setVolumeMultiplier(volume);
      }
    }
  }, [volume]);

  const scheduleControlsHide = () => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4500);
  };

  const handleTogglePlay = () => {
    triggerHaptic('selection');
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
      scheduleControlsHide();
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      setShowControls(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    setCurrentTime(curr);

    // A-B Looper execution: seek back to Point A when reaching Point B
    if (loopA !== null && loopB !== null && loopB > loopA) {
      if (curr >= loopB || curr < loopA) {
        videoRef.current.currentTime = loopA;
        return;
      }
    }

    // Dynamic Subtitle Sync
    if (subtitles.length > 0) {
      const activeText = getActiveCue(subtitles, curr, subtitleSettings.offsetMs || 0);
      setCurrentSubtitleText(activeText);
    }

    if (Math.round(curr) % 4 === 0) {
      saveVideoProgress({
        ...video,
        currentTime: curr,
        duration: videoRef.current.duration
      });
    }
  };

  const handleSkip = (seconds) => {
    triggerHaptic('light');
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(
      videoRef.current.duration,
      Math.max(0, videoRef.current.currentTime + seconds)
    );
    scheduleControlsHide();
  };

  const handleSeekCommit = (targetTime) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = targetTime;
    scheduleControlsHide();
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  // Instant High-Res Screenshot Snapper
  const handleTakeSnapshot = async () => {
    if (!videoRef.current) return;
    triggerHaptic('heavy');

    // Trigger visual camera shutter flash
    setIsShutterFlashing(true);
    setTimeout(() => setIsShutterFlashing(false), 250);

    const result = await captureVideoFrame(videoRef.current, video.name);
    if (result) {
      setRecentSnapshot(result);
      setTimeout(() => setRecentSnapshot(null), 3800);
    }
  };

  const handlePiP = async () => {
    try {
      if (videoRef.current && document.pictureInPictureEnabled) {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      }
    } catch (e) {
      console.warn('PiP error', e);
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const aspectClassMap = {
    fit: 'object-contain',
    fill: 'object-fill',
    zoom: 'object-cover',
    '16:9': 'aspect-video object-cover',
    '4:3': 'aspect-[4/3] object-cover'
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden">
      {/* Visual Camera Shutter White Flash Overlay */}
      {isShutterFlashing && (
        <div className="absolute inset-0 z-50 bg-white pointer-events-none transition-opacity duration-200" />
      )}

      {/* Video Canvas with Zoom Transform */}
      <div 
        className="w-full h-full flex items-center justify-center overflow-hidden"
        style={{ transform: `scale(${zoomScale})`, transition: 'transform 0.05s linear' }}
      >
        <video
          ref={videoRef}
          src={video.url}
          autoPlay
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration);
              videoRef.current.playbackRate = playbackSpeed;
              if (video.currentTime && settings.rememberPosition) {
                videoRef.current.currentTime = video.currentTime;
              }
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            setShowControls(true);
          }}
          style={{ filter: `brightness(${brightness}%)` }}
          className={`w-full h-full ${aspectClassMap[aspectRatio] || 'object-contain'}`}
        />
      </div>

      {/* Styled Subtitle Overlay */}
      {currentSubtitleText && (
        <div className="absolute bottom-20 left-4 right-4 z-20 pointer-events-none flex justify-center">
          <p
            style={{
              fontSize: `${subtitleSettings.fontSize || 20}px`,
              color: subtitleSettings.color || '#ffffff',
              backgroundColor: `rgba(0, 0, 0, ${(subtitleSettings.bgOpacity ?? 70) / 100})`,
              textShadow: subtitleSettings.hasShadow ? '0px 2px 4px rgba(0,0,0,0.9)' : 'none'
            }}
            className="px-4 py-1.5 rounded-2xl text-center font-medium shadow-2xl backdrop-blur-xs max-w-xl whitespace-pre-line leading-relaxed"
          >
            {currentSubtitleText}
          </p>
        </div>
      )}

      {/* MX Player Touch Gesture Overlay */}
      {!isLocked && (
        <GestureOverlay
          videoRef={videoRef}
          onSingleTap={() => {
            setShowControls((prev) => !prev);
            if (!showControls) scheduleControlsHide();
          }}
          onDoubleTapSkip={handleSkip}
          brightness={brightness}
          setBrightness={setBrightness}
          volume={volume}
          setVolume={setVolume}
          duration={duration}
          currentTime={currentTime}
          onSeekCommit={handleSeekCommit}
          zoomScale={zoomScale}
          setZoomScale={setZoomScale}
        />
      )}

      {/* Top Floating Action: Child Lock */}
      <div className="absolute top-5 right-5 z-40">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            triggerHaptic('medium');
            setIsLocked((prev) => !prev);
            setShowControls(true);
          }}
          className={`p-3 rounded-full backdrop-blur-xl border shadow-xl ${
            isLocked
              ? 'bg-rose-500/85 border-rose-400 text-white shadow-rose-500/30'
              : 'bg-black/60 border-white/20 text-white'
          }`}
        >
          {isLocked ? <Lock size={20} /> : <Unlock size={20} />}
        </motion.button>
      </div>

      {/* Snapshot Confirmation Pill Toast */}
      <AnimatePresence>
        {recentSnapshot && (
          <motion.div
            initial={{ opacity: 0, x: -30, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -30, scale: 0.9 }}
            className="absolute bottom-24 left-5 z-40 flex items-center space-x-3 p-2.5 pr-4 rounded-2xl bg-black/80 backdrop-blur-2xl border border-white/20 text-white shadow-2xl"
          >
            <img
              src={recentSnapshot.dataUrl}
              alt="Snapshot"
              className="w-12 h-8 rounded-lg object-cover border border-white/20 shrink-0"
            />
            <div>
              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                <Check size={11} /> Frame Captured
              </span>
              <p className="text-[11px] font-mono text-slate-300 font-bold">
                {formatTime(recentSnapshot.timestamp)} • Saved
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD Controls */}
      <AnimatePresence>
        {showControls && !isLocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-4 pt-6 pb-6 bg-gradient-to-b from-black/85 via-transparent to-black/90"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between pointer-events-auto pr-14">
              <div className="flex items-center space-x-3">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-lg border border-white/15"
                >
                  <ArrowLeft size={20} />
                </motion.button>
                <div className="truncate max-w-[170px]">
                  <h4 className="text-sm font-bold text-white truncate">{video.name}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">AltumCinema Engine</span>
                </div>
              </div>

              {/* Action Buttons Tray */}
              <div className="flex items-center space-x-2">
                {/* Screenshot Snapper */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleTakeSnapshot}
                  className="p-2.5 rounded-full bg-white/10 text-white backdrop-blur-lg border border-white/15 hover:bg-white/20"
                >
                  <Camera size={18} />
                </motion.button>

                {/* A-B Scene Looper Toggle */}
                <button
                  onClick={() => setIsLooperOpen((prev) => !prev)}
                  className={`p-2.5 rounded-full backdrop-blur-lg border transition-all ${
                    loopA !== null && loopB !== null
                      ? 'bg-emerald-600/70 border-emerald-400 text-white'
                      : 'bg-white/10 border-white/15 text-white'
                  }`}
                >
                  <Repeat size={18} />
                </button>

                {/* Playback Speed Pill */}
                <button
                  onClick={() => setIsSpeedModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 text-white font-mono text-xs font-bold backdrop-blur-lg border border-white/15 hover:bg-white/20"
                >
                  {playbackSpeed}x
                </button>

                {/* Subtitle Studio Button */}
                <button
                  onClick={() => setIsSubtitleModalOpen(true)}
                  className={`p-2.5 rounded-full backdrop-blur-lg border transition-all ${
                    subtitles.length > 0
                      ? 'bg-blue-600/70 border-blue-400 text-white'
                      : 'bg-white/10 border-white/15 text-white'
                  }`}
                >
                  <Subtitles size={18} />
                </button>

                {/* Audio EQ Button */}
                <button
                  onClick={() => setIsEQOpen(true)}
                  className="p-2.5 rounded-full bg-white/10 text-white backdrop-blur-lg border border-white/15"
                >
                  <Sliders size={18} />
                </button>

                {/* Aspect Ratio Button */}
                <button
                  onClick={() => setIsAspectSelectOpen(true)}
                  className="p-2.5 rounded-full bg-white/10 text-white backdrop-blur-lg border border-white/15"
                >
                  <Crop size={18} />
                </button>

                {/* Picture in Picture */}
                <button
                  onClick={handlePiP}
                  className="p-2.5 rounded-full bg-white/10 text-white backdrop-blur-lg border border-white/15"
                >
                  <PictureInPicture2 size={18} />
                </button>
              </div>
            </div>

            {/* Play/Pause & Skip Buttons */}
            <div className="flex items-center justify-center space-x-8 pointer-events-auto">
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => handleSkip(-10)}
                className="p-3.5 rounded-full bg-white/10 text-white backdrop-blur-md border border-white/15 hover:bg-white/20"
              >
                <RotateCcw size={24} />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleTogglePlay}
                className="p-5 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-700 text-white shadow-xl shadow-indigo-600/40 border border-blue-400/50"
              >
                {isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => handleSkip(10)}
                className="p-3.5 rounded-full bg-white/10 text-white backdrop-blur-md border border-white/15 hover:bg-white/20"
              >
                <RotateCw size={24} />
              </motion.button>
            </div>

            {/* Bottom Scrubber & A-B Looper Bar */}
            <div className="pointer-events-auto space-y-2">
              {/* Floating A-B Looper Utility Controls */}
              <ABLooperBar
                isOpen={isLooperOpen}
                onClose={() => setIsLooperOpen(false)}
                currentTime={currentTime}
                loopA={loopA}
                loopB={loopB}
                onSetA={(t) => setLoopA(t)}
                onSetB={(t) => setLoopB(t)}
                onClearLoop={() => {
                  setLoopA(null);
                  setLoopB(null);
                }}
              />

              <div className="flex items-center justify-between text-xs font-mono text-slate-300 font-semibold px-1">
                <span>{formatTime(currentTime)}</span>
                <span className="text-slate-400 font-normal">
                  {zoomScale !== 1.0 ? `Zoom ${Math.round(zoomScale * 100)}% • ` : ''}
                  {formatTime(duration)}
                </span>
              </div>

              {/* Scrubber Range with A-B Marker Overlays */}
              <div className="relative w-full flex items-center">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.5"
                  value={currentTime}
                  onChange={(e) => {
                    const target = Number(e.target.value);
                    setCurrentTime(target);
                    if (videoRef.current) videoRef.current.currentTime = target;
                  }}
                  className="w-full accent-blue-500 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer relative z-10"
                />

                {/* Point A Marker Pin on Scrubber */}
                {loopA !== null && duration > 0 && (
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-blue-400 z-20 pointer-events-none rounded-full shadow-sm shadow-blue-400"
                    style={{ left: `${(loopA / duration) * 100}%` }}
                  />
                )}

                {/* Point B Marker Pin on Scrubber */}
                {loopB !== null && duration > 0 && (
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-emerald-400 z-20 pointer-events-none rounded-full shadow-sm shadow-emerald-400"
                    style={{ left: `${(loopB / duration) * 100}%` }}
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals & Drawers */}
      <SubtitleModal
        isOpen={isSubtitleModalOpen}
        onClose={() => setIsSubtitleModalOpen(false)}
        subtitleSettings={subtitleSettings}
        onUpdateSettings={(newSub) => {
          setSubtitleSettings(newSub);
          onUpdateSettings({ ...settings, subtitles: newSub });
        }}
        hasLoadedSubtitles={subtitles.length > 0}
        onSubtitlesLoaded={(parsedList) => {
          setSubtitles(parsedList);
          setIsSubtitleModalOpen(false);
        }}
      />

      <PlaybackSpeedModal
        isOpen={isSpeedModalOpen}
        onClose={() => setIsSpeedModalOpen(false)}
        currentSpeed={playbackSpeed}
        onSelectSpeed={handleSpeedChange}
      />

      <GlassSelect
        isOpen={isAspectSelectOpen}
        onClose={() => setIsAspectSelectOpen(false)}
        title="Screen Aspect Ratio"
        selectedValue={aspectRatio}
        onSelect={(val) => {
          setAspectRatio(val);
          onUpdateSettings({ ...settings, aspectRatio: val });
        }}
        options={[
          { label: 'Fit to Screen (Original)', value: 'fit' },
          { label: 'Stretch Full (Fill)', value: 'fill' },
          { label: 'Smart Zoom (Crop)', value: 'zoom' },
          { label: '16:9 Widescreen', value: '16:9' },
          { label: '4:3 Classic TV', value: '4:3' }
        ]}
      />

      <AudioEQModal
        isOpen={isEQOpen}
        onClose={() => setIsEQOpen(false)}
        currentSettings={settings}
        onSaveSettings={onUpdateSettings}
      />
    </div>
  );
};
