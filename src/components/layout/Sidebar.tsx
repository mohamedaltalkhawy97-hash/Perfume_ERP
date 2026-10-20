'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import {
  LayoutDashboard,
  Package,
  FlaskConical,
  ShoppingCart,
  Layers,
  FileSpreadsheet,
  Settings,
  Truck,
  Users,
  ChevronLeft,
  Target,
  CreditCard,
  Warehouse,
  Droplets,
  Scale,
  Store,
  History,
  ShieldCheck,
  Sparkles,
  Building2,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: any;
  badge?: string;
}
interface NavSection {
  title: string;
  items: NavItem[];
}

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || '';

  const isActive = (href: string): boolean => {
    const [itemPath, itemQuery] = href.split('?');
    if (pathname !== itemPath) return false;
    if (!itemQuery) {
      // For routes without tabs, active if pathname matches and no tab param OR this is root
      return !currentTab;
    }
    const itemTab = new URLSearchParams(itemQuery).get('tab');
    if (!currentTab) {
      // Default tab for each module
      const defaults: Record<string, string> = {
        '/accounting': 'chart',
        '/inventory': 'items',
        '/manufacturing': 'orders',
        '/sales': 'invoices',
        '/purchasing': 'orders',
        '/reports': 'income',
      };
      return itemTab === defaults[itemPath];
    }
    return currentTab === itemTab;
  };

  const navSections: NavSection[] = [
    {
      title: 'الرئيسية',
      items: [
        { title: 'لوحة التحكم الرئيسية', href: '/', icon: LayoutDashboard },
      ],
    },
    {
      title: 'الحسابات والمالية',
      items: [
        { title: 'شجرة الحسابات', href: '/accounting?tab=chart', icon: Layers },
        { title: 'مراكز التكلفة', href: '/accounting?tab=cost_centers', icon: Target },
        { title: 'القيود اليومية', href: '/accounting?tab=entries', icon: CreditCard },
        { title: 'الخزائن والبنوك', href: '/accounting?tab=banks', icon: Building2 },
        { title: 'ميزان المراجعة', href: '/accounting?tab=trial', icon: Scale },
      ],
    },
    {
      title: 'المشتريات والموردون',
      items: [
        { title: 'طلبيات الشراء', href: '/purchasing?tab=orders', icon: Truck },
        { title: 'دليل الموردين', href: '/purchasing?tab=suppliers', icon: Building2 },
        { title: 'مدفوعات الموردين', href: '/purchasing?tab=payments', icon: CreditCard },
        { title: 'مرتجعات المشتريات', href: '/purchasing?tab=returns', icon: FlaskConical },
      ],
    },
    {
      title: 'المخازن والتصنيع',
      items: [
        { title: 'الأصناف والخامات', href: '/inventory?tab=items', icon: Package },
        { title: 'المستودعات', href: '/inventory?tab=warehouses', icon: Warehouse },
        { title: 'دفعات التعتيق', href: '/inventory?tab=batches', icon: Droplets },
        { title: 'أوامر التشغيل', href: '/manufacturing?tab=orders', icon: FlaskConical },
        { title: 'تركيبات العطور (BOM)', href: '/manufacturing?tab=boms', icon: FileSpreadsheet },
        { title: 'صهاريج التعتيق', href: '/manufacturing?tab=tanks', icon: ShieldCheck },
      ],
    },
    {
      title: 'المبيعات والعملاء',
      items: [
        { title: 'فواتير المبيعات', href: '/sales?tab=invoices', icon: ShoppingCart },
        { title: 'نقطة البيع (POS)', href: '/sales?tab=pos', icon: Store },
        { title: 'متجر Shopify', href: '/sales?tab=shopify', icon: Sparkles },
        { title: 'دليل العملاء', href: '/sales?tab=customers', icon: Users },
      ],
    },
    {
      title: 'التقارير والنظام',
      items: [
        { title: 'قائمة الدخل', href: '/reports?tab=income', icon: FileSpreadsheet },
        { title: 'الميزانية العمومية', href: '/reports?tab=balance_sheet', icon: Scale },
        { title: 'ضريبة القيمة المضافة', href: '/reports?tab=vat', icon: Target },
        { title: 'سجل التدقيق', href: '/audit', icon: History },
        { title: 'إعدادات النظام', href: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 font-sans border-l border-slate-800 select-none" dir="rtl">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-lg shrink-0">
          ERP
        </div>
        <div>
          <h1 className="font-black text-white text-sm">Perfume ERP</h1>
          <p className="text-[10px] text-emerald-400 font-semibold">مصنع العطور • EGP 14% VAT</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-4 px-2">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-0.5">
            <h2 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest px-3 pb-1">
              {section.title}
            </h2>
            {section.items.map((item, iIdx) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={iIdx}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    active
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.title}</span>
                  </div>
                  {active && <ChevronLeft className="w-3 h-3 shrink-0" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">م</div>
          <div className="flex-1 min-w-0">
            <span className="block text-xs font-bold text-slate-200 truncate">م. محمد جمعة</span>
            <span className="block text-[10px] text-slate-400">المدير العام • مسؤول النظام</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="متصل" />
        </div>
      </div>
    </aside>
  );
}

export function Sidebar() {
  return (
    <Suspense fallback={
      <aside className="w-64 bg-slate-900 shrink-0 h-screen sticky top-0" />
    }>
      <SidebarContent />
    </Suspense>
  );
}
