'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Plus, X, Phone, User, Wallet, Check, Search } from 'lucide-react';

interface Supplier {
  id: number;
  code: string;
  name: string;
  phone: string;
  balance: number;
  accountCode: string;
}

const DEFAULT_SUPPLIERS: Supplier[] = [
  { id: 1, code: 'SUP-001', name: 'شركة الزيوت العطرية العالمية', phone: '01012345678', balance: 15000, accountCode: '2111' },
  { id: 2, code: 'SUP-002', name: 'مصنع الزجاج والعبوات', phone: '01123456789', balance: 8500, accountCode: '2112' },
];

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    balance: '',
  });

  // تحميل البيانات المحفوظة تلقائياً
  useEffect(() => {
    const savedData = localStorage.getItem('erp_suppliers_data');
    if (savedData) {
      try {
        setSuppliers(JSON.parse(savedData));
      } catch (e) {
        setSuppliers(DEFAULT_SUPPLIERS);
      }
    } else {
      setSuppliers(DEFAULT_SUPPLIERS);
      localStorage.setItem('erp_suppliers_data', JSON.stringify(DEFAULT_SUPPLIERS));
    }
  }, []);

  // حفظ البيانات تلقائياً عند أي تغيير
  const saveSuppliersToStorage = (updatedSuppliers: Supplier[]) => {
    setSuppliers(updatedSuppliers);
    localStorage.setItem('erp_suppliers_data', JSON.stringify(updatedSuppliers));
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const nextId = suppliers.length + 1;
    const newSupplier: Supplier = {
      id: Date.now(),
      code: `SUP-${String(nextId).padStart(3, '0')}`,
      name: formData.name.trim(),
      phone: formData.phone.trim() || 'غير محدد',
      balance: parseFloat(formData.balance) || 0,
      accountCode: `211${nextId}`,
    };

    const updated = [...suppliers, newSupplier];
    saveSuppliersToStorage(updated);
    setFormData({ name: '', phone: '', balance: '' });
    setIsModalOpen(false);
  };

  const filteredSuppliers = suppliers.filter((sup) =>
    sup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sup.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sup.phone.includes(searchTerm)
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-800" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-orange-600" />
            دليل الموردين والمشتريات
          </h1>
          <p className="text-xs text-slate-500 mt-1">إدارة حسابات الموردين • الالتزامات المتداولة (كود الحساب الرئيسي: 211)</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" /> إضافة مورد جديد
        </button>
      </div>

      {/* Filter and Search */}
      <div className="mb-4 bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="ابحث باسم المورد، الكود، أو رقم الهاتف..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-xs bg-transparent outline-hidden text-slate-700"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-800 text-white font-bold">
            <tr>
              <th className="p-3.5">كود المورد</th>
              <th className="p-3.5">اسم المورد / الشركة</th>
              <th className="p-3.5">رقم الهاتف</th>
              <th className="p-3.5">كود الحساب الفرعي (211)</th>
              <th className="p-3.5">الرصيد المستحق (ج.م)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSuppliers.length > 0 ? (
              filteredSuppliers.map((sup) => (
                <tr key={sup.id} className="hover:bg-slate-50 font-semibold transition-all">
                  <td className="p-3.5"><code className="bg-slate-100 px-2 py-1 rounded text-slate-700 font-mono">{sup.code}</code></td>
                  <td className="p-3.5 font-bold text-slate-900">{sup.name}</td>
                  <td className="p-3.5 text-slate-600">{sup.phone}</td>
                  <td className="p-3.5"><code className="bg-orange-50 text-orange-700 px-2 py-1 rounded font-mono">{sup.accountCode}</code></td>
                  <td className="p-3.5 text-rose-600 font-bold">{sup.balance.toLocaleString()} ج.م</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-400 text-xs">لا يوجد موردين مطابقين للبحث</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center px-5 py-4 bg-slate-800 text-white">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Truck className="w-4 h-4 text-orange-400" />
                إضافة مورد جديد لحسابات (211)
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المورد / الشركة *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="مثال: شركة مصر للزيوت"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-emerald-600 focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="01012345678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-emerald-600 focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رصيد أول المدة (دائن - ج.م)</label>
                <div className="relative">
                  <Wallet className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="number"
                    placeholder="0.00"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                    className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-emerald-600 focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              <div className="p-3 bg-orange-50 rounded-lg border border-orange-100 text-[11px] text-orange-900">
                سيتم ربط المورد بالحساب الرئيسي <strong>211 (الالتزامات المتداولة)</strong> وتأطيره برقم حساب فرعي تلقائي.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" /> حفظ المورد
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}