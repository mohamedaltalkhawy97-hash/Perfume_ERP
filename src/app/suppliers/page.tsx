'use client';

import React, { useState } from 'react';
import { Truck, Plus, Search, Phone, ShieldCheck, FileText } from 'lucide-react';

export default function SuppliersPage() {
  const [suppliers] = useState([
    { id: 1, code: 'SUP-001', name: 'شركة الزيوت العطرية العالمية', phone: '01012345678', balance: 15000, accountCode: '2111' },
    { id: 2, code: 'SUP-002', name: 'مصنع الزجاج والعبوات', phone: '01123456789', balance: 8500, accountCode: '2112' },
  ]);

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-800" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-orange-600" />
            دليل الموردين والمشتريات
          </h1>
          <p className="text-xs text-slate-500 mt-1">الالتزامات المتداولة - كود الحساب الرئيسي (211)</p>
        </div>
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all">
          <Plus className="w-4 h-4" /> إضافة مورد جديد
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-800 text-white font-bold">
            <tr>
              <th className="p-3.5">كود المورد</th>
              <th className="p-3.5">اسم المورد</th>
              <th className="p-3.5">رقم الهاتف</th>
              <th className="p-3.5">حساب الشجرة (211)</th>
              <th className="p-3.5">الرصيد المستحق (ج.م)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {suppliers.map((sup) => (
              <tr key={sup.id} className="hover:bg-slate-50 font-semibold transition-all">
                <td className="p-3.5"><code className="bg-slate-100 px-2 py-1 rounded text-slate-700 font-mono">{sup.code}</code></td>
                <td className="p-3.5 font-bold text-slate-900">{sup.name}</td>
                <td className="p-3.5 text-slate-600">{sup.phone}</td>
                <td className="p-3.5"><code className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-mono">{sup.accountCode}</code></td>
                <td className="p-3.5 text-rose-600 font-bold">{sup.balance.toLocaleString()} ج.م</td>
              </tr>
            ))}
          </tbody>
        </table>س
      </div>
    </div>
  );
}