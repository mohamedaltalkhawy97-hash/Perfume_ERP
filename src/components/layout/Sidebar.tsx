"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Building2, 
  LayoutDashboard, 
  Receipt, 
  Boxes, 
  FlaskConical, 
  ShoppingCart, 
  FileSpreadsheet, 
  Settings, 
  CreditCard,
  Truck,
  Users,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Package,
  Layers,
  History
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const navSections = [
    {
      label: "الرئيسية",
      items: [
        {
          title: "لوحة المعلومات",
          href: "/",
          icon: LayoutDashboard,
          iconColor: "text-emerald-600 bg-emerald-50",
        },
      ],
    },
    {
      label: "الحسابات والمالية",
      items: [
        {
          title: "دليل وشجرة الحسابات",
          href: "/accounting",
          icon: Layers,
          iconColor: "text-blue-600 bg-blue-50",
          badge: "مفعلة",
          badgeColor: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        },
        {
          title: "القيود اليومية",
          href: "/accounting?tab=entries",
          icon: Receipt,
          iconColor: "text-indigo-600 bg-indigo-50",
        },
        {
          title: "الخزائن والحسابات البنكية",
          href: "/accounting?tab=banks",
          icon: CreditCard,
          iconColor: "text-teal-600 bg-teal-50",
        },
      ],
    },
    {
      label: "المخازن والتصنيع",
      items: [
        {
          title: "المنتجات والخامات",
          href: "/inventory",
          icon: Boxes,
          iconColor: "text-amber-600 bg-amber-50",
          badge: "مفعلة",
          badgeColor: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        },
        {
          title: "أوامر التشغيل والتصنيع",
          href: "/manufacturing",
          icon: FlaskConical,
          iconColor: "text-purple-600 bg-purple-50",
          badge: "المرحلة 3",
          badgeColor: "bg-slate-100 text-slate-600",
        },
      ],
    },
    {
      label: "المبيعات والعملاء",
      items: [
        {
          title: "فواتير المبيعات",
          href: "/sales",
          icon: ShoppingCart,
          iconColor: "text-rose-600 bg-rose-50",
        },
        {
          title: "ربط متجر Shopify",
          href: "/sales?tab=shopify",
          icon: Package,
          iconColor: "text-emerald-600 bg-emerald-50",
          badge: "المرحلة 4",
          badgeColor: "bg-slate-100 text-slate-600",
        },
      ],
    },
    {
      label: "النظام والتقارير",
      items: [
        {
          title: "التقارير المالية والختامية",
          href: "/reports",
          icon: FileSpreadsheet,
          iconColor: "text-cyan-600 bg-cyan-50",
        },
        {
          title: "سجل التدقيق والأمان",
          href: "/audit",
          icon: History,
          iconColor: "text-slate-600 bg-slate-100",
        },
        {
          title: "إعدادات المصنع والضرائب",
          href: "/settings",
          icon: Settings,
          iconColor: "text-gray-600 bg-gray-100",
        },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-white text-slate-800 flex flex-col shrink-0 min-h-screen border-l border-slate-200 shadow-sm select-none">
      
      {/* Brand Header (Daftra Style) */}
      <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm">
            <Sparkles className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-900 leading-tight">
              دفترة ERP
            </h1>
            <p className="text-[11px] text-emerald-700 font-bold">
              مصنع العطور - مصر
            </p>
          </div>
        </Link>
      </div>

      {/* Branch & Fiscal Context */}
      <div className="p-3 mx-3 my-2.5 bg-emerald-50/60 rounded-lg border border-emerald-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <span className="block font-bold text-slate-800 text-[11px]">الفرع الرئيسي | القاهرة</span>
            <span className="block text-[10px] text-emerald-700 font-semibold font-mono">EGP (14% VAT)</span>
          </div>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-600 ring-4 ring-emerald-100"></span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {section.label}
            </div>

            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href.split("?")[0];

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all group ${
                    isActive
                      ? "bg-emerald-50 text-emerald-800 font-bold border-r-4 border-emerald-600 shadow-xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${item.iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span>{item.title}</span>
                  </div>

                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            م
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-xs font-bold text-slate-800 truncate">م. محمد جمعة</span>
            <span className="block text-[10px] text-slate-500 font-medium">المدير العام • مسؤول النظام</span>
          </div>
        </div>
      </div>

    </aside>
  );
}
