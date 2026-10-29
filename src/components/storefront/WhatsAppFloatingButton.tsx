import React from 'react';

interface WhatsAppFloatingButtonProps {
  whatsappNumber: string;
  customerName?: string;
  customMessage?: string;
}

export const WhatsAppFloatingButton: React.FC<WhatsAppFloatingButtonProps> = ({
  whatsappNumber,
  customerName,
  customMessage,
}) => {
  // Limpiar el número dejando solo dígitos; si tiene 10 dígitos (ej. celular colombiano 3001234567), anteponer 57
  const rawDigits = (whatsappNumber || '573001234567').replace(/\D/g, '');
  const formattedPhone =
    rawDigits.length === 10 && rawDigits.startsWith('3')
      ? `57${rawDigits}`
      : rawDigits || '573001234567';

  const defaultMessage =
    customMessage ||
    (customerName
      ? `¡Hola American Clothes! Mi nombre es ${customerName} y me gustaría recibir atención personalizada sobre sus prendas y catálogo disponible.`
      : '¡Hola American Clothes! Me gustaría recibir atención personalizada e información sobre sus prendas disponibles.');

  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Atención al cliente por WhatsApp"
      title="Chatear con Atención al Cliente por WhatsApp"
      className="fixed bottom-5 right-4 sm:bottom-7 sm:right-7 z-40 group flex items-center gap-3 bg-[#1A1A1A] hover:bg-[#25D366] text-[#F9F8F6] hover:text-white border border-[#e9c349]/50 hover:border-[#25D366] pl-3.5 pr-4 py-3 sm:px-5 sm:py-3.5 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.45)] transition-all duration-300 hover:scale-105 active:scale-95"
    >
      {/* Indicador de estado en línea */}
      <span className="relative flex h-6 w-6 items-center justify-center flex-shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-40 group-hover:bg-white"></span>
        <svg
          viewBox="0 0 32 32"
          fill="currentColor"
          className="relative w-5 h-5 sm:w-6 sm:h-6 text-[#25D366] group-hover:text-white transition-colors"
          aria-hidden="true"
        >
          <path d="M16.004 3.2c-7.068 0-12.8 5.732-12.8 12.8 0 2.256.59 4.46 1.71 6.404L3.2 28.8l6.564-1.696a12.74 12.74 0 0 0 6.24 1.628h.006c7.066 0 12.796-5.732 12.796-12.8 0-3.42-1.332-6.636-3.75-9.054A12.716 12.716 0 0 0 16.004 3.2zm0 23.368h-.004a10.61 10.61 0 0 1-5.408-1.48l-.388-.23-4.022 1.04 1.074-3.922-.252-.402a10.596 10.596 0 0 1-1.63-5.646c0-5.862 4.77-10.632 10.634-10.632 2.84 0 5.51 1.106 7.518 3.116a10.564 10.564 0 0 1 3.112 7.52c0 5.864-4.772 10.636-10.634 10.636zm5.834-7.964c-.32-.16-1.892-.934-2.186-1.04-.292-.106-.506-.16-.72.16-.212.32-.826 1.04-1.012 1.252-.186.214-.374.24-.694.08-.32-.16-1.35-.498-2.572-1.586-.95-.848-1.592-1.894-1.778-2.214-.186-.32-.02-.492.14-.652.144-.144.32-.374.48-.56.16-.186.212-.32.32-.534.106-.212.054-.4-.026-.56-.08-.16-.72-1.734-.986-2.374-.26-.624-.524-.54-.72-.55l-.614-.01c-.212 0-.56.08-.852.4-.294.32-1.12 1.094-1.12 2.666 0 1.574 1.146 3.094 1.306 3.308.16.212 2.256 3.444 5.464 4.83.764.33 1.36.526 1.824.674.766.244 1.464.21 2.016.128.614-.092 1.892-.774 2.16-1.52.266-.746.266-1.386.186-1.52-.08-.134-.294-.214-.614-.374z" />
        </svg>
      </span>

      <div className="flex flex-col text-left leading-tight">
        <span className="font-label-caps text-[8px] sm:text-[9px] tracking-[2px] text-[#e9c349] group-hover:text-white/90 uppercase">
          Atención Directa
        </span>
        <span className="font-sans-body text-xs sm:text-sm font-bold tracking-wide whitespace-nowrap">
          WhatsApp
        </span>
      </div>
    </a>
  );
};
