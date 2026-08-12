import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#1A1A1A] text-[#F9F8F6] font-sans-body border-t border-white/10 px-6 md:px-16 py-16 grid grid-cols-1 md:grid-cols-12 gap-8 z-10 relative">
      <div className="md:col-span-4 flex flex-col justify-between gap-6">
        <span className="font-serif-display text-4xl md:text-5xl font-normal tracking-tighter text-[#F9F8F6]">
          AESTHETE
        </span>
        <p className="text-[#999999] font-label-caps text-[10px] uppercase tracking-[2px]">
          © 2026 AESTHETE COLOMBIA. TODOS LOS DERECHOS RESERVADOS.
        </p>
      </div>

      <div className="md:col-span-8 flex flex-wrap gap-8 md:gap-12 justify-start md:justify-end items-center">
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
    </footer>
  );
};
