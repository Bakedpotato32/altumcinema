import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, ArrowLeft, RotateCcw, RotateCw, 
  Lock, Unlock, Sliders, Crop, PictureInPicture2,
  Subtitles, Gauge, Camera, Repeat, Volume2, 
  MoreHorizontal, Sparkles, Rotate3D, Moon
} from 'lucide-react';
import { GestureOverlay } from './GestureOverlay';
import { GlassSelect } from './GlassSelect';
import { AudioEQModal } from './AudioEQModal';
import { SubtitleModal } from './SubtitleModal';
import { SubtitleSearchModal } from './SubtitleSearchModal';
import { PlaybackSpeedModal } from './PlaybackSpeedModal';
import { AudioTrackModal } from './AudioTrackModal';
import { SubtitleExplorerModal } from './SubtitleExplorerModal';
import { SleepTimerModal } from './SleepTimerModal';
import { ABLooperBar } from './ABLooperBar';
import { IntroSkipPill } from './IntroSkipPill';
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

  // Press-and-Hold 2.0x Speed State
  const [isHold2xActive, setIsHold2xActive] = useState(false);
  const previousSpeedRef = useRef(1.0);

  // Screen Orientation State ('auto' | 'landscape' | 'portrait')
  const [orientationMode, setOrientationMode] = useState('auto');

  // Sleep Timer State (in remaining seconds, or null)
  const [sleepTimerSeconds, setSleepTimerSeconds] = useState(null);
  const [isSleepTimerModalOpen, setIsSleepTimerModalOpen] = useState(false);

  // Intro / Anime OP Skip duration (default: 85 seconds)
  const [introSkipDuration, setIntroSkipDuration] = useState(settings.introSkipDuration || 85);

  // Modals state
  const [isQuickToolsOpen, setIsQuickToolsOpen] = useState(false);
  const [isAspectSelectOpen, setIsAspectSelectOpen] = useState(false);
  const [isEQOpen, setIsEQOpen] = useState(false);
  const [isSubtitleModalOpen, setIsSubtitleModalOpen] = useState(false);
  const [isSubtitleExplorerOpen, setIsSubtitleExplorerOpen] = useState(false);
  const [isSubtitleSearchOpen, setIsSubtitleSearchOpen] = useState(false);
  const [isSpeedModalOpen, setIsSpeedModalOpen] = useState(false);
  const [isLooperOpen, setIsLooperOpen] = useState(false);
  const [isAudioTrackModalOpen, setIsAudioTrackModalOpen] = useState(false);

  // Audio Tracks state
  const [audioTracksList, setAudioTracksList] = useState([]);
  const [activeAudioIndex, setActiveAudioIndex] = useState(0);

  // A-B Looper state
  const [loopA, setLoopA] = useState(null);
  const [loopB, setLoopB] = useState(null);

  // Snapshot flash state
  const [isShutterFlashing, setIsShutterFlashing] = useState(false);

  // Subtitles state
  const [subtitles, setSubtitles] = useState([]);
  const [currentSubtitleText, setCurrentSubtitleText] = useState('');
  const [subtitleSettings, setSubtitleSettings] = useState(
    settings.subtitles || {
      fontSize: 20,
      color: '#ffffff',
      bgOpacity: 70,
      offsetMs: 0,
      strokeWidth: 2,
      bottomOffset: 14,
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }
  );

  const controlsTimeoutRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && (volume > 100 || settings?.audio?.bassBoost > 0)) {
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
        album: video.folder || 'Device Storage'
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

  // Sleep Timer Countdown & Smooth Volume Fade
  useEffect(() => {
    if (sleepTimerSeconds === null) return;

    const timer = setInterval(() => {
      setSleepTimerSeconds((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          // Timer finished: pause video
          if (videoRef.current) videoRef.current.pause();
          setIsPlaying(false);
          setShowControls(true);
          return null;
        }

        // Smooth volume fade during last 30 seconds
        if (prev <= 30 && videoRef.current) {
          const fadeFactor = prev / 30;
          videoRef.current.volume = Math.max(0, (volume / 100) * fadeFactor);
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sleepTimerSeconds, volume]);

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    videoRef.current.playbackRate = playbackSpeed;

    if (video.currentTime && settings.rememberPosition) {
      videoRef.current.currentTime = video.currentTime;
    }

    if (videoRef.current.audioTracks) {
      const tracks = [];
      for (let i = 0; i < videoRef.current.audioTracks.length; i++) {
        tracks.push(videoRef.current.audioTracks[i]);
      }
      setAudioTracksList(tracks);
    }
  };

  const handleSelectAudioTrack = (index) => {
    setActiveAudioIndex(index);
    if (videoRef.current && videoRef.current.audioTracks) {
      for (let i = 0; i < videoRef.current.audioTracks.length; i++) {
        videoRef.current.audioTracks[i].enabled = (i === index);
      }
    }
  };

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

    if (loopA !== null && loopB !== null && loopB > loopA) {
      if (curr >= loopB || curr < loopA) {
        videoRef.current.currentTime = loopA;
        return;
      }
    }

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

  // YouTube-Style Press-and-Hold 2.0x Fast Forward
  const handlePressHold2xStart = () => {
    if (!videoRef.current) return;
    previousSpeedRef.current = playbackSpeed;
    videoRef.current.playbackRate = 2.0;
    setIsHold2xActive(true);
  };

  const handlePressHold2xEnd = () => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = previousSpeedRef.current;
    setIsHold2xActive(false);
  };

  // Screen Orientation Controller
  const handleToggleOrientation = async () => {
    triggerHaptic('selection');
    const nextMode = orientationMode === 'auto' ? 'landscape' : orientationMode === 'landscape' ? 'portrait' : 'auto';
    setOrientationMode(nextMode);

    try {
      if (window.screen?.orientation?.lock) {
        if (nextMode === 'landscape') await window.screen.orientation.lock('landscape');
        else if (nextMode === 'portrait') await window.screen.orientation.lock('portrait');
        else window.screen.orientation.unlock();
      }
    } catch (e) {
      console.warn('Orientation lock notice:', e);
    }
  };

  // Sleep Timer Handler
  const handleSetSleepTimer = (minutes) => {
    if (minutes === -1) {
      // End of video: remaining duration
      const remainingSec = Math.max(10, Math.floor(duration - currentTime));
      setSleepTimerSeconds(remainingSec);
    } else {
      setSleepTimerSeconds(minutes * 60);
    }
  };

  const handleTakeSnapshot = async () => {
    if (!videoRef.current) return;
    triggerHaptic('heavy');
    setIsShutterFlashing(true);
    setTimeout(() => setIsShutterFlashing(false), 200);
    await captureVideoFrame(videoRef.current, video.name);
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
      {/* Zero-Overhead Hardware Dimming Overlay */}
      <div 
        className="absolute inset-0 z-10 bg-black pointer-events-none transition-opacity"
        style={{ opacity: (100 - brightness) / 100 }}
      />

      {/* Shutter White Flash */}
      {isShutterFlashing && (
        <div className="absolute inset-0 z-40 bg-white pointer-events-none" />
      )}

      {/* Video Element */}
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
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => {
            setIsPlaying(false);
            setShowControls(true);
          }}
          className={`w-full h-full ${aspectClassMap[aspectRatio] || 'object-contain'}`}
        />
      </div>

      {/* Subtitles Overlay */}
      {currentSubtitleText && (
        <div 
          style={{ bottom: `${subtitleSettings.bottomOffset || 14}%` }}
          className="absolute left-4 right-4 z-20 pointer-events-none flex justify-center transition-all"
        >
          <p
            style={{
              fontSize: `${subtitleSettings.fontSize || 20}px`,
              color: subtitleSettings.color || '#ffffff',
              fontFamily: subtitleSettings.fontFamily || "'Plus Jakarta Sans', sans-serif",
              backgroundColor: `rgba(0, 0, 0, ${(subtitleSettings.bgOpacity ?? 70) / 100})`,
              WebkitTextStroke: `${subtitleSettings.strokeWidth ?? 2}px black`,
              textShadow: '0 2px 4px rgba(0,0,0,0.8)'
            }}
            className="px-4 py-1.5 rounded-2xl text-center font-medium shadow-2xl backdrop-blur-xs max-w-xl whitespace-pre-line leading-relaxed"
          >
            {currentSubtitleText}
          </p>
        </div>
      )}

      {/* Gesture Engine with Press-and-Hold 2.0x Speed */}
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
          onPressHold2xStart={handlePressHold2xStart}
          onPressHold2xEnd={handlePressHold2xEnd}
          isHold2xActive={isHold2xActive}
        />
      )}

      {/* Child Lock Floating Trigger */}
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

      {/* Responsive HUD Controls */}
      <AnimatePresence>
        {showControls && !isLocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-4 pt-6 pb-6 bg-gradient-to-b from-black/85 via-transparent to-black/90"
          >
            {/* Top Bar: Left Identity + Right Actions */}
            <div className="flex items-center justify-between pointer-events-auto pr-14">
              <div className="flex items-center space-x-3 min-w-0 pr-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-lg border border-white/15 shrink-0"
                >
                  <ArrowLeft size={20} />
                </motion.button>
                <div className="truncate">
                  <h4 className="text-sm font-bold text-white truncate">{video.name}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {playbackSpeed !== 1.0 ? `${playbackSpeed}x • ` : ''}AltumCinema Pro
                  </span>
                </div>
              </div>

              {/* Action Tray */}
              <div className="flex items-center space-x-2 shrink-0">
                {/* Screen Orientation Switcher */}
                <button
                  onClick={handleToggleOrientation}
                  className="p-2.5 rounded-full bg-white/10 text-white backdrop-blur-lg border border-white/15 capitalize"
                  title={`Orientation: ${orientationMode}`}
                >
                  <Rotate3D size={18} />
                </button>

                {/* Sleep Timer */}
                <button
                  onClick={() => setIsSleepTimerModalOpen(true)}
                  className={`p-2.5 rounded-full backdrop-blur-lg border transition-all ${
                    sleepTimerSeconds !== null
                      ? 'bg-indigo-600/70 border-indigo-400 text-white'
                      : 'bg-white/10 border-white/15 text-white'
                  }`}
                >
                  <Moon size={18} />
                </button>

                {/* Audio Track Switcher */}
                <button
                  onClick={() => setIsAudioTrackModalOpen(true)}
                  className="p-2.5 rounded-full bg-white/10 text-white backdrop-blur-lg border border-white/15"
                >
                  <Volume2 size={18} />
                </button>

                {/* Subtitle Selector */}
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

                {/* Quick Tools Drawer (...) */}
                <button
                  onClick={() => setIsQuickToolsOpen(true)}
                  className="p-2.5 rounded-full bg-white/10 text-white backdrop-blur-lg border border-white/15"
                >
                  <MoreHorizontal size={18} />
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

            {/* Bottom Scrubber & Controls */}
            <div className="pointer-events-auto space-y-2">
              {/* Utility Row: Anime OP Skip Pill + A-B Looper Bar */}
              <div className="flex items-center justify-between">
                <IntroSkipPill
                  skipDuration={introSkipDuration}
                  onUpdateDuration={(newDur) => {
                    setIntroSkipDuration(newDur);
                    onUpdateSettings({ ...settings, introSkipDuration: newDur });
                  }}
                  onSkipForward={(dur) => handleSkip(dur)}
                />

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
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-slate-300 font-semibold px-1">
                <span>{formatTime(currentTime)}</span>
                <span className="text-slate-400 font-normal">
                  {zoomScale !== 1.0 ? `Zoom ${Math.round(zoomScale * 100)}% • ` : ''}
                  {formatTime(duration)}
                </span>
              </div>

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

                {loopA !== null && duration > 0 && (
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-blue-400 z-20 pointer-events-none rounded-full shadow-sm shadow-blue-400"
                    style={{ left: `${(loopA / duration) * 100}%` }}
                  />
                )}
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

      {/* QUICK TOOLS BOTTOM DRAWER */}
      <GlassSelect
        isOpen={isQuickToolsOpen}
        onClose={() => setIsQuickToolsOpen(false)}
        title="Player Tools & Settings"
        selectedValue=""
        onSelect={(val) => {
          if (val === 'speed') setIsSpeedModalOpen(true);
          if (val === 'aspect') setIsAspectSelectOpen(true);
          if (val === 'eq') setIsEQOpen(true);
          if (val === 'loop') setIsLooperOpen(true);
          if (val === 'sleep') setIsSleepTimerModalOpen(true);
          if (val === 'pip') handlePiP();
          if (val === 'shot') handleTakeSnapshot();
          if (val === 'sub_explorer') setIsSubtitleExplorerOpen(true);
          if (val === 'sub_search') setIsSubtitleSearchOpen(true);
        }}
        options={[
          { label: `Playback Speed (${playbackSpeed}x)`, value: 'speed' },
          { label: `Aspect Ratio (${aspectRatio.toUpperCase()})`, value: 'aspect' },
          { label: 'Sleep Timer', value: 'sleep' },
          { label: 'Dialogue Scene Jump (Search)', value: 'sub_search' },
          { label: 'Browse In-App Subtitles (.srt)', value: 'sub_explorer' },
          { label: 'A-B Scene Looper', value: 'loop' },
          { label: '5-Band Audio Equalizer & Boost', value: 'eq' },
          { label: 'Take HD Video Screenshot', value: 'shot' },
          { label: 'Picture-in-Picture (PiP)', value: 'pip' }
        ]}
      />

      {/* Sleep Timer Modal */}
      <SleepTimerModal
        isOpen={isSleepTimerModalOpen}
        onClose={() => setIsSleepTimerModalOpen(false)}
        activeTimerRemaining={sleepTimerSeconds}
        onSetTimer={handleSetSleepTimer}
        onCancelTimer={() => setSleepTimerSeconds(null)}
      />

      {/* Audio Track Switcher Modal */}
      <AudioTrackModal
        isOpen={isAudioTrackModalOpen}
        onClose={() => setIsAudioTrackModalOpen(false)}
        tracks={audioTracksList}
        activeTrackIndex={activeAudioIndex}
        onSelectTrack={handleSelectAudioTrack}
      />

      {/* In-App Subtitle Directory Explorer */}
      <SubtitleExplorerModal
        isOpen={isSubtitleExplorerOpen}
        onClose={() => setIsSubtitleExplorerOpen(false)}
        initialPath={video.path ? video.path.substring(0, video.path.lastIndexOf('/')) : 'Download'}
        onSubtitleSelected={(parsed, name) => {
          setSubtitles(parsed);
          alert(`Loaded subtitles: ${name}`);
        }}
      />

      {/* Dialogue Search Modal */}
      <SubtitleSearchModal
        isOpen={isSubtitleSearchOpen}
        onClose={() => setIsSubtitleSearchOpen(false)}
        subtitles={subtitles}
        onSeekToTime={(time) => {
          if (videoRef.current) {
            videoRef.current.currentTime = time;
          }
        }}
      />

      {/* Subtitle Customizer Studio 2.0 */}
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
        onOpenExplorer={() => {
          setIsSubtitleModalOpen(false);
          setIsSubtitleExplorerOpen(true);
        }}
        onOpenDialogueSearch={() => {
          setIsSubtitleModalOpen(false);
          setIsSubtitleSearchOpen(true);
        }}
      />

      {/* Playback Speed Modal */}
      <PlaybackSpeedModal
        isOpen={isSpeedModalOpen}
        onClose={() => setIsSpeedModalOpen(false)}
        currentSpeed={playbackSpeed}
        onSelectSpeed={handleSpeedChange}
      />

      {/* Aspect Ratio Modal */}
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

      {/* Equalizer Modal */}
      <AudioEQModal
        isOpen={isEQOpen}
        onClose={() => setIsEQOpen(false)}
        currentSettings={settings}
        onSaveSettings={onUpdateSettings}
      />
    </div>
  );
};
