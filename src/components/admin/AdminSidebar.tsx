import React from 'react';
import { AdminTab } from '../../types';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onSwitchToStore: () => void;
  lowStockCount: number;
  ordersCount: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  onSwitchToStore,
  lowStockCount,
  ordersCount,
}) => {
  return (
    <aside className="fixed left-0 top-[37px] h-[calc(100vh-37px)] w-[280px] bg-[#1A1A1A] border-r border-white/10 flex flex-col py-8 px-6 z-40 select-none text-[#F9F8F6]">
      {/* User Header */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-[#262626] overflow-hidden flex-shrink-0 border border-white/20">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLTRx95qfL2RYSU7a_OWBS6spTdqq7oKSFgeu2p56UoJthHEFeSxNdUF0Fl5dTDiIsSQXz4hECsymhVAY8-9b1T09wTKvStV-mwqyXESJdJWQliY8RtskgdlG9nXv2TAqR1L7Dbg4Ng3mVAaw7cV2xrMNIzd0D9We_hCmxPqZQBjH9YFSycol1qN5nptO2gDDUrObdVWgu1O4vkC6-XouMSxkJZ5auGCqAYpr97dW_fdTO26H-KSKT"
              alt="Management Administrator"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="font-serif-display font-bold text-[#F9F8F6] text-lg">Gerencia</h2>
            <p className="font-sans-body text-xs text-[#999999]">Administrador del Sistema</p>
          </div>
        </div>

        {/* Brand Logo */}
        <div className="font-serif-display tracking-tighter text-[#F9F8F6] text-3xl font-normal border-b border-white/10 pb-6">
          AESTHETE
        </div>
      </div>

      {/* Navigation Links */}
      <ul className="flex-1 space-y-2 font-label-caps text-[11px] tracking-[2px]">
        {/* Dashboard */}
        <li>
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`w-full flex items-center justify-between p-3.5 transition-all duration-200 text-left ${
              activeTab === 'dashboard'
                ? 'bg-[#F9F8F6] text-[#1A1A1A] font-bold shadow-sm'
                : 'text-[#999999] hover:bg-[#262626] hover:text-[#F9F8F6]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-lg">dashboard</span>
              <span>Panel Principal</span>
            </div>
          </button>
        </li>

        {/* Products */}
        <li>
          <button
            onClick={() => onSelectTab('products')}
            className={`w-full flex items-center justify-between p-3.5 transition-all duration-200 text-left ${
              activeTab === 'products'
                ? 'bg-[#F9F8F6] text-[#1A1A1A] font-bold shadow-sm'
                : 'text-[#999999] hover:bg-[#262626] hover:text-[#F9F8F6]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-lg">inventory_2</span>
              <span>Productos</span>
            </div>
            {lowStockCount > 0 && (
              <span className="bg-[#F9F8F6] text-[#1A1A1A] border border-black/20 px-2 py-0.5 text-[9px] font-bold font-label-caps">
                {lowStockCount}
              </span>
            )}
          </button>
        </li>

        {/* Orders */}
        <li>
          <button
            onClick={() => onSelectTab('orders')}
            className={`w-full flex items-center justify-between p-3.5 transition-all duration-200 text-left ${
              activeTab === 'orders'
                ? 'bg-[#F9F8F6] text-[#1A1A1A] font-bold shadow-sm'
                : 'text-[#999999] hover:bg-[#262626] hover:text-[#F9F8F6]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-lg">shopping_cart</span>
              <span>Pedidos</span>
            </div>
            {ordersCount > 0 && (
              <span className="bg-[#F9F8F6] text-[#1A1A1A] px-2 py-0.5 text-[9px] font-bold font-label-caps">
                {ordersCount}
              </span>
            )}
          </button>
        </li>

        {/* Settings */}
        <li>
          <button
            onClick={() => onSelectTab('settings')}
            className={`w-full flex items-center justify-between p-3.5 transition-all duration-200 text-left ${
              activeTab === 'settings'
                ? 'bg-[#F9F8F6] text-[#1A1A1A] font-bold shadow-sm'
                : 'text-[#999999] hover:bg-[#262626] hover:text-[#F9F8F6]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-lg">settings</span>
              <span>Ajustes</span>
            </div>
          </button>
        </li>
      </ul>

      {/* Footer */}
      <div className="pt-6 border-t border-white/10 space-y-2">
        <button
          onClick={onSwitchToStore}
          className="w-full flex items-center gap-3 p-3 text-[#F9F8F6] hover:bg-[#262626] transition-all text-left text-[10px] font-label-caps tracking-[2px]"
        >
          <span className="material-symbols-outlined text-base">storefront</span>
          <span>Ver Tienda</span>
        </button>

        <button
          onClick={onSwitchToStore}
          className="w-full flex items-center gap-3 p-3 text-[#888888] hover:bg-[#262626] hover:text-[#F9F8F6] transition-all text-left text-xs font-sans-body"
        >
          <span className="material-symbols-outlined text-base">logout</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};
