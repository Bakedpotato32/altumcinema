import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Film, HardDrive, ShieldCheck, Sliders, Play, Plus, FolderPlus } from 'lucide-react';
import { AmbientBlobs } from './components/AmbientBlobs';
import { TopHeader } from './components/TopHeader';
import { SearchBarAndFilters } from './components/SearchBarAndFilters';
import { HeroRecentCard } from './components/HeroRecentCard';
import { PoppyBanners } from './components/PoppyBanners';
import { VideoFeedCard } from './components/VideoFeedCard';
import { FolderGrid } from './components/FolderGrid';
import { VideoList } from './components/VideoList';
import { VaultView } from './components/VaultView';
import { FloatingDock } from './components/FloatingDock';
import { PermissionModal } from './components/PermissionModal';
import { PinKeypadModal } from './components/PinKeypadModal';
import { VideoPlayer } from './components/VideoPlayer';
import { 
  getStoredFolders, saveFolders, 
  getStoredHistory, saveVideoProgress, 
  getStoredSettings, saveSettings,
  getVaultPin, saveVaultPin,
  getVaultVideos, moveVideoToVault, restoreVideoFromVault
} from './services/storage';
import { generateVideoThumbnail } from './services/thumbnail';
import { triggerHaptic } from './services/haptics';

