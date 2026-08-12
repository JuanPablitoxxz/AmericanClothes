import React from 'react';
import { AppMode } from '../types';

interface TopBarSwitchProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  cartCount: number;
}

export const TopBarSwitch: React.FC<TopBarSwitchProps> = ({
  currentMode,
  onModeChange,
  cartCount
}) => {
  return (
    <div className="bg-[#1A1A1A] border-b border-white/10 px-6 py-2 flex items-center justify-between text-xs font-sans-body z-[60] relative select-none text-[#F9F8F6]">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-2 font-label-caps text-[10px] text-[#F9F8F6] tracking-[3px] uppercase font-bold">
          <span className="w-2 h-2 rounded-full bg-[#F9F8F6]"></span>
          AESTHETE STUDIO
        </span>
        <span className="text-[#888888] hidden sm:inline">|</span>
        <span className="text-[#999999] text-[10px] uppercase tracking-widest hidden md:inline font-mono">
          {currentMode === 'store' ? 'Vol. 04 — Escaparate Editorial' : 'Sistema — Análisis y Catálogo de Admin'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onModeChange('store')}
          className={`px-3.5 py-1 font-label-caps text-[10px] transition-all flex items-center gap-1.5 uppercase tracking-wider ${
            currentMode === 'store'
              ? 'bg-[#F9F8F6] text-[#1A1A1A] font-bold shadow-sm'
              : 'bg-[#262626] text-[#999999] hover:text-[#F9F8F6] hover:bg-[#333333]'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">storefront</span>
          Tienda
          {cartCount > 0 && currentMode === 'admin' && (
            <span className="ml-1 px-1.5 py-0.2 bg-[#1A1A1A] text-[#F9F8F6] border border-[#F9F8F6] rounded-full text-[9px]">
              {cartCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onModeChange('admin')}
          className={`px-3.5 py-1 font-label-caps text-[10px] transition-all flex items-center gap-1.5 uppercase tracking-wider ${
            currentMode === 'admin'
              ? 'bg-[#F9F8F6] text-[#1A1A1A] font-bold shadow-sm'
              : 'bg-[#262626] text-[#999999] hover:text-[#F9F8F6] hover:bg-[#333333]'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
          Panel Admin
        </button>
      </div>
    </div>
  );
};
