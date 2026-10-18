"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileSpreadsheet,
  TrendingUp,
  Scale,
  PieChart,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  Building2,
  Sparkles,
  Printer,
  FileText,
  Boxes,
  FlaskConical,
} from "lucide-react";

function ReportsPageContent() {
  const searchParams = useSearchParams();
  type ReportType = "income" | "balance_sheet" | "mfg_cost" | "vat";
  const [activeReport, setActiveReport] = useState<ReportType>("income");
  const [dateRange, setDateRange] = useState("Q1_2026");

  useEffect(() => {
    const tabParam = searchParams.get("tab") as ReportType;
    if (tabParam && ["income", "balance_sheet", "mfg_cost", "vat"].includes(tabParam)) {
      setActiveReport(tabParam);
    }
  }, [searchParams]);

  const handleSwitchReport = (tab: ReportType) => {
    setActiveReport(tab);
    window.history.replaceState(null, "", `/reports?tab=${tab}`);
  };

  // Income Statement Numbers (EGP)
  const incomeData = {
    grossSales: 63638, // إجمالي الإيرادات
    salesDiscounts: 0,
    netSales: 63638,
    // COGS
    cogsRawMaterials: 24010,
    cogsPackaging: 11400,
    cogsDirectLabor: 1500,
    cogsMOH: 2000,
    totalCogs: 38910,
    grossProfit: 24728, // 63638 - 38910 (38.8% هامش مجمل ربح)
    grossMarginPercent: "38.8%",
    // Operating Expenses
    sellingExpenses: 40, // عمولة بوابات وشحن
    marketingExpenses: 2500, // إعلانات سوشيال ميديا
    generalAdminExpenses: 4500, // إيجار ومصاريف إدارية
    totalOpEx: 7040,
    // Other
    abnormalSpoilageLoss: 389.20, // خسائر زجاجة مكسورة بالتعبئة (5201)
    netProfitBeforeTax: 17298.80, // 24728 - 7040 - 389.20
  };

  // Balance Sheet Numbers (EGP)
  const balanceSheetData = {
    currentAssets: {
      cashAndBanks: 395000, // بنك CIB + الصندوق
      tradeReceivables: 82500, // عملاء جملة
      gatewayClearings: 3477, // باي موب + بوسطة معلق
      rawFragranceOils: 127500, // مخزون زيوت
      rawSolvents: 35000, // مخزون كحول ومثبتات
      packagingSupplies: 84000, // زجاجات وبخاخات وعلب
      wipMaceration: 125830, // تحت التشغيل والتعتيق بخزانات 316L
      finishedPerfumes: 177800, // عطور تامة بالمخزن
      prepaidExpenses: 15000,
      totalCurrentAssets: 1046107,
    },
    fixedAssets: {
      macerationTanks: 250000, // خزانات ستانلس ستيل
      crimpingPackagingMachines: 320000, // ماكينات كبس وتعبئة إيطالية
      furnitureAndFitout: 110000,
      totalFixedAssets: 680000,
    },
    totalAssets: 1726107,
    currentLiabilities: {
      tradePayables: 145000, // موردين زيوت وزجاجات
      vatPayable: 8638, // مصلحة الضرائب - ضريبة 14%
      whtPayable: 600, // خصم منبع
      accruedExpenses: 25000,
      totalCurrentLiabilities: 179238,
    },
    equity: {
      paidInCapital: 1500000, // رأس المال المدفوع
      retainedEarnings: 29570.20,
      currentPeriodProfit: 17298.80,
      totalEquity: 1546869,
    },
    totalLiabilitiesAndEquity: 1726107,
  };

  return (
    <div className="space-y-6">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & BREADCRUMBS                                               */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5 font-medium">
            <span>الرئيسية</span>
            <span>/</span>
            <span className="text-blue-700 font-bold">التقارير المالية والختامية</span>
          </nav>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center border border-cyan-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                القوائم المالية والختامية لمصنع العطور
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                قائمة الدخل الصناعية، الميزانية العمومية، تكلفة الإنتاج التام، وإقرار ضريبة القيمة المضافة 14%
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>طباعة القوائم</span>
          </button>
          
          <button
            onClick={() => alert("جاري تصدير التقارير المالية بصيغة Excel...")}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تصدير Excel رسمي</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SUB-TABS NAVIGATION                                                    */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        
        <div className="border-b border-slate-200 px-4 flex items-center gap-6 overflow-x-auto">
          <button
            onClick={() => handleSwitchReport("income")}
            className={`py-3.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeReport === "income"
                ? "border-cyan-700 text-cyan-700 font-extrabold"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>قائمة الدخل الصناعية (Income Statement)</span>
          </button>

          <button
            onClick={() => handleSwitchReport("balance_sheet")}
            className={`py-3.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeReport === "balance_sheet"
                ? "border-cyan-700 text-cyan-700 font-extrabold"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>الميزانية العمومية والمركز المالي (Balance Sheet)</span>
          </button>

          <button
            onClick={() => handleSwitchReport("mfg_cost")}
            className={`py-3.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeReport === "mfg_cost"
                ? "border-cyan-700 text-cyan-700 font-extrabold"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>تقرير تكلفة الإنتاج التام (Manufacturing Statement)</span>
          </button>

          <button
            onClick={() => handleSwitchReport("vat")}
            className={`py-3.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeReport === "vat"
                ? "border-cyan-700 text-cyan-700 font-extrabold"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>إقرار ضريبة القيمة المضافة 14% (VAT Return)</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* REPORT 1: INCOME STATEMENT (قائمة الدخل الصناعية)                        */}
        {/* ========================================================================= */}
        {activeReport === "income" && (
          <div className="p-6 max-w-4xl mx-auto space-y-6">
            
            <div className="text-center border-b border-slate-200 pb-4">
              <span className="text-xs font-bold text-slate-400 font-mono">مصنع العطور الفاخرة - جمهورية مصر العربية</span>
              <h2 className="text-lg font-black text-slate-900 mt-1">قائمة الدخل والأرباح والخسائر الصناعية</h2>
              <span className="text-xs text-slate-500 font-medium">عن الفترة المنتهية في الربع الأول 2026 (بالجنيه المصري EGP)</span>
            </div>

            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4 text-xs">
              
              {/* Revenues */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center font-extrabold text-slate-900 text-sm">
                  <span>إيرادات مبيعات العطور (معرض، جملة، شوبيفاي):</span>
                  <span className="font-mono">{incomeData.grossSales.toLocaleString("ar-EG")} ج.م</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 text-[11px] pr-4">
                  <span>يخصم: الخصومات والمسموحات التجارية</span>
                  <span className="font-mono">0.00 ج.م</span>
                </div>
                <div className="flex justify-between items-center font-bold text-slate-800 border-t border-slate-200 pt-1.5">
                  <span>صافي إيرادات المبيعات:</span>
                  <span className="font-mono">{incomeData.netSales.toLocaleString("ar-EG")} ج.م</span>
                </div>
              </div>

              {/* COGS */}
              <div className="space-y-1.5 pt-3 border-t border-slate-200">
                <span className="font-extrabold text-red-900 block text-xs">
                  يخصم: تكلفة البضاعة المباعة (Cost of Goods Sold):
                </span>
                <div className="flex justify-between items-center text-slate-600 pr-4">
                  <span>• تكلفة الزيوت والكحول والمذيبات المستنفذة:</span>
                  <span className="font-mono">{incomeData.cogsRawMaterials.toLocaleString("ar-EG")} ج.م</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 pr-4">
                  <span>• تكلفة مستلزمات التعبئة (زجاجات، مضخات، علب):</span>
                  <span className="font-mono">{incomeData.cogsPackaging.toLocaleString("ar-EG")} ج.م</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 pr-4">
                  <span>• تكلفة العمالة المباشرة لخطوط التعبئة:</span>
                  <span className="font-mono">{incomeData.cogsDirectLabor.toLocaleString("ar-EG")} ج.م</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 pr-4">
                  <span>• تكاليف صناعية غير مباشرة محملة (استهلاك ومرافق MOH):</span>
                  <span className="font-mono">{incomeData.cogsMOH.toLocaleString("ar-EG")} ج.م</span>
                </div>
                <div className="flex justify-between items-center font-bold text-red-700 border-t border-slate-200 pt-1.5">
                  <span>إجمالي تكلفة المبيعات:</span>
                  <span className="font-mono">({incomeData.totalCogs.toLocaleString("ar-EG")}) ج.م</span>
                </div>
              </div>

              {/* Gross Profit */}
              <div className="bg-emerald-50 p-3.5 rounded-lg border border-emerald-200 flex justify-between items-center font-black text-sm text-emerald-950">
                <div className="flex items-center gap-2">
                  <span>مجمل الربح الصناعي (Gross Profit):</span>
                  <span className="text-[11px] font-sans font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                    هامش {incomeData.grossMarginPercent}
                  </span>
                </div>
                <span className="font-mono text-base">{incomeData.grossProfit.toLocaleString("ar-EG")} ج.م</span>
              </div>

              {/* Operating Expenses */}
              <div className="space-y-1.5 pt-3 border-t border-slate-200">
                <span className="font-extrabold text-slate-800 block text-xs">
                  يخصم: المصروفات التشغيلية والبيعية والإدارية (OpEx):
                </span>
                <div className="flex justify-between items-center text-slate-600 pr-4">
                  <span>• عمولات بوابات الدفع الإلكتروني ومصاريف شحن بوسطة:</span>
                  <span className="font-mono">{incomeData.sellingExpenses.toLocaleString("ar-EG")} ج.م</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 pr-4">
                  <span>• مصاريف التسويق والحملات الإعلانية:</span>
                  <span className="font-mono">{incomeData.marketingExpenses.toLocaleString("ar-EG")} ج.م</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 pr-4">
                  <span>• المصروفات العمومية والإدارية (إيجار المقر ورواتب الإدارة):</span>
                  <span className="font-mono">{incomeData.generalAdminExpenses.toLocaleString("ar-EG")} ج.م</span>
                </div>
                <div className="flex justify-between items-center font-bold text-slate-700 border-t border-slate-200 pt-1.5">
                  <span>إجمالي المصروفات التشغيلية:</span>
                  <span className="font-mono">({incomeData.totalOpEx.toLocaleString("ar-EG")}) ج.م</span>
                </div>
              </div>

              {/* Spoilage Loss */}
              <div className="flex justify-between items-center text-amber-900 bg-amber-50 p-2.5 rounded border border-amber-200">
                <span>يخصم: خسائر تلف وكسر زجاجات أثناء التعبئة غير طبيعي (حـ/ 5201):</span>
                <span className="font-mono font-bold">({incomeData.abnormalSpoilageLoss.toFixed(2)}) ج.م</span>
              </div>

              {/* Net Profit */}
              <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center font-black text-base">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>صافي الربح التشغيلي قبل الضرائب:</span>
                </div>
                <span className="font-mono text-lg text-emerald-400">
                  {Math.round(incomeData.netProfitBeforeTax).toLocaleString("ar-EG")} ج.م
                </span>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* REPORT 2: BALANCE SHEET (الميزانية العمومية)                              */}
        {/* ========================================================================= */}
        {activeReport === "balance_sheet" && (
          <div className="p-6 max-w-5xl mx-auto space-y-6">
            
            <div className="text-center border-b border-slate-200 pb-4">
              <span className="text-xs font-bold text-slate-400 font-mono">مصنع العطور الفاخرة - جمهورية مصر العربية</span>
              <h2 className="text-lg font-black text-slate-900 mt-1">الميزانية العمومية وقائمة المركز المالي</h2>
              <span className="text-xs text-slate-500 font-medium">كما في 31 مارس 2026 (معدلة وفق معايير المحاسبة المصرية EAS)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              
              {/* Assets (الأصول) */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <h3 className="font-black text-slate-900 text-sm border-b border-slate-200 pb-2 flex items-center justify-between">
                  <span>الأصول (Assets)</span>
                  <span className="text-xs font-mono font-bold text-blue-700">الجانب المدين</span>
                </h3>

                {/* Current Assets */}
                <div className="space-y-1.5">
                  <span className="font-extrabold text-slate-700 block">أولاً: الأصول المتداولة:</span>
                  <div className="flex justify-between text-slate-600 pr-3">
                    <span>النقدية بالبنوك (CIB) والصندوق:</span>
                    <span className="font-mono font-bold">{balanceSheetData.currentAssets.cashAndBanks.toLocaleString("ar-EG")} ج.م</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pr-3">
                    <span>العملاء وأوراق القبض (تجاريين):</span>
                    <span className="font-mono font-bold">{balanceSheetData.currentAssets.tradeReceivables.toLocaleString("ar-EG")} ج.م</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pr-3">
                    <span>وسيط باي موب وشحن بوسطة المعلق:</span>
                    <span className="font-mono">{balanceSheetData.currentAssets.gatewayClearings.toLocaleString("ar-EG")} ج.م</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pr-3">
                    <span>مخزون الزيوت العطرية المركزة:</span>
                    <span className="font-mono">{balanceSheetData.currentAssets.rawFragranceOils.toLocaleString("ar-EG")} ج.م</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pr-3">
                    <span>مخزون الكحول والمذيبات 96%:</span>
                    <span className="font-mono">{balanceSheetData.currentAssets.rawSolvents.toLocaleString("ar-EG")} ج.م</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pr-3">
                    <span>مخزون مستلزمات التعبئة (زجاجات/علب):</span>
                    <span className="font-mono">{balanceSheetData.currentAssets.packagingSupplies.toLocaleString("ar-EG")} ج.م</span>
                  </div>
                  <div className="flex justify-between text-purple-900 font-bold pr-3 bg-purple-50 p-1.5 rounded">
                    <span>إنتاج تحت التشغيل وتعتيق (WIP Tanks):</span>
                    <span className="font-mono">{balanceSheetData.currentAssets.wipMaceration.toLocaleString("ar-EG")} ج.م</span>
                  </div>
                  <div className="flex justify-between text-emerald-900 font-bold pr-3 bg-emerald-50 p-1.5 rounded">
                    <span>مخزون عطور تامة الصنع:</span>
                    <span className="font-mono">{balanceSheetData.currentAssets.finishedPerfumes.toLocaleString("ar-EG")} ج.م</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-slate-900 border-t border-slate-200 pt-1.5">
                    <span>إجمالي الأصول المتداولة:</span>
                    <span className="font-mono">{balanceSheetData.currentAssets.totalCurrentAssets.toLocaleString("ar-EG")} ج.م</span>
                  </div>
                </div>

                {/* Fixed Assets */}
                <div className="space-y-1.5 pt-3 border-t border-slate-200">
                  <span className="font-extrabold text-slate-700 block">ثانياً: الأصول الثابتة (بالصافي):</span>
                  <div className="flex justify-between text-slate-600 pr-3">
                    <span>خزانات التعتيق الستانلس ستيل 316L:</span>
                    <span className="font-mono">{balanceSheetData.fixedAssets.macerationTanks.toLocaleString("ar-EG")} ج.م</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pr-3">
                    <span>ماكينات وخطوط كبس وتعبئة العطور:</span>
                    <span className="font-mono">{balanceSheetData.fixedAssets.crimpingPackagingMachines.toLocaleString("ar-EG")} ج.م</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pr-3">
                    <span>تجهيزات وديكورات المعرض الرئيسي:</span>
                    <span className="font-mono">{balanceSheetData.fixedAssets.furnitureAndFitout.toLocaleString("ar-EG")} ج.م</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-slate-900 border-t border-slate-200 pt-1.5">
                    <span>إجمالي الأصول الثابتة:</span>
                    <span className="font-mono">{balanceSheetData.fixedAssets.totalFixedAssets.toLocaleString("ar-EG")} ج.م</span>
                  </div>
                </div>

                {/* Total Assets */}
                <div className="bg-blue-700 text-white p-3.5 rounded-lg flex justify-between items-center font-black text-sm">
                  <span>إجمالي الأصول:</span>
                  <span className="font-mono text-base">{balanceSheetData.totalAssets.toLocaleString("ar-EG")} ج.م</span>
                </div>
              </div>

              {/* Liabilities & Equity (الالتزامات وحقوق الملكية) */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <h3 className="font-black text-slate-900 text-sm border-b border-slate-200 pb-2 flex items-center justify-between">
                  <span>الالتزامات وحقوق الملكية</span>
                  <span className="text-xs font-mono font-bold text-rose-700">الجانب الدائن</span>
                </h3>

                {/* Liabilities */}
                <div className="space-y-1.5">
                  <span className="font-extrabold text-slate-700 block">أولاً: الالتزامات المتداولة:</span>
                  <div className="flex justify-between text-slate-600 pr-3">
                    <span>الموردين التجاريين (شركات الزيوت والزجاج):</span>
                    <span className="font-mono font-bold">{balanceSheetData.currentLiabilities.tradePayables.toLocaleString("ar-EG")} ج.م</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pr-3">
                    <span>مصلحة الضرائب المصرية - ضريبة 14% VAT:</span>
                    <span className="font-mono font-bold text-rose-700">{balanceSheetData.currentLiabilities.vatPayable.toLocaleString("ar-EG")} ج.م</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pr-3">
                    <span>مصلحة الضرائب - ضريبة خصم وتحصيل 1%:</span>
                    <span className="font-mono">{balanceSheetData.currentLiabilities.whtPayable.toLocaleString("ar-EG")} ج.م</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pr-3">
                    <span>مصروفات ومستحقات تشغيلية أخرى:</span>
                    <span className="font-mono">{balanceSheetData.currentLiabilities.accruedExpenses.toLocaleString("ar-EG")} ج.م</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-slate-900 border-t border-slate-200 pt-1.5">
                    <span>إجمالي الالتزامات المتداولة:</span>
                    <span className="font-mono">{balanceSheetData.currentLiabilities.totalCurrentLiabilities.toLocaleString("ar-EG")} ج.م</span>
                  </div>
                </div>

                {/* Equity */}
                <div className="space-y-1.5 pt-3 border-t border-slate-200">
                  <span className="font-extrabold text-slate-700 block">ثانياً: حقوق الملكية:</span>
                  <div className="flex justify-between text-slate-600 pr-3">
                    <span>رأس المال المصدر والمدفوع:</span>
                    <span className="font-mono font-bold">{balanceSheetData.equity.paidInCapital.toLocaleString("ar-EG")} ج.م</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pr-3">
                    <span>الأرباح المرحلة والاحتياطيات:</span>
                    <span className="font-mono">{balanceSheetData.equity.retainedEarnings.toLocaleString("ar-EG")} ج.م</span>
                  </div>
                  <div className="flex justify-between text-emerald-900 font-bold pr-3 bg-emerald-50 p-1.5 rounded">
                    <span>أرباح الفترة الحالية (من قائمة الدخل):</span>
                    <span className="font-mono">{balanceSheetData.equity.currentPeriodProfit.toLocaleString("ar-EG")} ج.م</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-slate-900 border-t border-slate-200 pt-1.5">
                    <span>إجمالي حقوق الملكية:</span>
                    <span className="font-mono">{balanceSheetData.equity.totalEquity.toLocaleString("ar-EG")} ج.م</span>
                  </div>
                </div>

                {/* Total Liabilities & Equity */}
                <div className="bg-slate-900 text-white p-3.5 rounded-lg flex justify-between items-center font-black text-sm">
                  <span>إجمالي الالتزامات وحقوق الملكية:</span>
                  <span className="font-mono text-base">{balanceSheetData.totalLiabilitiesAndEquity.toLocaleString("ar-EG")} ج.م</span>
                </div>

                {/* Balance Verification Badge */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-emerald-900 font-extrabold">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>ميزانية متوازنة تماماً وفق المعادلة المحاسبية:</span>
                  </div>
                  <span className="font-mono text-xs">الأصول = الالتزامات + حقوق الملكية</span>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* REPORT 3: MANUFACTURING COST STATEMENT                                   */}
        {/* ========================================================================= */}
        {activeReport === "mfg_cost" && (
          <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="text-center border-b border-slate-200 pb-4">
              <h2 className="text-lg font-black text-slate-900">بيان تكلفة الإنتاج التام خلال الفترة</h2>
              <span className="text-xs text-slate-500 font-medium">متابعة مدخلات خلط العطور والتعتيق وتكلفة الزجاجة المعبأة</span>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between font-bold text-slate-700">
                <span>رصيد أول المدة - إنتاج تحت التشغيل والتعتيق (110404):</span>
                <span className="font-mono">85,000 ج.م</span>
              </div>
              <div className="flex justify-between text-slate-600 pr-3">
                <span>+ الزيوت العطرية المنصرفة من المخزن:</span>
                <span className="font-mono">48,020 ج.م</span>
              </div>
              <div className="flex justify-between text-slate-600 pr-3">
                <span>+ الكحول والمثبتات المنصرفة:</span>
                <span className="font-mono">4,500 ج.م</span>
              </div>
              <div className="flex justify-between text-slate-600 pr-3">
                <span>+ أجور عمالة مباشرة محملة:</span>
                <span className="font-mono">3,000 ج.م</span>
              </div>
              <div className="flex justify-between text-slate-600 pr-3">
                <span>+ تكاليف صناعية غير مباشرة محملة (MOH):</span>
                <span className="font-mono">4,000 ج.م</span>
              </div>
              <div className="flex justify-between font-bold text-slate-700 border-t border-slate-200 pt-2">
                <span>يخصم: رصيد آخر المدة - قيد التعتيق بالخزانات (31 مارس):</span>
                <span className="font-mono text-purple-700">(125,830) ج.م</span>
              </div>
              <div className="bg-purple-700 text-white p-3.5 rounded-lg flex justify-between items-center font-black text-sm">
                <span>تكلفة العطور المكتملة تعتيقاً والمحولة للتعبئة:</span>
                <span className="font-mono">18,690 ج.م</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* REPORT 4: VAT 14% RETURN                                                 */}
        {/* ========================================================================= */}
        {activeReport === "vat" && (
          <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="text-center border-b border-slate-200 pb-4">
              <h2 className="text-lg font-black text-slate-900">نموذج إقرار ضريبة القيمة المضافة 14% (VAT-10)</h2>
              <span className="text-xs text-slate-500 font-medium">مصلحة الضرائب المصرية - مركز كبار الممولين / مأمورية الشركات المساهمة</span>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="block text-[11px] text-slate-500 font-bold mb-1">الوعاء الضريبي لمبيعات السلع المصنعة:</span>
                  <span className="font-mono font-black text-base text-slate-900">63,638.00 ج.م</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="block text-[11px] text-rose-700 font-bold mb-1">ضريبة المخرجات المحصلة (14%):</span>
                  <span className="font-mono font-black text-base text-rose-700">8,638.00 ج.م</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 leading-relaxed">
                💡 <strong>تعليمات الفحص الضريبي:</strong> الفواتير متوافقة مع اشتراطات منظومة الفاتورة الإلكترونية المصرية ومربوطة بشجرة الحسابات بحساب <span className="font-mono font-bold">210401 ضريبة القيمة المضافة</span>.
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500 font-bold">جاري تحميل التقارير المالية...</div>}>
      <ReportsPageContent />
    </Suspense>
  );
}
