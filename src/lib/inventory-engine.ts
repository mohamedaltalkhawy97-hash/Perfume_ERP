import { Item, ItemBatch, StockTransaction, StockMovementType } from "@/types/inventory";
import { JournalEntry, JournalEntryLine } from "@/types/accounting";

/**
 * حساب المتوسط المرجح المتحرك لتكلفة الوحدة
 * Moving Weighted Average Formula
 */
export function calculateMovingWeightedAverage(
  currentQty: number,
  currentAverageCost: number,
  incomingQty: number,
  incomingPrice: number
): number {
  if (currentQty <= 0) {
    return incomingPrice;
  }
  const currentTotalValue = currentQty * currentAverageCost;
  const incomingTotalValue = incomingQty * incomingPrice;
  const newTotalQty = currentQty + incomingQty;

  if (newTotalQty <= 0) return currentAverageCost;

  const newAverage = (currentTotalValue + incomingTotalValue) / newTotalQty;
  return Math.round(newAverage * 100) / 100; // تقريب لأقرب قرشين
}

/**
 * توليد القيد المحاسبي التلقائي لإذن إضافة مخزني وارد شراء (GRN)
 */
export function generatePurchaseReceiptJournalEntry(
  item: Item,
  quantity: number,
  unitPrice: number,
  vendorName: string,
  referenceNumber: string,
  entryNumber: string
): JournalEntry {
  const totalAmount = Math.round(quantity * unitPrice * 100) / 100;
  
  // تحديد حساب المخزون الصحيح وفق فئة الصنف
  let inventoryAccountCode = "110401"; // الزيوت العطرية
  let inventoryAccountName = "مخزون المواد الخام (الزيوت العطرية المركزة)";
  let inventoryAccountId = "acc-110401";

  if (item.category === "ALCOHOL_SOLVENT") {
    inventoryAccountCode = "110402";
    inventoryAccountName = "مخزون الكحول المعالج والمثبتات";
    inventoryAccountId = "acc-110402";
  } else if (item.category === "BOTTLE" || item.category === "CAP_PUMP" || item.category === "PACKAGING_BOX") {
    inventoryAccountCode = "110403";
    inventoryAccountName = "مخزون مواد التعبئة والتغليف (زجاجات، مضخات، كرتون)";
    inventoryAccountId = "acc-110403";
  }

  const lines: JournalEntryLine[] = [
    {
      id: `l-deb-${Date.now()}`,
      accountId: inventoryAccountId,
      accountCode: inventoryAccountCode,
      accountNameAr: inventoryAccountName,
      description: `استلام مخزني: ${quantity} ${item.unit} من [${item.nameAr}] بسعر ${unitPrice} ج.م`,
      debit: totalAmount,
      credit: 0,
    },
    {
      id: `l-crd-${Date.now()}`,
      accountId: "acc-2101",
      accountCode: "2101",
      accountNameAr: "الموردون (ذمم دائنة)",
      description: `استحقاق المورد [${vendorName}] عن فاتورة/إذن توريد: ${referenceNumber}`,
      debit: 0,
      credit: totalAmount,
    },
  ];

  return {
    id: `je-grn-${Date.now()}`,
    entryNumber,
    date: new Date().toISOString().split("T")[0],
    description: `إثبات وارد شراء مخزني للصنف (${item.nameAr}) - كمية ${quantity} - مورد: ${vendorName}`,
    referenceType: "PURCHASE",
    referenceId: referenceNumber,
    status: "POSTED",
    lines,
    totalDebit: totalAmount,
    totalCredit: totalAmount,
    createdAt: new Date().toISOString(),
    createdBy: "أمين المخزن والمحاسب",
  };
}
