import React, { useState } from 'react';
import { AdminTab, AuthUser } from '../../types';

interface AdminSidebarProps {
  activeTab: AdminTab;
  currentUser: AuthUser | null;
  onSelectTab: (tab: AdminTab) => void;
  onSwitchToStore: () => void;
  onLogout: () => void;
  lowStockCount: number;
  criticalStockCount?: number;
  ordersCount: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  currentUser,
  onSelectTab,
  onSwitchToStore,
  onLogout,
  lowStockCount,
  criticalStockCount = 0,
  ordersCount,
}) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const totalStockAlerts = criticalStockCount + lowStockCount;

  const navItems: { id: AdminTab; label: string; icon: string; badge?: number; isCritical?: boolean }[] = [
    { id: 'dashboard', label: 'Panel Principal', icon: 'dashboard' },
    {
      id: 'products',
      label: 'Productos',
      icon: 'inventory_2',
      badge: totalStockAlerts > 0 ? totalStockAlerts : undefined,
      isCritical: criticalStockCount > 0,
    },
    { id: 'orders', label: 'Pedidos', icon: 'shopping_cart', badge: ordersCount > 0 ? ordersCount : undefined },
    { id: 'settings', label: 'Ajustes', icon: 'settings' },
  ];

  const handleSelect = (tab: AdminTab) => {
    onSelectTab(tab);
    setMobileDrawerOpen(false);
  };

  return (
    <>
      {/* =================================================================
          BARRA SUPERIOR Y PESTAÑAS RÁPIDAS PARA SMARTPHONE Y TABLET (< lg)
         ================================================================= */}
      <div className="lg:hidden sticky top-0 z-40 bg-[#1A1A1A] text-[#F9F8F6] border-b border-white/10 select-none">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="p-1.5 text-[#F9F8F6] hover:bg-white/10 transition-colors"
              aria-label="Abrir menú de administración"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>
            <div>
              <span className="font-serif-display text-lg sm:text-xl tracking-tight text-[#F9F8F6] block leading-none">
                AMERICAN CLOTHES
              </span>
              <span className="font-label-caps text-[9px] tracking-[2px] text-[#999999] uppercase">
                Panel Administrativo
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSwitchToStore}
              className="px-3 py-1.5 bg-[#262626] hover:bg-[#333333] border border-white/15 text-[#F9F8F6] font-label-caps text-[9px] tracking-[1.5px] uppercase flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">storefront</span>
              <span className="hidden xs:inline">Ver Tienda</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 text-red-400 hover:bg-red-950/40 transition-colors"
              title="Cerrar Sesión"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
            </button>
          </div>
        </div>

        {/* Barra de navegación rápida de los 4 apartados en móvil/tablet */}
        <div className="grid grid-cols-4 border-t border-white/10 bg-[#141414]">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`py-2.5 px-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-[9px] sm:text-[10px] font-label-caps tracking-[1px] transition-all relative ${
                  isActive
                    ? 'bg-[#F9F8F6] text-[#1A1A1A] font-bold'
                    : 'text-[#999999] hover:text-[#F9F8F6]'
                }`}
              >
                <span className="material-symbols-outlined text-base sm:text-lg">{item.icon}</span>
                <span className="truncate max-w-full">{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 text-[8px] font-bold rounded-full ${
                      isActive ? 'bg-[#1A1A1A] text-[#F9F8F6]' : 'bg-white/15 text-[#F9F8F6]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* =================================================================
          DRAWER DESLIZABLE PARA SMARTPHONE Y TABLET
         ================================================================= */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-black/70 backdrop-blur-xs flex"
          onClick={() => setMobileDrawerOpen(false)}
        >
          <aside
            className="w-[280px] max-w-[85vw] bg-[#1A1A1A] h-full flex flex-col justify-between py-6 px-5 text-[#F9F8F6] shadow-2xl border-r border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-5 mb-6 border-b border-white/10">
                <span className="font-serif-display text-xl tracking-tight text-[#F9F8F6]">
                  AMERICAN CLOTHES
                </span>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="text-[#999999] hover:text-[#F9F8F6] p-1"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="flex items-center gap-3 mb-6 p-3 bg-[#262626] border border-white/10">
                <div className="w-10 h-10 rounded-full bg-[#1A1A1A] overflow-hidden flex-shrink-0 border border-white/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl text-[#F9F8F6]">
                    admin_panel_settings
                  </span>
                </div>
                <div className="overflow-hidden">
                  <h2 className="font-serif-display font-bold text-[#F9F8F6] text-sm truncate">
                    {currentUser?.name || 'Gerencia'}
                  </h2>
                  <p className="font-sans-body text-[11px] text-[#999999] truncate">
                    {currentUser?.email || 'Administrador del Sistema'}
                  </p>
                </div>
              </div>

              <ul className="space-y-2 font-label-caps text-[11px] tracking-[2px]">
                {navItems.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(item.id)}
                      className={`w-full flex items-center justify-between p-3.5 transition-all duration-200 text-left ${
                        activeTab === item.id
                          ? 'bg-[#F9F8F6] text-[#1A1A1A] font-bold shadow-sm'
                          : 'text-[#999999] hover:bg-[#262626] hover:text-[#F9F8F6]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-lg">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span
                          className={`px-2 py-0.5 text-[9px] font-bold font-label-caps ${
                            activeTab === item.id
                              ? 'bg-[#1A1A1A] text-[#F9F8F6]'
                              : 'bg-[#F9F8F6] text-[#1A1A1A]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-5 border-t border-white/10 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  onSwitchToStore();
                }}
                className="w-full flex items-center gap-3 p-3 text-[#F9F8F6] hover:bg-[#262626] transition-all text-left text-[10px] font-label-caps tracking-[2px]"
              >
                <span className="material-symbols-outlined text-base">storefront</span>
                <span>Ver Tienda</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-3 p-3 text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-all text-left text-xs font-sans-body"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* =================================================================
          SIDEBAR FIJO PARA PC / ESCRITORIO (lg+)
         ================================================================= */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-[280px] bg-[#1A1A1A] border-r border-white/10 flex-col py-8 px-6 z-40 select-none text-[#F9F8F6]">
        {/* User Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#262626] overflow-hidden flex-shrink-0 border border-white/20">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLTRx95qfL2RYSU7a_OWBS6spTdqq7oKSFgeu2p56UoJthHEFeSxNdUF0Fl5dTDiIsSQXz4hECsymhVAY8-9b1T09wTKvStV-mwqyXESJdJWQliY8RtskgdlG9nXv2TAqR1L7Dbg4Ng3mVAaw7cV2xrMNIzd0D9We_hCmxPqZQBjH9YFSycol1qN5nptO2gDDUrObdVWgu1O4vkC6-XouMSxkJZ5auGCqAYpr97dW_fdTO26H-KSKT"
                alt="Management Administrator"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="overflow-hidden">
              <h2 className="font-serif-display font-bold text-[#F9F8F6] text-base truncate">
                {currentUser?.name || 'Gerencia'}
              </h2>
              <p className="font-sans-body text-[11px] text-[#999999] truncate">
                {currentUser?.email || 'Administrador del Sistema'}
              </p>
            </div>
          </div>

          {/* Brand Logo */}
          <div className="font-serif-display tracking-tight text-[#F9F8F6] text-2xl font-normal border-b border-white/10 pb-6">
            AMERICAN CLOTHES
          </div>
        </div>

        {/* Navigation Links */}
        <ul className="flex-1 space-y-2 font-label-caps text-[11px] tracking-[2px]">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between p-3.5 transition-all duration-200 text-left ${
                  activeTab === item.id
                    ? 'bg-[#F9F8F6] text-[#1A1A1A] font-bold shadow-sm'
                    : 'text-[#999999] hover:bg-[#262626] hover:text-[#F9F8F6]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 text-[9px] font-bold font-label-caps ${
                      activeTab === item.id
                        ? 'bg-[#1A1A1A] text-[#F9F8F6]'
                        : 'bg-[#F9F8F6] text-[#1A1A1A]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="pt-6 border-t border-white/10 space-y-2">
          <button
            type="button"
            onClick={onSwitchToStore}
            className="w-full flex items-center gap-3 p-3 text-[#F9F8F6] hover:bg-[#262626] transition-all text-left text-[10px] font-label-caps tracking-[2px]"
          >
            <span className="material-symbols-outlined text-base">storefront</span>
            <span>Ver Tienda</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 p-3 text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-all text-left text-xs font-sans-body"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};

