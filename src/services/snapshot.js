import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

// Captures a full-resolution still frame from the active video element
export const captureVideoFrame = async (videoElement, videoName = 'AltumCinema_Shot') => {
  if (!videoElement) return null;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth || videoElement.clientWidth || 1920;
    canvas.height = videoElement.videoHeight || videoElement.clientHeight || 1080;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const cleanName = `${videoName.replace(/\.[^/.]+$/, '')}_${Math.floor(videoElement.currentTime)}s_${Date.now()}.jpg`;

    // Attempt Capacitor native filesystem save if in APK environment
    try {
      const base64Data = dataUrl.split(',')[1];
      await Filesystem.writeFile({
        path: `AltumCinema/${cleanName}`,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true
      });
    } catch (e) {
      // Fallback for browser preview: browser download anchor
      const link = document.createElement('a');
      link.download = cleanName;
      link.href = dataUrl;
      link.click();
    }

    return {
      dataUrl,
      fileName: cleanName,
      timestamp: videoElement.currentTime
    };
  } catch (err) {
    console.error('Frame snapshot capture error:', err);
    return null;
  }
};
