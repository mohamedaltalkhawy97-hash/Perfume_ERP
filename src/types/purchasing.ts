// ====================================================
// types/purchasing.ts — موديول المشتريات والموردين
// ====================================================

export interface Supplier {
  id: string;
  code: string;           // SUP-001
  nameAr: string;
  nameEn?: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  taxNumber?: string;     // الرقم الضريبي
  commercialRegister?: string;
  paymentTermsDays: number;  // شروط الدفع (30 يوم مثلاً)
  creditLimit: number;
  currentBalance: number;    // رصيد الحساب (موجب = مستحق للمورد)
  accountId: string;          // id الحساب في شجرة الحسابات (acc-211101 مثلاً)
  accountCode: string;        // كود الحساب (211101)
  isActive: boolean;
  createdAt: string;
  notes?: string;
}

export type PurchaseOrderStatus = 
  | 'DRAFT'       // مسودة
  | 'SENT'        // أُرسل للمورد
  | 'PARTIAL'     // تم استلام جزء منه
  | 'RECEIVED'    // تم الاستلام الكامل
  | 'CANCELLED';  // ملغي

export interface PurchaseOrderItem {
  id: string;
  itemId: string;
  sku: string;
  nameAr: string;
  unit: string;
  orderedQty: number;
  receivedQty: number;
  unitPrice: number;
  vatRate: number;       // 0.14
  vatAmount: number;
  subtotal: number;
  total: number;
  warehouseId: string;
  warehouseNameAr: string;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;    // PO-2026-001
  supplierId: string;
  supplierNameAr: string;
  supplierAccountCode: string;
  date: string;
  expectedDelivery?: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  subtotal: number;
  vatTotal: number;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  createdBy: string;
  // ربط محاسبي: عند الاستلام يُنشئ قيد تلقائياً
  journalEntryId?: string;
}

export type PaymentStatus = 'PENDING' | 'PAID' | 'PARTIAL';

export interface SupplierPayment {
  id: string;
  paymentNumber: string;  // PAY-SUP-2026-001
  supplierId: string;
  supplierNameAr: string;
  supplierAccountCode: string;
  date: string;
  amount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHECK';
  bankAccountCode?: string;  // كود حساب البنك أو الخزينة المدفوع منه
  bankAccountNameAr?: string;
  reference?: string;
  notes?: string;
  journalEntryId?: string;
  createdAt: string;
  createdBy: string;
}

export interface PurchaseReturn {
  id: string;
  returnNumber: string;    // RET-PO-2026-001
  originalOrderId: string;
  supplierId: string;
  supplierNameAr: string;
  supplierAccountCode: string;
  date: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  vatTotal: number;
  reason: string;
  journalEntryId?: string;
  createdAt: string;
}
