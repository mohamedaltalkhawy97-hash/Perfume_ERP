'use client';

import React, { useState } from 'react';

export default function SuppliersPage() {
  const [suppliers] = useState([
    { id: 1, code: 'SUP-001', name: 'شركة الزيوت العطرية العالمية', phone: '01012345678', balance: 15000, accountCode: '2111' },
    { id: 2, code: 'SUP-002', name: 'مصنع الزجاج والعبوات', phone: '01123456789', balance: 8500, accountCode: '2112' },
  ]);

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', direction: 'rtl', backgroundColor: '#fff', minHeight: '100vh' }}>
      <h2>موديول الموردين والمشتريات</h2>
      <p>مرتبط آلياً بحساب الموردين الرئيسي (211 - الالتزامات المتداولة)</p>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', marginTop: '20px', border: '1px solid #ddd' }}>
        <thead>
          <tr style={{ background: '#333', color: '#fff' }}>
            <th style={{ padding: '10px' }}>كود المورد</th>
            <th style={{ padding: '10px' }}>اسم المورد</th>
            <th style={{ padding: '10px' }}>رقم الهاتف</th>
            <th style={{ padding: '10px' }}>حساب الشجرة</th>
            <th style={{ padding: '10px' }}>الرصيد المستحق</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((sup) => (
            <tr key={sup.id} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '10px' }}>{sup.code}</td>
              <td style={{ padding: '10px' }}><strong>{sup.name}</strong></td>
              <td style={{ padding: '10px' }}>{sup.phone}</td>
              <td style={{ padding: '10px' }}><code>{sup.accountCode}</code></td>
              <td style={{ padding: '10px', color: 'red', fontWeight: 'bold' }}>{sup.balance} ج.م</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}