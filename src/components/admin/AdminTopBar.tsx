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
    <div className="fixed top-0 left-0 md:left-[280px] right-0 z-30 bg-[#262626] border-b border-white/10 py-2.5 px-6 flex justify-between items-center text-xs font-label-caps text-[#F9F8F6] tracking-[2px] select-none">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[#F9F8F6] text-base">warning</span>
        <span>Alerta: {lowStockCount} productos con stock bajo</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[#F9F8F6] text-base">notifications</span>
        <span>Nuevos pedidos: {ordersTodayCount} hoy</span>
      </div>
    </div>
  );
};
