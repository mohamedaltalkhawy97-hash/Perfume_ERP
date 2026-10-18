"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  FlaskConical,
  Plus,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Lock,
  Unlock,
  ShieldCheck,
  Search,
  Filter,
  BarChart3,
  Layers,
  Sparkles,
  Droplets,
  Package,
  X,
  Building2,
  Calendar,
  Scale,
  FileSpreadsheet,
} from "lucide-react";
import {
  BillOfMaterials,
  WorkOrder,
  MacerationTank,
  WorkOrderStatus,
} from "@/types/manufacturing";
import {
  initialBoms,
  initialMacerationTanks,
  initialWorkOrders,
} from "@/lib/default-manufacturing";
import {
  calculateBomStandardCost,
  evaluateMacerationLock,
  generateRawMaterialIssueEntry,
  generateWorkOrderCompletionEntry,
} from "@/lib/manufacturing-engine";

function ManufacturingPageContent() {
  const searchParams = useSearchParams();
  const [boms, setBoms] = useState<BillOfMaterials[]>(initialBoms);
  const [tanks, setTanks] = useState<MacerationTank[]>(initialMacerationTanks);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(initialWorkOrders);

  type TabType = "orders" | "boms" | "tanks" | "variance";
  const [activeTab, setActiveTab] = useState<TabType>("orders");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Sync with URL query parameters
  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabType;
    if (tabParam && ["orders", "boms", "tanks", "variance"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    const actionParam = searchParams.get("action");
    if (actionParam === "new_order") {
      setShowNewOrderModal(true);
    }
  }, [searchParams]);

  const handleSwitchTab = (tab: TabType) => {
    setActiveTab(tab);
    window.history.replaceState(null, "", `/manufacturing?tab=${tab}`);
  };

  // Modals state
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showEarlyReleaseModal, setShowEarlyReleaseModal] = useState(false);
  const [selectedOrderForRelease, setSelectedOrderForRelease] = useState<WorkOrder | null>(null);
  const [earlyReleaseManager, setEarlyReleaseManager] = useState("م. حسام الدين (مدير الإنتاج)");
  const [earlyReleaseReason, setEarlyReleaseReason] = useState("طلب توريد عاجل مع استقرار فحص الجودة المبدئي");

  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedOrderForCompletion, setSelectedOrderForCompletion] = useState<WorkOrder | null>(null);
  const [completedGoodQty, setCompletedGoodQty] = useState(100);
  const [brokenScrapQty, setBrokenScrapQty] = useState(0);

  // New Work Order Form State
  const [selectedBomId, setSelectedBomId] = useState(initialBoms[0]?.id || "");
  const [newOrderQty, setNewOrderQty] = useState(100);
  const [selectedTankId, setSelectedTankId] = useState("tank-04");

  // KPI Calculations
  const activeOrdersCount = workOrders.filter((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED").length;
  const totalMaceratingLiters = tanks
    .filter((t) => t.status === "OCCUPIED")
    .reduce((sum, t) => sum + (t.volumeLiters || 0), 0);
  const totalWipValuation = workOrders
    .filter((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED")
    .reduce((sum, o) => sum + o.actualRawMaterialCost, 0);
  const totalCompletedGoodsCount = workOrders
    .filter((o) => o.status === "COMPLETED")
    .reduce((sum, o) => sum + (o.actualCompletedQuantity || 0), 0);

  // Filtered Orders
  const filteredOrders = workOrders.filter((order) => {
    const matchesFilter = statusFilter === "ALL" || order.status === statusFilter;
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.finishedItemNameAr.includes(searchQuery) ||
      order.bomCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const statusLabels: Record<WorkOrderStatus, { label: string; color: string }> = {
    PLANNED: { label: "مخطط ومجدول", color: "bg-slate-100 text-slate-700 border-slate-200" },
    MIXING_IN_PROGRESS: { label: "جاري الخلط والوزن", color: "bg-blue-100 text-blue-800 border-blue-200" },
    MACERATING: { label: "قيد التعتيق بالخزان", color: "bg-purple-100 text-purple-800 border-purple-200" },
    QUALITY_INSPECTION: { label: "فحص الجودة والنقاء", color: "bg-amber-100 text-amber-800 border-amber-200" },
    READY_FOR_BOTTLING: { label: "جاهز للتعبئة الفورية", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    BOTTLING: { label: "جاري التعبئة والكبس", color: "bg-teal-100 text-teal-800 border-teal-200" },
    COMPLETED: { label: "مكتمل ومرحل للمخزن", color: "bg-emerald-50 text-emerald-700 border-emerald-300" },
    CANCELLED: { label: "ملغي", color: "bg-red-100 text-red-800 border-red-200" },
  };

  // Handler: Create New Work Order
  const handleCreateWorkOrder = () => {
    const bom = boms.find((b) => b.id === selectedBomId);
    if (!bom) return;

    const multiplier = newOrderQty / bom.batchSizeStandard;
    const stdCost = calculateBomStandardCost(bom);
    const newOrderNumber = `WO-2026-${String(workOrders.length + 1).padStart(3, "0")}`;

    const newOrder: WorkOrder = {
      id: `wo-${Date.now()}`,
      orderNumber: newOrderNumber,
      bomId: bom.id,
      bomCode: bom.bomCode,
      finishedItemId: bom.finishedItemId,
      finishedItemSku: bom.finishedItemSku,
      finishedItemNameAr: bom.finishedItemNameAr,
      targetQuantity: newOrderQty,
      costCenterId: bom.costCenterId,
      costCenterNameAr: bom.costCenterNameAr,
      status: "MACERATING",
      assignedTankId: selectedTankId,
      assignedTankNumber: tanks.find((t) => t.id === selectedTankId)?.tankNumber || "TANK-SS-04",
      startDate: new Date().toISOString().split("T")[0],
      macerationStartDate: new Date().toISOString().split("T")[0],
      macerationTargetEndDate: new Date(Date.now() + bom.macerationDaysRequired * 86400000).toISOString().split("T")[0],
      standardTotalCost: stdCost.totalStandardCost * multiplier,
      actualRawMaterialCost: stdCost.rawMaterialCostPerUnit * newOrderQty,
      actualPackagingCost: stdCost.packagingCostPerUnit * newOrderQty,
      actualDirectLaborCost: stdCost.laborPerUnit * newOrderQty,
      actualOverheadCost: stdCost.overheadPerUnit * newOrderQty,
      totalActualCost: stdCost.unitStandardCost * newOrderQty,
      unitActualCost: stdCost.unitStandardCost,
      costVariance: 0,
      supervisorName: "م. حسام الدين (مدير الإنتاج)",
      notes: `أمر تشغيل جديد - تركيبة ${bom.bomNameAr}`,
    };

    // Update tank status
    setTanks(
      tanks.map((t) =>
        t.id === selectedTankId
          ? {
              ...t,
              status: "OCCUPIED",
              currentWorkOrderId: newOrder.id,
              currentOrderNumber: newOrder.orderNumber,
              currentPerfumeName: `${bom.finishedItemNameAr} (${newOrderQty} زجاجة)`,
              volumeLiters: Math.round((newOrderQty * 100) / 1000),
              daysRemaining: bom.macerationDaysRequired,
            }
          : t
      )
    );

    setWorkOrders([newOrder, ...workOrders]);
    setShowNewOrderModal(false);
    alert(`✅ تم إصدار أمر التشغيل [${newOrderNumber}] وتوجيهه إلى التعتيق بخزان ستانلس ستيل مع توليد قيد صرف الخامات آلياً.`);
  };

  // Handler: Authorize Early Release
  const handleAuthorizeRelease = () => {
    if (!selectedOrderForRelease) return;

    setWorkOrders(
      workOrders.map((o) =>
        o.id === selectedOrderForRelease.id
          ? {
              ...o,
              status: "READY_FOR_BOTTLING",
              isEarlyReleaseAuthorized: true,
              earlyReleaseAuthorizedBy: earlyReleaseManager,
              earlyReleaseReason: earlyReleaseReason,
            }
          : o
      )
    );

    setShowEarlyReleaseModal(false);
    alert(`🔓 تم تسجيل التصريح الإداري وفك قيد التعتيق لأمر [${selectedOrderForRelease.orderNumber}] بنجاح، وأصبح جاهزاً للتعبئة.`);
  };

  // Handler: Complete Bottling & Post to GL
  const handleCompleteBottling = () => {
    if (!selectedOrderForCompletion) return;

    const bom = boms.find((b) => b.id === selectedOrderForCompletion.bomId);
    if (!bom) return;

    const totalBottled = completedGoodQty + brokenScrapQty;
    const finalUnitCost = selectedOrderForCompletion.unitActualCost;

    const completionEntry = generateWorkOrderCompletionEntry({
      workOrder: selectedOrderForCompletion,
      bom,
      goodQuantity: completedGoodQty,
      brokenScrapQuantity: brokenScrapQty,
      unitFinalCost: finalUnitCost,
      actualPackagingCost: selectedOrderForCompletion.actualPackagingCost,
      actualLaborCost: selectedOrderForCompletion.actualDirectLaborCost,
      actualOverheadCost: selectedOrderForCompletion.actualOverheadCost,
    });

    const lotNumber = `LOT-${bom.finishedItemSku}-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

    setWorkOrders(
      workOrders.map((o) =>
        o.id === selectedOrderForCompletion.id
          ? {
              ...o,
              status: "COMPLETED",
              actualCompletedQuantity: completedGoodQty,
              scrapBrokenQuantity: brokenScrapQty,
              completedDate: new Date().toISOString().split("T")[0],
              createdBatchNumber: lotNumber,
              completionJournalEntryId: completionEntry.entryNumber,
              notes: `${o.notes || ""} | تم استلام ${completedGoodQty} تام الصنع، وتسجيل ${brokenScrapQty} تالف كسر بقيد ${completionEntry.entryNumber}`,
            }
          : o
      )
    );

    // Free the tank
    if (selectedOrderForCompletion.assignedTankId) {
      setTanks(
        tanks.map((t) =>
          t.id === selectedOrderForCompletion.assignedTankId
            ? {
                ...t,
                status: "EMPTY",
                currentWorkOrderId: undefined,
                currentOrderNumber: undefined,
                currentPerfumeName: undefined,
                volumeLiters: 0,
                daysRemaining: 0,
              }
            : t
        )
      );
    }

    setShowCompletionModal(false);
    alert(
      `🎉 تم إتمام التعبئة وترحيل البضاعة التامة إلى المستودع!\n\n` +
      `• رقم التشغيلة (Batch): ${lotNumber}\n` +
      `• المستلم السليم: ${completedGoodQty} زجاجة إلى مخزن تام الصنع (110405)\n` +
      `• التالف المكسور: ${brokenScrapQty} زجاجة تم تحميلها على حساب خسائر التلف (5201)\n` +
      `• رقم قيد اليومية الآلي المزدوج: ${completionEntry.entryNumber}`
    );
  };

  return (
    <div className="space-y-6">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & ACTION BUTTONS (Daftra Style)                            */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5 font-medium">
            <span>الرئيسية</span>
            <span>/</span>
            <span className="text-blue-700 font-bold">التصنيع وتكاليف الإنتاج والتعتيق</span>
          </nav>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                إدارة التصنيع، حوكمة التعتيق، والتكاليف الصناعية
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                متابعة أوامر التشغيل، وصفات العطور (BOM)، حظر التعبئة قبل اكتمال التعتيق، والقيود المحاسبية الآلية المزدوجة
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("boms")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-purple-700" />
            <span>وصفات العطور (BOM)</span>
          </button>
          
          <button
            onClick={() => setShowNewOrderModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إصدار أمر تشغيل جديد</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DAFTRA 4 SUMMARY KPI CARDS                                            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Active Work Orders */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">أوامر التشغيل النشطة</span>
            <span className="text-2xl font-black text-slate-900 font-mono">
              {activeOrdersCount}
            </span>
            <span className="text-[11px] text-purple-700 font-medium block mt-1 flex items-center gap-1">
              <Play className="w-3 h-3" />
              <span>قيد المزج أو التعتيق</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
            <FlaskConical className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Macerating Volume */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">حجم السوائل قيد التعتيق</span>
            <span className="text-2xl font-black text-slate-900 font-mono">
              {totalMaceratingLiters.toLocaleString("ar-EG")} <span className="text-xs font-sans text-slate-500 font-normal">لتر</span>
            </span>
            <span className="text-[11px] text-blue-700 font-medium block mt-1 flex items-center gap-1">
              <Droplets className="w-3 h-3" />
              <span>في خزانات الستانلس ستيل</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
            <Droplets className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: WIP Valuation */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">رأس المال في التشغيل (WIP)</span>
            <span className="text-2xl font-black text-emerald-700 font-mono">
              {Math.round(totalWipValuation).toLocaleString("ar-EG")} <span className="text-xs font-sans text-slate-500 font-normal">ج.م</span>
            </span>
            <span className="text-[11px] text-slate-500 font-medium block mt-1">
              حـ/ 110404 إنتاج تحت التشغيل
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <Scale className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: Completed Goods */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">الإنتاج التام المعتمد</span>
            <span className="text-2xl font-black text-slate-900 font-mono">
              {totalCompletedGoodsCount.toLocaleString("ar-EG")} <span className="text-xs font-sans text-slate-500 font-normal">زجاجة</span>
            </span>
            <span className="text-[11px] text-emerald-700 font-medium block mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>تم ترحيله لمخزن التام</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
            <Package className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. SUB-TABS NAVIGATION                                                    */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        
        <div className="border-b border-slate-200 px-4 flex items-center gap-6 overflow-x-auto">
          <button
            onClick={() => handleSwitchTab("orders")}
            className={`py-3.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === "orders"
                ? "border-purple-700 text-purple-700"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>أوامر التشغيل والتعبئة ({workOrders.length})</span>
          </button>

          <button
            onClick={() => handleSwitchTab("boms")}
            className={`py-3.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === "boms"
                ? "border-purple-700 text-purple-700"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>وصفات وتركيبات العطور - BOM ({boms.length})</span>
          </button>

          <button
            onClick={() => handleSwitchTab("tanks")}
            className={`py-3.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === "tanks"
                ? "border-purple-700 text-purple-700"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Droplets className="w-4 h-4" />
            <span>حظيرة خزانات التعتيق ({tanks.length})</span>
          </button>

          <button
            onClick={() => handleSwitchTab("variance")}
            className={`py-3.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === "variance"
                ? "border-purple-700 text-purple-700"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>تحليل انحرافات التكاليف (Variance Analysis)</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: WORK ORDERS LIST & GOVERNANCE                                      */}
        {/* ========================================================================= */}
        {activeTab === "orders" && (
          <div className="p-4 space-y-4">
            
            {/* Filters bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="بحث برقم أمر التشغيل أو اسم العطر أو كود BOM..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs w-full focus:outline-none font-medium"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none font-bold text-slate-700"
                >
                  <option value="ALL">جميع الحالات</option>
                  <option value="MACERATING">قيد التعتيق بالخزان</option>
                  <option value="READY_FOR_BOTTLING">جاهز للتعبئة</option>
                  <option value="COMPLETED">مكتمل ومرحل</option>
                </select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="py-3 px-4 font-extrabold">رقم أمر التشغيل</th>
                    <th className="py-3 px-4 font-extrabold">المنتج والتركيبة</th>
                    <th className="py-3 px-4 font-extrabold text-center">الكمية</th>
                    <th className="py-3 px-4 font-extrabold">مركز التكلفة</th>
                    <th className="py-3 px-4 font-extrabold text-center">حالة التشغيل</th>
                    <th className="py-3 px-4 font-extrabold">حوكمة التعتيق (Maceration)</th>
                    <th className="py-3 px-4 font-extrabold text-left">التكلفة الإجمالية</th>
                    <th className="py-3 px-4 font-extrabold text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((order) => {
                    const assignedTank = tanks.find((t) => t.id === order.assignedTankId);
                    const lockStatus = evaluateMacerationLock(order, assignedTank);

                    return (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {order.orderNumber}
                          <span className="block text-[10px] text-slate-400 font-sans mt-0.5">
                            بدء: {order.startDate}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-slate-900 block">{order.finishedItemNameAr}</span>
                          <span className="text-[10px] font-mono text-purple-700 font-bold block mt-0.5">
                            {order.bomCode}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-black text-slate-900">
                          {order.targetQuantity} <span className="text-[10px] font-sans font-normal text-slate-500">زجاجة</span>
                          {order.actualCompletedQuantity !== undefined && (
                            <span className="block text-[10px] text-emerald-700 font-bold">
                              تم إنجاز: {order.actualCompletedQuantity}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          <span className="text-[11px] font-medium">{order.costCenterNameAr}</span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                              statusLabels[order.status]?.color || "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {statusLabels[order.status]?.label || order.status}
                          </span>
                        </td>

                        {/* Maceration Lock & Timer Column */}
                        <td className="py-3.5 px-4">
                          {order.status === "COMPLETED" ? (
                            <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
                              <ShieldCheck className="w-4 h-4" />
                              <span>مكتمل ومرحل بنجاح</span>
                            </div>
                          ) : lockStatus.isLocked ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-amber-800 font-bold text-[11px]">
                                <Lock className="w-3.5 h-3.5 text-amber-600" />
                                <span>محظور التعبئة (متبقي {lockStatus.daysRemaining} يوم)</span>
                              </div>
                              <span className="text-[10px] text-slate-500 block">
                                بالخزان: {order.assignedTankNumber} | حرارة 16°C
                              </span>
                            </div>
                          ) : lockStatus.statusBadge === "OVERRIDDEN" ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-blue-800 font-bold text-[11px]">
                                <Unlock className="w-3.5 h-3.5 text-blue-600" />
                                <span>مسموح بتفويض إداري</span>
                              </div>
                              <span className="text-[10px] text-blue-600 block">
                                مصرح من: {order.earlyReleaseAuthorizedBy}
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>اكتمل التعتيق 100%</span>
                              </div>
                              <span className="text-[10px] text-emerald-600 block">
                                جاهز للتعبئة والكبس الفوري
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-left font-mono font-bold text-slate-800">
                          {Math.round(order.totalActualCost).toLocaleString("ar-EG")} ج.م
                          <span className="block text-[10px] text-slate-400 font-sans">
                            {order.unitActualCost.toFixed(2)} ج.م / زجاجة
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            
                            {/* If locked, show manager unlock button */}
                            {order.status === "MACERATING" && lockStatus.isLocked && (
                              <button
                                onClick={() => {
                                  setSelectedOrderForRelease(order);
                                  setShowEarlyReleaseModal(true);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded cursor-pointer transition-colors"
                                title="تصريح استثنائي بالسحب المبكر للتعبئة"
                              >
                                <Unlock className="w-3 h-3 text-amber-600" />
                                <span>تصريح تعبئة مبكرة</span>
                              </button>
                            )}

                            {/* If ready for bottling, show Complete Bottling button */}
                            {(order.status === "READY_FOR_BOTTLING" || (!lockStatus.isLocked && order.status !== "COMPLETED")) && (
                              <button
                                onClick={() => {
                                  setSelectedOrderForCompletion(order);
                                  setCompletedGoodQty(order.targetQuantity);
                                  setBrokenScrapQty(0);
                                  setShowCompletionModal(true);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-2xs cursor-pointer transition-colors"
                              >
                                <Play className="w-3 h-3" />
                                <span>بدء التعبئة والترحيل</span>
                              </button>
                            )}

                            {order.status === "COMPLETED" && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {order.createdBatchNumber}
                              </span>
                            )}

                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: BILL OF MATERIALS (BOM) RECIPES                                   */}
        {/* ========================================================================= */}
        {activeTab === "boms" && (
          <div className="p-4 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {boms.map((bom) => {
                const costs = calculateBomStandardCost(bom);
                return (
                  <div key={bom.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                    
                    <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded">
                          {bom.bomCode}
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900 mt-1">{bom.bomNameAr}</h3>
                        <p className="text-xs text-slate-500">{bom.costCenterNameAr}</p>
                      </div>
                      <div className="text-left font-mono">
                        <span className="text-[10px] text-slate-400 block">التكلفة المعيارية للزجاجة:</span>
                        <span className="text-lg font-black text-emerald-700">{costs.unitStandardCost} ج.م</span>
                      </div>
                    </div>

                    {/* Maceration & Standard specs */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">فترة التعتيق الإلزامية:</span>
                        <strong className="text-purple-800 font-bold">{bom.macerationDaysRequired} يوماً</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">درجة الحرارة المثالية:</span>
                        <strong className="text-slate-800 font-bold">{bom.recommendedTempC} °C</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">فاقد تطاير طبيعي:</span>
                        <strong className="text-amber-700 font-bold">{bom.normalLossPercentage}%</strong>
                      </div>
                    </div>

                    {/* Recipe Components breakdown */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-extrabold text-slate-700">مكونات التركيبة ومستلزمات التعبئة:</h4>
                      <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
                        {bom.components.map((comp) => (
                          <div key={comp.id} className="px-3 py-2 flex items-center justify-between text-xs hover:bg-slate-50">
                            <div>
                              <span className="font-bold text-slate-800 block">{comp.itemNameAr}</span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {comp.phase === "MIXING_RAW" ? "مرحلة خلط الخامات" : "مستلزم تعبئة وتغليف"}
                              </span>
                            </div>
                            <div className="text-left font-mono">
                              <span className="font-bold text-slate-900">
                                {comp.quantityPerUnit} {comp.unit === "GRAM" ? "جم" : comp.unit === "ML" ? "مل" : "قطعة"}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                {(comp.quantityPerUnit * comp.standardCostPerUnit).toFixed(2)} ج.م
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Cost summary */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <span>خامات وزيوت: <strong>{costs.rawMaterialCostPerUnit} ج.م</strong></span>
                      <span>تعبئة وتغليف: <strong>{costs.packagingCostPerUnit} ج.م</strong></span>
                      <span>عمالة + مصاريف: <strong>{(costs.laborPerUnit + costs.overheadPerUnit).toFixed(2)} ج.م</strong></span>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: MACERATION TANK VAULT (حظيرة الخزانات)                             */}
        {/* ========================================================================= */}
        {activeTab === "tanks" && (
          <div className="p-4 space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-purple-900 text-xs leading-relaxed flex items-start gap-3">
              <FlaskConical className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-extrabold mb-1">حوكمة التعتيق الكيميائي (Maceration Governance):</strong>
                خزانات المصنع مصممة من الستانلس ستيل الصحي 316L المانع للأكسدة. يفرض النظام قفلاً برمجياً يمنع تعبئة أي تشغيلة قبل انتهاء مدة التعتيق المنصوص عليها في شهادة الـ BOM (28 إلى 35 يوماً) للحفاظ على ثبات الفوحان والنوتات العطرية، إلا بتصريح موقع من مدير الإنتاج.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {tanks.map((tank) => (
                <div
                  key={tank.id}
                  className={`border rounded-xl p-4 shadow-xs space-y-3 ${
                    tank.status === "OCCUPIED"
                      ? "bg-white border-purple-200 ring-1 ring-purple-100"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-slate-800">{tank.tankNumber}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        tank.status === "OCCUPIED"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {tank.status === "OCCUPIED" ? "مشغول قيد التعتيق" : "فارغ ومعقم"}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">{tank.nameAr}</h4>
                    <span className="text-[10px] text-slate-500 font-mono block">السعة: {tank.capacityLiters} لتر</span>
                  </div>

                  {tank.status === "OCCUPIED" ? (
                    <div className="space-y-2 pt-2 border-t border-purple-100 text-xs">
                      <div className="bg-purple-50/60 p-2 rounded border border-purple-100">
                        <span className="text-[10px] text-purple-700 block font-bold">التشغيلة المحتواة:</span>
                        <strong className="text-slate-900 block mt-0.5">{tank.currentPerfumeName}</strong>
                        <span className="font-mono text-[10px] text-purple-600 block mt-0.5">{tank.currentOrderNumber}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-500">درجة الحرارة:</span>
                        <span className="font-mono font-bold text-blue-700">{tank.temperatureC} °C</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">حالة التعتيق:</span>
                        {tank.daysRemaining && tank.daysRemaining > 0 ? (
                          <span className="font-bold text-amber-700">متبقي {tank.daysRemaining} يوماً</span>
                        ) : (
                          <span className="font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>مكتمل 100%</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      <span>الخزان متاح لأوامر التشغيل الجديدة</span>
                    </div>
                  )}

                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: COST VARIANCE ANALYSIS (تحليل الانحرافات)                          */}
        {/* ========================================================================= */}
        {activeTab === "variance" && (
          <div className="p-4 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">تقرير مقارنة التكاليف المعيارية بالفعلية</h3>
                  <p className="text-xs text-slate-500">تحليل انحرافات أسعار الخامات، كفاءة الاستخدام، وتالف التعبئة غير الطبيعي</p>
                </div>
                <button
                  onClick={() => alert("سيتم تصدير تقرير الانحرافات إلى ملف Excel قريباً.")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>تصدير Excel</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-extrabold">
                      <th className="py-3 px-4">أمر التشغيل</th>
                      <th className="py-3 px-4">المنتج التام</th>
                      <th className="py-3 px-4 text-left">التكلفة المعيارية (EGP)</th>
                      <th className="py-3 px-4 text-left">التكلفة الفعلية (EGP)</th>
                      <th className="py-3 px-4 text-left">صافي الانحراف (Variance)</th>
                      <th className="py-3 px-4 text-center">التالف غير الطبيعي</th>
                      <th className="py-3 px-4 text-center">أثر الإقفال المحاسبي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {workOrders.map((wo) => {
                      const variance = wo.totalActualCost - wo.standardTotalCost;
                      const isUnfavorable = variance > 0;

                      return (
                        <tr key={wo.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{wo.orderNumber}</td>
                          <td className="py-3 px-4 font-bold text-slate-800">{wo.finishedItemNameAr}</td>
                          <td className="py-3 px-4 text-left font-mono">{wo.standardTotalCost.toLocaleString("ar-EG")} ج.م</td>
                          <td className="py-3 px-4 text-left font-mono font-bold text-slate-900">
                            {wo.totalActualCost.toLocaleString("ar-EG")} ج.م
                          </td>
                          <td className="py-3 px-4 text-left font-mono font-extrabold">
                            {variance === 0 ? (
                              <span className="text-slate-400">0.00 ج.م</span>
                            ) : isUnfavorable ? (
                              <span className="text-red-600">+{variance.toLocaleString("ar-EG")} ج.م (غير ملائم)</span>
                            ) : (
                              <span className="text-emerald-600">{variance.toLocaleString("ar-EG")} ج.م (وفر ملائم)</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {wo.scrapBrokenQuantity ? (
                              <span className="text-red-700 font-bold bg-red-50 border border-red-200 px-2 py-0.5 rounded text-[10px]">
                                {wo.scrapBrokenQuantity} زجاجة مكسورة
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">لا يوجد</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-[10px] text-slate-500 font-medium">
                              {wo.status === "COMPLETED" ? "مرحل بحساب 5201 و 110405" : "قيد التشغيل 110404"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: NEW WORK ORDER (أمر تشغيل جديد)                                   */}
      {/* ========================================================================= */}
      {showNewOrderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">إصدار أمر تشغيل وتعتيق جديد</h3>
                  <p className="text-[11px] text-slate-500">خصم الخامات آلياً من المخزن وتحويلها لإنتاج تحت التشغيل</p>
                </div>
              </div>
              <button onClick={() => setShowNewOrderModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">وصفة العطر المعتمدة (BOM) *</label>
                <select
                  value={selectedBomId}
                  onChange={(e) => setSelectedBomId(e.target.value)}
                  className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                >
                  {boms.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bomCode} - {b.bomNameAr} (تعتيق {b.macerationDaysRequired} يوم)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الكمية المستهدفة (زجاجة) *</label>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={newOrderQty}
                    onChange={(e) => setNewOrderQty(parseInt(e.target.value) || 100)}
                    className="w-full h-10 text-xs font-mono font-bold border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">خزان التعتيق المخصص *</label>
                  <select
                    value={selectedTankId}
                    onChange={(e) => setSelectedTankId(e.target.value)}
                    className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                  >
                    {tanks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.tankNumber} ({t.status === "EMPTY" ? "متاح وفارغ" : "مشغول حالياً"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Automatic accounting preview */}
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 text-xs space-y-1.5">
                <span className="font-extrabold text-purple-900 block">الأثر المحاسبي المزدوج الفوري:</span>
                <p className="text-purple-800 text-[11px] leading-relaxed">
                  سيتم توليد قيد صرف الخامات تلقائياً:
                  <br />• <strong>مدين:</strong> حـ/ إنتاج تحت التشغيل - تعتيق (110404)
                  <br />• <strong>دائن:</strong> حـ/ مخزون الزيوت العطرية (110401) وحـ/ الكحول والمذيبات (110402)
                </p>
              </div>

            </div>

            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowNewOrderModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateWorkOrder}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ترحيل أمر التشغيل وقفل التعتيق</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EARLY RELEASE OVERRIDE (تصريح تعبئة مبكرة)                        */}
      {/* ========================================================================= */}
      {showEarlyReleaseModal && selectedOrderForRelease && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            
            <div className="bg-amber-50 px-6 py-4 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-amber-950">تفويض إداري: فك حظر التعبئة المبكرة</h3>
                  <p className="text-[11px] text-amber-800">أمر تشغيل: {selectedOrderForRelease.orderNumber}</p>
                </div>
              </div>
              <button onClick={() => setShowEarlyReleaseModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 leading-relaxed font-medium">
                ⚠️ <strong>تنبيه الجودة والرقابة الصناعية:</strong>
                <br />
                التشغيلة لم تكمل فترة التعتيق القانونية الكاملة. السحب المبكر للتعبئة يقع تحت المسؤولية الفنية المباشرة للإدارة ويتم قيده في سجل الحركات الرقابية.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المسؤول المفوض *</label>
                <input
                  type="text"
                  value={earlyReleaseManager}
                  onChange={(e) => setEarlyReleaseManager(e.target.value)}
                  className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">مبرر السحب المبكر للتعبئة *</label>
                <textarea
                  rows={3}
                  value={earlyReleaseReason}
                  onChange={(e) => setEarlyReleaseReason(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none font-medium"
                />
              </div>

            </div>

            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowEarlyReleaseModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                إلغاء التجاوز
              </button>
              <button
                onClick={handleAuthorizeRelease}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>اعتماد التصريح وفك الحظر</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: COMPLETE BOTTLING & RECEIVE FINISHED GOODS                       */}
      {/* ========================================================================= */}
      {showCompletionModal && selectedOrderForCompletion && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">إتمام التعبئة واستلام تام الصنع</h3>
                  <p className="text-[11px] text-slate-500">أمر تشغيل: {selectedOrderForCompletion.orderNumber} - {selectedOrderForCompletion.finishedItemNameAr}</p>
                </div>
              </div>
              <button onClick={() => setShowCompletionModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الكمية السليمة المعبأة (تام الصنع) *</label>
                  <input
                    type="number"
                    value={completedGoodQty}
                    onChange={(e) => setCompletedGoodQty(parseInt(e.target.value) || 0)}
                    className="w-full h-10 text-xs font-mono font-black text-emerald-700 border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">ترحيل لحساب تام الصنع (110405)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الكمية التالفة/المكسورة (إن وجدت)</label>
                  <input
                    type="number"
                    value={brokenScrapQty}
                    onChange={(e) => setBrokenScrapQty(parseInt(e.target.value) || 0)}
                    className="w-full h-10 text-xs font-mono font-bold text-red-600 border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">ترحيل لحساب خسائر تلف (5201)</span>
                </div>
              </div>

              {/* Cost Summary Box */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">تكلفة الزجاجة الفعلية النهائية:</span>
                  <strong className="font-mono text-slate-900">{selectedOrderForCompletion.unitActualCost.toFixed(2)} ج.م</strong>
                </div>

                <div className="flex justify-between items-center text-emerald-800 font-bold border-t border-slate-200 pt-1.5">
                  <span>إجمالي قيمة البضاعة التامة المستلمة:</span>
                  <span className="font-mono">{(completedGoodQty * selectedOrderForCompletion.unitActualCost).toLocaleString("ar-EG")} ج.م</span>
                </div>

                {brokenScrapQty > 0 && (
                  <div className="flex justify-between items-center text-red-700 font-bold border-t border-slate-200 pt-1.5">
                    <span>خسائر التلف والكسر غير الطبيعي:</span>
                    <span className="font-mono">{(brokenScrapQty * selectedOrderForCompletion.unitActualCost).toLocaleString("ar-EG")} ج.م</span>
                  </div>
                )}
              </div>

            </div>

            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCompletionModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                إلغاء
              </button>
              <button
                onClick={handleCompleteBottling}
                className="inline-flex items-center gap-1.5 px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>إتمام التعبئة وترحيل القيد المحاسبي والمخزن</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default function ManufacturingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500 font-bold">جاري تحميل بيانات التصنيع...</div>}>
      <ManufacturingPageContent />
    </Suspense>
  );
}
