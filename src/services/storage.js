const HISTORY_KEY = 'altum_cinema_history';
const SETTINGS_KEY = 'altum_cinema_settings';
const FOLDERS_KEY = 'altum_cinema_folders';
const VAULT_KEY = 'altum_cinema_vault_videos';
const VAULT_PIN_KEY = 'altum_cinema_vault_pin';

export const getStoredFolders = () => {
  try {
    const data = localStorage.getItem(FOLDERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveFolders = (folders) => {
  try {
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  } catch (e) {
    console.error('Failed saving folders', e);
  }
};

export const getStoredHistory = () => {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveVideoProgress = (video) => {
  try {
    const history = getStoredHistory();
    const id = video.id || (video.name + '_' + (video.size || 0));
    const existingIndex = history.findIndex((item) => item.id === id);

    const entry = {
      id,
      name: video.name,
      folder: video.folder || 'Device Storage',
      duration: video.duration || 0,
      currentTime: video.currentTime || 0,
      thumbnail: video.thumbnail || null,
      size: video.size || 'Local',
      lastPlayed: Date.now(),
      completed: video.duration > 0 && (video.currentTime / video.duration) > 0.94
    };

    if (existingIndex >= 0) {
      history[existingIndex] = entry;
    } else {
      history.unshift(entry);
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 30)));
  } catch (e) {
    console.error('Failed saving video progress', e);
  }
};

export const getStoredSettings = () => {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data
      ? JSON.parse(data)
      : {
          aspectRatio: 'fit',
          skipInterval: 10,
          doubleTapSeek: true,
          rememberPosition: true,
          volumeBoostEnabled: true,
          audio: { bassBoost: 0, eqBands: [0, 0, 0, 0, 0], preset: 'flat' }
        };
  } catch (e) {
    return {
      aspectRatio: 'fit',
      skipInterval: 10,
      rememberPosition: true,
      volumeBoostEnabled: true
    };
  }
};

export const saveSettings = (newSettings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  } catch (e) {
    console.error('Failed saving settings', e);
  }
};

export const getVaultPin = () => {
  try {
    return localStorage.getItem(VAULT_PIN_KEY);
  } catch (e) {
    return null;
  }
};

export const saveVaultPin = (pin) => {
  try {
    localStorage.setItem(VAULT_PIN_KEY, pin);
  } catch (e) {
    console.error('Failed saving vault PIN', e);
  }
};

export const getVaultVideos = () => {
  try {
    const data = localStorage.getItem(VAULT_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveVaultVideos = (videos) => {
  try {
    localStorage.setItem(VAULT_KEY, JSON.stringify(videos));
  } catch (e) {
    console.error('Failed saving vault videos', e);
  }
};

export const moveVideoToVault = (videoToLock) => {
  try {
    const vault = getVaultVideos();
    const cleanEntry = {
      ...videoToLock,
      isVaulted: true,
      vaultedAt: Date.now()
    };
    const updatedVault = [cleanEntry, ...vault.filter((v) => v.id !== videoToLock.id)];
    saveVaultVideos(updatedVault);

    const folders = getStoredFolders();
    const updatedFolders = folders.map((f) => ({
      ...f,
      videos: (f.videos || []).filter((v) => v.id !== videoToLock.id)
    }));
    saveFolders(updatedFolders);

    const history = getStoredHistory();
    const updatedHistory = history.filter((v) => v.id !== videoToLock.id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));

    return { updatedVault, updatedFolders };
  } catch (e) {
    console.error('Failed moving video to vault', e);
    return null;
  }
};

export const restoreVideoFromVault = (videoToRestore) => {
  try {
    const vault = getVaultVideos();
    const updatedVault = vault.filter((v) => v.id !== videoToRestore.id);
    saveVaultVideos(updatedVault);

    const folders = getStoredFolders();
    const targetFolderIndex = folders.findIndex(
      (f) => f.name === (videoToRestore.folder || 'Imported Files')
    );

    const cleanEntry = { ...videoToRestore, isVaulted: false };
    delete cleanEntry.vaultedAt;

    if (targetFolderIndex >= 0) {
      folders[targetFolderIndex].videos = [cleanEntry, ...(folders[targetFolderIndex].videos || [])];
    } else {
      folders.unshift({
        id: 'folder_restored_' + Date.now(),
        name: videoToRestore.folder || 'Restored Media',
        path: '/storage/emulated/0/Restored',
        videoCount: 1,
        totalSize: videoToRestore.size || 'Local',
        videos: [cleanEntry]
      });
    }

    saveFolders(folders);
    return { updatedVault, updatedFolders: folders, restoredVideo: cleanEntry };
  } catch (e) {
    console.error('Failed restoring video from vault', e);
    return null;
  }
};
