"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Boxes, 
  Plus, 
  Search, 
  Printer, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  Calendar, 
  X, 
  Layers, 
  Warehouse as WarehouseIcon, 
  Tag, 
  Clock, 
  ArrowRight, 
  TrendingUp, 
  Sparkles, 
  ShieldCheck, 
  FileText, 
  Package, 
  ArrowUpDown,
  Filter,
  Check,
  Pencil,
  Trash2
} from "lucide-react";
import { 
  INITIAL_WAREHOUSES, 
  INITIAL_ITEMS, 
  INITIAL_BATCHES, 
  INITIAL_STOCK_TRANSACTIONS 
} from "@/lib/default-inventory";
import { 
  Warehouse, 
  Item, 
  ItemBatch, 
  StockTransaction, 
  ItemCategory, 
  ItemUnit 
} from "@/types/inventory";
import { 
  calculateMovingWeightedAverage, 
  generatePurchaseReceiptJournalEntry 
} from "@/lib/inventory-engine";

function InventoryPageContent() {
  const searchParams = useSearchParams();
  type TabType = "items" | "warehouses" | "batches" | "movements";
  const [activeTab, setActiveTab] = useState<TabType>("items");
  const [items, setItems] = useState<Item[]>(INITIAL_ITEMS);
  const [warehouses] = useState<Warehouse[]>(INITIAL_WAREHOUSES);
  const [batches, setBatches] = useState<ItemBatch[]>(INITIAL_BATCHES);
  const [transactions, setTransactions] = useState<StockTransaction[]>(INITIAL_STOCK_TRANSACTIONS);

  // Sync with URL query parameters
  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabType;
    if (tabParam && ["items", "warehouses", "batches", "movements"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    const actionParam = searchParams.get("action");
    if (actionParam === "new_grn") {
      setShowGrnModal(true);
    } else if (actionParam === "new_item") {
      openNewItemModal();
    }
  }, [searchParams]);

  const handleSwitchTab = (tab: TabType) => {
    setActiveTab(tab);
    window.history.replaceState(null, "", `/inventory?tab=${tab}`);
  };

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // ==========================================
  // MODAL 1: GOODS RECEIPT NOTE (إذن إضافة وارد مشتريات)
  // ==========================================
  const [showGrnModal, setShowGrnModal] = useState(false);
  const [grnItemId, setGrnItemId] = useState(items[0]?.id || "");
  const [grnQty, setGrnQty] = useState<number>(1000);
  const [grnUnitPrice, setGrnUnitPrice] = useState<number>(5.20);
  const [grnVendor, setGrnVendor] = useState("شركة جيفودان السويسرية");
  const [grnRefInvoice, setGrnRefInvoice] = useState("INV-2026-88");
  const [grnBatchNo, setGrnBatchNo] = useState("LOT-LAV-2026-02");
  const [grnExpiryDate, setGrnExpiryDate] = useState("2028-06-30");
  const [grnWarehouseId, setGrnWarehouseId] = useState("wh-01");

  const selectedItemForGrn = useMemo(() => {
    return items.find((i) => i.id === grnItemId) || items[0];
  }, [items, grnItemId]);

  // Live calculation of new Moving Weighted Average
  const calculatedNewAverageCost = useMemo(() => {
    if (!selectedItemForGrn) return 0;
    return calculateMovingWeightedAverage(
      selectedItemForGrn.currentStock,
      selectedItemForGrn.averageCost,
      grnQty || 0,
      grnUnitPrice || 0
    );
  }, [selectedItemForGrn, grnQty, grnUnitPrice]);

  // Save GRN and execute Moving Average update
  const handleSaveGrn = () => {
    if (!selectedItemForGrn || grnQty <= 0 || grnUnitPrice <= 0) {
      alert("يرجى إدخال كمية وسعر شراء صحيحين.");
      return;
    }

    const totalCost = Math.round(grnQty * grnUnitPrice * 100) / 100;
    const targetWh = warehouses.find((w) => w.id === grnWarehouseId);

    // 1. Update Item Stock & Average Cost
    const updatedItems = items.map((i) => {
      if (i.id === selectedItemForGrn.id) {
        return {
          ...i,
          currentStock: i.currentStock + grnQty,
          averageCost: calculatedNewAverageCost,
          lastPurchasePrice: grnUnitPrice,
        };
      }
      return i;
    });
    setItems(updatedItems);

    // 2. Add New Batch
    const newBatch: ItemBatch = {
      id: `batch-${Date.now()}`,
      itemId: selectedItemForGrn.id,
      itemSku: selectedItemForGrn.sku,
      itemNameAr: selectedItemForGrn.nameAr,
      batchNumber: grnBatchNo || `LOT-${Date.now().toString().slice(-6)}`,
      vendorName: grnVendor || "مورد معتمد",
      productionDate: new Date().toISOString().split("T")[0],
      expiryDate: grnExpiryDate || "2028-12-31",
      receivedQty: grnQty,
      availableQty: grnQty,
      unitCost: grnUnitPrice,
      warehouseId: grnWarehouseId,
      warehouseNameAr: targetWh ? targetWh.nameAr : "المستودع الرئيسي",
      status: "ACTIVE",
    };
    setBatches([newBatch, ...batches]);

    // 3. Add Stock Transaction
    const newTx: StockTransaction = {
      id: `st-${Date.now()}`,
      transactionNumber: `GRN-2026-${String(transactions.length + 1).padStart(4, "0")}`,
      date: new Date().toISOString().split("T")[0],
      type: "RECEIPT_PURCHASE",
      itemId: selectedItemForGrn.id,
      itemSku: selectedItemForGrn.sku,
      itemNameAr: selectedItemForGrn.nameAr,
      batchNumber: newBatch.batchNumber,
      targetWarehouseId: grnWarehouseId,
      targetWarehouseName: targetWh ? targetWh.nameAr : "المستودع الرئيسي",
      quantity: grnQty,
      unit: selectedItemForGrn.unit,
      unitCost: grnUnitPrice,
      totalCost,
      referenceNumber: grnRefInvoice || "أمر شراء",
      notes: `توريد واستلام مخزني برقم تشغيلة: ${newBatch.batchNumber}`,
      createdAt: new Date().toISOString(),
      createdBy: "م. محمد جمعة",
    };
    setTransactions([newTx, ...transactions]);

    setShowGrnModal(false);
    alert(`✅ تم استلام الشحنة وتحديث رصيد المخزن بنجاح!\n• متوسط التكلفة الجديد للصنف أصبح: ${calculatedNewAverageCost} ج.م`);
  };

  // ==========================================
  // MODAL 2: ADD NEW ITEM (إضافة بطاقة صنف جديدة)
  // ==========================================
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [newItemSku, setNewItemSku] = useState("");
  const [newItemNameAr, setNewItemNameAr] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<ItemCategory>("FRAGRANCE_OIL");
  const [newItemUnit, setNewItemUnit] = useState<ItemUnit>("GRAM");
  const [newItemMinStock, setNewItemMinStock] = useState<number>(100);
  const [newItemWhId, setNewItemWhId] = useState("wh-01");

  const openNewItemModal = () => {
    setNewItemSku(`ITEM-${Date.now().toString().slice(-4)}`);
    setNewItemNameAr("");
    setNewItemCategory("FRAGRANCE_OIL");
    setNewItemUnit("GRAM");
    setNewItemMinStock(100);
    setNewItemWhId("wh-01");
    setShowNewItemModal(true);
  };

  const handleSaveNewItem = () => {
    if (!newItemNameAr || !newItemSku) {
      alert("يرجى إدخال اسم وكود الصنف.");
      return;
    }

    const newItem: Item = {
      id: `item-${Date.now()}`,
      sku: newItemSku,
      barcode: `622${Date.now().toString().slice(-8)}`,
      nameAr: newItemNameAr,
      nameEn: newItemNameAr,
      category: newItemCategory,
      unit: newItemUnit,
      minStockAlert: newItemMinStock || 50,
      currentStock: 0,
      averageCost: 0,
      lastPurchasePrice: 0,
      defaultWarehouseId: newItemWhId,
      description: `صنف مضاف جديد إلى مخازن المصنع`,
    };

    setItems([...items, newItem]);
    setShowNewItemModal(false);
  };

  // ==========================================
  // EDIT & DELETE ITEM HANDLERS (تعديل وحذف الصنف)
  // ==========================================
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editItemNameAr, setEditItemNameAr] = useState("");
  const [editItemMinStock, setEditItemMinStock] = useState<number>(0);
  const [editItemBarcode, setEditItemBarcode] = useState("");
  const [editItemDesc, setEditItemDesc] = useState("");

  const handleOpenEditItem = (item: Item) => {
    setEditingItem(item);
    setEditItemNameAr(item.nameAr);
    setEditItemMinStock(item.minStockAlert);
    setEditItemBarcode(item.barcode);
    setEditItemDesc(item.description);
    setShowEditItemModal(true);
  };

  const handleSaveEditItem = () => {
    if (!editingItem || !editItemNameAr) return;
    setItems(items.map((i) => 
      i.id === editingItem.id 
        ? { 
            ...i, 
            nameAr: editItemNameAr, 
            minStockAlert: editItemMinStock, 
            barcode: editItemBarcode, 
            description: editItemDesc 
          }
        : i
    ));
    setShowEditItemModal(false);
  };

  const handleDeleteItem = (item: Item) => {
    if (item.currentStock > 0) {
      alert(`⚠️ حماية المخزون: لا يمكن حذف الصنف [${item.nameAr}] لأن له رصيد حالي بالمخزن (${item.currentStock} ${unitNames[item.unit]}).\nيجب تصفية الرصيد أو صرفه أولاً لحفظ دقة ميزان المخزون.`);
      return;
    }

    if (confirm(`هل أنت متأكد من رغبتك في حذف بطاقة الصنف [${item.nameAr}] كود: ${item.sku} نهائياً؟`)) {
      setItems(items.filter((i) => i.id !== item.id));
    }
  };

  // KPI Calculations
  const totalStockValuation = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.currentStock * item.averageCost), 0);
  }, [items]);

  const lowStockItemsCount = useMemo(() => {
    return items.filter((i) => i.currentStock <= i.minStockAlert).length;
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch = item.nameAr.includes(searchQuery) || item.sku.includes(searchQuery) || item.barcode.includes(searchQuery);
      const matchCat = categoryFilter === "ALL" || item.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [items, searchQuery, categoryFilter]);

  const categoryNames: Record<ItemCategory, string> = {
    FRAGRANCE_OIL: "زيوت عطرية مركزة",
    ALCOHOL_SOLVENT: "كحول ومذيبات ومثبتات",
    BOTTLE: "زجاجات فارغة",
    CAP_PUMP: "بخاخات وأغطية",
    PACKAGING_BOX: "علب كرتون وسلوفان",
    FINISHED_PERFUME: "عطور تامة الصنع",
  };

  const unitNames: Record<ItemUnit, string> = {
    GRAM: "جرام",
    KG: "كجم",
    ML: "مليلتر",
    LITER: "لتر",
    PIECE: "قطعة",
    BOX: "كرتونة",
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Daftra Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/" className="hover:text-emerald-700 transition-colors">الرئيسية</Link>
            <span>/</span>
            <span className="text-slate-800 font-bold">المخازن والمستودعات</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            إدارة المخازن والمستلزمات وتتبع الدفعات
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={openNewItemModal}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>+ بطاقة صنف جديدة</span>
          </button>

          <button
            onClick={() => setShowGrnModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Package className="w-4 h-4 shrink-0" />
            <span>إذن إضافة مخزن (وارد شراء)</span>
          </button>
        </div>
      </div>

      {/* Daftra Metric Strip (4 Inventory KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Valuation */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-xs font-medium text-slate-500">إجمالي القيمة الدفترية للمخزون</span>
            <span className="text-lg font-extrabold font-mono text-emerald-700 block tracking-tight">
              {Math.round(totalStockValuation).toLocaleString("ar-EG")} <span className="text-xs font-sans text-slate-500 font-normal">ج.م</span>
            </span>
            <span className="text-[10px] text-slate-400 block">بالتقييم المرجح المتحرك</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/80">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Reorder Warnings */}
        <div className={`p-4 rounded-xl border shadow-xs flex items-center justify-between ${
          lowStockItemsCount > 0 ? "bg-amber-50/70 border-amber-200" : "bg-white border-slate-200/90"
        }`}>
          <div className="space-y-1">
            <span className="block text-xs font-medium text-slate-500">تنبيهات نواقص الأصناف</span>
            <span className={`text-lg font-extrabold font-mono block tracking-tight ${
              lowStockItemsCount > 0 ? "text-amber-800" : "text-slate-800"
            }`}>
              {lowStockItemsCount} <span className="text-xs font-sans text-slate-500 font-normal">أصناف</span>
            </span>
            <span className="text-[10px] text-slate-400 block">وصلت لحد إعادة الطلب</span>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            lowStockItemsCount > 0 ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500"
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Active Batches */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-xs font-medium text-slate-500">الدفعات والتشغيلات النشطة</span>
            <span className="text-lg font-extrabold font-mono text-purple-700 block tracking-tight">
              {batches.length} <span className="text-xs font-sans text-slate-500 font-normal">تشغيلات</span>
            </span>
            <span className="text-[10px] text-slate-400 block">تتبع كامل لمصادر التوريد</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100/80">
            <Tag className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Warehouses */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-xs font-medium text-slate-500">المستودعات التخصصية</span>
            <span className="text-lg font-extrabold font-mono text-blue-700 block tracking-tight">
              {warehouses.length} <span className="text-xs font-sans text-slate-500 font-normal">مستودعات</span>
            </span>
            <span className="text-[10px] text-slate-400 block">خامات، تعبئة، تعتيق، وتام</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/80">
            <WarehouseIcon className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Daftra Sub-Navigation Tabs */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/60 px-3 pt-2.5 gap-1.5 overflow-x-auto">
          <button
            onClick={() => handleSwitchTab("items")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 border-t-2 shrink-0 cursor-pointer ${
              activeTab === "items"
                ? "bg-white text-emerald-800 border-emerald-600 shadow-xs font-extrabold"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            }`}
          >
            <Boxes className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>بطاقات الأصناف والمنتجات ({items.length})</span>
          </button>

          <button
            onClick={() => handleSwitchTab("warehouses")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 border-t-2 shrink-0 cursor-pointer ${
              activeTab === "warehouses"
                ? "bg-white text-blue-800 border-blue-600 shadow-xs font-extrabold"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            }`}
          >
            <WarehouseIcon className="w-4 h-4 text-blue-600 shrink-0" />
            <span>المستودعات والمخازن ({warehouses.length})</span>
          </button>

          <button
            onClick={() => handleSwitchTab("batches")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 border-t-2 shrink-0 cursor-pointer ${
              activeTab === "batches"
                ? "bg-white text-purple-800 border-purple-600 shadow-xs font-extrabold"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            }`}
          >
            <Tag className="w-4 h-4 text-purple-600 shrink-0" />
            <span>سجل الدفعات والتشغيلات ({batches.length})</span>
          </button>

          <button
            onClick={() => handleSwitchTab("movements")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 border-t-2 shrink-0 cursor-pointer ${
              activeTab === "movements"
                ? "bg-white text-amber-800 border-amber-600 shadow-xs font-extrabold"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            }`}
          >
            <ArrowUpDown className="w-4 h-4 text-amber-600 shrink-0" />
            <span>حركات وأذون المخزن ({transactions.length})</span>
          </button>
        </div>

        {/* ========================================== */}
        {/* TAB 1: ITEMS TABLE (الأصناف)               */}
        {/* ========================================== */}
        {activeTab === "items" && (
          <div className="p-4 space-y-4">
            
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 shrink-0" />
                <input
                  type="text"
                  placeholder="ابحث باسم الصنف، الكود SKU، أو الباركود..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-9 pl-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                <span className="text-xs text-slate-500 font-bold shrink-0 ml-1">التصنيف:</span>
                {["ALL", "FRAGRANCE_OIL", "ALCOHOL_SOLVENT", "BOTTLE", "CAP_PUMP", "PACKAGING_BOX", "FINISHED_PERFUME"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-bold whitespace-nowrap transition-colors ${
                      categoryFilter === cat
                        ? "bg-emerald-700 text-white"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {cat === "ALL" ? "الكل" : categoryNames[cat as ItemCategory]}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-28">كود الصنف (SKU)</th>
                    <th className="py-3 px-4">اسم الصنف في المخزن</th>
                    <th className="py-3 px-4 w-36">التصنيف</th>
                    <th className="py-3 px-4 w-24">الوحدة</th>
                    <th className="py-3 px-4 text-left w-32">الرصيد الحالي</th>
                    <th className="py-3 px-4 text-left w-36">متوسط التكلفة (ج.م)</th>
                    <th className="py-3 px-4 text-left w-36">إجمالي القيمة</th>
                    <th className="py-3 px-4 text-center w-24">حالة المخزون</th>
                    <th className="py-3 px-4 text-center w-24">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => {
                    const isLow = item.currentStock <= item.minStockAlert;
                    const itemValue = item.currentStock * item.averageCost;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">
                          {item.sku}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{item.nameAr}</span>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{item.nameEn}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {categoryNames[item.category]}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {unitNames[item.unit]}
                        </td>
                        <td className="py-3 px-4 text-left font-mono font-extrabold text-slate-900 text-sm">
                          {item.currentStock.toLocaleString("ar-EG")} <span className="text-[10px] font-sans text-slate-500 font-normal">{unitNames[item.unit]}</span>
                        </td>
                        <td className="py-3 px-4 text-left font-mono font-bold text-emerald-700">
                          {item.averageCost.toLocaleString("ar-EG")} ج.م
                        </td>
                        <td className="py-3 px-4 text-left font-mono font-bold text-slate-800">
                          {Math.round(itemValue).toLocaleString("ar-EG")} ج.م
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100/80 border border-amber-200 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>نواقص</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>متوفر</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditItem(item)}
                              className="p-1.5 rounded-md text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                              title={`تعديل صنف [${item.nameAr}]`}
                            >
                              <Pencil className="w-3.5 h-3.5 text-blue-600" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item)}
                              className="p-1.5 rounded-md text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                              title={`حذف صنف [${item.nameAr}]`}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </button>
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

        {/* ========================================== */}
        {/* TAB 2: WAREHOUSES (المستودعات)             */}
        {/* ========================================== */}
        {activeTab === "warehouses" && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {warehouses.map((wh) => (
                <div key={wh.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
                        <WarehouseIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm">{wh.nameAr}</h3>
                        <span className="font-mono text-xs text-blue-700 font-bold">{wh.code}</span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                      {wh.type}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>الموقع:</strong> {wh.location}
                  </p>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>أمين المستودع: <strong className="text-slate-800">{wh.managerName}</strong></span>
                    <span className="text-emerald-700 font-bold">نشط ومفعل</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 3: BATCHES (تتبع الدفعات)              */}
        {/* ========================================== */}
        {activeTab === "batches" && (
          <div className="p-4 space-y-4">
            
            <div className="bg-purple-50/70 border border-purple-200 p-3 rounded-lg text-xs text-purple-950 flex items-center gap-2.5">
              <Tag className="w-4 h-4 text-purple-700 shrink-0" />
              <span>
                <strong>سجل تتبع الدفعات (Lot / Batch Traceability):</strong> يضمن المصنع مطابقة أرقام التشغيلات بمصادر التوريد الدولية (مثل جيفودان ومان) وتتبع تواريخ الصلاحية لضمان أعلى معايير الجودة للعطور.
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-36">رقم الدفعة (Lot#)</th>
                    <th className="py-3 px-4">الصنف</th>
                    <th className="py-3 px-4">المورد / المصدر</th>
                    <th className="py-3 px-4 w-32">المستودع الحالي</th>
                    <th className="py-3 px-4 text-left w-28">الكمية المتبقية</th>
                    <th className="py-3 px-4 text-left w-28">تكلفة الوحدة</th>
                    <th className="py-3 px-4 text-center w-28">تاريخ الصلاحية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batches.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-extrabold text-purple-700">
                        {b.batchNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {b.itemNameAr}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {b.vendorName}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {b.warehouseNameAr}
                      </td>
                      <td className="py-3 px-4 text-left font-mono font-extrabold text-slate-900">
                        {b.availableQty.toLocaleString("ar-EG")}
                      </td>
                      <td className="py-3 px-4 text-left font-mono font-bold text-emerald-700">
                        {b.unitCost.toLocaleString("ar-EG")} ج.م
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-600">
                        {b.expiryDate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ========================================== */}
        {/* TAB 4: STOCK MOVEMENTS (سجل الأذون والحركات) */}
        {/* ========================================== */}
        {activeTab === "movements" && (
          <div className="p-4 space-y-4">
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-36">رقم الإذن</th>
                    <th className="py-3 px-4 w-28">التاريخ</th>
                    <th className="py-3 px-4 w-36">نوع الحركة</th>
                    <th className="py-3 px-4">الصنف</th>
                    <th className="py-3 px-4 text-left w-28">الكمية</th>
                    <th className="py-3 px-4 text-left w-28">التكلفة الإجمالية</th>
                    <th className="py-3 px-4">المستند المرجعي</th>
                    <th className="py-3 px-4">مسؤول الحركة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {tx.transactionNumber}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{tx.date}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          وارد مشتريات (GRN)
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{tx.itemNameAr}</td>
                      <td className="py-3 px-4 text-left font-mono font-bold text-slate-900">
                        {tx.quantity.toLocaleString("ar-EG")} {unitNames[tx.unit]}
                      </td>
                      <td className="py-3 px-4 text-left font-mono font-bold text-emerald-700">
                        {tx.totalCost.toLocaleString("ar-EG")} ج.م
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{tx.referenceNumber}</td>
                      <td className="py-3 px-4 text-slate-600">{tx.createdBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: GOODS RECEIPT NOTE (إذن استلام وارد مشتريات)                      */}
      {/* ========================================================================= */}
      {showGrnModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">إذن إضافة وارد مخزني جديد (GRN)</h3>
                  <p className="text-[11px] text-slate-500">تحديث كميات المخزن وحساب متوسط التكلفة المرجح تلقائياً</p>
                </div>
              </div>
              <button
                onClick={() => setShowGrnModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              
              {/* Item & Warehouse */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الصنف المستلم *</label>
                  <select
                    value={grnItemId}
                    onChange={(e) => setGrnItemId(e.target.value)}
                    className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  >
                    {items.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.sku} - {i.nameAr} ({i.currentStock} {unitNames[i.unit]} بالمخزن)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المستودع المستلم *</label>
                  <select
                    value={grnWarehouseId}
                    onChange={(e) => setGrnWarehouseId(e.target.value)}
                    className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.code} - {w.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantity & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الكمية الواردة ({unitNames[selectedItemForGrn?.unit || "GRAM"]}) *
                  </label>
                  <input
                    type="number"
                    value={grnQty || ""}
                    onChange={(e) => setGrnQty(parseFloat(e.target.value) || 0)}
                    className="w-full h-10 text-xs font-mono font-bold border border-slate-300 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">سعر شراء الوحدة في الفاتورة (ج.م) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={grnUnitPrice || ""}
                    onChange={(e) => setGrnUnitPrice(parseFloat(e.target.value) || 0)}
                    className="w-full h-10 text-xs font-mono font-bold text-emerald-700 border border-slate-300 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Vendor & Invoice */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المورد *</label>
                  <input
                    type="text"
                    value={grnVendor}
                    onChange={(e) => setGrnVendor(e.target.value)}
                    className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم فاتورة المورد / أمر الشراء *</label>
                  <input
                    type="text"
                    value={grnRefInvoice}
                    onChange={(e) => setGrnRefInvoice(e.target.value)}
                    className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Batch & Expiry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الدفعة والتشغيلة (Lot #) *</label>
                  <input
                    type="text"
                    value={grnBatchNo}
                    onChange={(e) => setGrnBatchNo(e.target.value)}
                    className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ انتهاء الصلاحية *</label>
                  <input
                    type="date"
                    value={grnExpiryDate}
                    onChange={(e) => setGrnExpiryDate(e.target.value)}
                    className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Real-time Moving Average & Costing Preview Card */}
              <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-xl space-y-2">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>معادلة المتوسط المرجح المتحرك (Moving Weighted Average):</span>
                </span>
                
                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                  <div className="bg-white p-2 rounded border border-emerald-100">
                    <span className="block text-[10px] text-slate-500">متوسط التكلفة السابق:</span>
                    <strong className="font-mono text-slate-800">{selectedItemForGrn?.averageCost} ج.م</strong>
                  </div>

                  <div className="bg-white p-2 rounded border border-emerald-100">
                    <span className="block text-[10px] text-slate-500">سعر الشراء الحالي:</span>
                    <strong className="font-mono text-blue-700">{grnUnitPrice} ج.م</strong>
                  </div>

                  <div className="bg-emerald-600 text-white p-2 rounded">
                    <span className="block text-[10px] text-emerald-100 font-bold">المتوسط الجديد المحسوب:</span>
                    <strong className="font-mono text-sm">{calculatedNewAverageCost} ج.م</strong>
                  </div>
                </div>

                <p className="text-[11px] text-emerald-800 pt-1">
                  💡 سيقوم النظام بتحديث رصيد الصنف ليصبح <strong>{(selectedItemForGrn?.currentStock || 0) + (grnQty || 0)} {unitNames[selectedItemForGrn?.unit || "GRAM"]}</strong> بالمتوسط الجديد دون المساس بالقيود السابقة.
                </p>
              </div>

            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={() => setShowGrnModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveGrn}
                className="inline-flex items-center gap-1.5 px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ترحيل الاستلام وتحديث التكلفة والمخزن</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD NEW ITEM CARD (إضافة بطاقة صنف جديدة)                         */}
      {/* ========================================================================= */}
      {showNewItemModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">إضافة بطاقة صنف جديدة للمصنع</h3>
                  <p className="text-[11px] text-slate-500">تعريف خامات، مستلزمات تعبئة، أو عطور تامة</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewItemModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">كود الصنف (SKU) *</label>
                  <input
                    type="text"
                    value={newItemSku}
                    onChange={(e) => setNewItemSku(e.target.value)}
                    className="w-full h-10 text-xs font-mono font-bold border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تصنيف الصنف *</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as ItemCategory)}
                    className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="FRAGRANCE_OIL">زيوت عطرية مركزة</option>
                    <option value="ALCOHOL_SOLVENT">كحول ومذيبات ومثبتات</option>
                    <option value="BOTTLE">زجاجات فارغة</option>
                    <option value="CAP_PUMP">بخاخات وأغطية</option>
                    <option value="PACKAGING_BOX">علب كرتون وسلوفان</option>
                    <option value="FINISHED_PERFUME">عطور تامة الصنع</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الصنف بالعربية *</label>
                <input
                  type="text"
                  placeholder="مثال: زيت خشب الصندل النقي، زجاجة 50 مل أسطوانية..."
                  value={newItemNameAr}
                  onChange={(e) => setNewItemNameAr(e.target.value)}
                  className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">وحدة القياس *</label>
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value as ItemUnit)}
                    className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="GRAM">جرام</option>
                    <option value="KG">كجم</option>
                    <option value="ML">مليلتر</option>
                    <option value="LITER">لتر</option>
                    <option value="PIECE">قطعة</option>
                    <option value="BOX">كرتونة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">حد إعادة الطلب (نواقص)</label>
                  <input
                    type="number"
                    value={newItemMinStock}
                    onChange={(e) => setNewItemMinStock(parseFloat(e.target.value) || 0)}
                    className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المستودع الافتراضي للتخزين</label>
                <select
                  value={newItemWhId}
                  onChange={(e) => setNewItemWhId(e.target.value)}
                  className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code} - {w.nameAr}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowNewItemModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveNewItem}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>حفظ بطاقة الصنف</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EDIT ITEM CARD (تعديل بطاقة صنف)                                  */}
      {/* ========================================================================= */}
      {showEditItemModal && editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">تعديل بيانات الصنف: {editingItem.sku}</h3>
                  <p className="text-[11px] text-slate-500">تعديل المسميات وحدود التنبيه والباركود</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditItemModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">كود الصنف (SKU)</label>
                  <input
                    type="text"
                    disabled
                    value={editingItem.sku}
                    className="w-full h-10 text-xs font-mono font-bold bg-slate-100 border border-slate-200 rounded-lg px-3 text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">باركود الصنف (GTIN / Barcode)</label>
                  <input
                    type="text"
                    value={editItemBarcode}
                    onChange={(e) => setEditItemBarcode(e.target.value)}
                    className="w-full h-10 text-xs font-mono font-bold border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الصنف بالعربية *</label>
                <input
                  type="text"
                  value={editItemNameAr}
                  onChange={(e) => setEditItemNameAr(e.target.value)}
                  className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">وحدة القياس</label>
                  <input
                    type="text"
                    disabled
                    value={unitNames[editingItem.unit]}
                    className="w-full h-10 text-xs font-bold bg-slate-100 border border-slate-200 rounded-lg px-3 text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">حد إعادة الطلب (نواقص)</label>
                  <input
                    type="number"
                    value={editItemMinStock}
                    onChange={(e) => setEditItemMinStock(parseFloat(e.target.value) || 0)}
                    className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات ومواصفات الصنف</label>
                <textarea
                  rows={2}
                  value={editItemDesc}
                  onChange={(e) => setEditItemDesc(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Financial Protection Notice */}
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  <span>قيد الحماية المحاسبية:</span>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  الرصيد الحالي ({editingItem.currentStock.toLocaleString("ar-EG")} {unitNames[editingItem.unit]}) ومتوسط التكلفة ({editingItem.averageCost.toLocaleString("ar-EG")} ج.م) محكومان بالقيود والأذون المخزنية، ولا يتم تعديلهما إلا عبر إذن إضافة مخزن (GRN) أو جرد دوري لضمان الدقة المالية.
                </p>
              </div>

            </div>

            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowEditItemModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveEditItem}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>حفظ التعديلات</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500 font-bold">جاري تحميل بيانات المخازن...</div>}>
      <InventoryPageContent />
    </Suspense>
  );
}
