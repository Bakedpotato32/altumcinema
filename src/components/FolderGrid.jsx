import React from 'react';
import { motion } from 'framer-motion';
import { Folder, Film, ChevronRight, HardDrive, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

export const FolderGrid = ({ folders, onSelectFolder }) => {
  const totalVideos = folders.reduce((sum, f) => sum + (f.videos?.length || f.videoCount || 0), 0);

  return (
    <div className="space-y-4 px-5 mb-6">
      {/* Storage Insight Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white shadow-lg shadow-indigo-600/20 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-blue-100">
            <HardDrive size={11} className="text-amber-300" />
            Device Storage
          </span>
          <span className="text-[11px] font-bold text-blue-100/90 font-mono">
            {folders.length} Folders
          </span>
        </div>
        <h3 className="text-lg font-black text-white">Local Directory Vault</h3>
        <p className="text-xs text-blue-100/80 mt-1">
          {totalVideos} video files indexed across internal directories.
        </p>
      </div>

      <div className="flex items-center justify-between pt-1">
        <h3 className="text-xs font-black tracking-wider text-slate-500 uppercase">
          Device Directories ({folders.length})
        </h3>
        <span className="text-[11px] font-bold text-blue-600">Auto Grouped</span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {folders.map((folder) => (
          <motion.div
            key={folder.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              triggerHaptic('light');
              onSelectFolder(folder);
            }}
            className="p-4 rounded-3xl glass-panel border border-white/90 flex items-center justify-between shadow-[0_4px_20px_rgb(0,0,0,0.03)] cursor-pointer hover:border-blue-300 transition-all"
          >
            <div className="flex items-center space-x-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                <Folder size={22} className="fill-white/20" />
              </div>

              <div className="truncate">
                <h4 className="text-sm font-bold text-slate-900 truncate">
                  {folder.name}
                </h4>
                <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-medium mt-0.5">
                  <span className="flex items-center gap-1 text-blue-600 font-bold">
                    <Film size={12} /> {folder.videos?.length || folder.videoCount} videos
                  </span>
                  <span>•</span>
                  <span>{folder.totalSize}</span>
                </div>
              </div>
            </div>

            <div className="w-8 h-8 rounded-full bg-slate-100/80 flex items-center justify-center text-slate-400 shrink-0 ml-2">
              <ChevronRight size={16} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
