export type SalesChannel = "POS_SHOWROOM" | "WHOLESALE" | "SHOPIFY_ONLINE";

export type PaymentMethod =
  | "CASH"               // نقداً - صندوق المعرض (110101)
  | "BANK_TRANSFER"     // تحويل بنكي CIB (110201)
  | "PAYMOB_GATEWAY"    // بوابة Paymob بطاقات ائتمان (110204)
  | "TAP_GATEWAY"       // بوابة Tap Payments (110204)
  | "BOSTA_COD"         // شركة بوسطة - تحصيل عند الاستلام (110304)
  | "ARAMEX_COD"        // شركة أرامكس - تحصيل عند الاستلام (110304)
  | "ON_CREDIT";        // آجل على حساب العميل (110301)

export interface Customer {
  id: string;
  code: string;
  nameAr: string;
  phone: string;
  email?: string;
  type: "RETAIL" | "WHOLESALE" | "SHOPIFY";
  taxRegistrationNumber?: string; // البطاقة الضريبية للشركات
  creditLimit: number; // الحد الائتماني المسموح به
  currentBalance: number; // رصيد الحساب الحالي
  priceTier: "RETAIL" | "WHOLESALE_A" | "WHOLESALE_B";
  city: string;
  address?: string;
}

export interface InvoiceItem {
  id: string;
  itemId: string;
  sku: string;
  nameAr: string;
  quantity: number;
  unitPrice: number; // السعر للوحدة قبل الضريبة
  unitCost: number;  // تكلفة الصنف بالمتوسط المرجح (لحساب COGS)
  discountPercentage: number;
  discountAmount: number;
  subtotal: number;
  vatRate: number; // 0.14 الافتراضي المصري
  vatAmount: number;
  total: number;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string; // مثال: "INV-2026-012"
  date: string;
  dueDate?: string;
  customerId: string;
  customerNameAr: string;
  channel: SalesChannel;
  paymentMethod: PaymentMethod;
  paymentStatus: "PAID" | "UNPAID" | "PARTIALLY_PAID";
  items: InvoiceItem[];
  
  subtotal: number;       // المجموع قبل الخصم والضريبة
  discountTotal: number;  // إجمالي الخصومات
  taxableAmount: number;  // الوعاء الخاضع لضريبة القيمة المضافة
  vatAmount: number;      // ضريبة القيمة المضافة 14%
  whtRate: number;        // ضريبة الخصم والتحصيل من المنبع (1% لمشتريات الجملة)
  whtAmount: number;      // قيمة الخصم من المنبع
  netTotal: number;       // الصافي النهائي المستحق
  
  totalCogs: number;      // إجمالي تكلفة البضاعة المباعة للتشغيلات
  costCenterId: string;
  costCenterNameAr: string;
  
  journalEntryId?: string; // قيد الإيراد والضريبة
  cogsJournalEntryId?: string; // قيد تكلفة البضاعة والمخزون
  shopifyOrderId?: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface ShopifyOrderSync {
  id: string;
  shopifyOrderNumber: string; // "#1042"
  orderDate: string;
  customerName: string;
  customerPhone: string;
  shippingCity: string;
  itemsSummary: string;
  totalAmount: number;
  financialStatus: "PAID" | "PENDING_COD";
  fulfillmentStatus: "UNFULFILLED" | "FULFILLED" | "IN_TRANSIT" | "DELIVERED";
  gateway: "Paymob" | "Tap" | "Bosta COD";
  clearingAccountCode: string;
  clearingAccountNameAr: string;
  isInventoryDeducted: boolean;
  erpInvoiceNumber?: string;
  syncStatus: "SYNCED" | "PENDING_CLEARING" | "RECONCILED";
  courierTrackingNumber?: string;
}
