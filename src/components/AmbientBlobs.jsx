import React from 'react';

export const AmbientBlobs = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div 
        className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-br from-blue-200/55 via-indigo-200/40 to-transparent blur-[85px] animate-blob-1" 
      />
      <div 
        className="absolute top-1/3 -right-28 w-96 h-96 rounded-full bg-gradient-to-tr from-violet-200/50 via-purple-100/40 to-transparent blur-[90px] animate-blob-2" 
      />
      <div 
        className="absolute -bottom-24 left-1/4 w-80 h-80 rounded-full bg-gradient-to-t from-rose-200/40 via-amber-100/30 to-transparent blur-[95px]" 
      />
    </div>
  );
};
