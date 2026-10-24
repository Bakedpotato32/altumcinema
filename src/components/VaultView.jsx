import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, Lock, Unlock, Play, Undo2, 
  Trash2, Plus, Sparkles, FolderLock 
} from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

export const VaultView = ({
  vaultVideos,
  isUnlocked,
  hasPin,
  onOpenKeypad,
  onLockVault,
  onPlayVideo,
  onRestoreVideo
}) => {
  const formatDuration = (sec) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="px-5 space-y-5">
      {/* LOCKED STATE BANNER */}
      {!isUnlocked ? (
        <div className="p-7 rounded-[32px] bg-gradient-to-br from-rose-500 via-red-500 to-orange-500 text-white shadow-xl shadow-rose-500/20 text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md mx-auto flex items-center justify-center mb-4 shadow-inner">
            <Lock size={32} />
          </div>

          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-rose-50 mb-2">
            <ShieldCheck size={12} /> Encrypted Media Safe
          </span>

          <h2 className="text-xl font-black">Private Vault</h2>
          <p className="text-xs text-rose-100/90 mt-1 max-w-xs mx-auto leading-relaxed">
            {hasPin
              ? 'Enter your 4-digit PIN to access hidden personal clips.'
              : 'Set up a 4-digit PIN code to start locking sensitive videos away from your public feed.'}
          </p>

          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              triggerHaptic('medium');
              onOpenKeypad(hasPin ? 'unlock' : 'setup');
            }}
            className="mt-6 px-6 py-3 rounded-2xl bg-white text-rose-600 font-black text-xs shadow-lg inline-flex items-center gap-2"
          >
            {hasPin ? <Unlock size={14} /> : <Plus size={14} />}
            <span>{hasPin ? 'Enter PIN to Unlock' : 'Create 4-Digit PIN'}</span>
          </motion.button>
        </div>
      ) : (
        /* UNLOCKED STATE DASHBOARD */
        <div className="space-y-4">
          {/* Unlocked Notice Strip */}
          <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-400/30 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                <Unlock size={18} />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">Vault Unlocked</h4>
                <p className="text-[11px] text-slate-500">{vaultVideos.length} private clips secured</p>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                triggerHaptic('medium');
                onLockVault();
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-sm"
            >
              Lock Now
            </motion.button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <h3 className="text-xs font-black tracking-wider text-slate-500 uppercase">
              Locked Clips ({vaultVideos.length})
            </h3>
            <span className="text-[11px] font-bold text-rose-500">Hidden From Feed</span>
          </div>

          {/* Vault Videos Grid */}
          {vaultVideos.length === 0 ? (
            <div className="p-8 text-center glass-panel rounded-3xl border border-white/90">
              <FolderLock size={36} className="mx-auto text-rose-400 mb-2" />
              <h4 className="text-sm font-black text-slate-900">Vault is Empty</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Go to the Videos feed and tap the lock icon on any card to move it into this private safe.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {vaultVideos.map((video) => (
                <div
                  key={video.id}
                  className="p-3.5 rounded-2xl glass-panel border border-white/90 flex items-center justify-between shadow-sm"
                >
                  <div
                    onClick={() => {
                      triggerHaptic('medium');
                      onPlayVideo(video);
                    }}
                    className="flex items-center space-x-3 min-w-0 flex-1 cursor-pointer"
                  >
                    <div className="relative w-14 h-11 rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
                      {video.thumbnail ? (
                        <img
                          src={video.thumbnail}
                          alt="Thumbnail"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Play size={16} className="text-white/60 fill-white/40" />
                      )}
                    </div>

                    <div className="truncate pr-2">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {video.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {formatDuration(video.duration)} • {video.size}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Unhide / Restore */}
                  <div className="flex items-center space-x-1 shrink-0">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        triggerHaptic('light');
                        onRestoreVideo(video);
                      }}
                      title="Restore to public feed"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold"
                    >
                      <Undo2 size={15} />
                    </motion.button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
