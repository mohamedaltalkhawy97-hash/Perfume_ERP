export type ItemCategory = 
  | 'FRAGRANCE_OIL'      // زيوت عطرية مركزة
  | 'ALCOHOL_SOLVENT'    // كحول ومذيبات ومثبتات
  | 'BOTTLE'             // زجاجات فارغة
  | 'CAP_PUMP'           // بخاخات وأغطية
  | 'PACKAGING_BOX'      // علب كرتون وسلوفان
  | 'FINISHED_PERFUME';  // عطور تامة الصنع جاهزة للبيع

export type ItemUnit = 'GRAM' | 'KG' | 'ML' | 'LITER' | 'PIECE' | 'BOX';

export interface Warehouse {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  type: 'RAW_MATERIALS' | 'PACKAGING' | 'WIP_AGING' | 'FINISHED_GOODS' | 'SCRAP';
  location: string;
  managerName: string;
}

export interface Item {
  id: string;
  sku: string;
  barcode: string;
  nameAr: string;
  nameEn: string;
  category: ItemCategory;
  unit: ItemUnit;
  minStockAlert: number;
  currentStock: number;
  averageCost: number;       // المتوسط المرجح المتحرك للوحدة (ج.م)
  lastPurchasePrice: number; // آخر سعر شراء مدفوع (ج.م)
  defaultWarehouseId: string;
  description: string;
}

export interface ItemBatch {
  id: string;
  itemId: string;
  itemSku: string;
  itemNameAr: string;
  batchNumber: string;       // رقم التشغيلة / الدفعة (Lot Number)
  vendorName: string;        // مورد الشحنة (مثلاً: جيفودان السويسرية)
  productionDate: string;
  expiryDate: string;
  receivedQty: number;
  availableQty: number;
  unitCost: number;
  warehouseId: string;
  warehouseNameAr: string;
  status: 'ACTIVE' | 'EXPIRED' | 'DEPLETED';
}

export type StockMovementType = 
  | 'RECEIPT_PURCHASE'  // إذن إضافة وارد مشتريات
  | 'ISSUE_PRODUCTION'  // إذن صرف خامات لأمر تشغيل
  | 'RECEIPT_FINISHED'  // إذن استلام منتج تام من الإنتاج
  | 'TRANSFER'          // تحويل بين المخازن
  | 'SALES_DISPATCH'    // صرف مبيعات للعميل
  | 'ADJUSTMENT';       // تسوية جردية

export interface StockTransaction {
  id: string;
  transactionNumber: string;
  date: string;
  type: StockMovementType;
  itemId: string;
  itemSku: string;
  itemNameAr: string;
  batchNumber?: string;
  sourceWarehouseId?: string;
  targetWarehouseId?: string;
  sourceWarehouseName?: string;
  targetWarehouseName?: string;
  quantity: number;
  unit: ItemUnit;
  unitCost: number;
  totalCost: number;
  referenceNumber: string; // رقم الفاتورة أو إذن الشراء
  notes: string;
  createdAt: string;
  createdBy: string;
}
