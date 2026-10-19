'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Factory,
  ShoppingCart,
  BookOpen,
  FileSpreadsheet,
  Settings,
  Truck,
  Users,
  ChevronLeft,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  const navSections = [
    {
      title: 'الرئيسية والتشغيل',
      items: [
        { title: 'لوحة التحكم العامة', href: '/', icon: LayoutDashboard },
        { title: 'إدارة المخزون والمنتجات', href: '/inventory', icon: Package },
        { title: 'التصنيع والتركيبات', href: '/manufacturing', icon: Factory },
        { title: 'نقطة البيع والمبيعات', href: '/sales', icon: ShoppingCart },
      ],
    },
    {
      title: 'إدارة الشركاء والعمليات',
      items: [
        { title: 'دليل الموردين والمشتريات', href: '/suppliers', icon: Truck },
        { title: 'دليل العملاء والموزعين', href: '/customers', icon: Users },
      ],
    },
    {
      title: 'النظام المحاسبي والمالية',
      items: [
        { title: 'شجرة الحسابات والقيود', href: '/accounting', icon: BookOpen },
        { title: 'التقارير القوائم المالية', href: '/reports', icon: FileSpreadsheet },
        { title: 'إعدادات النظام', href: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 font-sans border-l border-slate-800 select-none" dir="rtl">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg">
            P
          </div>
          <div>
            <h1 className="font-bold text-white text-sm">Perfume ERP</h1>
            <p className="text-[10px] text-slate-400">نظام إدارة مصانع العطور</p>
          </div>
        </div>
      </div>

      {/* Links */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-2">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3">
              {section.title}
            </h2>
            <div className="space-y-1">
              {section.items.map((item, iIdx) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={iIdx}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </div>
                    {isActive && <ChevronLeft className="w-3.5 h-3.5" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Info */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
            م
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-xs font-bold text-slate-200 truncate">أ. محمد جمعة</span>
            <span className="block text-[10px] text-slate-400 font-medium">المدير العام</span>
          </div>
        </div>
      </div>
    </aside>
  );
}