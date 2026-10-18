"use client";

import { usePathname } from "next/navigation";
import { 
  Search, 
  Bell, 
  Plus, 
  HelpCircle,
  Building2,
  Calendar,
  Layers,
  Receipt,
  Boxes,
  ShoppingCart
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function Header() {
  const pathname = usePathname();
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const getPageTitle = () => {
    switch (pathname) {
      case "/":
        return "لوحة المعلومات والتحليلات الرئيسية";
      case "/accounting":
        return "الحسابات العامة وشجرة الحسابات ومراكز التكلفة";
      case "/inventory":
        return "إدارة المخازن والمستودعات وتتبع الدفعات";
      case "/manufacturing":
        return "التصنيع وأوامر التشغيل وتكلفة الوجبات";
      case "/sales":
        return "المبيعات ونقاط البيع ومتجر Shopify";
      case "/reports":
        return "التقارير المالية والختامية وضريبة القيمة المضافة";
      case "/audit":
        return "سجل التدقيق والأمان والمعاملات الرقابية";
      case "/settings":
        return "إعدادات المصنع والضرائب والمستخدمين";
      default:
        return "نظام دفترة لإدارة مصنع العطور";
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      
      {/* Title & Path */}
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-sm md:text-base font-extrabold text-slate-900 tracking-tight">
            {getPageTitle()}
          </h2>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <span>مصنع العطور</span>
            <span>/</span>
            <span className="text-emerald-700 font-bold">البيئة التشغيلية المصرية (EGP)</span>
          </div>
        </div>
      </div>

      {/* Center / Left Actions (Daftra Style) */}
      <div className="flex items-center gap-3">
        
        {/* Global Search */}
        <div className="relative hidden md:block w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="بحث سريع برقم الحساب، الفاتورة، أو الصنف..."
            className="w-full pr-8 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-800"
          />
        </div>

        {/* Daftra Iconic Quick Add Button (+ أضف) */}
        <div className="relative">
          <button
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-md shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>أضف جديد</span>
          </button>

          {/* Quick Add Dropdown */}
          {showQuickAdd && (
            <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
              <Link
                href="/accounting?tab=entries&action=new_entry"
                onClick={() => setShowQuickAdd(false)}
                className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-emerald-700 font-semibold"
              >
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>قيد يومية محاسبي جديد</span>
              </Link>
              <Link
                href="/accounting?tab=cost_centers&action=new_cost_center"
                onClick={() => setShowQuickAdd(false)}
                className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-purple-700 font-semibold"
              >
                <Layers className="w-4 h-4 text-purple-600" />
                <span>إضافة مركز تكلفة جديد</span>
              </Link>
              <Link
                href="/inventory?tab=items&action=new_grn"
                onClick={() => setShowQuickAdd(false)}
                className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-blue-700 font-semibold"
              >
                <Boxes className="w-4 h-4 text-blue-600" />
                <span>إذن إضافة مخزن (توريد خامات)</span>
              </Link>
              <Link
                href="/manufacturing?tab=orders&action=new_order"
                onClick={() => setShowQuickAdd(false)}
                className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-amber-700 font-semibold"
              >
                <Plus className="w-4 h-4 text-amber-600" />
                <span>أمر تشغيل وخلط عطور جديد</span>
              </Link>
              <Link
                href="/sales?tab=invoices&action=new_invoice"
                onClick={() => setShowQuickAdd(false)}
                className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-rose-700 font-semibold"
              >
                <ShoppingCart className="w-4 h-4 text-rose-600" />
                <span>فاتورة مبيعات جديدة</span>
              </Link>
            </div>
          )}
        </div>

        {/* Currency badge */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-md">
          <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1 py-0.2 rounded font-mono font-bold">ج.م EGP</span>
        </div>

        {/* Notifications */}
        <button 
          title="التنبيهات"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-emerald-600 absolute top-1.5 left-1.5"></span>
        </button>

      </div>

    </header>
  );
}
