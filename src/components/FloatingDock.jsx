import React from 'react';
import { motion } from 'framer-motion';
import { Film, Folder, Plus, ShieldCheck, Sliders } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

export const FloatingDock = ({ activeTab, onSelectTab, onCenterAction }) => {
  const leftTabs = [
    { id: 'videos', label: 'Videos', icon: Film },
    { id: 'folders', label: 'Folders', icon: Folder }
  ];

  const rightTabs = [
    { id: 'vault', label: 'Vault', icon: ShieldCheck },
    { id: 'settings', label: 'Settings', icon: Sliders }
  ];

  return (
    <div className="fixed bottom-4 inset-x-4 max-w-md mx-auto z-40">
      <div className="glass-dock h-20 rounded-[32px] px-3 flex items-center justify-between relative">
        {/* Left Tabs (Videos / Folders) */}
        <div className="flex items-center space-x-1 flex-1 justify-around">
          {leftTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                  triggerHaptic('light');
                  onSelectTab(tab.id);
                }}
                className="relative flex flex-col items-center justify-center w-14 py-1.5 focus:outline-none"
              >
                <div
                  className={`p-1.5 rounded-xl transition-all duration-200 ${
                    isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-400'
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span
                  className={`text-[10px] font-bold mt-0.5 transition-colors duration-200 ${
                    isActive ? 'text-blue-600' : 'text-slate-500'
                  }`}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-0.5 shadow-sm shadow-blue-400" />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Elevated Center Action FAB Button */}
        <div className="relative -top-3 px-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              triggerHaptic('medium');
              onCenterAction();
            }}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-700 text-white flex items-center justify-center shadow-xl shadow-indigo-600/40 border-2 border-white focus:outline-none"
          >
            <Plus size={26} strokeWidth={2.8} />
          </motion.button>
        </div>

        {/* Right Tabs (Vault / Settings) */}
        <div className="flex items-center space-x-1 flex-1 justify-around">
          {rightTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                  triggerHaptic('light');
                  onSelectTab(tab.id);
                }}
                className="relative flex flex-col items-center justify-center w-14 py-1.5 focus:outline-none"
              >
                <div
                  className={`p-1.5 rounded-xl transition-all duration-200 ${
                    isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-400'
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span
                  className={`text-[10px] font-bold mt-0.5 transition-colors duration-200 ${
                    isActive ? 'text-blue-600' : 'text-slate-500'
                  }`}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-0.5 shadow-sm shadow-blue-400" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
