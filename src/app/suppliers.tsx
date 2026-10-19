import React, { useState } from 'react';

// هيكلية بيانات الموردين والمشتريات المربوطة بدليل الحسابات
export default function SuppliersModule() {
  const [suppliers, setSuppliers] = useState([
    { id: 1, code: 'SUP-001', name: 'شركة الزيوت العطرية العالمية', phone: '01012345678', balance: 15000, accountCode: '2111' },
    { id: 2, code: 'SUP-002', name: 'مصنع الزجاج والعبوات', phone: '01123456789', balance: 8500, accountCode: '2112' },
  ]);

  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', initialBalance: 0 });

  // إضافة مورد جديد مع ربطه أوتوماتيكياً بشجرة الحسابات (حـ/ الموردين - 211)
  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name) return;

    const nextId = suppliers.length + 1;
    const accountCode = `211${nextId}`; // يتفرع تلقائياً تحت حـ/ الموردين رئيسي (211)
    
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
    <div style={{ padding: '20px', fontFamily: 'sans-serif', direction: 'rtl' }}>
      <h2>🛒 موديول الموردين والمشتريات (Procurement Module)</h2>
      <p style={{ color: '#666' }}>مرتبط آلياً بحساب الموردين الرئيسي (211 - الالتزامات المتداولة)</p>

      {/* نموذج إضافة مورد جديد */}
      <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>إضافة مورد جديد</h3>
        <form onSubmit={handleAddSupplier} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="اسم المورد / الشركة" 
            value={newSupplier.name} 
            onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            required
          />
          <input 
            type="text" 
            placeholder="رقم الهاتف" 
            value={newSupplier.phone} 
            onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <input 
            type="number" 
            placeholder="رصيد بداية المدة (دائن)" 
            value={newSupplier.initialBalance} 
            onChange={(e) => setNewSupplier({...newSupplier, initialBalance: Number(e.target.value)})}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <button type="submit" style={{ background: '#28a745', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>
            حفظ وربط بالشجرة
          </button>
        </form>
      </div>

      {/* جدول عرض الموردين */}
      <table border={1} cellPadding={10} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
        <thead>
          <tr style={{ background: '#333', color: '#fff' }}>
            <th>كود المورد</th>
            <th>اسم المورد</th>
            <th>رقم الهاتف</th>
            <th>حساب الشجرة الفرعي</th>
            <th>الرصيد المستحق (ج.م)</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((sup) => (
            <tr key={sup.id}>
              <td>{sup.code}</td>
              <td><strong>{sup.name}</strong></td>
              <td>{sup.phone}</td>
              <td><code>{sup.accountCode} (حـ/ {sup.name})</code></td>
              <td style={{ color: sup.balance > 0 ? 'red' : 'green', fontWeight: 'bold' }}>
                {sup.balance.toLocaleString()} ج.م
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}