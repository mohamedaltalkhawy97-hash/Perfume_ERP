"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  Package,
  Layers,
  ArrowRightLeft,
  Building2,
  Wallet,
  Scale,
  X,
  CreditCard,
  Truck,
  Sparkles,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Store,
  Globe,
  Send,
} from "lucide-react";
import {
  SalesInvoice,
  Customer,
  ShopifyOrderSync,
  SalesChannel,
  PaymentMethod,
} from "@/types/sales";
import {
  initialCustomers,
  initialSalesInvoices,
  initialShopifyOrders,
} from "@/lib/default-sales";
import {
  calculateInvoiceTotals,
  generateSalesRevenueJournalEntry,
  generateCogsJournalEntry,
  generateGatewaySettlementEntry,
} from "@/lib/sales-engine";

function SalesPageContent() {
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<SalesInvoice[]>(initialSalesInvoices);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [shopifyOrders, setShopifyOrders] = useState<ShopifyOrderSync[]>(initialShopifyOrders);

  type TabType = "invoices" | "pos" | "shopify" | "customers";
  const [activeTab, setActiveTab] = useState<TabType>("invoices");
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("ALL");

  // Sync with URL query parameters
  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabType;
    if (tabParam && ["invoices", "pos", "shopify", "customers"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    const actionParam = searchParams.get("action");
    if (actionParam === "new_invoice") {
      setShowNewInvoiceModal(true);
    }
  }, [searchParams]);

  const handleSwitchTab = (tab: TabType) => {
    setActiveTab(tab);
    window.history.replaceState(null, "", `/sales?tab=${tab}`);
  };

  // Modals state
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [selectedOrderForSettlement, setSelectedOrderForSettlement] = useState<ShopifyOrderSync | null>(null);
  const [settlementFee, setSettlementFee] = useState<number>(40); // 40 ج.م عمولة بوسطة أو بوابة

  // POS State
  const [posCart, setPosCart] = useState<Array<{ id: string; nameAr: string; sku: string; price: number; cost: number; qty: number }>>([
    { id: "item-09", nameAr: "عطر لافندر ملكي 100 مل", sku: "PERF-LAV-100", price: 850, cost: 389.20, qty: 1 },
  ]);
  const [posPaidCash, setPosPaidCash] = useState<number>(1000);

  // New Invoice Form State
  const [invCustomerId, setInvCustomerId] = useState(initialCustomers[1]?.id || "");
  const [invChannel, setInvChannel] = useState<SalesChannel>("WHOLESALE");
  const [invPaymentMethod, setInvPaymentMethod] = useState<PaymentMethod>("ON_CREDIT");
  const [invItemLavenderQty, setInvItemLavenderQty] = useState(20);
  const [invItemOudQty, setInvItemOudQty] = useState(10);

  // KPI Calculations
  const totalGrossRevenue = invoices.reduce((sum, inv) => sum + inv.taxableAmount, 0);
  const totalVatCollected = invoices.reduce((sum, inv) => sum + inv.vatAmount, 0);
  const totalWholesaleReceivables = customers
    .filter((c) => c.type === "WHOLESALE")
    .reduce((sum, c) => sum + c.currentBalance, 0);
  const totalShopifySyncCount = shopifyOrders.length;

  // Filtered Invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesChannel = channelFilter === "ALL" || inv.channel === channelFilter;
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerNameAr.includes(searchQuery);
    return matchesChannel && matchesSearch;
  });

  // POS Totals
  const posSubtotal = posCart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const posVat = Math.round(posSubtotal * 0.14 * 100) / 100;
  const posTotal = posSubtotal + posVat;
  const posChange = posPaidCash >= posTotal ? Math.round((posPaidCash - posTotal) * 100) / 100 : 0;

  // Handler: POS Checkout
  const handlePosCheckout = () => {
    if (posCart.length === 0) return;

    const newInvNumber = `INV-POS-${Date.now().toString().slice(-4)}`;
    const totalCogs = posCart.reduce((sum, i) => sum + i.cost * i.qty, 0);

    const newInvoice: SalesInvoice = {
      id: `inv-pos-${Date.now()}`,
      invoiceNumber: newInvNumber,
      date: new Date().toISOString().split("T")[0],
      customerId: "cust-01",
      customerNameAr: "عميل نقدي - نقطة بيع المعرض",
      channel: "POS_SHOWROOM",
      paymentMethod: "CASH",
      paymentStatus: "PAID",
      items: posCart.map((i) => ({
        id: `pos-item-${Date.now()}-${i.id}`,
        itemId: i.id,
        sku: i.sku,
        nameAr: i.nameAr,
        quantity: i.qty,
        unitPrice: i.price,
        unitCost: i.cost,
        discountPercentage: 0,
        discountAmount: 0,
        subtotal: i.price * i.qty,
        vatRate: 0.14,
        vatAmount: (i.price * i.qty) * 0.14,
        total: (i.price * i.qty) * 1.14,
      })),
      subtotal: posSubtotal,
      discountTotal: 0,
      taxableAmount: posSubtotal,
      vatAmount: posVat,
      whtRate: 0,
      whtAmount: 0,
      netTotal: posTotal,
      totalCogs,
      costCenterId: "cc-sales-showroom",
      costCenterNameAr: "معرض المصنع - القاهرة الجديدة",
      journalEntryId: `JV-POS-${Date.now().toString().slice(-4)}`,
      cogsJournalEntryId: `JV-COGS-${Date.now().toString().slice(-4)}`,
      notes: `إيصال POS نقدي. المدفوع: ${posPaidCash} ج.م | الباقي: ${posChange} ج.م`,
      createdAt: new Date().toISOString(),
      createdBy: "كاشير المعرض",
    };

    setInvoices([newInvoice, ...invoices]);
    alert(
      `🧾 تم إصدار الفاتورة وإتمام البيع بنجاح!\n\n` +
      `• رقم الفاتورة: ${newInvNumber}\n` +
      `• الإجمالي شامل 14% ضريبة: ${posTotal} ج.م\n` +
      `• المدفوع: ${posPaidCash} ج.م | الباقي للعميل: ${posChange} ج.م\n` +
      `• تم ترحيل قيد الإيراد وقيد صرف المخزون التام آلياً.`
    );
    setPosCart([]);
  };

  // Handler: Create New Wholesale Invoice
  const handleCreateWholesaleInvoice = () => {
    const customer = customers.find((c) => c.id === invCustomerId);
    if (!customer) return;

    const items = [];
    if (invItemLavenderQty > 0) {
      items.push({
        id: `item-w-1-${Date.now()}`,
        itemId: "item-09",
        sku: "PERF-LAV-100",
        nameAr: "عطر لافندر ملكي فاخر 100 مل",
        quantity: invItemLavenderQty,
        unitPrice: customer.priceTier === "WHOLESALE_A" ? 650 : 700,
        unitCost: 389.20,
        discountPercentage: 0,
        discountAmount: 0,
        subtotal: invItemLavenderQty * (customer.priceTier === "WHOLESALE_A" ? 650 : 700),
        vatRate: 0.14,
        vatAmount: invItemLavenderQty * (customer.priceTier === "WHOLESALE_A" ? 650 : 700) * 0.14,
        total: invItemLavenderQty * (customer.priceTier === "WHOLESALE_A" ? 650 : 700) * 1.14,
      });
    }

    if (invItemOudQty > 0) {
      items.push({
        id: `item-w-2-${Date.now()}`,
        itemId: "item-10",
        sku: "PERF-OUD-050",
        nameAr: "عطر عود ملكي فاخر 50 مل",
        quantity: invItemOudQty,
        unitPrice: customer.priceTier === "WHOLESALE_A" ? 1100 : 1150,
        unitCost: 633.00,
        discountPercentage: 0,
        discountAmount: 0,
        subtotal: invItemOudQty * (customer.priceTier === "WHOLESALE_A" ? 1100 : 1150),
        vatRate: 0.14,
        vatAmount: invItemOudQty * (customer.priceTier === "WHOLESALE_A" ? 1100 : 1150) * 0.14,
        total: invItemOudQty * (customer.priceTier === "WHOLESALE_A" ? 1100 : 1150) * 1.14,
      });
    }

    const calc = calculateInvoiceTotals({
      items: items.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice })),
      isWholesale: invChannel === "WHOLESALE",
    });

    const newInvNumber = `INV-2026-${String(invoices.length + 1).padStart(3, "0")}`;
    const totalCogs = items.reduce((sum, i) => sum + i.unitCost * i.quantity, 0);

    const newInvoice: SalesInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: newInvNumber,
      date: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      customerId: customer.id,
      customerNameAr: customer.nameAr,
      channel: invChannel,
      paymentMethod: invPaymentMethod,
      paymentStatus: invPaymentMethod === "CASH" ? "PAID" : "UNPAID",
      items,
      subtotal: calc.subtotal,
      discountTotal: calc.discountTotal,
      taxableAmount: calc.taxableAmount,
      vatAmount: calc.vatAmount,
      whtRate: calc.whtRate,
      whtAmount: calc.whtAmount,
      netTotal: calc.netTotal,
      totalCogs,
      costCenterId: invChannel === "WHOLESALE" ? "cc-sales-wholesale" : "cc-sales-shopify",
      costCenterNameAr: invChannel === "WHOLESALE" ? "قناة مبيعات الجملة والتوزيع" : "متجر شوبيفاي الإلكتروني",
      journalEntryId: `JV-SALES-${Date.now().toString().slice(-4)}`,
      cogsJournalEntryId: `JV-COGS-${Date.now().toString().slice(-4)}`,
      notes: `فاتورة مبيعات معتمدة وفق المعايير والضرائب المصرية.`,
      createdAt: new Date().toISOString(),
      createdBy: "أ. ماجد فهمي (مدير المبيعات)",
    };

    // Update customer balance if credit
    if (invPaymentMethod === "ON_CREDIT") {
      setCustomers(
        customers.map((c) =>
          c.id === customer.id ? { ...c, currentBalance: c.currentBalance + calc.netTotal } : c
        )
      );
    }

    setInvoices([newInvoice, ...invoices]);
    setShowNewInvoiceModal(false);
    alert(
      `✅ تم حفظ وترحيل الفاتورة الضريبية [${newInvNumber}] بنجاح!\n\n` +
      `• الوعاء الضريبي: ${calc.taxableAmount.toLocaleString("ar-EG")} ج.م\n` +
      `• ضريبة القيمة المضافة 14%: ${calc.vatAmount.toLocaleString("ar-EG")} ج.م\n` +
      `• ضريبة الخصم من المنبع 1% WHT: ${calc.whtAmount.toLocaleString("ar-EG")} ج.م\n` +
      `• الصافي المستحق: ${calc.netTotal.toLocaleString("ar-EG")} ج.م`
    );
  };

  // Handler: Reconcile Courier / Gateway Clearing
  const handleReconcileSettlement = () => {
    if (!selectedOrderForSettlement) return;

    const clearingCode = selectedOrderForSettlement.gateway === "Bosta COD" ? "110304" : "110204";
    const clearingName = selectedOrderForSettlement.clearingAccountNameAr;
    const gross = selectedOrderForSettlement.totalAmount;
    const fee = settlementFee;

    const entry = generateGatewaySettlementEntry({
      clearingAccountCode: clearingCode,
      clearingAccountName: clearingName,
      grossAmount: gross,
      gatewayFee: fee,
      referenceNumber: selectedOrderForSettlement.shopifyOrderNumber,
    });

    setShopifyOrders(
      shopifyOrders.map((o) =>
        o.id === selectedOrderForSettlement.id
          ? {
              ...o,
              syncStatus: "RECONCILED",
              financialStatus: "PAID",
            }
          : o
      )
    );

    setShowSettlementModal(false);
    alert(
      `🏦 تم تسوية الحساب وتحويل الرصيد إلى حساب البنك CIB بنجاح!\n\n` +
      `• رقم القيد المحاسبي المزدوج: ${entry.entryNumber}\n` +
      `• المبلغ المحصل: ${gross} ج.م\n` +
      `• عمولة وسيط الدفع/الشحن: ${fee} ج.م (حـ/ 530501)\n` +
      `• الصافي المودع في CIB: ${gross - fee} ج.م (حـ/ 110201)\n` +
      `• تم إقفال حساب الوسيط المعلق بالكامل.`
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
            <span className="text-blue-700 font-bold">المبيعات، نقاط البيع، وشوبيفاي</span>
          </nav>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                إدارة المبيعات، الفواتير الضريبية، ومزامنة Shopify
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                فواتير مبيعات الجملة والتجزئة (14% VAT + 1% WHT)، كاشير POS، وتسوية وسطاء الشحن والدفع (بوسطة و Paymob)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("pos")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Store className="w-4 h-4 text-emerald-700" />
            <span>نقطة بيع سريعة (POS)</span>
          </button>
          
          <button
            onClick={() => setShowNewInvoiceModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ فاتورة مبيعات جديدة</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DAFTRA 4 SUMMARY KPI CARDS                                            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Gross Sales */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">إجمالي المبيعات (صافي)</span>
            <span className="text-2xl font-black text-slate-900 font-mono">
              {Math.round(totalGrossRevenue).toLocaleString("ar-EG")} <span className="text-xs font-sans text-slate-500 font-normal">ج.م</span>
            </span>
            <span className="text-[11px] text-emerald-700 font-medium block mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>حـ/ 410101 إيرادات المبيعات</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: VAT Collected 14% */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">ضريبة القيمة المضافة 14%</span>
            <span className="text-2xl font-black text-rose-700 font-mono">
              {Math.round(totalVatCollected).toLocaleString("ar-EG")} <span className="text-xs font-sans text-slate-500 font-normal">ج.م</span>
            </span>
            <span className="text-[11px] text-slate-500 font-medium block mt-1">
              حـ/ 210401 التزام ضريبي مصلحة الضرائب
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-100">
            <Scale className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: Wholesale Receivables */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">أرصدة العملاء الآجلة (الجملة)</span>
            <span className="text-2xl font-black text-amber-700 font-mono">
              {Math.round(totalWholesaleReceivables).toLocaleString("ar-EG")} <span className="text-xs font-sans text-slate-500 font-normal">ج.م</span>
            </span>
            <span className="text-[11px] text-amber-800 font-medium block mt-1">
              حـ/ 110301 عملاء تجاريين
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: Shopify Connected Orders */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">طلبات Shopify المتزامنة</span>
            <span className="text-2xl font-black text-slate-900 font-mono">
              {totalShopifySyncCount} <span className="text-xs font-sans text-slate-500 font-normal">طلبات</span>
            </span>
            <span className="text-[11px] text-blue-700 font-medium block mt-1 flex items-center gap-1">
              <Globe className="w-3 h-3" />
              <span>مربوطة مع Paymob و Bosta</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
            <Globe className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. SUB-TABS NAVIGATION                                                    */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        
        <div className="border-b border-slate-200 px-4 flex items-center gap-6 overflow-x-auto">
          <button
            onClick={() => handleSwitchTab("invoices")}
            className={`py-3.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === "invoices"
                ? "border-rose-700 text-rose-700 font-extrabold"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>سجل فواتير المبيعات ({invoices.length})</span>
          </button>

          <button
            onClick={() => handleSwitchTab("pos")}
            className={`py-3.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === "pos"
                ? "border-rose-700 text-rose-700 font-extrabold"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Store className="w-4 h-4" />
            <span>نقطة البيع السريعة للمعرض (POS Express)</span>
          </button>

          <button
            onClick={() => handleSwitchTab("shopify")}
            className={`py-3.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === "shopify"
                ? "border-rose-700 text-rose-700 font-extrabold"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>مزامنة Shopify وتسوية الوسطاء ({shopifyOrders.length})</span>
          </button>

          <button
            onClick={() => handleSwitchTab("customers")}
            className={`py-3.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === "customers"
                ? "border-rose-700 text-rose-700 font-extrabold"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>العملاء وأسعار الجملة ({customers.length})</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: SALES INVOICES LIST                                               */}
        {/* ========================================================================= */}
        {activeTab === "invoices" && (
          <div className="p-4 space-y-4">
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="بحث برقم الفاتورة أو اسم العميل..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs w-full focus:outline-none font-medium"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value)}
                  className="text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none font-bold text-slate-700"
                >
                  <option value="ALL">جميع القنوات</option>
                  <option value="WHOLESALE">مبيعات الجملة</option>
                  <option value="POS_SHOWROOM">نقطة بيع المعرض</option>
                  <option value="SHOPIFY_ONLINE">متجر شوبيفاي</option>
                </select>
              </div>
            </div>

            {/* Invoices Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="py-3 px-4 font-extrabold">رقم الفاتورة</th>
                    <th className="py-3 px-4 font-extrabold">التاريخ</th>
                    <th className="py-3 px-4 font-extrabold">العميل</th>
                    <th className="py-3 px-4 font-extrabold">قناة البيع</th>
                    <th className="py-3 px-4 font-extrabold text-left">الوعاء الخاضع</th>
                    <th className="py-3 px-4 font-extrabold text-left">ضريبة 14%</th>
                    <th className="py-3 px-4 font-extrabold text-left">خصم منبع 1%</th>
                    <th className="py-3 px-4 font-extrabold text-left">الصافي المستحق</th>
                    <th className="py-3 px-4 font-extrabold text-center">حالة السداد</th>
                    <th className="py-3 px-4 font-extrabold text-center">طباعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {inv.invoiceNumber}
                        <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                          {inv.journalEntryId}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-mono">
                        {inv.date}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-slate-900 block">{inv.customerNameAr}</span>
                        <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                          {inv.costCenterNameAr}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {inv.channel === "WHOLESALE" ? "جملة شركات" : inv.channel === "POS_SHOWROOM" ? "معرض تجزئة" : "متجر إلكتروني"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-left font-mono text-slate-800">
                        {inv.taxableAmount.toLocaleString("ar-EG")} ج.م
                      </td>

                      <td className="py-3.5 px-4 text-left font-mono font-bold text-rose-700">
                        +{inv.vatAmount.toLocaleString("ar-EG")} ج.م
                      </td>

                      <td className="py-3.5 px-4 text-left font-mono font-bold text-blue-700">
                        {inv.whtAmount > 0 ? `-${inv.whtAmount.toLocaleString("ar-EG")} ج.م` : "-"}
                      </td>

                      <td className="py-3.5 px-4 text-left font-mono font-black text-slate-900 text-sm">
                        {inv.netTotal.toLocaleString("ar-EG")} ج.م
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            inv.paymentStatus === "PAID"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : inv.paymentStatus === "PARTIALLY_PAID"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-red-50 text-red-800 border-red-200"
                          }`}
                        >
                          {inv.paymentStatus === "PAID" ? "مسدد بالكامل" : inv.paymentStatus === "PARTIALLY_PAID" ? "مسدد جزئياً" : "آجل غير مسدد"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => alert(`طباعة الفاتورة الضريبية الرسمية رقم [${inv.invoiceNumber}] المتوافقة مع منظومة الفاتورة الإلكترونية المصرية.`)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="طباعة الفاتورة"
                        >
                          <Printer className="w-4 h-4 text-slate-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: POS EXPRESS CHECKOUT (كاشير المعرض السريع)                         */}
        {/* ========================================================================= */}
        {activeTab === "pos" && (
          <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Products Selector Grid (2 Cols) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900">أصناف العطور المتاحة بالمعرض</h3>
                <span className="text-xs text-slate-500 font-mono">الأسعار شاملة ضريبة 14% عند الإغلاق</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Product 1 */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 hover:border-emerald-500 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400">PERF-LAV-100</span>
                      <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">عطر لافندر ملكي 100 مل</h4>
                      <p className="text-xs text-slate-500">Extrait de Parfum - تركيز 25%</p>
                    </div>
                    <div className="text-left font-mono">
                      <span className="text-base font-black text-emerald-700">850 ج.م</span>
                      <span className="text-[10px] text-slate-400 block">+ 14% ضريبة</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const exist = posCart.find((i) => i.id === "item-09");
                      if (exist) {
                        setPosCart(posCart.map((i) => i.id === "item-09" ? { ...i, qty: i.qty + 1 } : i));
                      } else {
                        setPosCart([...posCart, { id: "item-09", nameAr: "عطر لافندر ملكي 100 مل", sku: "PERF-LAV-100", price: 850, cost: 389.20, qty: 1 }]);
                      }
                    }}
                    className="w-full py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة لسلة الشراء</span>
                  </button>
                </div>

                {/* Product 2 */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 hover:border-emerald-500 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400">PERF-OUD-050</span>
                      <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">عطر عود ملكي فاخر 50 مل</h4>
                      <p className="text-xs text-slate-500">دهن عود هندي مبخر - تركيز 35%</p>
                    </div>
                    <div className="text-left font-mono">
                      <span className="text-base font-black text-emerald-700">1,350 ج.م</span>
                      <span className="text-[10px] text-slate-400 block">+ 14% ضريبة</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const exist = posCart.find((i) => i.id === "item-10");
                      if (exist) {
                        setPosCart(posCart.map((i) => i.id === "item-10" ? { ...i, qty: i.qty + 1 } : i));
                      } else {
                        setPosCart([...posCart, { id: "item-10", nameAr: "عطر عود ملكي فاخر 50 مل", sku: "PERF-OUD-050", price: 1350, cost: 633.00, qty: 1 }]);
                      }
                    }}
                    className="w-full py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة لسلة الشراء</span>
                  </button>
                </div>

              </div>
            </div>

            {/* POS Cart & Cash Checkout (1 Col) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-emerald-700" />
                  <h3 className="text-sm font-extrabold text-slate-900">سلة الإيصال النقدي</h3>
                </div>
                <button
                  onClick={() => setPosCart([])}
                  className="text-[10px] text-red-600 font-bold hover:underline"
                >
                  تفريغ السلة
                </button>
              </div>

              {/* Cart Items */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {posCart.map((item) => (
                  <div key={item.id} className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <strong className="block text-slate-900">{item.nameAr}</strong>
                      <span className="text-slate-500 font-mono text-[10px]">
                        {item.qty} × {item.price} ج.م
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <strong className="font-mono text-emerald-700">
                        {item.price * item.qty} ج.م
                      </strong>
                      <button
                        onClick={() => setPosCart(posCart.filter((i) => i.id !== item.id))}
                        className="text-slate-400 hover:text-red-600 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {posCart.length === 0 && (
                  <p className="text-center py-6 text-xs text-slate-400">
                    السلة فارغة. اختر عطوراً لإضافتها.
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-1.5 pt-3 border-t border-slate-200 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>المجموع الفرعي:</span>
                  <span className="font-mono font-bold">{posSubtotal} ج.م</span>
                </div>
                <div className="flex justify-between text-rose-700 font-bold">
                  <span>ضريبة القيمة المضافة 14%:</span>
                  <span className="font-mono">+{posVat} ج.م</span>
                </div>
                <div className="flex justify-between text-slate-900 font-black text-base border-t border-slate-200 pt-2">
                  <span>المطلوب تحصيله:</span>
                  <span className="font-mono text-emerald-700">{posTotal} ج.م</span>
                </div>
              </div>

              {/* Cash Paid & Change Calculator */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-700">
                  المبلغ المستلم نقداً من العميل:
                </label>
                <input
                  type="number"
                  value={posPaidCash}
                  onChange={(e) => setPosPaidCash(parseFloat(e.target.value) || 0)}
                  className="w-full h-10 text-sm font-mono font-black border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />

                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg flex items-center justify-between text-xs">
                  <span className="text-emerald-900 font-bold">الباقي للعميل:</span>
                  <span className="font-mono font-black text-emerald-800 text-sm">
                    {posChange} ج.م
                  </span>
                </div>
              </div>

              <button
                disabled={posCart.length === 0}
                onClick={handlePosCheckout}
                className="w-full py-3 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>إتمام التحصيل وطباعة الإيصال الفوري</span>
              </button>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SHOPIFY INTEGRATION & GATEWAY CLEARING                             */}
        {/* ========================================================================= */}
        {activeTab === "shopify" && (
          <div className="p-4 space-y-4">
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-900 text-xs leading-relaxed flex items-start gap-3">
              <Globe className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-extrabold mb-1">محور تكامل شوبيفاي مع الشحن وبوابات الدفع (Shopify Gateway Pipeline):</strong>
                عند استلام طلب من المتجر الإلكتروني، يتم قيد الإيراد وضريبة القيمة المضافة، وتوجيه الطرف المدين إلى حساب وسيط معلق (مثل <span className="font-mono font-bold">110204 وسيط باي موب</span> أو <span className="font-mono font-bold">110304 وسيط شحن بوسطة COD</span>). وعند قيام شركة الشحن أو بوابة الدفع بتحويل المبالغ لحساب المصنع في البنك التجاري الدولي (CIB)، يتم إقفال حساب الوسيط وإثبات عمولة الشحن تلقائياً.
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-extrabold">
                    <th className="py-3 px-4">رقم طلب Shopify</th>
                    <th className="py-3 px-4">تاريخ الطلب</th>
                    <th className="py-3 px-4">اسم العميل والمدينة</th>
                    <th className="py-3 px-4">تفاصيل العطور</th>
                    <th className="py-3 px-4">وسيط الدفع والشحن</th>
                    <th className="py-3 px-4 text-left">قيمة الطلب</th>
                    <th className="py-3 px-4 text-center">حالة الصرف</th>
                    <th className="py-3 px-4 text-center">حالة التسوية البنكية</th>
                    <th className="py-3 px-4 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shopifyOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        {order.shopifyOrderNumber}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {order.orderDate}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{order.customerName}</span>
                        <span className="text-[10px] text-slate-400 block">{order.shippingCity}</span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {order.itemsSummary}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 block">{order.gateway}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">{order.clearingAccountCode}</span>
                      </td>

                      <td className="py-3.5 px-4 text-left font-mono font-bold text-slate-900">
                        {order.totalAmount.toLocaleString("ar-EG")} ج.م
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {order.isInventoryDeducted ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>مخصوم من المخزن</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            جاهز للصرف
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            order.syncStatus === "RECONCILED"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-blue-50 text-blue-800 border-blue-200"
                          }`}
                        >
                          {order.syncStatus === "RECONCILED" ? "تم التحويل للبنك" : "معلق لدى الوسيط"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {order.syncStatus !== "RECONCILED" ? (
                          <button
                            onClick={() => {
                              setSelectedOrderForSettlement(order);
                              setSettlementFee(order.gateway === "Bosta COD" ? 40 : Math.round(order.totalAmount * 0.0275));
                              setShowSettlementModal(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-extrabold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded cursor-pointer transition-colors"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            <span>تسوية للبنك CIB</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {order.courierTrackingNumber || "تم الإقفال"}
                          </span>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: CUSTOMERS DIRECTORY                                               */}
        {/* ========================================================================= */}
        {activeTab === "customers" && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customers.map((cust) => (
                <div key={cust.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs text-slate-400">{cust.code}</span>
                      <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">{cust.nameAr}</h4>
                      <span className="text-xs text-slate-500 font-mono">{cust.phone}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {cust.priceTier === "WHOLESALE_A" ? "سعر جملة فئة أ" : cust.priceTier === "WHOLESALE_B" ? "سعر جملة فئة ب" : "سعر التجزئة"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">الحد الائتماني:</span>
                      <strong className="font-mono text-slate-800">
                        {cust.creditLimit > 0 ? `${cust.creditLimit.toLocaleString("ar-EG")} ج.م` : "نقدي فقط"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">الرصيد المستحق الحالي:</span>
                      <strong className="font-mono text-amber-700">
                        {cust.currentBalance.toLocaleString("ar-EG")} ج.م
                      </strong>
                    </div>
                  </div>

                  {cust.taxRegistrationNumber && (
                    <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex justify-between">
                      <span>البطاقة الضريبية:</span>
                      <span className="font-mono font-bold text-slate-700">{cust.taxRegistrationNumber}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: NEW WHOLESALE / RETAIL INVOICE                                    */}
      {/* ========================================================================= */}
      {showNewInvoiceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">إنشاء فاتورة مبيعات ضريبية</h3>
                  <p className="text-[11px] text-slate-500">حساب 14% ضريبة قيمة مضافة و 1% خصم تحصيل أرباح تجارية</p>
                </div>
              </div>
              <button onClick={() => setShowNewInvoiceModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">العميل *</label>
                <select
                  value={invCustomerId}
                  onChange={(e) => setInvCustomerId(e.target.value)}
                  className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr} ({c.type === "WHOLESALE" ? "جملة شركات" : "تجزئة"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">قناة البيع</label>
                  <select
                    value={invChannel}
                    onChange={(e) => setInvChannel(e.target.value as SalesChannel)}
                    className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                  >
                    <option value="WHOLESALE">مبيعات الجملة والتوزيع</option>
                    <option value="POS_SHOWROOM">معرض المصنع</option>
                    <option value="SHOPIFY_ONLINE">متجر شوبيفاي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">طريقة السداد</label>
                  <select
                    value={invPaymentMethod}
                    onChange={(e) => setInvPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                  >
                    <option value="ON_CREDIT">آجل على الحساب (30 يوماً)</option>
                    <option value="BANK_TRANSFER">تحويل بنكي CIB</option>
                    <option value="CASH">نقداً بالصندوق</option>
                  </select>
                </div>
              </div>

              {/* Quantities */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <span className="block text-xs font-extrabold text-slate-800">الأصناف والكميات:</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">عطر لافندر ملكي 100 مل (زجاجة)</label>
                    <input
                      type="number"
                      value={invItemLavenderQty}
                      onChange={(e) => setInvItemLavenderQty(parseInt(e.target.value) || 0)}
                      className="w-full h-9 text-xs font-mono font-bold border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">عطر عود ملكي 50 مل (زجاجة)</label>
                    <input
                      type="number"
                      value={invItemOudQty}
                      onChange={(e) => setInvItemOudQty(parseInt(e.target.value) || 0)}
                      className="w-full h-9 text-xs font-mono font-bold border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Tax Notice */}
              <div className="bg-rose-50 p-3 rounded-lg border border-rose-200 text-xs text-rose-900 space-y-1">
                <span className="font-extrabold block">الأثر الضريبي والمحاسبي المزدوج:</span>
                <p className="text-[11px] leading-relaxed">
                  سيتم توليد قيد الإيراد والضريبة وقيد صرف المخزون التام بالمتوسط المرجح المتحرك (COGS) آلياً لحفظ الدقة المالية.
                </p>
              </div>

            </div>

            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowNewInvoiceModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateWholesaleInvoice}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>حفظ وترحيل الفاتورة الضريبية</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: GATEWAY / COURIER SETTLEMENT RECONCILIATION                      */}
      {/* ========================================================================= */}
      {showSettlementModal && selectedOrderForSettlement && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            
            <div className="bg-blue-50 px-6 py-4 border-b border-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-blue-950">تسوية رصيد وسيط الشحن / الدفع للبنك</h3>
                  <p className="text-[11px] text-blue-800">طلب رقم: {selectedOrderForSettlement.shopifyOrderNumber}</p>
                </div>
              </div>
              <button onClick={() => setShowSettlementModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">حساب الوسيط المقفل:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedOrderForSettlement.clearingAccountCode} - {selectedOrderForSettlement.gateway}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">إجمالي المبلغ المحصل:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedOrderForSettlement.totalAmount.toLocaleString("ar-EG")} ج.م
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  عمولة ومصاريف الوسيط (شحن بوسطة أو بوابة دفع):
                </label>
                <input
                  type="number"
                  value={settlementFee}
                  onChange={(e) => setSettlementFee(parseFloat(e.target.value) || 0)}
                  className="w-full h-10 text-xs font-mono font-bold border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">ترحيل لحساب عمولات ومصروفات (530501)</span>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center justify-between text-xs">
                <span className="text-emerald-950 font-bold">الصافي المحول لحساب CIB (110201):</span>
                <span className="font-mono font-black text-emerald-800 text-sm">
                  {(selectedOrderForSettlement.totalAmount - settlementFee).toLocaleString("ar-EG")} ج.م
                </span>
              </div>

            </div>

            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowSettlementModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                إلغاء
              </button>
              <button
                onClick={handleReconcileSettlement}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>إتمام التسوية وترحيل قيد البنك</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default function SalesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500 font-bold">جاري تحميل بيانات المبيعات...</div>}>
      <SalesPageContent />
    </Suspense>
  );
}
