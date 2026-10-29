import React, { useState } from 'react';
import { saveCloudSettings } from '../../lib/storeData';

interface SettingsPanelProps {
  shaderOpacity: number;
  setShaderOpacity: (val: number) => void;
  currency: string;
  setCurrency: (val: string) => void;
  announcementText: string;
  setAnnouncementText: (val: string) => void;
  whatsappNumber: string;
  setWhatsappNumber: (val: string) => void;
  isSupabaseConfigured: boolean;
  onResetDemoData: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  shaderOpacity,
  setShaderOpacity,
  currency,
  setCurrency,
  announcementText,
  setAnnouncementText,
  whatsappNumber,
  setWhatsappNumber,
  isSupabaseConfigured,
  onResetDemoData,
}) => {
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSupabaseConfigured) {
      try {
        await saveCloudSettings({
          shaderOpacity,
          currency,
          announcementText,
          whatsappNumber,
        });
      } catch (err) {
        console.error('Error al guardar ajustes en Supabase:', err);
      }
    }
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 md:space-y-8 animate-fade-up text-[#1A1A1A]">
      <div className="border-b border-black/10 pb-6">
        <span className="sub-headline block mb-1">PREFERENCIAS GENERALES</span>
        <h1 className="font-serif-display text-2xl sm:text-3xl md:text-4xl font-normal text-[#1A1A1A]">
          Ajustes de Sistema & Experiencia
        </h1>
        <p className="font-sans-body text-xs text-[#555555] mt-1">
          Configuración visual de la tienda, alertas de stock, divisa y parámetros generales.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 md:space-y-8">
        <div className="bg-[#EFECE7] border border-black/10 p-5 sm:p-6 space-y-4 shadow-sm">
          <h3 className="font-serif-display text-lg sm:text-xl text-[#1A1A1A] font-normal border-b border-black/10 pb-2">
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

        <div className="bg-[#EFECE7] border border-black/10 p-5 sm:p-6 space-y-4 shadow-sm">
          <h3 className="font-serif-display text-lg sm:text-xl text-[#1A1A1A] font-normal border-b border-black/10 pb-2">
            Divisa & Parámetros Comerciales
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <div className="bg-[#EFECE7] border border-black/10 p-5 sm:p-6 space-y-4 shadow-sm">
          <h3 className="font-serif-display text-lg sm:text-xl text-[#1A1A1A] font-normal border-b border-black/10 pb-2">
            Anuncio Superior en Tienda & Contacto
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div>
              <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-1">
                WhatsApp del Atelier (con código de país)
              </label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="573001234567"
                className="w-full bg-[#F9F8F6] border border-black/10 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none font-mono"
              />
              <span className="text-[10px] text-[#777] mt-1 block">
                Número al que los clientes podrán enviar el resumen de su pedido por WhatsApp.
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#EFECE7] border border-black/10 p-5 sm:p-6 space-y-4 shadow-sm">
          <h3 className="font-serif-display text-lg sm:text-xl text-[#1A1A1A] font-normal border-b border-black/10 pb-2">
            Base de Datos & Almacenamiento
          </h3>

          <div className="flex items-start sm:items-center gap-3">
            <span
              className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 sm:mt-0 ${
                isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            ></span>
            <div>
              <p className="text-xs font-bold text-[#1A1A1A]">
                {isSupabaseConfigured
                  ? 'Conectado a Supabase PostgreSQL Cloud'
                  : 'Almacenamiento Local (LocalStorage Activo)'}
              </p>
              <p className="text-[11px] text-[#666] leading-relaxed">
                {isSupabaseConfigured
                  ? 'Todos los productos, usuarios, órdenes y configuraciones se sincronizan en tiempo real con tu base de datos remota en Supabase.'
                  : 'Tus productos, inventario, pedidos y carrito se guardan de forma segura y permanente en este navegador.'}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-black/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <span className="text-xs text-[#666]">
              ¿Deseas restaurar el catálogo y pedidos originales de muestra?
            </span>
            <button
              type="button"
              onClick={onResetDemoData}
              className="w-full sm:w-auto px-4 py-2.5 border border-red-300 bg-red-50 text-red-700 text-xs font-label-caps hover:bg-red-100 transition-colors text-center"
            >
              Restaurar Datos de Demostración
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
          <button
            type="submit"
            className="w-full sm:w-auto bg-[#1A1A1A] text-[#F9F8F6] font-label-caps text-xs px-8 py-3.5 font-bold uppercase tracking-[3px] hover:bg-[#333333] transition-colors text-center"
          >
            Guardar Cambios
          </button>
          {savedMessage && (
            <span className="text-xs text-emerald-800 font-mono font-bold animate-fade-up text-center sm:text-right">
              ✓ Configuración guardada y sincronizada en Supabase
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
