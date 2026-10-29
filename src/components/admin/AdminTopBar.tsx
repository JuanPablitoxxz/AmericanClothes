import React from 'react';

interface AdminTopBarProps {
  lowStockCount: number;
  criticalStockCount?: number;
  ordersTodayCount: number;
}

export const AdminTopBar: React.FC<AdminTopBarProps> = ({
  lowStockCount,
  criticalStockCount = 0,
  ordersTodayCount,
}) => {
  const hasStockNotifications = criticalStockCount > 0 || lowStockCount > 0;

  return (
    <header className="w-full bg-[#262626] border-b border-white/10 py-2.5 px-4 sm:px-8 text-[10px] sm:text-xs font-label-caps text-[#F9F8F6] tracking-[1.5px] sm:tracking-[2px] select-none">
      <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-2">
        {hasStockNotifications ? (
          <div className="flex flex-wrap items-center gap-3">
            {criticalStockCount > 0 && (
              <div className="flex items-center gap-1.5 bg-red-900/80 border border-red-400/40 text-white px-2.5 py-0.5">
                <span className="material-symbols-outlined text-red-300 text-sm">
                  error
                </span>
                <span className="font-bold">
                  Stock Crítico (0 uds): {criticalStockCount} agotado(s)
                </span>
              </div>
            )}
            {lowStockCount > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-900/60 border border-amber-400/40 text-[#e9c349] px-2.5 py-0.5">
                <span className="material-symbols-outlined text-[#e9c349] text-sm">
                  warning
                </span>
                <span>
                  Stock Bajo (≤ 3 uds): {lowStockCount} en últimas unidades
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[#999999]">
            <span className="material-symbols-outlined text-emerald-400 text-sm">
              verified
            </span>
            <span>Panel de Control • American Clothes</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#F9F8F6] text-sm sm:text-base">
            notifications
          </span>
          <span>Pedidos registrados: {ordersTodayCount}</span>
        </div>
      </div>
    </header>
  );
};


