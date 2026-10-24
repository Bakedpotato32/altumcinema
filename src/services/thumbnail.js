// Client-side video frame capture using HTML5 Canvas
const thumbnailCache = new Map();

export const generateVideoThumbnail = (fileOrUrl, seekTime = 2) => {
  return new Promise((resolve) => {
    const cacheKey = typeof fileOrUrl === 'string' ? fileOrUrl : `${fileOrUrl.name}_${fileOrUrl.size}`;
    if (thumbnailCache.has(cacheKey)) {
      return resolve(thumbnailCache.get(cacheKey));
    }

    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const url = typeof fileOrUrl === 'string' ? fileOrUrl : URL.createObjectURL(fileOrUrl);
    video.src = url;

    const cleanUp = () => {
      if (typeof fileOrUrl !== 'string') {
        URL.revokeObjectURL(url);
      }
      video.remove();
    };

    video.onloadedmetadata = () => {
      const targetTime = Math.min(seekTime, (video.duration || 5) * 0.2);
      video.currentTime = targetTime;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        // Render 16:9 optimized thumbnail (320x180)
        canvas.width = 320;
        canvas.height = 180;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
        thumbnailCache.set(cacheKey, dataUrl);
        cleanUp();
        resolve(dataUrl);
      } catch (err) {
        cleanUp();
        resolve(null);
      }
    };

    video.onerror = () => {
      cleanUp();
      resolve(null);
    };

    // Fallback timeout in case seek stalls
    setTimeout(() => {
      if (!thumbnailCache.has(cacheKey)) {
        cleanUp();
        resolve(null);
      }
    }, 3500);
  });
};
