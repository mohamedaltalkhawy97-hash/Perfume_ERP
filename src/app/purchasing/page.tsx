'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Truck, Plus, X, Search, CheckCircle2, AlertCircle, Clock, AlertTriangle,
  FileText, Wallet, ChevronDown, ChevronRight, Building2,
  CreditCard, RotateCcw, Eye, Printer, Check, DollarSign, Filter, Download,
} from 'lucide-react';
import { Supplier, PurchaseOrder, SupplierPayment, PurchaseOrderStatus } from '@/types/purchasing';
import { INITIAL_SUPPLIERS, INITIAL_PURCHASE_ORDERS, INITIAL_SUPPLIER_PAYMENTS } from '@/lib/default-purchasing';
import { generateSupplierAccountCode, calcSupplierAging } from '@/lib/purchasing-engine';

// ───────── تنسيق الأرقام ─────────
const fmt = (n: number) =>
  n.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ج.م';

// ───────── شارات الحالة ─────────
const STATUS_MAP: Record<PurchaseOrderStatus, { label: string; cls: string }> = {
  DRAFT:     { label: 'مسودة',          cls: 'bg-slate-100 text-slate-600' },
  SENT:      { label: 'أُرسل للمورد',   cls: 'bg-blue-50 text-blue-700' },
  PARTIAL:   { label: 'استلام جزئي',    cls: 'bg-amber-50 text-amber-700' },
  RECEIVED:  { label: 'مستلم كامل',     cls: 'bg-emerald-50 text-emerald-700' },
  CANCELLED: { label: 'ملغي',           cls: 'bg-red-50 text-red-600' },
};

const AGING_CLS: Record<string, string> = {
  '< 30 يوم': 'text-emerald-700',
  '31-60 يوم': 'text-amber-600',
  '> 60 يوم': 'text-orange-600',
  'متأخر': 'text-red-600 font-bold',
};

