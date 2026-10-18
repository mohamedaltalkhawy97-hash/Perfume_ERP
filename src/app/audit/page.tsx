"use client";

import React, { useState } from "react";
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  User,
  Calendar,
  Layers,
  FileText,
  DollarSign,
  Download,
  Printer,
} from "lucide-react";

interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  ipAddress: string;
  module: "ACCOUNTING" | "INVENTORY" | "MANUFACTURING" | "SALES" | "SECURITY";
  actionType: string;
  details: string;
  financialImpact?: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
}

const initialAuditLogs: AuditLog[] = [
  {
    id: "log-101",
    timestamp: "2026-03-01 14:22:15",
    userName: "م. محمد جمعة",
    userRole: "المدير العام / Chief Executive",
    ipAddress: "192.168.1.7",
    module: "ACCOUNTING",
    actionType: "ترحيل قيد يومية",
    details: "ترحيل قيد افتتاحي رقم JE-2026-0001 بإيداع رأس مال 250,000 ج.م بالبنك والخزينة",
    financialImpact: "+250,000 ج.م (مدين/دائن متوازن)",
    severity: "INFO",
  },
  {
    id: "log-102",
    timestamp: "2026-03-01 15:40:08",
    userName: "م. حسام الدين",
    userRole: "مدير الإنتاج والتصنيع",
    ipAddress: "192.168.1.12",
    module: "MANUFACTURING",
    actionType: "تصريح تعبئة مبكرة (تجاوز)",
    details: "إصدار تفويض إداري لفك حظر تعتيق أمر تشغيل WO-2026-003 لطلب توريد عاجل",
    financialImpact: "لا يوجد أثر مالي مباشر (حوكمة جودة)",
    severity: "WARNING",
  },
  {
    id: "log-103",
    timestamp: "2026-03-01 16:10:45",
    userName: "أحمد كمال",
    userRole: "أمين المستودع الرئيسي",
    ipAddress: "192.168.1.18",
    module: "INVENTORY",
    actionType: "إذن إضافة وارد مشتريات (GRN)",
    details: "استلام 1,000 جرام زيت لافندر من جيفودان السويسرية بتشغيلة LOT-LAV-2026-02 وتحديث متوسط التكلفة",
    financialImpact: "+5,200 ج.م (مخزون زيوت)",
    severity: "INFO",
  },
  {
    id: "log-104",
    timestamp: "2026-03-01 17:05:30",
    userName: "كاشير المعرض",
    userRole: "مسؤول نقطة البيع POS",
    ipAddress: "192.168.1.25",
    module: "SALES",
    actionType: "فاتورة مبيعات نقدية",
    details: "إصدار إيصال POS رقم INV-POS-002 بعدد 2 زجاجة لافندر ملكي 100 مل نقداً",
    financialImpact: "+1,938 ج.م (شامل 14% VAT)",
    severity: "INFO",
  },
  {
    id: "log-105",
    timestamp: "2026-03-01 17:30:12",
    userName: "م. محمد جمعة",
    userRole: "المدير العام",
    ipAddress: "192.168.1.7",
    module: "ACCOUNTING",
    actionType: "إضافة حساب فرعي",
    details: "إضافة حساب تحليلي جديد [مخزن مستلزمات العلب الفاخرة] برقم كود 11040302",
    financialImpact: "تحديث هيكل شجرة الحسابات",
    severity: "INFO",
  },
];

export default function AuditPage() {
  const [logs] = useState<AuditLog[]>(initialAuditLogs);
  const [moduleFilter, setModuleFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLogs = logs.filter((log) => {
    const matchesModule = moduleFilter === "ALL" || log.module === moduleFilter;
    const matchesSearch =
      log.details.includes(searchQuery) ||
      log.userName.includes(searchQuery) ||
      log.actionType.includes(searchQuery);
    return matchesModule && matchesSearch;
  });

  const moduleNames: Record<string, string> = {
    ACCOUNTING: "الحسابات العامة",
    INVENTORY: "المخازن والخامات",
    MANUFACTURING: "التصنيع والتعتيق",
    SALES: "المبيعات ونقاط البيع",
    SECURITY: "الأمان والصلاحيات",
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5 font-medium">
            <span>الرئيسية</span>
            <span>/</span>
            <span className="text-blue-700 font-bold">سجل التدقيق والأمان المالي</span>
          </nav>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-300">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                سجل التدقيق الرقابي والأمان المالي (Audit Trail)
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                تتبع غير قابل للتعديل لجميع العمليات المالية، حركات المخزن، تصاريح التعتيق، وبيانات المستخدمين وعناوين IP
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>طباعة السجل</span>
          </button>
          <button
            onClick={() => alert("جاري تصدير سجل التدقيق إلى Excel...")}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تصدير السجل الكامل</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">إجمالي الحركات الموثقة</span>
            <span className="text-2xl font-black font-mono text-slate-900">
              {logs.length} <span className="text-xs font-sans text-slate-500 font-normal">عملية</span>
            </span>
            <span className="text-[11px] text-emerald-700 font-bold block mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>مشفرة وغير قابلة للمسح</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">العمليات والقيود المالية</span>
            <span className="text-2xl font-black font-mono text-emerald-700">
              {logs.filter((l) => l.module === "ACCOUNTING" || l.module === "SALES").length}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">قيود، فواتير، وتحصيلات</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">التجاوزات الإدارية المعتمدة</span>
            <span className="text-2xl font-black font-mono text-amber-700">
              {logs.filter((l) => l.severity === "WARNING").length}
            </span>
            <span className="text-[11px] text-amber-800 font-bold block mt-1">تصاريح سحب تعتيق مبكر</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
            <Unlock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">مستوى الأمان والنزاهة</span>
            <span className="text-lg font-black text-emerald-700 block">100% مطابق</span>
            <span className="text-[11px] text-slate-400 block mt-1">صفر محاولات تلاعب</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <Lock className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* 3. Audit Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-4 space-y-4">
        
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 shrink-0" />
            <input
              type="text"
              placeholder="بحث في السجل باسم المستخدم أو نوع الحركة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-bold shrink-0 ml-1">القسم:</span>
            {["ALL", "ACCOUNTING", "INVENTORY", "MANUFACTURING", "SALES"].map((mod) => (
              <button
                key={mod}
                onClick={() => setModuleFilter(mod)}
                className={`px-3 py-1 text-xs rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  moduleFilter === mod
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {mod === "ALL" ? "الكل" : moduleNames[mod]}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-36">التاريخ والوقت</th>
                <th className="py-3 px-4">المستخدم والمنصب</th>
                <th className="py-3 px-4 w-28">عنوان IP</th>
                <th className="py-3 px-4 w-32">القسم / الموديول</th>
                <th className="py-3 px-4 w-36">نوع الحركة</th>
                <th className="py-3 px-4">تفاصيل العملية والبيان</th>
                <th className="py-3 px-4 text-left w-44">الأثر المالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-600 font-bold text-[11px]">
                    {log.timestamp}
                  </td>
                  <td className="py-3 px-4">
                    <strong className="block text-slate-900">{log.userName}</strong>
                    <span className="text-[10px] text-slate-400 block">{log.userRole}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                    {log.ipAddress}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {moduleNames[log.module]}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800">
                    {log.actionType}
                  </td>
                  <td className="py-3 px-4 text-slate-700 leading-relaxed">
                    {log.details}
                  </td>
                  <td className="py-3 px-4 text-left font-mono font-bold text-emerald-700 text-xs">
                    {log.financialImpact || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
