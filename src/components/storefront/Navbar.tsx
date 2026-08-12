import React, { useState } from 'react';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  onSelectCategory: (cat: string) => void;
  onOpenSearch: () => void;
  onOpenAdmin: () => void;
  onOpenJournal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  onSelectCategory,
  onOpenSearch,
  onOpenAdmin,
  onOpenJournal
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-[37px] w-full z-40 bg-[#F9F8F6]/90 backdrop-blur-md border-b border-black/10 text-[#1A1A1A] transition-all">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-5 flex justify-between items-center">
        {/* Brand Logo */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSelectCategory('Todos');
          }}
          className="font-serif-display text-2xl md:text-3xl font-bold tracking-tighter text-[#1A1A1A] hover:text-[#555555] transition-colors"
        >
          AESTHETE
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 font-label-caps text-[11px] tracking-[3px]">
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

        {/* Right Icon Actions */}
        <div className="flex items-center gap-5">
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

          <button
            onClick={onOpenAdmin}
            className="text-[#1A1A1A] hover:text-[#555555] transition-colors p-1 hidden sm:flex items-center gap-1 font-label-caps text-[11px]"
            title="Acceso Administración"
          >
            <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-[#1A1A1A] p-1"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#F9F8F6] border-b border-black/10 px-6 py-6 space-y-4 font-label-caps text-xs">
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
          <div className="pt-2 border-t border-black/10">
            <button
              onClick={() => {
                onOpenAdmin();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 text-[#1A1A1A] font-bold py-2"
            >
              <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
              Ir a Admin Dashboard
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