// ══════════════════════════════════════════════
//  المكوّن الرئيسي
// ══════════════════════════════════════════════
function PurchasingPageContent() {
  const searchParams = useSearchParams();
  type TabType = 'orders' | 'suppliers' | 'payments' | 'returns';
  const [activeTab, setActiveTab] = useState<TabType>('orders');

  const [suppliers, setSuppliers]   = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [orders, setOrders]         = useState<PurchaseOrder[]>(INITIAL_PURCHASE_ORDERS);
  const [payments, setPayments]     = useState<SupplierPayment[]>(INITIAL_SUPPLIER_PAYMENTS);

  // ─── sync URL ───
  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    if (tab && ['orders','suppliers','payments','returns'].includes(tab)) {
      setActiveTab(tab);
    }
    if (searchParams.get('action') === 'new_order')    setShowNewOrderModal(true);
    if (searchParams.get('action') === 'new_supplier') setShowNewSupplierModal(true);
    if (searchParams.get('action') === 'new_payment')  setShowNewPaymentModal(true);
  }, [searchParams]);

  const handleSwitchTab = (tab: TabType) => {
    setActiveTab(tab);
    window.history.replaceState(null, '', `/purchasing?tab=${tab}`);
  };

  // ─── search/filter ───
  const [searchQ, setSearchQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // ══════════════════════════════════════════════
  //  MODAL: طلبية شراء جديدة
  // ══════════════════════════════════════════════
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [newOrderSupplierId, setNewOrderSupplierId] = useState('');
  const [newOrderDate, setNewOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [newOrderExpected, setNewOrderExpected] = useState('');
  const [newOrderNotes, setNewOrderNotes] = useState('');
  const [newOrderItems, setNewOrderItems] = useState([
    { sku: '', nameAr: '', unit: 'قطعة', orderedQty: 1, unitPrice: 0, vatRate: 0.14 },
  ]);

  const newOrderTotals = useMemo(() => {
    const subtotal = newOrderItems.reduce((s, i) => s + i.orderedQty * i.unitPrice, 0);
    const vat = newOrderItems.reduce((s, i) => s + i.orderedQty * i.unitPrice * i.vatRate, 0);
    return { subtotal: Math.round(subtotal * 100) / 100, vat: Math.round(vat * 100) / 100, total: Math.round((subtotal + vat) * 100) / 100 };
  }, [newOrderItems]);

  const handleSaveNewOrder = () => {
    const sup = suppliers.find((s) => s.id === newOrderSupplierId);
    if (!sup || newOrderItems.some((i) => !i.nameAr || i.orderedQty <= 0 || i.unitPrice <= 0)) {
      alert('تأكد من اختيار المورد وإدخال الأصناف بشكل صحيح'); return;
    }
    const newOrder: PurchaseOrder = {
      id: `po-${Date.now()}`,
      orderNumber: `PO-2026-${String(orders.length + 1).padStart(3, '0')}`,
      supplierId: sup.id,
      supplierNameAr: sup.nameAr,
      supplierAccountCode: sup.accountCode,
      date: newOrderDate,
      expectedDelivery: newOrderExpected || undefined,
      status: 'DRAFT',
      items: newOrderItems.map((i, idx) => ({
        id: `poi-new-${idx}`,
        itemId: '',
        sku: i.sku || `SKU-${idx}`,
        nameAr: i.nameAr,
        unit: i.unit,
        orderedQty: i.orderedQty,
        receivedQty: 0,
        unitPrice: i.unitPrice,
        vatRate: i.vatRate,
        vatAmount: Math.round(i.orderedQty * i.unitPrice * i.vatRate * 100) / 100,
        subtotal: Math.round(i.orderedQty * i.unitPrice * 100) / 100,
        total: Math.round(i.orderedQty * i.unitPrice * (1 + i.vatRate) * 100) / 100,
        warehouseId: 'wh-01',
        warehouseNameAr: 'مستودع الخامات الرئيسي',
      })),
      subtotal: newOrderTotals.subtotal,
      vatTotal: newOrderTotals.vat,
      totalAmount: newOrderTotals.total,
      notes: newOrderNotes,
      createdAt: new Date().toISOString(),
      createdBy: 'م. محمد جمعة',
    };
    setOrders((prev) => [newOrder, ...prev]);
    setShowNewOrderModal(false);
    setNewOrderSupplierId(''); setNewOrderNotes('');
    setNewOrderItems([{ sku:'', nameAr:'', unit:'قطعة', orderedQty:1, unitPrice:0, vatRate:0.14 }]);
  };

  // ══════════════════════════════════════════════
  //  MODAL: مورد جديد (مع إنشاء حساب تلقائي)
  // ══════════════════════════════════════════════
  const [showNewSupplierModal, setShowNewSupplierModal] = useState(false);
  const [newSupForm, setNewSupForm] = useState({
    nameAr: '', nameEn: '', phone: '', email: '', address: '', city: '',
    taxNumber: '', paymentTermsDays: 30, creditLimit: 50000, notes: '',
  });

  const handleSaveNewSupplier = () => {
    if (!newSupForm.nameAr.trim()) { alert('اسم المورد مطلوب'); return; }
    const existingCodes = suppliers.map((s) => s.accountCode);
    const accountCode = generateSupplierAccountCode(existingCodes);
    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      code: `SUP-${String(suppliers.length + 1).padStart(3, '0')}`,
      nameAr: newSupForm.nameAr.trim(),
      nameEn: newSupForm.nameEn.trim() || undefined,
      phone: newSupForm.phone.trim(),
      email: newSupForm.email.trim() || undefined,
      address: newSupForm.address.trim() || undefined,
      city: newSupForm.city.trim() || undefined,
      taxNumber: newSupForm.taxNumber.trim() || undefined,
      paymentTermsDays: newSupForm.paymentTermsDays,
      creditLimit: newSupForm.creditLimit,
      currentBalance: 0,
      accountId: `acc-${accountCode}`,
      accountCode,
      isActive: true,
      createdAt: new Date().toISOString(),
      notes: newSupForm.notes.trim() || undefined,
    };
    setSuppliers((prev) => [...prev, newSup]);
    setShowNewSupplierModal(false);
    setNewSupForm({ nameAr:'', nameEn:'', phone:'', email:'', address:'', city:'', taxNumber:'', paymentTermsDays:30, creditLimit:50000, notes:'' });
    alert(`✅ تم إنشاء المورد بنجاح!\nكود الحساب المحاسبي: ${accountCode}\nسيظهر الحساب تلقائياً في شجرة الحسابات تحت (الدائنون - 2111)`);
  };

  // ══════════════════════════════════════════════
  //  MODAL: دفعة جديدة لمورد
  // ══════════════════════════════════════════════
  const [showNewPaymentModal, setShowNewPaymentModal] = useState(false);
  const [payForm, setPayForm] = useState({
    supplierId: '', date: new Date().toISOString().split('T')[0],
    amount: 0, paymentMethod: 'BANK_TRANSFER' as 'CASH' | 'BANK_TRANSFER' | 'CHECK',
    reference: '', notes: '',
  });

  const handleSavePayment = () => {
    const sup = suppliers.find((s) => s.id === payForm.supplierId);
    if (!sup || payForm.amount <= 0) { alert('تأكد من اختيار المورد والمبلغ'); return; }
    const bankCode = payForm.paymentMethod === 'CASH' ? '110101' : '110102';
    const bankName = payForm.paymentMethod === 'CASH' ? 'الخزينة الرئيسية' : 'الحساب البنكي (CIB)';
    const newPayment: SupplierPayment = {
      id: `pay-sup-${Date.now()}`,
      paymentNumber: `PAY-SUP-2026-${String(payments.length + 1).padStart(3, '0')}`,
      supplierId: sup.id,
      supplierNameAr: sup.nameAr,
      supplierAccountCode: sup.accountCode,
      date: payForm.date,
      amount: payForm.amount,
      paymentMethod: payForm.paymentMethod,
      bankAccountCode: bankCode,
      bankAccountNameAr: bankName,
      reference: payForm.reference,
      notes: payForm.notes,
      createdAt: new Date().toISOString(),
      createdBy: 'م. محمد جمعة',
    };
    setPayments((prev) => [newPayment, ...prev]);
    // تحديث رصيد المورد
    setSuppliers((prev) =>
      prev.map((s) => s.id === sup.id
        ? { ...s, currentBalance: Math.max(0, s.currentBalance - payForm.amount) }
        : s
      )
    );
    setShowNewPaymentModal(false);
    setPayForm({ supplierId:'', date:new Date().toISOString().split('T')[0], amount:0, paymentMethod:'BANK_TRANSFER', reference:'', notes:'' });
  };

  // ─── KPIs ───
  const kpis = useMemo(() => {
    const totalPayable = suppliers.reduce((s, sup) => s + sup.currentBalance, 0);
    const pendingOrders = orders.filter((o) => ['DRAFT','SENT','PARTIAL'].includes(o.status)).length;
    const overduePayable = suppliers.filter((s) => calcSupplierAging(
      orders.find((o) => o.supplierId === s.id)?.date || new Date().toISOString().split('T')[0],
      s.paymentTermsDays
    ) === 'متأخر').length;
    const thisMonthPurchases = orders
      .filter((o) => o.status === 'RECEIVED' && o.date.startsWith(new Date().toISOString().slice(0, 7)))
      .reduce((s, o) => s + o.totalAmount, 0);
    return { totalPayable, pendingOrders, overduePayable, thisMonthPurchases };
  }, [suppliers, orders]);

  // ─── filtered orders ───
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch = !searchQ || o.orderNumber.includes(searchQ) || o.supplierNameAr.includes(searchQ);
      const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, searchQ, statusFilter]);

  // ─── filtered suppliers ───
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) =>
      !searchQ || s.nameAr.includes(searchQ) || s.code.includes(searchQ) || s.accountCode.includes(searchQ)
    );
  }, [suppliers, searchQ]);

  return (
    <div className="p-5 space-y-4 bg-slate-50 min-h-screen">

      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
            <Truck className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900">إدارة المشتريات والموردين</h1>
            <p className="text-[11px] text-slate-500">أوامر الشراء • الموردين • المدفوعات • المرتجعات</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'orders' && (
            <button onClick={() => setShowNewOrderModal(true)}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-xs transition-all">
              <Plus className="w-4 h-4" /> طلبية شراء جديدة
            </button>
          )}
          {activeTab === 'suppliers' && (
            <button onClick={() => setShowNewSupplierModal(true)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-xs transition-all">
              <Plus className="w-4 h-4" /> إضافة مورد جديد
            </button>
          )}
          {activeTab === 'payments' && (
            <button onClick={() => setShowNewPaymentModal(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-xs transition-all">
              <Plus className="w-4 h-4" /> تسجيل دفعة جديدة
            </button>
          )}
        </div>
      </div>

      {/* ─── KPIs ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'إجمالي المستحق للموردين', value: fmt(kpis.totalPayable), icon: Wallet, cls: 'text-amber-600 bg-amber-50' },
          { label: 'طلبيات معلقة', value: `${kpis.pendingOrders} طلبية`, icon: Clock, cls: 'text-blue-600 bg-blue-50' },
          { label: 'موردون متأخرون', value: `${kpis.overduePayable} مورد`, icon: AlertTriangle, cls: 'text-red-600 bg-red-50' },
          { label: 'مشتريات الشهر الحالي', value: fmt(kpis.thisMonthPurchases), icon: FileText, cls: 'text-emerald-600 bg-emerald-50' },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-500 font-medium">{k.label}</p>
                <p className="text-sm font-extrabold font-mono text-slate-900 mt-0.5">{k.value}</p>
              </div>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${k.cls}`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Tabs ─── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs">
        <div className="flex border-b border-slate-200 px-4 pt-2 gap-1">
          {([
            ['orders', 'طلبيات الشراء'],
            ['suppliers', 'الموردون'],
            ['payments', 'المدفوعات'],
            ['returns', 'المرتجعات'],
          ] as [TabType, string][]).map(([t, label]) => (
            <button key={t} onClick={() => handleSwitchTab(t)}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === t
                  ? 'border-amber-600 text-amber-700 bg-amber-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="p-4">

          {/* ══ تبويب: طلبيات الشراء ══ */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                  <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
                    placeholder="بحث برقم الطلبية أو اسم المورد..."
                    className="w-full pr-8 pl-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white">
                  <option value="ALL">كل الحالات</option>
                  {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500 text-[11px] font-bold">
                    <tr>
                      {['رقم الطلبية','التاريخ','المورد','الحساب','الإجمالي','الضريبة','الصافي','الحالة',''].map((h, i) => (
                        <th key={i} className="px-3 py-2.5 text-right whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((o) => {
                      const st = STATUS_MAP[o.status];
                      return (
                        <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2.5 font-bold text-amber-700 font-mono">{o.orderNumber}</td>
                          <td className="px-3 py-2.5 text-slate-600">{o.date}</td>
                          <td className="px-3 py-2.5 font-semibold text-slate-800">{o.supplierNameAr}</td>
                          <td className="px-3 py-2.5 font-mono text-slate-500">{o.supplierAccountCode}</td>
                          <td className="px-3 py-2.5 font-mono text-slate-700">{fmt(o.subtotal)}</td>
                          <td className="px-3 py-2.5 font-mono text-orange-600">{fmt(o.vatTotal)}</td>
                          <td className="px-3 py-2.5 font-mono font-bold text-slate-900">{fmt(o.totalAmount)}</td>
                          <td className="px-3 py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${st.cls}`}>{st.label}</span>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex gap-1">
                              <button title="عرض تفاصيل" className="p-1 text-slate-400 hover:text-blue-600 transition-colors">
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {o.status === 'DRAFT' && (
                                <button title="تأكيد الإرسال"
                                  onClick={() => setOrders((prev) => prev.map((x) => x.id === o.id ? { ...x, status: 'SENT' } : x))}
                                  className="p-1 text-slate-400 hover:text-emerald-600 transition-colors">
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {o.status === 'SENT' && (
                                <button title="تسجيل استلام"
                                  onClick={() => setOrders((prev) => prev.map((x) => x.id === o.id ? { ...x, status: 'RECEIVED' } : x))}
                                  className="p-1 text-slate-400 hover:text-emerald-600 transition-colors">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredOrders.length === 0 && (
                      <tr><td colSpan={9} className="text-center py-8 text-slate-400">لا توجد طلبيات</td></tr>
                    )}
                  </tbody>
                  <tfoot className="bg-amber-50 border-t-2 border-amber-200">
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-xs font-bold text-amber-800">إجمالي</td>
                      <td className="px-3 py-2 font-mono font-bold text-amber-800">{fmt(filteredOrders.reduce((s,o)=>s+o.subtotal,0))}</td>
                      <td className="px-3 py-2 font-mono font-bold text-orange-700">{fmt(filteredOrders.reduce((s,o)=>s+o.vatTotal,0))}</td>
                      <td className="px-3 py-2 font-mono font-bold text-amber-900">{fmt(filteredOrders.reduce((s,o)=>s+o.totalAmount,0))}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ══ تبويب: الموردون ══ */}
          {activeTab === 'suppliers' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="بحث باسم المورد، الكود، أو رقم الحساب..."
                  className="w-full pr-8 pl-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500 text-[11px] font-bold">
                    <tr>
                      {['كود المورد','الاسم','حساب الدائنين','الهاتف','شروط الدفع','الرصيد المستحق','التقادم','الحالة'].map((h,i)=>(
                        <th key={i} className="px-3 py-2.5 text-right whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSuppliers.map((sup) => {
                      const lastOrder = orders.filter((o) => o.supplierId === sup.id).sort((a,b) => b.date.localeCompare(a.date))[0];
                      const aging = lastOrder ? calcSupplierAging(lastOrder.date, sup.paymentTermsDays) : '< 30 يوم';
                      return (
                        <tr key={sup.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-3 font-mono text-amber-700 font-bold">{sup.code}</td>
                          <td className="px-3 py-3">
                            <div className="font-bold text-slate-900">{sup.nameAr}</div>
                            {sup.nameEn && <div className="text-[10px] text-slate-400">{sup.nameEn}</div>}
                          </td>
                          <td className="px-3 py-3">
                            <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[10px] font-bold">{sup.accountCode}</span>
                          </td>
                          <td className="px-3 py-3 text-slate-600 font-mono">{sup.phone}</td>
                          <td className="px-3 py-3 text-slate-600">{sup.paymentTermsDays} يوم</td>
                          <td className="px-3 py-3 font-mono font-bold text-amber-700">{fmt(sup.currentBalance)}</td>
                          <td className={`px-3 py-3 text-xs font-bold ${AGING_CLS[aging] || ''}`}>{aging}</td>
                          <td className="px-3 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sup.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                              {sup.isActive ? 'نشط' : 'موقوف'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-amber-50 border-t-2 border-amber-200">
                    <tr>
                      <td colSpan={5} className="px-3 py-2 text-xs font-bold text-amber-800">إجمالي المستحق للموردين</td>
                      <td className="px-3 py-2 font-mono font-bold text-amber-900">{fmt(filteredSuppliers.reduce((s,sup)=>s+sup.currentBalance,0))}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* بطاقة الربط المحاسبي */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs">
                <p className="font-bold text-blue-800 mb-2 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" /> الربط المحاسبي التلقائي للموردين
                </p>
                <p className="text-blue-700 leading-relaxed">
                  عند إضافة مورد جديد، يُنشئ النظام تلقائياً حساباً فرعياً له تحت حساب{' '}
                  <span className="font-mono font-bold bg-blue-100 px-1 rounded">2111 — ذمم دائنة (موردون)</span> في شجرة الحسابات.
                  وعند استلام بضاعة أو دفع مستحقات، يُنشئ النظام قيد محاسبي مزدوج متوازن تلقائياً.
                </p>
              </div>
            </div>
          )}

          {/* ══ تبويب: المدفوعات ══ */}
          {activeTab === 'payments' && (
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500 text-[11px] font-bold">
                    <tr>
                      {['رقم الدفعة','التاريخ','المورد','حساب المورد','المبلغ','طريقة الدفع','من حساب','مرجع'].map((h,i)=>(
                        <th key={i} className="px-3 py-2.5 text-right whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5 font-mono text-blue-700 font-bold">{p.paymentNumber}</td>
                        <td className="px-3 py-2.5 text-slate-600">{p.date}</td>
                        <td className="px-3 py-2.5 font-semibold text-slate-800">{p.supplierNameAr}</td>
                        <td className="px-3 py-2.5 font-mono text-slate-500">{p.supplierAccountCode}</td>
                        <td className="px-3 py-2.5 font-mono font-bold text-emerald-700">{fmt(p.amount)}</td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.paymentMethod === 'CASH' ? 'bg-emerald-50 text-emerald-700' :
                            p.paymentMethod === 'BANK_TRANSFER' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {p.paymentMethod === 'CASH' ? 'نقداً' : p.paymentMethod === 'BANK_TRANSFER' ? 'تحويل بنكي' : 'شيك'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-500 text-[10px]">{p.bankAccountNameAr}</td>
                        <td className="px-3 py-2.5 text-slate-500">{p.reference || '—'}</td>
                      </tr>
                    ))}
                    {payments.length === 0 && (
                      <tr><td colSpan={8} className="text-center py-8 text-slate-400">لا توجد مدفوعات مسجلة</td></tr>
                    )}
                  </tbody>
                  <tfoot className="bg-blue-50 border-t-2 border-blue-200">
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-xs font-bold text-blue-800">إجمالي المدفوعات</td>
                      <td className="px-3 py-2 font-mono font-bold text-blue-900">{fmt(payments.reduce((s,p)=>s+p.amount,0))}</td>
                      <td colSpan={3}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ══ تبويب: المرتجعات ══ */}
          {activeTab === 'returns' && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <RotateCcw className="w-12 h-12 text-slate-300 mb-3" />
              <p className="font-bold text-slate-500 text-sm">مرتجعات المشتريات</p>
              <p className="text-xs text-slate-400 mt-1">يتم تسجيل مرتجع عند إلغاء بضاعة مستلمة وإعادتها للمورد</p>
              <button className="mt-4 flex items-center gap-2 bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-amber-700 transition-all">
                <Plus className="w-4 h-4" /> تسجيل مرتجع مشتريات
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ════════════════════════════════════
           MODAL: طلبية شراء جديدة
         ════════════════════════════════════ */}
      {showNewOrderModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-600" /> طلبية شراء جديدة
              </h2>
              <button onClick={() => setShowNewOrderModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المورد *</label>
                  <select value={newOrderSupplierId} onChange={(e) => setNewOrderSupplierId(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400">
                    <option value="">— اختر المورد —</option>
                    {suppliers.filter((s) => s.isActive).map((s) => (
                      <option key={s.id} value={s.id}>{s.nameAr} ({s.accountCode})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الطلبية *</label>
                  <input type="date" value={newOrderDate} onChange={(e) => setNewOrderDate(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ التسليم المتوقع</label>
                  <input type="date" value={newOrderExpected} onChange={(e) => setNewOrderExpected(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات</label>
                  <input value={newOrderNotes} onChange={(e) => setNewOrderNotes(e.target.value)} placeholder="ملاحظات اختيارية..."
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">أصناف الطلبية *</label>
                  <button onClick={() => setNewOrderItems((p) => [...p, { sku:'', nameAr:'', unit:'قطعة', orderedQty:1, unitPrice:0, vatRate:0.14 }])}
                    className="text-[10px] text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1">
                    <Plus className="w-3 h-3" /> إضافة صنف
                  </button>
                </div>
                <div className="space-y-2">
                  {newOrderItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-5 gap-2 items-center bg-slate-50 p-2 rounded-lg">
                      <input value={item.nameAr} onChange={(e) => setNewOrderItems((p) => p.map((x,i)=>i===idx?{...x,nameAr:e.target.value}:x))}
                        placeholder="اسم الصنف *" className="col-span-2 text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400" />
                      <input type="number" min="1" value={item.orderedQty} onChange={(e) => setNewOrderItems((p) => p.map((x,i)=>i===idx?{...x,orderedQty:+e.target.value}:x))}
                        placeholder="الكمية" className="text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400" />
                      <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => setNewOrderItems((p) => p.map((x,i)=>i===idx?{...x,unitPrice:+e.target.value}:x))}
                        placeholder="سعر الوحدة ج.م" className="text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400" />
                      <button onClick={() => setNewOrderItems((p) => p.filter((_,i)=>i!==idx))} disabled={newOrderItems.length===1}
                        className="flex justify-center text-red-400 hover:text-red-600 transition-colors disabled:opacity-30">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs space-y-1">
                <div className="flex justify-between text-slate-600"><span>المجموع قبل الضريبة</span><span className="font-mono font-bold">{fmt(newOrderTotals.subtotal)}</span></div>
                <div className="flex justify-between text-orange-600"><span>ضريبة القيمة المضافة (14%)</span><span className="font-mono font-bold">{fmt(newOrderTotals.vat)}</span></div>
                <div className="flex justify-between text-amber-900 font-extrabold border-t border-amber-200 pt-1"><span>الإجمالي</span><span className="font-mono">{fmt(newOrderTotals.total)}</span></div>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={handleSaveNewOrder}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2.5 rounded-lg transition-all">
                  ✅ حفظ الطلبية
                </button>
                <button onClick={() => setShowNewOrderModal(false)}
                  className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-lg transition-all">
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════
           MODAL: مورد جديد
         ════════════════════════════════════ */}
      {showNewSupplierModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" /> إضافة مورد جديد
              </h2>
              <button onClick={() => setShowNewSupplierModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-700">
                <strong>ملاحظة:</strong> سيُنشئ النظام تلقائياً حساباً محاسبياً لهذا المورد تحت{' '}
                <span className="font-mono font-bold">2111 — ذمم دائنة (موردون)</span>
              </div>
              {[
                ['nameAr','اسم المورد بالعربي *','text'],
                ['nameEn','اسم المورد بالإنجليزي','text'],
                ['phone','رقم الهاتف','text'],
                ['email','البريد الإلكتروني','email'],
                ['address','العنوان','text'],
                ['city','المدينة','text'],
                ['taxNumber','الرقم الضريبي','text'],
              ].map(([field, label, type]) => (
                <div key={field}>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{label}</label>
                  <input type={type} value={(newSupForm as any)[field]}
                    onChange={(e) => setNewSupForm((p) => ({...p,[field]:e.target.value}))}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">شروط الدفع (أيام)</label>
                  <input type="number" value={newSupForm.paymentTermsDays}
                    onChange={(e) => setNewSupForm((p) => ({...p,paymentTermsDays:+e.target.value}))}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الحد الائتماني (ج.م)</label>
                  <input type="number" value={newSupForm.creditLimit}
                    onChange={(e) => setNewSupForm((p) => ({...p,creditLimit:+e.target.value}))}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات</label>
                <textarea value={newSupForm.notes} onChange={(e) => setNewSupForm((p) => ({...p,notes:e.target.value}))} rows={2}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleSaveNewSupplier}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-lg transition-all">
                  ✅ إضافة المورد وإنشاء الحساب
                </button>
                <button onClick={() => setShowNewSupplierModal(false)}
                  className="px-4 bg-slate-100 text-slate-700 text-xs font-bold py-2.5 rounded-lg">
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════
           MODAL: دفعة جديدة
         ════════════════════════════════════ */}
      {showNewPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600" /> تسجيل دفعة لمورد
              </h2>
              <button onClick={() => setShowNewPaymentModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المورد *</label>
                <select value={payForm.supplierId} onChange={(e) => setPayForm((p)=>({...p,supplierId:e.target.value}))}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="">— اختر المورد —</option>
                  {suppliers.filter((s)=>s.currentBalance>0).map((s)=>(
                    <option key={s.id} value={s.id}>{s.nameAr} — مستحق: {fmt(s.currentBalance)}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التاريخ *</label>
                  <input type="date" value={payForm.date} onChange={(e)=>setPayForm((p)=>({...p,date:e.target.value}))}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ (ج.م) *</label>
                  <input type="number" min="1" value={payForm.amount || ''} onChange={(e)=>setPayForm((p)=>({...p,amount:+e.target.value}))}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">طريقة الدفع *</label>
                <select value={payForm.paymentMethod} onChange={(e)=>setPayForm((p)=>({...p,paymentMethod:e.target.value as any}))}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="BANK_TRANSFER">تحويل بنكي (حساب CIB)</option>
                  <option value="CASH">نقداً من الخزينة</option>
                  <option value="CHECK">شيك بنكي</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم المرجع / رقم التحويل</label>
                <input value={payForm.reference} onChange={(e)=>setPayForm((p)=>({...p,reference:e.target.value}))}
                  placeholder="TRF-CIB-XXXX"
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-700">
                القيد التلقائي: <span className="font-bold font-mono">{suppliers.find(s=>s.id===payForm.supplierId)?.accountCode || '2111XX'}</span> مدين ←{' '}
                <span className="font-bold font-mono">{payForm.paymentMethod === 'CASH' ? '110101 الخزينة' : '110102 بنك CIB'}</span> دائن
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={handleSavePayment}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-lg transition-all">
                  ✅ تسجيل الدفعة وإنشاء القيد
                </button>
                <button onClick={() => setShowNewPaymentModal(false)}
                  className="px-4 bg-slate-100 text-slate-700 text-xs font-bold py-2.5 rounded-lg">
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ══════════════════════════════════════════════
//  Wrapper بـ Suspense (مطلوب لـ useSearchParams)
// ══════════════════════════════════════════════
export default function PurchasingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-slate-500 text-sm">جاري تحميل موديول المشتريات...</div>}>
      <PurchasingPageContent />
    </Suspense>
  );
}
