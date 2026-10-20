'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
} from 'lucide-react';
import {
  INITIAL_WAREHOUSES,
  INITIAL_ITEMS,
  INITIAL_BATCHES,
  INITIAL_STOCK_TRANSACTIONS
} from '@/lib/default-inventory';

function InventoryContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') || 'items';
  const [activeTab, setActiveTab] = useState(tabParam);

  // حالة بيانات الموردين
  const [suppliers, setSuppliers] = useState([
    { id: 1, code: 'SUP-001', name: 'شركة الزيوت العطرية العالمية', phone: '01012345678', balance: 15000, accountCode: '2111' },
    { id: 2, code: 'SUP-002', name: 'مصنع الزجاج والعبوات', phone: '01123456789', balance: 8500, accountCode: '2112' },
  ]);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t) setActiveTab(t);
  }, [searchParams]);

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif', direction: 'rtl', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* رأس الصفحة والعنوان */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', margin: 0 }}>نظام إدارة مصنع العطور (ERP)</h1>
          <p style={{ color: '#666', margin: '5px 0 0 0' }}>إدارة المخازن، الحسابات، والموردين بدقة متكاملة</p>
        </div>
      </div>

      {/* شريط التابات (Tabs Bar) */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #dee2e6', paddingBottom: '10px', marginBottom: '20px', background: '#fff', padding: '10px', borderRadius: '8px' }}>
        <Link href="/inventory?tab=items" style={{ padding: '8px 16px', background: activeTab === 'items' ? '#007bff' : '#f1f3f5', color: activeTab === 'items' ? '#fff' : '#495057', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold' }}>
          الأصناف والمخزن
        </Link>
        <Link href="/inventory?tab=suppliers" style={{ padding: '8px 16px', background: activeTab === 'suppliers' ? '#007bff' : '#f1f3f5', color: activeTab === 'suppliers' ? '#fff' : '#495057', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold' }}>
          الموردين والمشتريات (211)
        </Link>
        <Link href="/inventory?tab=warehouses" style={{ padding: '8px 16px', background: activeTab === 'warehouses' ? '#007bff' : '#f1f3f5', color: activeTab === 'warehouses' ? '#fff' : '#495057', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold' }}>
          المستودعات
        </Link>
      </div>

      {/* محتوى التابات */}
      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        {activeTab === 'suppliers' ? (
          <div>
            <h2 style={{ fontSize: '20px', color: '#333', marginBottom: '10px' }}>موديول الموردين والمشتريات</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>الالتزامات المتداولة - (211) مرتبط آلياً بحسابات الموردين الرئيسي</p>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', marginTop: '10px', border: '1px solid #ddd' }}>
              <thead>
                <tr style={{ background: '#333', color: '#fff' }}>
                  <th style={{ padding: '12px' }}>كود المورد</th>
                  <th style={{ padding: '12px' }}>اسم المورد</th>
                  <th style={{ padding: '12px' }}>رقم الهاتف</th>
                  <th style={{ padding: '12px' }}>حساب الشجرة</th>
                  <th style={{ padding: '12px' }}>الرصيد المستحق</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((sup) => (
                  <tr key={sup.id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '12px' }}><code>{sup.code}</code></td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{sup.name}</td>
                    <td style={{ padding: '12px' }}>{sup.phone}</td>
                    <td style={{ padding: '12px' }}><code>{sup.accountCode}</code></td>
                    <td style={{ padding: '12px', color: 'red', fontWeight: 'bold' }}>{sup.balance} EGP</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div>
            <h2 style={{ fontSize: '20px', color: '#333', marginBottom: '10px' }}>إدارة المخزون والأصناف</h2>
            <p style={{ color: '#666' }}>أهلاً بك في نظام المخازن الرئيسي. اختر تبويب الموردين بالأعلى لعرض بيانات الموردين وحساباتهم.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>جاري تحميل النظام...</div>}>
      <InventoryContent />
    </Suspense>
  );
}