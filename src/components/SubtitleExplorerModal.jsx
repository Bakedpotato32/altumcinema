import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Folder, FileText, ArrowLeft, RefreshCw } from 'lucide-react';
import { listDirectoryContents } from '../services/deviceScanner';
import { parseSubtitles } from '../services/subtitles';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { triggerHaptic } from '../services/haptics';

export const SubtitleExplorerModal = ({
  isOpen,
  onClose,
  initialPath = 'Download',
  onSubtitleSelected
}) => {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPath(initialPath);
    }
  }, [isOpen, initialPath]);

  const loadPath = async (path) => {
    setIsLoading(true);
    setCurrentPath(path);
    const contents = await listDirectoryContents(path);
    setItems(contents);
    setIsLoading(false);
  };

  const handleFolderClick = (folderName) => {
    triggerHaptic('light');
    const nextPath = `${currentPath}/${folderName}`.replace(/\/+/g, '/');
    loadPath(nextPath);
  };

  const handleGoUp = () => {
    triggerHaptic('light');
    const parts = currentPath.split('/').filter(Boolean);
    if (parts.length > 0) {
      parts.pop();
      const parentPath = parts.join('/') || 'Download';
      loadPath(parentPath);
    }
  };

  const handleFileSelect = async (fileItem) => {
    const isSubtitle = ['.srt', '.vtt'].some((ext) =>
      fileItem.name.toLowerCase().endsWith(ext)
    );

    if (!isSubtitle) {
      alert('Please select a valid .srt or .vtt subtitle file.');
      return;
    }

    triggerHaptic('success');
    try {
      const readRes = await Filesystem.readFile({
        path: fileItem.path,
        directory: Directory.ExternalStorage
      });

      const text = typeof readRes.data === 'string' ? readRes.data : '';
      const parsed = parseSubtitles(text);
      onSubtitleSelected(parsed, fileItem.name);
      onClose();
    } catch (e) {
      console.warn('Failed reading subtitle file directly', e);
      alert('Could not read subtitle file. Check storage permissions.');
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/65 backdrop-blur-md"
        />

        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="relative z-10 w-full max-w-md mx-auto bg-slate-900/95 backdrop-blur-3xl border-t border-white/15 rounded-t-[32px] p-6 pb-10 shadow-2xl max-h-[85vh] flex flex-col"
        >
          <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4" />

          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-white tracking-wide">
              Subtitle File Explorer
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 text-slate-300 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-white/5 border border-white/10 mb-4">
            <button
              onClick={handleGoUp}
              className="p-1.5 rounded-lg bg-white/10 text-slate-300 hover:text-white"
            >
              <ArrowLeft size={16} />
            </button>
            <span className="text-[11px] font-mono text-blue-300 truncate flex-1">
              /{currentPath}
            </span>
            <button
              onClick={() => loadPath(currentPath)}
              className="p-1.5 rounded-lg bg-white/10 text-slate-300"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
            {items.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <FileText size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-xs">No files found in this folder</p>
              </div>
            ) : (
              items.map((item, idx) => {
                const isDir = item.type === 'directory';
                const isSub =
                  !isDir &&
                  ['.srt', '.vtt'].some((ext) => item.name.toLowerCase().endsWith(ext));

                return (
                  <motion.div
                    key={idx}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (isDir) handleFolderClick(item.name);
                      else handleFileSelect(item);
                    }}
                    className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                      isSub
                        ? 'bg-blue-600/25 border border-blue-400/50 text-white font-bold'
                        : isDir
                        ? 'bg-white/5 hover:bg-white/10 text-slate-200 border border-white/5'
                        : 'bg-white/5 opacity-50 text-slate-400 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3 truncate">
                      {isDir ? (
                        <Folder size={18} className="text-amber-400 shrink-0" />
                      ) : (
                        <FileText
                          size={18}
                          className={isSub ? 'text-blue-400 shrink-0' : 'text-slate-500 shrink-0'}
                        />
                      )}
                      <span className="text-xs truncate">{item.name}</span>
                    </div>

                    {isSub && (
                      <span className="text-[10px] font-bold text-blue-300 uppercase px-2 py-0.5 rounded-md bg-blue-500/20">
                        Pick Subtitle
                      </span>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
