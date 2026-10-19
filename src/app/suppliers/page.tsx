'use client';

import React, { useState } from 'react';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([
    { id: 1, code: 'SUP-001', name: 'شركة الزيوت العطرية العالمية', phone: '01012345678', balance: 15000, accountCode: '2111' },
    { id: 2, code: 'SUP-002', name: 'مصنع الزجاج والعبوات', phone: '01123456789', balance: 8500, accountCode: '2112' },
  ]);

  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', initialBalance: 0 });

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name) return;

    const nextId = suppliers.length + 1;
    const accountCode = `211${nextId}`;
    
    const addedSupplier = {
      id: nextId,
      code: `SUP-0${nextId.toString().padStart(2, '0')}`,
      name: newSupplier.name,
      phone: newSupplier.phone,
      balance: Number(newSupplier.initialBalance),
      accountCode: accountCode
    };

    setSuppliers([...suppliers, addedSupplier]);
    setNewSupplier({ name: '', phone: '', initialBalance: 0 });
    alert(`تم إضافة المورد وربطه تلقائياً بشجرة الحسابات تحت كود: ${accountCode}`);
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', direction: 'rtl', backgroundColor: '#fff', minHeight: '100vh' }}>
      <h2 style={{ color: '#111827' }}>🛒 موديول الموردين والمشتريات (Procurement Module)</h2>
      <p style={{ color: '#6b7280' }}>مرتبط آلياً بحساب الموردين الرئيسي (211 - الالتزامات المتداولة)</p>

      <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '25px' }}>
        <h3 style={{ marginTop: 0 }}>إضافة مورد جديد</h3>
        <form onSubmit={handleAddSupplier} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="اسم المورد / الشركة" 
            value={newSupplier.name} 
            onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', flex: '1' }}
            required
          />
          <input 
            type="text" 
            placeholder="رقم الهاتف" 
            value={newSupplier.phone} 
            onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', flex: '1' }}
          />
          <input 
            type="number" 
            placeholder="رصيد بداية المدة" 
            value={newSupplier.initialBalance} 
            onChange={(e) => setNewSupplier({...newSupplier, initialBalance: Number(e.target.value)})}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', flex: '1' }}
          />
          <button type="submit" style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            حفظ وربط بالشجرة
          </button>
        </form>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', border: '1px solid #e5e7eb' }}>
        <thead>
          <tr style={{ background: '#1f2937', color: '#fff' }}>
            <th style={{ padding: '12px' }}>كود المورد</th>
            <th style={{ padding: '12px' }}>اسم المورد</th>
            <th style={{ padding: '12px' }}>رقم الهاتف</th>
            <th style={{ padding: '12px' }}>حساب الشجرة الفرعي</th>
            <th style={{ padding: '12px' }}>الرصيد المستحق (ج.م)</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((sup) => (
            <tr key={sup.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '12px' }}>{sup.code}</td>
              <td style={{ padding: '12px' }}><strong>{sup.name}</strong></td>
              <td style={{ padding: '12px' }}>{sup.phone}</td>
              <td style={{ padding: '12px' }}><code style={{ background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px' }}>{sup.accountCode}</code></td>
              <td style={{ padding: '12px', color: sup.balance > 0 ? '#dc2626' : '#16a34a', fontWeight: 'bold' }}>
                {sup.balance.toLocaleString()} ج.م
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}