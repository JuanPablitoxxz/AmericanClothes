import React from 'react';

export const LookbookJournal: React.FC = () => {
  return (
    <section
      className="py-14 sm:py-20 md:py-24 px-4 sm:px-8 md:px-16 max-w-[1440px] mx-auto z-10 relative bg-[#F9F8F6]"
      id="journal"
    >
      <div className="mb-8 sm:mb-12 text-center">
        <span className="sub-headline block mb-2">Manifiesto & Editorial</span>
        <h2 className="font-serif-display text-3xl sm:text-4xl text-[#1A1A1A] font-normal">
          Diario de Alta Costura
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
        {/* Editorial Story 1 */}
        <div className="bg-[#EFECE7] border border-black/10 group hover:border-black/30 transition-all overflow-hidden flex flex-col shadow-sm">
          <div className="relative aspect-[16/9] overflow-hidden bg-[#D6D2CC]">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDHml_hOHrKfDUxGSYu5OkvyPOvyzjK8O1WOqwotwDV-q4ubOFQWPx20PHaiXdlblde3krDP9kjn3vCePZxOYHyx_OlLsewhhAGic0VUS4DHTyZ0BgX3-6ORWncvBupKzDf-s2mYuhadM_46m3OtEnrniuJjfHHZ0li5E5SE5vuw33tvkCNKXQXpIkzTYUhjwcyIU1qLADVHcd-Z32gSrGlZ1y759u6G-6tfri9N9SYLpGPUcibvvIM"
              alt="Editorial Runway"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <span className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-[#F9F8F6]/90 backdrop-blur-md text-[#1A1A1A] font-label-caps text-[9px] px-3 py-1 border border-black/10 tracking-[2px]">
              EDITORIAL Nº 04
            </span>
          </div>
          <div className="p-5 sm:p-8 flex flex-col justify-between flex-1 space-y-4">
            <div>
              <span className="text-[10px] font-label-caps text-[#888888] tracking-[2px]">
                AGOSTO 2026 | EDICIÓN NOIR
              </span>
              <h3 className="font-serif-display text-xl sm:text-2xl text-[#1A1A1A] group-hover:text-[#555555] transition-colors mt-2">
                La Arquitectura del Silencio: Alta Costura en Oro Noble y Terciopelo
              </h3>
              <p className="text-xs text-[#555555] mt-3 leading-relaxed font-sans-body">
                Exploramos la convergencia entre siluetas industriales brutales y el bordado artesanal en hilos de oro. Una declaración estética para quienes visten con autoridad.
              </p>
            </div>
            <div className="cta-button pt-2">
              <div className="dot"></div>
              <span className="font-label-caps text-[10px] text-[#1A1A1A] tracking-[3px] font-bold">
                Leer Artículo Completo
              </span>
            </div>
          </div>
        </div>

        {/* Editorial Story 2 */}
        <div className="bg-[#EFECE7] border border-black/10 group hover:border-black/30 transition-all overflow-hidden flex flex-col shadow-sm">
          <div className="relative aspect-[16/9] overflow-hidden bg-[#D6D2CC]">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWEcEanj9Y0-mkFZ8DJ-XD0kyCVvOl2EreiIYDNT77nGjL_p15Ana9-FtpOXOI8KI67CLzIgAck9qByYynfn98WOu2TKDEosTURJjHh87VhSowp3fyfpYt51pegR2zDnlpHFllAYeQJ87gNsnIV_YlYy9pUmbuxUifkb-_rax9p0jG04ZVwbpR--HFRRX_PvctfpbIWlQ5vGOOzkPvKl6_8fnLQn6RswtmDHnXjh4Flg74I0_qoEWj"
              alt="Streetwear Haute Couture"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <span className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-[#F9F8F6]/90 backdrop-blur-md text-[#1A1A1A] font-label-caps text-[9px] px-3 py-1 border border-black/10 tracking-[2px]">
              LOOKBOOK 2026
            </span>
          </div>
          <div className="p-5 sm:p-8 flex flex-col justify-between flex-1 space-y-4">
            <div>
              <span className="text-[10px] font-label-caps text-[#888888] tracking-[2px]">
                COLECCIÓN TÁCTICA & LUJO
              </span>
              <h3 className="font-serif-display text-xl sm:text-2xl text-[#1A1A1A] group-hover:text-[#555555] transition-colors mt-2">
                Vanguardia Urbana: Funcionalidad Táctica y Joyería Imperial
              </h3>
              <p className="text-xs text-[#555555] mt-3 leading-relaxed font-sans-body">
                Análisis técnico de los tejidos impermeables combinados con colgantes de rubí corte cojín y pulseras en filigrana artesanal.
              </p>
            </div>
            <div className="cta-button pt-2">
              <div className="dot"></div>
              <span className="font-label-caps text-[10px] text-[#1A1A1A] tracking-[3px] font-bold">
                Explorar Lookbook
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
