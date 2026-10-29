import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#1A1A1A] text-[#F9F8F6] font-sans-body border-t border-white/10 px-4 sm:px-8 md:px-16 py-12 sm:py-16 z-10 relative">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-5 flex flex-col justify-between gap-4 text-center sm:text-left">
          <span className="font-serif-display text-2xl sm:text-3xl md:text-4xl font-normal tracking-tight text-[#F9F8F6]">
            AMERICAN CLOTHES
          </span>
          <p className="text-[#999999] font-label-caps text-[10px] uppercase tracking-[2px]">
            © 2026 AMERICAN CLOTHES. TODOS LOS DERECHOS RESERVADOS.
          </p>
        </div>

        <div className="lg:col-span-7 flex flex-wrap gap-6 sm:gap-8 lg:gap-10 justify-center sm:justify-start lg:justify-end items-center">
          <a
            href="#"
            className="text-[#999999] hover:text-[#F9F8F6] transition-colors font-label-caps text-[10px] tracking-[2px] uppercase"
          >
            Política de Privacidad
          </a>
          <a
            href="#"
            className="text-[#999999] hover:text-[#F9F8F6] transition-colors font-label-caps text-[10px] tracking-[2px] uppercase"
          >
            Términos de Servicio
          </a>
          <a
            href="#"
            className="text-[#999999] hover:text-[#F9F8F6] transition-colors font-label-caps text-[10px] tracking-[2px] uppercase"
          >
            Envíos & Devoluciones
          </a>
          <a
            href="#"
            className="text-[#999999] hover:text-[#F9F8F6] transition-colors font-label-caps text-[10px] tracking-[2px] uppercase"
          >
            Contacto & Atelier
          </a>
        </div>
      </div>
    </footer>
  );
};
