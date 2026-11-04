import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  footer: ReactNode;
  valueClass?: string;
  footerClass?: string;
}

export function StatCard({
  label,
  value,
  footer,
  valueClass = "",
  footerClass = "text-gray-500 font-mono",
}: StatCardProps) {
  return (
    <div className="w-full h-30 border border-gray-300 rounded-xl p-4 flex flex-col justify-between">
      <span className="block text-[12px] text-gray-500 font-serif">{label.toUpperCase()}</span>
      <span className={`text-3xl block font-bold font-mono ${valueClass}`}>{value}</span>
      <span className={`text-[12px] flex place-items-center ${footerClass}`}>{footer}</span>
    </div>
  );
}