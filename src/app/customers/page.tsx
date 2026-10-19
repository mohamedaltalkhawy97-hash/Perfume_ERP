'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, X, Phone, User, Wallet, Check, Search } from 'lucide-react';

interface Customer {
  id: number;
  code: string;
  name: string;
  phone: string;
  balance: number;
  accountCode: string;
}

const DEFAULT_CUSTOMERS: Customer[] = [
  { id: 1, code: 'CUST-001', name: 'معرض العطور الملكية', phone: '01098765432', balance: 25000, accountCode: '1121' },
  { id: 2, code: 'CUST-002', name: 'مؤسسة أريج الشرق', phone: '01155443322', balance: 12000, accountCode: '1122' },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    balance: '',
  });

  useEffect(() => {
    const savedData = localStorage.getItem('erp_customers_data');
    if (savedData) {
      try {
        setCustomers(JSON.parse(savedData));
      } catch (e) {
        setCustomers(DEFAULT_CUSTOMERS);
      }
    } else {
      setCustomers(DEFAULT_CUSTOMERS);
      localStorage.setItem('erp_customers_data', JSON.stringify(DEFAULT_CUSTOMERS));
    }
  }, []);

  const saveCustomersToStorage = (updatedCustomers: Customer[]) => {
    setCustomers(updatedCustomers);
    localStorage.setItem('erp_customers_data', JSON.stringify(updatedCustomers));
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const nextId = customers.length + 1;
    const newCustomer: Customer = {
      id: Date.now(),
      code: `CUST-${String(nextId).padStart(3, '0')}`,
      name: formData.name.trim(),
      phone: formData.phone.trim() || 'غير محدد',
      balance: parseFloat(formData.balance) || 0,
      accountCode: `112${nextId}`,
    };

    const updated = [...customers, newCustomer];
    saveCustomersToStorage(updated);
    setFormData({ name: '', phone: '', balance: '' });
    setIsModalOpen(false);
  };

  const filteredCustomers = customers.filter((cust) =>
    cust.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cust.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cust.phone.includes(searchTerm)
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-800" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            دليل العملاء والموزعين
          </h1>
          <p className="text-xs text-slate-500 mt-1">إدارة حسابات العملاء • الأصول المتداولة (كود الحساب الرئيسي: 112)</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" /> إضافة عميل جديد
        </button>
      </div>

      {/* Filter and Search */}
      <div className="mb-4 bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="ابحث باسم العميل، الكود، أو رقم الهاتف..."
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
              <th className="p-3.5">كود العميل</th>
              <th className="p-3.5">اسم العميل / معرض العطور</th>
              <th className="p-3.5">رقم الهاتف</th>
              <th className="p-3.5">كود الحساب الفرعي (112)</th>
              <th className="p-3.5">الرصيد المدين (ج.م)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-50 font-semibold transition-all">
                  <td className="p-3.5"><code className="bg-slate-100 px-2 py-1 rounded text-slate-700 font-mono">{cust.code}</code></td>
                  <td className="p-3.5 font-bold text-slate-900">{cust.name}</td>
                  <td className="p-3.5 text-slate-600">{cust.phone}</td>
                  <td className="p-3.5"><code className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-mono">{cust.accountCode}</code></td>
                  <td className="p-3.5 text-emerald-600 font-bold">{cust.balance.toLocaleString()} ج.م</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-400 text-xs">لا يوجد عملاء مطابقين للبحث</td>
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
                <Users className="w-4 h-4 text-indigo-400" />
                إضافة عميل جديد لحسابات (112)
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم العميل / المعرض *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="مثال: معرض عطور الشروق"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-indigo-600 focus:outline-hidden transition-all"
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
                    className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-indigo-600 focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رصيد أول المدة (مدين - ج.م)</label>
                <div className="relative">
                  <Wallet className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="number"
                    placeholder="0.00"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                    className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-indigo-600 focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 text-[11px] text-indigo-900">
                سيتم ربط العميل بالحساب الرئيسي <strong>112 (الأصول المتداولة - العملاء)</strong> وتأطيره برقم حساب فرعي تلقائي.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" /> حفظ العميل
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