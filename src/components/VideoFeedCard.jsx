import React from 'react';
import { motion } from 'framer-motion';
import { Play, Clock, Folder, Shield, Lock } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

export const VideoFeedCard = ({ video, onPlayVideo, onLockToVault }) => {
  const duration = video.duration || 100;
  const current = video.currentTime || 0;
  const progressPercent = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;

  const formatTime = (sec) => {
    if (isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        triggerHaptic('medium');
        onPlayVideo(video);
      }}
      className="rounded-3xl glass-panel border border-white/90 overflow-hidden shadow-[0_6px_25px_rgb(0,0,0,0.04)] cursor-pointer hover:border-blue-300 transition-all"
    >
      {/* 16:9 YouTube Thumbnail Container */}
      <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-950 via-indigo-950 to-slate-900">
            <div className="w-13 h-13 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-xl">
              <Play size={24} className="fill-white/80 ml-1" />
            </div>
          </div>
        )}

        {/* Top Folder Tag Badge */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold flex items-center gap-1 shadow-md">
          <Folder size={11} className="text-blue-400" />
          <span>{video.folder || 'Downloads'}</span>
        </div>

        {/* Bottom Timestamp Chip */}
        <span className="absolute bottom-2.5 right-3 px-2 py-0.5 rounded-lg bg-black/85 backdrop-blur-sm text-[10px] font-mono font-bold text-white shadow-md">
          {formatTime(duration)}
        </span>

        {/* YouTube Red Playback Progress Bar */}
        {progressPercent > 0 && (
          <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20">
            <div
              className="h-full bg-rose-500 shadow-sm shadow-rose-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Video Details & Meta Footer */}
      <div className="p-4 flex items-start justify-between space-x-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-black text-slate-900 truncate leading-snug">
            {video.name}
          </h4>
          <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-medium mt-1">
            <span className="flex items-center gap-1 font-mono text-slate-600">
              <Clock size={11} /> {formatTime(duration)}
            </span>
            <span>•</span>
            <span>{video.size}</span>
            <span>•</span>
            <span className="text-blue-600 font-semibold">{video.date || 'Recent'}</span>
          </div>

          {progressPercent > 0 && (
            <p className="text-[10px] text-rose-500 font-bold mt-1.5">
              Resume from {formatTime(current)} ({Math.round(progressPercent)}% watched)
            </p>
          )}
        </div>

        {/* 1-Tap Lock to Private Vault Button */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic('light');
            onLockToVault(video);
          }}
          title="Move to Private Safe"
          className="p-2 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors shrink-0"
        >
          <Lock size={16} />
        </motion.button>
      </div>
    </motion.div>
  );
};
