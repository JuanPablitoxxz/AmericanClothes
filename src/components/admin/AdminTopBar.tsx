import React from 'react';

interface AdminTopBarProps {
  lowStockCount: number;
  ordersTodayCount: number;
}

export const AdminTopBar: React.FC<AdminTopBarProps> = ({
  lowStockCount,
  ordersTodayCount,
}) => {
  return (
    <header className="w-full bg-[#262626] border-b border-white/10 py-2.5 px-4 sm:px-8 text-[10px] sm:text-xs font-label-caps text-[#F9F8F6] tracking-[1.5px] sm:tracking-[2px] select-none">
      <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#e9c349] text-sm sm:text-base">
            warning
          </span>
          <span>Alerta: {lowStockCount} productos con stock bajo</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#F9F8F6] text-sm sm:text-base">
            notifications
          </span>
          <span>Pedidos activos: {ordersTodayCount} registrados</span>
        </div>
      </div>
    </header>
  );
};

