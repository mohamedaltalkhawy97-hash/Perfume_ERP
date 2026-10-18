import { SalesInvoice, InvoiceItem, Customer, ShopifyOrderSync } from "../types/sales";
import { JournalEntry, JournalEntryLine } from "../types/accounting";

/**
 * حساب إجماليات الفاتورة، ضريبة القيمة المضافة 14%، وضريبة الخصم من المنبع 1%
 */
export function calculateInvoiceTotals(params: {
  items: Array<{ quantity: number; unitPrice: number; discountPercentage?: number }>;
  isWholesale?: boolean;
}) {
  let subtotal = 0;
  let discountTotal = 0;

  for (const item of params.items) {
    const itemSub = item.quantity * item.unitPrice;
    const itemDisc = itemSub * ((item.discountPercentage || 0) / 100);
    subtotal += itemSub;
    discountTotal += itemDisc;
  }

  const taxableAmount = subtotal - discountTotal;
  const vatRate = 0.14; // 14% Egyptian VAT
  const vatAmount = Math.round(taxableAmount * vatRate * 100) / 100;

  // قانون الضرائب المصري: ضريبة الخصم والتحصيل من المنبع (WHT) 1% على التوريدات للشركات التي تزيد عن 300 ج.م
  let whtRate = 0;
  let whtAmount = 0;

  if (params.isWholesale && taxableAmount >= 300) {
    whtRate = 0.01; // 1%
    whtAmount = Math.round(taxableAmount * whtRate * 100) / 100;
  }

  // صافي المبلغ المستحق على العميل = الوعاء الخاضع + ضريبة القيمة المضافة - ضريبة الخصم من المنبع
  const netTotal = Math.round((taxableAmount + vatAmount - whtAmount) * 100) / 100;

  return {
    subtotal,
    discountTotal,
    taxableAmount,
    vatRate,
    vatAmount,
    whtRate,
    whtAmount,
    netTotal,
  };
}

/**
 * توليد قيد اليومية المزدوج الآلي لإثبات الإيراد والضريبة
 */
export function generateSalesRevenueJournalEntry(invoice: SalesInvoice): JournalEntry {
  const lines: JournalEntryLine[] = [];

  // 1. الطرف المدين: طريقة التحصيل أو الحساب المعلق
  let debitAccountId = "110101";
  let debitAccountCode = "110101";
  let debitAccountNameAr = "صندوق النقدية بالمعرض الرئيسي";

  if (invoice.paymentMethod === "BANK_TRANSFER") {
    debitAccountId = "110201";
    debitAccountCode = "110201";
    debitAccountNameAr = "البنك التجاري الدولي CIB - حساب جارٍ";
  } else if (invoice.paymentMethod === "PAYMOB_GATEWAY" || invoice.paymentMethod === "TAP_GATEWAY") {
    debitAccountId = "110204";
    debitAccountCode = "110204";
    debitAccountNameAr = "وسيط دفع إلكتروني معلق (Paymob / Tap)";
  } else if (invoice.paymentMethod === "BOSTA_COD" || invoice.paymentMethod === "ARAMEX_COD") {
    debitAccountId = "110304";
    debitAccountCode = "110304";
    debitAccountNameAr = "وسيط تحصيل وشحن عند الاستلام معلق (Bosta / Aramex COD)";
  } else if (invoice.paymentMethod === "ON_CREDIT") {
    debitAccountId = "110301";
    debitAccountCode = "110301";
    debitAccountNameAr = `العملاء التجاريين - ${invoice.customerNameAr}`;
  }

  lines.push({
    id: `jl-rev-deb-${Date.now()}-1`,
    accountId: debitAccountId,
    accountCode: debitAccountCode,
    accountNameAr: debitAccountNameAr,
    debit: invoice.netTotal,
    credit: 0,
    description: `استحقاق فاتورة مبيعات ${invoice.invoiceNumber} (${invoice.customerNameAr})`,
    costCenterId: invoice.costCenterId,
  });

  // 2. مدين: ضريبة الخصم من المنبع WHT 1% (أصل ضريبي مستحق للمصنع لدى الضرائب)
  if (invoice.whtAmount > 0) {
    lines.push({
      id: `jl-rev-wht-${Date.now()}-2`,
      accountId: "110502",
      accountCode: "110502",
      accountNameAr: "مصلحة الضرائب - خصم وتحصيل تحت حساب الضريبة 1%",
      debit: invoice.whtAmount,
      credit: 0,
      description: `ضريبة خصم من المنبع 1% محتجزة من العميل بفاتورة ${invoice.invoiceNumber}`,
      costCenterId: invoice.costCenterId,
    });
  }

  // 3. دائن: إيرادات المبيعات (صافي المبيعات بدون ضريبة)
  lines.push({
    id: `jl-rev-sales-${Date.now()}-3`,
    accountId: "410101",
    accountCode: "410101",
    accountNameAr: "إيرادات مبيعات العطور الفاخرة",
    debit: 0,
    credit: invoice.taxableAmount,
    description: `إيراد بيع عطور فاتورة ${invoice.invoiceNumber}`,
    costCenterId: invoice.costCenterId,
  });

  // 4. دائن: ضريبة القيمة المضافة 14% (التزام لمصلحة الضرائب المصرية)
  if (invoice.vatAmount > 0) {
    lines.push({
      id: `jl-rev-vat-${Date.now()}-4`,
      accountId: "210401",
      accountCode: "210401",
      accountNameAr: "مصلحة الضرائب - ضريبة القيمة المضافة المحصلة (14%)",
      debit: 0,
      credit: invoice.vatAmount,
      description: `ضريبة قيمة مضافة 14% على فاتورة ${invoice.invoiceNumber}`,
      costCenterId: invoice.costCenterId,
    });
  }

  const totalDebit = invoice.netTotal + invoice.whtAmount;
  const totalCredit = invoice.taxableAmount + invoice.vatAmount;

  return {
    id: `je-sales-${Date.now()}`,
    entryNumber: `JV-SALES-${Date.now().toString().slice(-4)}`,
    date: invoice.date,
    description: `إثبات إيراد وضريبة مبيعات فاتورة [${invoice.invoiceNumber}] - ${invoice.customerNameAr}`,
    referenceType: "SALES_INVOICE",
    referenceId: invoice.invoiceNumber,
    costCenterId: invoice.costCenterId,
    lines,
    totalDebit,
    totalCredit,
    status: "POSTED",
    createdAt: new Date().toISOString(),
    createdBy: "محرك المبيعات المحاسبي",
  };
}

