import { Filesystem, Directory } from '@capacitor/filesystem';
import { generateVideoThumbnail } from './thumbnail';

const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.webm', '.avi', '.mov', '.3gp', '.flv'];

const SCAN_DIRECTORIES = [
  { name: 'Downloads', path: 'Download' },
  { name: 'Camera / DCIM', path: 'DCIM/Camera' },
  { name: 'Movies', path: 'Movies' },
  { name: 'WhatsApp Video', path: 'Android/media/com.whatsapp/WhatsApp/Media/WhatsApp Video' },
  { name: 'Pictures', path: 'Pictures' }
];

export const scanDeviceStorage = async () => {
  const detectedFolders = [];

  for (const dirTarget of SCAN_DIRECTORIES) {
    try {
      const result = await Filesystem.readdir({
        path: dirTarget.path,
        directory: Directory.ExternalStorage
      });

      const videoFiles = result.files.filter((file) => {
        const name = typeof file === 'string' ? file : file.name;
        return VIDEO_EXTENSIONS.some((ext) => name.toLowerCase().endsWith(ext));
      });

      if (videoFiles.length > 0) {
        const parsedVideos = await Promise.all(
          videoFiles.map(async (file, idx) => {
            const fileName = typeof file === 'string' ? file : file.name;
            const filePath = `${dirTarget.path}/${fileName}`;

            let fileUri = filePath;
            try {
              const uriResult = await Filesystem.getUri({
                path: filePath,
                directory: Directory.ExternalStorage
              });
              fileUri = uriResult.uri;
            } catch (e) {}

            return {
              id: `dev_${dirTarget.name}_${idx}_${fileName}`,
              name: fileName,
              path: filePath,
              url: fileUri,
              folder: dirTarget.name,
              duration: 0,
              currentTime: 0,
              size: file.size ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : 'Local',
              date: 'Device Storage',
              thumbnail: null
            };
          })
        );

        detectedFolders.push({
          id: `folder_${dirTarget.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          name: dirTarget.name,
          path: `/storage/emulated/0/${dirTarget.path}`,
          videoCount: parsedVideos.length,
          totalSize: `${parsedVideos.length} Videos`,
          videos: parsedVideos
        });
      }
    } catch (err) {
      // Directory may not exist on this specific device, proceed to next
    }
  }

  return detectedFolders;
};

// In-app directory browser for custom subtitle picking
export const listDirectoryContents = async (dirPath = 'Download') => {
  try {
    const result = await Filesystem.readdir({
      path: dirPath,
      directory: Directory.ExternalStorage
    });

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