export default function App() {
  const [activeTab, setActiveTab] = useState('videos');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasPermission, setHasPermission] = useState(true);

  // Library & Navigation State
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [recentVideo, setRecentVideo] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
  const [settings, setSettings] = useState(getStoredSettings());

  // Private Safe State
  const [vaultVideos, setVaultVideos] = useState([]);
  const [vaultPin, setVaultPin] = useState(null);
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  const [keypadMode, setKeypadMode] = useState('unlock'); // 'unlock' | 'setup'

  const fileInputRef = useRef(null);

  useEffect(() => {
    const granted = localStorage.getItem('altum_storage_permission_granted');
    if (!granted) setHasPermission(false);

    setFolders(getStoredFolders());
    setVaultVideos(getVaultVideos());
    setVaultPin(getVaultPin());

    const history = getStoredHistory();
    if (history.length > 0) setRecentVideo(history[0]);
  }, []);

  const handleGrantPermission = () => {
    localStorage.setItem('altum_storage_permission_granted', 'true');
    setHasPermission(true);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    triggerHaptic('success');

    const newVideos = await Promise.all(
      files.map(async (file, idx) => {
        const objectUrl = URL.createObjectURL(file);
        const thumb = await generateVideoThumbnail(file, 2);
        return {
          id: `vid_${Date.now()}_${idx}`,
          name: file.name,
          duration: 0,
          currentTime: 0,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          url: objectUrl,
          thumbnail: thumb,
          date: 'Just now',
          folder: 'Imported Files'
        };
      })
    );

    const newFolder = {
      id: `folder_${Date.now()}`,
      name: 'Imported Files',
      path: '/storage/emulated/0/Imported',
      videoCount: newVideos.length,
      totalSize: `${(files.reduce((a, b) => a + b.size, 0) / (1024 * 1024)).toFixed(1)} MB`,
      videos: newVideos
    };

    const updated = [newFolder, ...folders];
    setFolders(updated);
    saveFolders(updated);
  };

  const handlePlayVideo = (video) => {
    triggerHaptic('medium');
    const playable = {
      ...video,
      url: video.url || URL.createObjectURL(new Blob([], { type: 'video/mp4' }))
    };
    setActiveVideo(playable);
    if (!video.isVaulted) {
      setRecentVideo(video);
      saveVideoProgress(video);
    }
  };

  // Lock video into Private Vault
  const handleLockVideo = (video) => {
    if (!vaultPin) {
      setKeypadMode('setup');
      setIsKeypadOpen(true);
      return;
    }

    const res = moveVideoToVault(video);
    if (res) {
      triggerHaptic('success');
      setVaultVideos(res.updatedVault);
      setFolders(res.updatedFolders);
      if (recentVideo?.id === video.id) setRecentVideo(null);
    }
  };

  // Restore video from Private Vault
  const handleRestoreVideo = (video) => {
    const res = restoreVideoFromVault(video);
    if (res) {
      triggerHaptic('success');
      setVaultVideos(res.updatedVault);
      setFolders(res.updatedFolders);
    }
  };

  // Keypad Success Handler
  const handleKeypadSuccess = (pin) => {
    if (keypadMode === 'setup') {
      saveVaultPin(pin);
      setVaultPin(pin);
    }
    setIsVaultUnlocked(true);
    setIsKeypadOpen(false);
  };

  // Filter public videos
  const allVideos = folders.flatMap((f) =>
    (f.videos || []).map((v) => ({ ...v, folder: f.name }))
  );

  const filteredVideos = allVideos.filter((v) =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative min-h-screen bg-[#f8fafc] text-slate-900 pb-36 font-['Plus_Jakarta_Sans',sans-serif]">
      <AmbientBlobs />

      <input
        type="file"
        ref={fileInputRef}
        accept="video/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="relative z-10 w-full max-w-lg mx-auto">
        <TopHeader onScanClick={() => fileInputRef.current?.click()} />

        <SearchBarAndFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          activeTab={activeTab}
        />

        {/* VIDEOS TAB (Home Screen Feed) */}
        {activeTab === 'videos' && (
          <main className="space-y-4">
            {recentVideo && (
              <HeroRecentCard
                recentVideo={recentVideo}
                onResumePlay={handlePlayVideo}
              />
            )}

            <PoppyBanners
              onScanClick={() => fileInputRef.current?.click()}
              onSafeClick={() => setActiveTab('vault')}
            />

            <div className="px-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black tracking-wider text-slate-500 uppercase">
                  All Media ({filteredVideos.length})
                </h3>
                <span className="text-[11px] font-bold text-blue-600">YouTube Feed</span>
              </div>

              {filteredVideos.length === 0 ? (
                <div className="p-8 text-center glass-panel rounded-3xl border border-white/90">
                  <Film size={36} className="mx-auto text-blue-500 mb-2" />
                  <h4 className="text-sm font-black text-slate-900">No Videos Loaded</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Your library is completely clean. Tap "+ Scan" or the button below to add local videos from your device.
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-blue-500/30"
                  >
                    <FolderPlus size={14} />
                    <span>Import Local Videos</span>
                  </motion.button>
                </div>
              ) : (
                filteredVideos.map((video) => (
                  <VideoFeedCard
                    key={video.id}
                    video={video}
                    onPlayVideo={handlePlayVideo}
                    onLockToVault={handleLockVideo}
                  />
                ))
              )}
            </div>
          </main>
        )}

        {/* FOLDERS TAB */}
        {activeTab === 'folders' && (
          <main>
            {selectedFolder ? (
              <VideoList
                folder={selectedFolder}
                onBack={() => setSelectedFolder(null)}
                onPlayVideo={handlePlayVideo}
              />
            ) : filteredFolders.length === 0 ? (
              <div className="px-5">
                <div className="p-8 text-center glass-panel rounded-3xl border border-white/90">
                  <HardDrive size={36} className="mx-auto text-indigo-500 mb-2" />
                  <h4 className="text-sm font-black text-slate-900">No Directories Indexed</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Import videos to automatically generate and group directories.
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-indigo-500/30"
                  >
                    <Plus size={14} />
                    <span>Add Folders</span>
                  </motion.button>
                </div>
              </div>
            ) : (
              <FolderGrid
                folders={filteredFolders}
                onSelectFolder={setSelectedFolder}
              />
            )}
          </main>
        )}

        {/* VAULT TAB */}
        {activeTab === 'vault' && (
          <main>
            <VaultView
              vaultVideos={vaultVideos}
              isUnlocked={isVaultUnlocked}
              hasPin={!!vaultPin}
              onOpenKeypad={(mode) => {
                setKeypadMode(mode);
                setIsKeypadOpen(true);
              }}
              onLockVault={() => setIsVaultUnlocked(false)}
              onPlayVideo={handlePlayVideo}
              onRestoreVideo={handleRestoreVideo}
            />
          </main>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <main className="px-5 space-y-3">
            <h3 className="text-xs font-black tracking-wider text-slate-500 uppercase mb-2">
              Player Preferences
            </h3>
            <div className="p-4 rounded-3xl glass-panel flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">Auto Resume Video</p>
                <span className="text-xs text-slate-500">Pick up exactly where you left off</span>
              </div>
              <input
                type="checkbox"
                checked={settings.rememberPosition}
                onChange={(e) => {
                  const updated = { ...settings, rememberPosition: e.target.checked };
                  setSettings(updated);
                  saveSettings(updated);
                }}
                className="w-5 h-5 accent-blue-600 rounded"
              />
            </div>
          </main>
        )}
      </div>

      {/* Floating Bottom Navigation Glass Dock */}
      <FloatingDock
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'folders') setSelectedFolder(null);
        }}
        onCenterAction={() => fileInputRef.current?.click()}
      />

      {/* First-Launch Permission Onboarding Sheet */}
      <PermissionModal
        isOpen={!hasPermission}
        onGrant={handleGrantPermission}
      />

      {/* PIN Keypad Modal */}
      <PinKeypadModal
        isOpen={isKeypadOpen}
        onClose={() => setIsKeypadOpen(false)}
        mode={keypadMode}
        storedPin={vaultPin}
        onSuccess={handleKeypadSuccess}
      />

      {/* Fullscreen Video Player */}
      {activeVideo && (
        <VideoPlayer
          video={activeVideo}
          onClose={() => setActiveVideo(null)}
          settings={settings}
          onUpdateSettings={setSettings}
        />
      )}
    </div>
  );
}
