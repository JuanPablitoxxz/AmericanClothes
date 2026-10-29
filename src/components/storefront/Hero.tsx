import React from 'react';

interface HeroProps {
  onExplore: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExplore }) => {
  return (
    <section className="relative min-h-[85vh] bg-[#F9F8F6] pt-16 flex items-center justify-center border-b border-black/10 overflow-hidden">
      <div className="max-w-[1440px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 min-h-[75vh]">
        {/* Left Editorial Text Content */}
        <div className="lg:col-span-5 p-8 md:p-16 flex flex-col justify-center z-10 animate-fade-up">
          <span className="sub-headline mb-4">Historia Destacada - American Clothes 2026</span>
          <h1 className="font-serif-display text-5xl md:text-7xl lg:text-8xl font-normal text-[#1A1A1A] leading-[0.95] tracking-tight mb-6">
            Formas <br />
            <span className="italic font-normal">Puras.</span>
          </h1>
          <p className="text-sm leading-relaxed text-[#555555] max-w-sm mb-8 font-sans-body">
            Una exploración de la alta costura brutalista y la sastrería contemporánea hecha para Colombia. Encontrando armonía en la colisión de texturas orgánicas y geometría arquitectónica.
          </p>
          
          <div className="cursor-pointer inline-flex items-center gap-3 group mt-2" onClick={onExplore}>
            <div className="w-2.5 h-2.5 rounded-full bg-[#1A1A1A] group-hover:scale-125 transition-transform"></div>
            <span className="text-[11px] uppercase tracking-[4px] font-bold text-[#1A1A1A] group-hover:opacity-70 transition-opacity">
              Explorar Colección
            </span>
          </div>
        </div>

        {/* Right Visual Image Container */}
        <div className="lg:col-span-7 bg-[#EFECE7] relative flex items-center justify-center overflow-hidden min-h-[420px] lg:min-h-full border-l border-black/5">
          <div className="w-[85%] h-[85%] bg-[#D6D2CC] relative overflow-hidden shadow-2xl">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDHml_hOHrKfDUxGSYu5OkvyPOvyzjK8O1WOqwotwDV-q4ubOFQWPx20PHaiXdlblde3krDP9kjn3vCePZxOYHyx_OlLsewhhAGic0VUS4DHTyZ0BgX3-6ORWncvBupKzDf-s2mYuhadM_46m3OtEnrniuJjfHHZ0li5E5SE5vuw33tvkCNKXQXpIkzTYUhjwcyIU1qLADVHcd-Z32gSrGlZ1y759u6G-6tfri9N9SYLpGPUcibvvIM"
              alt="Editorial de alta costura en Colombia"
              className="w-full h-full object-cover filter brightness-[0.92] contrast-[1.05]"
            />
            <div className="absolute top-0 right-0 w-[60%] h-[120%] bg-white/20 transform rotate-[12deg] pointer-events-none"></div>
            <div className="absolute bottom-6 left-6 p-4 text-white mix-blend-difference">
              <span className="text-[10px] uppercase tracking-[3px] font-bold">Colección American Clothes 2026</span>
            </div>
          </div>

          <div className="absolute bottom-8 right-8 text-right hidden sm:block">
            <div className="text-5xl font-serif leading-none text-[#1A1A1A]">01</div>
            <div className="text-[10px] uppercase tracking-[3px] text-[#888888] mt-1 font-bold">
              Bogotá / Atelier
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
