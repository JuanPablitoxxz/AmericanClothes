import React, { useState } from 'react';
import { AuthUser } from '../../types';
import { AuthView } from '../auth/AuthModal';

interface NavbarProps {
  cartCount: number;
  currentUser: AuthUser | null;
  onOpenCart: () => void;
  onSelectCategory: (cat: string) => void;
  onOpenSearch: () => void;
  onOpenAuth: (view?: AuthView) => void;
  onOpenCustomerAccount: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
  onOpenJournal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  currentUser,
  onOpenCart,
  onSelectCategory,
  onOpenSearch,
  onOpenAuth,
  onOpenCustomerAccount,
  onOpenAdmin,
  onLogout,
  onOpenJournal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-40 bg-[#F9F8F6]/95 backdrop-blur-md border-b border-black/10 text-[#1A1A1A] transition-all">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-5 flex justify-between items-center">
        {/* Brand Logo */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSelectCategory('Todos');
          }}
          className="font-serif-display text-xl md:text-2xl font-bold tracking-tight text-[#1A1A1A] hover:text-[#555555] transition-colors"
        >
          AMERICAN CLOTHES
        </a>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-8 font-label-caps text-[11px] tracking-[3px]">
          <button
            onClick={() => onSelectCategory('Todos')}
            className="text-[#555555] hover:text-[#1A1A1A] transition-colors uppercase font-medium"
          >
            Colecciones
          </button>
          <button
            onClick={() => onSelectCategory('Hombre')}
            className="text-[#555555] hover:text-[#1A1A1A] transition-colors uppercase font-medium"
          >
            Hombre
          </button>
          <button
            onClick={() => onSelectCategory('Mujer')}
            className="text-[#555555] hover:text-[#1A1A1A] transition-colors uppercase font-medium"
          >
            Mujer
          </button>
          <button
            onClick={() => onSelectCategory('Accesorios')}
            className="text-[#555555] hover:text-[#1A1A1A] transition-colors uppercase font-medium"
          >
            Accesorios
          </button>
          <button
            onClick={onOpenJournal}
            className="text-[#555555] hover:text-[#1A1A1A] transition-colors uppercase font-medium"
          >
            Diario & Lookbook
          </button>
        </div>

        {/* Right Actions & Auth */}
        <div className="flex items-center gap-4">
          <button
            onClick={onOpenSearch}
            className="text-[#1A1A1A] hover:text-[#555555] transition-colors p-1"
            title="Buscar"
          >
            <span className="material-symbols-outlined text-xl">search</span>
          </button>

          <button
            onClick={onOpenCart}
            className="text-[#1A1A1A] hover:text-[#555555] transition-colors relative p-1"
            title="Bolsa de Compras"
          >
            <span className="material-symbols-outlined text-xl">shopping_bag</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#1A1A1A] text-[#F9F8F6] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          {/* Auth Buttons (Desktop) */}
          {!currentUser ? (
            <button
              onClick={() => onOpenAuth('login')}
              className="hidden sm:flex items-center gap-2 bg-[#1A1A1A] text-[#F9F8F6] px-4 py-2 font-label-caps text-[10px] font-bold uppercase tracking-[2px] hover:bg-[#333333] transition-colors"
            >
              <span className="material-symbols-outlined text-sm">person</span>
              <span>Iniciar Sesión / Registrarse</span>
            </button>
          ) : currentUser.role === 'admin' ? (
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 bg-[#1A1A1A] text-[#F9F8F6] px-4 py-2 font-label-caps text-[10px] font-bold uppercase tracking-[2px] hover:bg-[#333333] transition-colors"
                title="Volver al Panel Administrativo"
              >
                <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                <span>Panel Admin</span>
              </button>
              <button
                onClick={onLogout}
                className="p-2 border border-black/15 text-[#1A1A1A] hover:bg-black/5 transition-colors"
                title="Cerrar Sesión"
              >
                <span className="material-symbols-outlined text-base">logout</span>
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={onOpenCustomerAccount}
                className="flex items-center gap-1.5 bg-[#EFECE7] border border-black/15 text-[#1A1A1A] px-3.5 py-2 font-label-caps text-[10px] font-bold uppercase tracking-[1.5px] hover:bg-[#1A1A1A] hover:text-[#F9F8F6] transition-colors"
                title="Ver Mi Cuenta y Pedidos"
              >
                <span className="material-symbols-outlined text-sm">account_circle</span>
                <span>{currentUser.name.split(' ')[0]}</span>
              </button>
              <button
                onClick={onLogout}
                className="p-2 border border-black/15 text-[#1A1A1A] hover:bg-black/5 transition-colors"
                title="Cerrar Sesión"
              >
                <span className="material-symbols-outlined text-base">logout</span>
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-[#1A1A1A] p-1"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#F9F8F6] border-b border-black/10 px-6 py-6 space-y-4 font-label-caps text-xs">
          <button
            onClick={() => {
              onSelectCategory('Todos');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-[#1A1A1A] font-bold"
          >
            Todas las Colecciones
          </button>
          <button
            onClick={() => {
              onSelectCategory('Hombre');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-[#555555] hover:text-[#1A1A1A]"
          >
            Hombre
          </button>
          <button
            onClick={() => {
              onSelectCategory('Mujer');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-[#555555] hover:text-[#1A1A1A]"
          >
            Mujer
          </button>
          <button
            onClick={() => {
              onSelectCategory('Accesorios');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-[#555555] hover:text-[#1A1A1A]"
          >
            Accesorios
          </button>
          <button
            onClick={() => {
              onOpenJournal();
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-[#555555] hover:text-[#1A1A1A]"
          >
            Diario & Lookbook
          </button>

          <div className="pt-3 border-t border-black/10 space-y-2">
            {!currentUser ? (
              <>
                <button
                  onClick={() => {
                    onOpenAuth('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3 bg-[#1A1A1A] text-[#F9F8F6] font-bold uppercase tracking-[2px] flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">person</span>
                  Iniciar Sesión / Registrarse
                </button>
              </>
            ) : currentUser.role === 'admin' ? (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    onOpenAdmin();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3 bg-[#1A1A1A] text-[#F9F8F6] font-bold uppercase tracking-[2px] flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                  Ir al Panel Admin
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 border border-black/15 text-[#1A1A1A] uppercase tracking-[2px] flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    onOpenCustomerAccount();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3 bg-[#1A1A1A] text-[#F9F8F6] font-bold uppercase tracking-[2px] flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">account_circle</span>
                  Mi Cuenta ({currentUser.name.split(' ')[0]})
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 border border-black/15 text-[#1A1A1A] uppercase tracking-[2px] flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
