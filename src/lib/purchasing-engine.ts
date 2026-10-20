// ====================================================
// lib/purchasing-engine.ts — محرك المشتريات المحاسبي
// ينشئ قيود القيد المزدوجة عند كل عملية شراء أو دفع
// ====================================================

import { JournalEntry, JournalEntryLine } from '@/types/accounting';
import { PurchaseOrder, SupplierPayment } from '@/types/purchasing';

// -------------------------------------------------------
// 1. قيد استلام البضاعة من المورد
// Dr. المخزون (خامات أو تعبئة)   ← 1131/1141
// Dr. ضريبة المدخلات (VAT 14%)   ← 2131
// Cr. المورد (حساب الدائنين)     ← 211101/211102...
// -------------------------------------------------------
export function generatePurchaseReceiptEntry(
  order: PurchaseOrder,
  inventoryAccountCode: string,
  inventoryAccountId: string,
  inventoryAccountNameAr: string,
  entryNumber: string,
): JournalEntry {
  const lines: JournalEntryLine[] = [];
  let lineIdx = 1;

  // خط المخزون: مدين
  lines.push({
    id: `jel-${lineIdx++}`,
    accountId: inventoryAccountId,
    accountCode: inventoryAccountCode,
    accountNameAr: inventoryAccountNameAr,
    description: `استلام بضاعة - ${order.orderNumber} من ${order.supplierNameAr}`,
    debit: order.subtotal,
    credit: 0,
  });

  // خط ضريبة المدخلات: مدين
  if (order.vatTotal > 0) {
    lines.push({
      id: `jel-${lineIdx++}`,
      accountId: 'acc-2131',
      accountCode: '2131',
      accountNameAr: 'ضريبة القيمة المضافة المدخلات (14%)',
      description: `VAT 14% - ${order.orderNumber}`,
      debit: order.vatTotal,
      credit: 0,
    });
  }

  // خط المورد: دائن
  lines.push({
    id: `jel-${lineIdx++}`,
    accountId: `acc-${order.supplierAccountCode}`,
    accountCode: order.supplierAccountCode,
    accountNameAr: order.supplierNameAr,
    description: `مستحق للمورد - ${order.orderNumber}`,
    debit: 0,
    credit: order.totalAmount,
  });

  return {
    id: `je-pur-${Date.now()}`,
    entryNumber,
    date: order.date,
    description: `قيد استلام مشتريات: ${order.orderNumber} - ${order.supplierNameAr}`,
    referenceType: 'PURCHASE',
    referenceId: order.id,
    status: 'POSTED',
    lines,
    totalDebit: order.totalAmount,
    totalCredit: order.totalAmount,
    createdAt: new Date().toISOString(),
    createdBy: order.createdBy,
  };
}

// -------------------------------------------------------
// 2. قيد سداد مستحقات المورد
// Dr. المورد (حساب الدائنين)     ← 211101/211102...
// Cr. الخزينة أو البنك           ← 110101/110102
// -------------------------------------------------------
export function generateSupplierPaymentEntry(
  payment: SupplierPayment,
  entryNumber: string,
): JournalEntry {
  const lines: JournalEntryLine[] = [
    {
      id: 'jel-1',
      accountId: `acc-${payment.supplierAccountCode}`,
      accountCode: payment.supplierAccountCode,
      accountNameAr: payment.supplierNameAr,
      description: `سداد مستحقات: ${payment.paymentNumber}`,
      debit: payment.amount,
      credit: 0,
    },
    {
      id: 'jel-2',
      accountId: `acc-${payment.bankAccountCode || '110101'}`,
      accountCode: payment.bankAccountCode || '110101',
      accountNameAr: payment.bankAccountNameAr || 'الخزينة الرئيسية',
      description: `دفع للمورد ${payment.supplierNameAr} - ${payment.reference || ''}`,
      debit: 0,
      credit: payment.amount,
    },
  ];

  return {
    id: `je-pay-${Date.now()}`,
    entryNumber,
    date: payment.date,
    description: `قيد سداد مورد: ${payment.paymentNumber} - ${payment.supplierNameAr}`,
    referenceType: 'BANK_TRANSFER',
    referenceId: payment.id,
    status: 'POSTED',
    lines,
    totalDebit: payment.amount,
    totalCredit: payment.amount,
    createdAt: payment.createdAt,
    createdBy: payment.createdBy,
  };
}

// -------------------------------------------------------
// 3. توليد كود حساب المورد الجديد تلقائياً
// -------------------------------------------------------
export function generateSupplierAccountCode(existingCodes: string[]): string {
  const supplierCodes = existingCodes
    .filter((c) => c.startsWith('2111') && c.length === 6)
    .map((c) => parseInt(c.slice(4), 10))
    .filter((n) => !isNaN(n));

  const maxNum = supplierCodes.length > 0 ? Math.max(...supplierCodes) : 0;
  return `2111${String(maxNum + 1).padStart(2, '0')}`;
}

// -------------------------------------------------------
// 4. احتساب أرصدة الموردين المستحقة
// -------------------------------------------------------
export function calcSupplierAging(
  orderDate: string,
  paymentTermsDays: number,
): '< 30 يوم' | '31-60 يوم' | '> 60 يوم' | 'متأخر' {
  const daysPassed = Math.floor(
    (Date.now() - new Date(orderDate).getTime()) / 86400000,
  );
  if (daysPassed <= paymentTermsDays) return '< 30 يوم';
  if (daysPassed <= paymentTermsDays + 30) return '31-60 يوم';
  if (daysPassed <= paymentTermsDays + 60) return '> 60 يوم';
  return 'متأخر';
}
