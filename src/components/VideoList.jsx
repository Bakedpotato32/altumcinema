import React from 'react';
import { motion } from 'framer-motion';
import { Play, ArrowLeft, Clock, Film } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

export const VideoList = ({ folder, onBack, onPlayVideo }) => {
  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-4 px-5 mb-6">
      {/* Folder Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            triggerHaptic('light');
            onBack();
          }}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-sm"
        >
          <ArrowLeft size={14} />
          <span>All Folders</span>
        </motion.button>
        <span className="text-xs font-bold text-slate-500 font-mono">
          {folder.videos?.length || 0} Clips
        </span>
      </div>

      <div className="p-4 rounded-3xl glass-panel border border-white/90">
        <h2 className="text-base font-black text-slate-900">{folder.name}</h2>
        <p className="text-[11px] text-slate-500 truncate font-mono mt-0.5">
          {folder.path}
        </p>
      </div>

      {/* Video Cards */}
      <div className="space-y-2.5">
        {folder.videos?.map((video) => {
          const progressPercent = video.duration
            ? Math.min(100, (video.currentTime / video.duration) * 100)
            : 0;

          return (
            <motion.div
              key={video.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                triggerHaptic('medium');
                onPlayVideo({ ...video, folder: folder.name });
              }}
              className="p-3.5 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/70 flex items-center justify-between shadow-sm cursor-pointer hover:border-blue-400/50 transition-all"
            >
              <div className="flex items-center space-x-3 min-w-0">
                {/* Video Icon Thumbnail with Progress Bar */}
                <div className="relative w-16 h-12 rounded-xl bg-slate-900 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                  {video.thumbnail ? (
                    <img
                      src={video.thumbnail}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Play size={16} className="text-white/70 fill-white/50" />
                  )}
                  {progressPercent > 0 && (
                    <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20">
                      <div
                        className="h-full bg-rose-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="truncate">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {video.name}
                  </h4>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-medium mt-1">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock size={10} /> {formatDuration(video.duration)}
                    </span>
                    <span>•</span>
                    <span>{video.size}</span>
                  </div>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 ml-2">
                <Play size={14} className="fill-blue-600 ml-0.5" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
