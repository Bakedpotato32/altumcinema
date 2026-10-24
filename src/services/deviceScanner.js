import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { requestDeviceStoragePermissions } from './permissions';

const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.webm', '.avi', '.mov', '.3gp', '.flv', '.ts'];

const SCAN_TARGETS = [
  { name: 'Downloads', path: 'Download' },
  { name: 'Camera', path: 'DCIM/Camera' },
  { name: 'DCIM', path: 'DCIM' },
  { name: 'Movies', path: 'Movies' },
  { name: 'WhatsApp Video', path: 'Android/media/com.whatsapp/WhatsApp/Media/WhatsApp Video' },
  { name: 'WhatsApp Media', path: 'WhatsApp/Media/WhatsApp Video' },
  { name: 'Pictures', path: 'Pictures' },
  { name: 'Screen Records', path: 'Movies/Screenrecords' }
];

export const scanDeviceStorage = async () => {
  if (!Capacitor.isNativePlatform()) {
    return [];
  }

  const hasPermission = await requestDeviceStoragePermissions();
  if (!hasPermission) {
    console.warn('Storage permission not granted by user.');
    return [];
  }

  const detectedFolders = [];

  for (const target of SCAN_TARGETS) {
    try {
      const result = await Filesystem.readdir({
        path: target.path,
        directory: Directory.ExternalStorage
      });

      if (!result || !result.files) continue;

      const videoFiles = result.files.filter((file) => {
        const fileName = typeof file === 'string' ? file : file.name;
        return VIDEO_EXTENSIONS.some((ext) => fileName.toLowerCase().endsWith(ext));
      });

      if (videoFiles.length > 0) {
        const parsedVideos = await Promise.all(
          videoFiles.map(async (file, idx) => {
            const fileName = typeof file === 'string' ? file : file.name;
            const fullRelativePath = `${target.path}/${fileName}`;

            let fileUri = fullRelativePath;
            try {
              const uriRes = await Filesystem.getUri({
                path: fullRelativePath,
                directory: Directory.ExternalStorage
              });
              fileUri = uriRes.uri;
            } catch (e) {}

            return {
              id: `vid_${target.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${idx}_${fileName}`,
              name: fileName,
              path: fullRelativePath,
              url: Capacitor.convertFileSrc ? Capacitor.convertFileSrc(fileUri) : fileUri,
              folder: target.name,
              duration: 0,
              currentTime: 0,
              size: file.size ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : 'Local',
              date: 'Device Storage',
              thumbnail: null
            };
          })
        );

        detectedFolders.push({
          id: `folder_${target.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          name: target.name,
          path: `/storage/emulated/0/${target.path}`,
          videoCount: parsedVideos.length,
          totalSize: `${parsedVideos.length} Videos`,
          videos: parsedVideos
        });
      }
    } catch (dirErr) {
      // Directory does not exist on this device, skip cleanly
    }
  }

  return detectedFolders;
};

export const listDirectoryContents = async (dirPath = 'Download') => {
  try {
    const result = await Filesystem.readdir({
      path: dirPath,
      directory: Directory.ExternalStorage
    });

    if (!result || !result.files) return [];

    return result.files.map((item) => {
      const isString = typeof item === 'string';
      const name = isString ? item : item.name;
      const type = isString ? (name.includes('.') ? 'file' : 'directory') : item.type;
      return {
        name,
        type,
        path: `${dirPath}/${name}`
      };
    });
  } catch (err) {
    console.warn('Filesystem readdir error:', err);
    return [];
  }
};
