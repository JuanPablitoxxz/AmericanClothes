import React from 'react';
import { ProductCategory } from '../../types';

interface BentoGridProps {
  onSelectCategory: (category: ProductCategory) => void;
}

export const BentoGrid: React.FC<BentoGridProps> = ({ onSelectCategory }) => {
  return (
    <section className="py-20 px-6 md:px-16 max-w-[1440px] mx-auto relative z-10 bg-[#F9F8F6]" id="collections">
      <div className="mb-12 text-center">
        <span className="sub-headline block mb-2">
          Líneas de Diseño & Categorías
        </span>
        <h2 className="font-serif-display text-4xl md:text-5xl text-[#1A1A1A] font-normal">
          Colecciones AESTHETE
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Menswear Large Card */}
        <div
          onClick={() => onSelectCategory('Hombre')}
          className="md:col-span-8 relative h-[520px] md:h-[600px] group overflow-hidden cursor-pointer bg-[#EFECE7] border border-black/10 hover:border-black/40 transition-all duration-500"
        >
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWEcEanj9Y0-mkFZ8DJ-XD0kyCVvOl2EreiIYDNT77nGjL_p15Ana9-FtpOXOI8KI67CLzIgAck9qByYynfn98WOu2TKDEosTURJjHh87VhSowp3fyfpYt51pegR2zDnlpHFllAYeQJ87gNsnIV_YlYy9pUmbuxUifkb-_rax9p0jG04ZVwbpR--HFRRX_PvctfpbIWlQ5vGOOzkPvKl6_8fnLQn6RswtmDHnXjh4Flg74I0_qoEWj"
            alt="Menswear High Fashion"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter brightness-[0.95]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
          <div className="absolute bottom-8 left-8 z-20 transition-transform duration-500 transform translate-y-2 group-hover:translate-y-0 text-white">
            <span className="font-label-caps text-[10px] tracking-[4px] block mb-1 opacity-90">COLECCIÓN HOMBRE</span>
            <h3 className="font-serif-display text-3xl md:text-5xl font-normal mb-2">Hombre</h3>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[3px] font-bold">
              <span className="w-2 h-2 rounded-full bg-white"></span>
              <span>Explorar Catálogo</span>
            </div>
          </div>
        </div>

        {/* Right Stack (Womenswear & Accessories) */}
        <div className="md:col-span-4 flex flex-col gap-6">
          {/* Womenswear */}
          <div
            onClick={() => onSelectCategory('Mujer')}
            className="relative flex-1 min-h-[280px] group overflow-hidden cursor-pointer bg-[#EFECE7] border border-black/10 hover:border-black/40 transition-all duration-500"
          >
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBekPNiB5SekzdQRdiuovgz8pw1jYbD0CkGbxz7kTlcNr033nWxGrQsEGuZ_MwIuHQ1lUksfHCPPh_E5zJV4os7tu6JnUioJdwM--0I4lIalIhbDoZYQAWaapUDzAcuIPy9ODUj5-aIjS6TKgEleRQ346kWDVcoLgyUGX7NI_VWiZ-1hlOMPMNFTJ-Bm5c5VjMHkDMD6nXKj942WWdOaIKGRyY7oc9csADkVsyT1HlXTK4atN6qUxAD"
              alt="Womenswear High Fashion"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter brightness-[0.95]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
            <div className="absolute bottom-6 left-6 z-20 transition-transform duration-500 transform translate-y-2 group-hover:translate-y-0 text-white">
              <span className="font-label-caps text-[10px] tracking-[4px] block mb-1 opacity-90">COLECCIÓN MUJER</span>
              <h3 className="font-serif-display text-2xl md:text-3xl font-normal mb-1">Mujer</h3>
              <p className="font-label-caps text-[10px] tracking-[3px]">Ver Piezas</p>
            </div>
          </div>

          {/* Accessories */}
          <div
            onClick={() => onSelectCategory('Accesorios')}
            className="relative flex-1 min-h-[280px] group overflow-hidden cursor-pointer bg-[#EFECE7] border border-black/10 hover:border-black/40 transition-all duration-500"
          >
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSeU26lRHqYN8xOs4-6k8cy2ZxtfMgVGR4FjOyfXyD-IEZ3927JD79l8sTRzqyx_-X8wRoqNk_h2-u8WHdW2nAQCVeL3dmpec5xgdIDc2XgKjWjpOFTwFOEWmh9UgsLqoAmBKDeXAmhoo-KOacfysRind9dpbiRAZ1tNwECHjjKOJKFgtlKiL8jTfROFuqD-HKfe7CfP3__rDvMcgiuEsriZRUbbCMS49N6QINdehfmmZzspsr3NLE"
              alt="Accessories High Fashion"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter brightness-[0.95]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
            <div className="absolute bottom-6 left-6 z-20 transition-transform duration-500 transform translate-y-2 group-hover:translate-y-0 text-white">
              <span className="font-label-caps text-[10px] tracking-[4px] block mb-1 opacity-90">JOYERÍA & ARTÍCULOS</span>
              <h3 className="font-serif-display text-2xl md:text-3xl font-normal mb-1">Accesorios</h3>
              <p className="font-label-caps text-[10px] tracking-[3px]">Descubrir</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
