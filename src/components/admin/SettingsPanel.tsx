import React, { useState } from 'react';

interface SettingsPanelProps {
  shaderOpacity: number;
  setShaderOpacity: (val: number) => void;
  currency: string;
  setCurrency: (val: string) => void;
  announcementText: string;
  setAnnouncementText: (val: string) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  shaderOpacity,
  setShaderOpacity,
  currency,
  setCurrency,
  announcementText,
  setAnnouncementText,
}) => {
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  return (
    <div className="max-w-3xl space-y-8 animate-fade-up text-[#1A1A1A]">
      <div className="border-b border-black/10 pb-6">
        <span className="sub-headline block mb-1">PREFERENCIAS GENERALES</span>
        <h1 className="font-serif-display text-3xl font-normal text-[#1A1A1A]">
          Ajustes de Sistema & Experiencia
        </h1>
        <p className="font-sans-body text-xs text-[#555555] mt-1">
          Configuración visual de la tienda, alertas de stock, divisa y parámetros generales.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="bg-[#EFECE7] border border-black/10 p-6 space-y-4 shadow-sm">
          <h3 className="font-serif-display text-xl text-[#1A1A1A] font-normal border-b border-black/10 pb-2">
            Efectos Visuales & Shader WebGL
          </h3>

          <div>
            <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-2">
              Opacidad del Fondo Fluido Liquid Gold ({Math.round(shaderOpacity * 100)}%)
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={shaderOpacity}
              onChange={(e) => setShaderOpacity(parseFloat(e.target.value))}
              className="w-full accent-[#1A1A1A]"
            />
            <p className="text-[11px] text-[#555555] mt-1">
              Ajusta la intensidad del fondo animado en WebGL de oro líquido.
            </p>
          </div>
        </div>

        <div className="bg-[#EFECE7] border border-black/10 p-6 space-y-4 shadow-sm">
          <h3 className="font-serif-display text-xl text-[#1A1A1A] font-normal border-b border-black/10 pb-2">
            Divisa & Parámetros Comerciales
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-1">
                Moneda Predeterminada
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-[#F9F8F6] border border-black/10 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
              >
                <option value="COP">Peso Colombiano ($ COP)</option>
              </select>
            </div>

            <div>
              <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-1">
                Umbral de Alerta de Stock Bajo
              </label>
              <input
                type="number"
                defaultValue={5}
                className="w-full bg-[#F9F8F6] border border-black/10 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-[#EFECE7] border border-black/10 p-6 space-y-4 shadow-sm">
          <h3 className="font-serif-display text-xl text-[#1A1A1A] font-normal border-b border-black/10 pb-2">
            Anuncio Superior en Tienda
          </h3>

          <div>
            <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-1">
              Texto de Anuncio Principal
            </label>
            <input
              type="text"
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              className="w-full bg-[#F9F8F6] border border-black/10 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <button
            type="submit"
            className="bg-[#1A1A1A] text-[#F9F8F6] font-label-caps text-xs px-8 py-3.5 font-bold uppercase tracking-[3px] hover:bg-[#333333] transition-colors"
          >
            Guardar Cambios
          </button>
          {savedMessage && (
            <span className="text-xs text-[#1A1A1A] font-mono font-bold animate-fade-up">
              ✓ Configuración guardada correctamente
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
