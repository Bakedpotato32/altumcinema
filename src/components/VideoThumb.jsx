import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { fetchVideoThumbnail } from '../services/nativeMedia';

export const VideoThumb = ({ video, className = '' }) => {
  const [thumb, setThumb] = useState(video?.thumbnail || null);

  useEffect(() => {
    let isMounted = true;
    if (!thumb && video?.path) {
      const rawId = parseInt((video.id || '').replace('media_', ''), 10) || -1;
      fetchVideoThumbnail(rawId, video.path).then((b64) => {
        if (isMounted && b64) {
          setThumb(b64);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [video?.id, video?.path]);

  return (
    <div className={`relative bg-slate-950 overflow-hidden flex items-center justify-center ${className}`}>
      {thumb ? (
        <img
          src={thumb}
          alt={video?.name || 'Thumbnail'}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-950 via-indigo-950 to-slate-900">
          <Play size={18} className="fill-white/60 text-white/80" />
        </div>
      )}
    </div>
  );
};
