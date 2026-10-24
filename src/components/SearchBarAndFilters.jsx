import React from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

export const SearchBarAndFilters = ({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  activeTab
}) => {
  const videoFilters = [
    { id: 'all', label: 'All Videos' },
    { id: 'in_progress', label: 'Continue Watching' },
    { id: 'recent', label: 'Recently Added' },
    { id: 'downloads', label: 'Downloads' },
    { id: 'camera', label: 'Camera / DCIM' }
  ];

  const folderFilters = [
    { id: 'all', label: 'All Directories' },
    { id: 'internal', label: 'Internal Storage' },
    { id: 'camera', label: 'Camera' },
    { id: 'downloads', label: 'Downloads' }
  ];

  const currentFilters = activeTab === 'folders' ? folderFilters : videoFilters;

  return (
    <div className="space-y-3.5 px-5 my-3">
      {/* Frosted Rounded Search Input */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={
            activeTab === 'folders'
              ? 'Search directories and folders...'
              : 'Search videos, tags, duration...'
          }
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-[0_4px_16px_rgb(0,0,0,0.02)] transition-all font-medium"
        />
      </div>

      {/* Horizontally Scrollable Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 pt-0.5">
        {currentFilters.map((filter) => {
          const isActive = activeFilter === filter.id;
          return (
            <motion.button
              key={filter.id}
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                triggerHaptic('light');
                onFilterChange(filter.id);
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 border border-blue-500'
                  : 'bg-white/70 text-slate-600 border border-slate-200/80 hover:bg-white'
              }`}
            >
              {filter.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