/**
 * توليد قيد تكلفة البضاعة المباعة COGS وصرف المخزون التام
 */
export function generateCogsJournalEntry(invoice: SalesInvoice): JournalEntry {
  const lines: JournalEntryLine[] = [];

  // 1. مدين: حـ/ تكلفة البضاعة المباعة (510101)
  lines.push({
    id: `jl-cogs-deb-${Date.now()}-1`,
    accountId: "510101",
    accountCode: "510101",
    accountNameAr: "تكلفة البضاعة المباعة - مبيعات عطور تامة",
    debit: invoice.totalCogs,
    credit: 0,
    description: `تكلفة مبيعات فاتورة ${invoice.invoiceNumber} بالمتوسط المرجح المتحرك`,
    costCenterId: invoice.costCenterId,
  });

  // 2. دائن: حـ/ مخزون عطور ومنتجات تامة الصنع (110405)
  lines.push({
    id: `jl-cogs-crd-${Date.now()}-2`,
    accountId: "110405",
    accountCode: "110405",
    accountNameAr: "مخزون عطور ومنتجات تامة الصنع",
    debit: 0,
    credit: invoice.totalCogs,
    description: `صرف خروج عطور من المخزن التام لفاتورة ${invoice.invoiceNumber}`,
    costCenterId: invoice.costCenterId,
  });

  return {
    id: `je-cogs-${Date.now()}`,
    entryNumber: `JV-COGS-${Date.now().toString().slice(-4)}`,
    date: invoice.date,
    description: `إثبات تكلفة البضاعة المباعة وصرف المخزون [${invoice.invoiceNumber}]`,
    referenceType: "COGS",
    referenceId: invoice.invoiceNumber,
    costCenterId: invoice.costCenterId,
    lines,
    totalDebit: invoice.totalCogs,
    totalCredit: invoice.totalCogs,
    status: "POSTED",
    createdAt: new Date().toISOString(),
    createdBy: "محرك التكاليف الآلي",
  };
}

/**
 * توليد قيد تسوية حساب وسيط شحن أو دفع إلكتروني (Reconciliation Entry)
 * إقفال حساب Bosta أو Paymob المعلق وتحويل الصافي للبنك وخصم العمولات
 */
export function generateGatewaySettlementEntry(params: {
  clearingAccountCode: "110204" | "110304";
  clearingAccountName: string;
  grossAmount: number;
  gatewayFee: number;
  referenceNumber: string;
}): JournalEntry {
  const { clearingAccountCode, clearingAccountName, grossAmount, gatewayFee, referenceNumber } = params;
  const netReceived = grossAmount - gatewayFee;

  const lines: JournalEntryLine[] = [];

  // 1. مدين: البنك التجاري الدولي CIB (110201) بالصافي
  lines.push({
    id: `jl-settle-bank-${Date.now()}-1`,
    accountId: "110201",
    accountCode: "110201",
    accountNameAr: "البنك التجاري الدولي CIB - حساب جارٍ",
    debit: netReceived,
    credit: 0,
    description: `استلام صافي تسوية تحصيلات ${clearingAccountName} تسوية رقم: ${referenceNumber}`,
  });

  // 2. مدين: عمولات ومصاريف تحصيل بنكية / شحن (5305)
  if (gatewayFee > 0) {
    lines.push({
      id: `jl-settle-fee-${Date.now()}-2`,
      accountId: "5305",
      accountCode: "530501",
      accountNameAr: "عمولات بوابات دفع إلكتروني ومصاريف شحن",
      debit: gatewayFee,
      credit: 0,
      description: `عمولات تسوية ${clearingAccountName}`,
    });
  }

  // 3. دائن: إقفال حساب الوسيط المعلق بالكامل (110204 أو 110304)
  lines.push({
    id: `jl-settle-close-${Date.now()}-3`,
    accountId: clearingAccountCode,
    accountCode: clearingAccountCode,
    accountNameAr: clearingAccountName,
    debit: 0,
    credit: grossAmount,
    description: `إقفال وسيط التحصيل المعلق ${referenceNumber}`,
  });

  return {
    id: `je-settle-${Date.now()}`,
    entryNumber: `JV-SETTLE-${Date.now().toString().slice(-4)}`,
    date: new Date().toISOString().split("T")[0],
    description: `تسوية تحصيلات إلكترونية / شحن COD [${referenceNumber}] - ${clearingAccountName}`,
    referenceType: "BANK_TRANSFER",
    referenceId: referenceNumber,
    lines,
    totalDebit: grossAmount,
    totalCredit: grossAmount,
    status: "POSTED",
    createdAt: new Date().toISOString(),
    createdBy: "محرك التسويات البنكية الآلي",
  };
}
