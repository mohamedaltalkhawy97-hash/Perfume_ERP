import { ItemUnit, ItemCategory } from "./inventory";

export interface BomComponent {
  id: string;
  itemId: string;
  itemSku: string;
  itemNameAr: string;
  quantityPerUnit: number; // كمية المكون لإنتاج وحدة واحدة (أو زجاجة واحدة)
  unit: ItemUnit;
  standardCostPerUnit: number; // السعر المعياري للوحدة
  category: ItemCategory;
  phase: "MIXING_RAW" | "BOTTLING_PACKAGING"; // خلط خامات أو تعبئة وتغليف
}

export interface BillOfMaterials {
  id: string;
  bomCode: string; // مثال: "BOM-LAV-100"
  bomNameAr: string;
  finishedItemId: string;
  finishedItemSku: string;
  finishedItemNameAr: string;
  batchSizeStandard: number; // حجم التشغيلة المعيارية (مثلاً: 100 زجاجة)
  macerationDaysRequired: number; // فترة التعتيق الإلزامية بالأيام (مثلاً 28 يوم)
  recommendedTempC: number; // درجة حرارة التعتيق المثالية (15-18 مئوية)
  costCenterId: string;
  costCenterNameAr: string;
  components: BomComponent[];
  standardLaborCostPerBatch: number; // تكلفة العمالة المباشرة المعيارية
  standardOverheadCostPerBatch: number; // التكاليف الصناعية غير المباشرة المعيارية المحملة
  normalLossPercentage: number; // نسبة الفاقد الطبيعي المسموح بها (تطاير 1.5%)
  notes?: string;
  createdAt: string;
  isActive: boolean;
}

export type WorkOrderStatus =
  | "PLANNED"               // مخطط ومجدول
  | "MIXING_IN_PROGRESS"    // جاري وزن وخلط الخامات والكحول
  | "MACERATING"            // في مرحلة التعتيق بحظيرة الخزانات
  | "QUALITY_INSPECTION"    // فحص واختبار الجودة والنقاء
  | "READY_FOR_BOTTLING"    // جاهز للتعبئة (اكتمل التعتيق)
  | "BOTTLING"              // جاري التعبئة، الكبس، والسلوفان
  | "COMPLETED"             // مكتمل ومرحل للمخزن التام
  | "CANCELLED";            // ملغي

export interface WorkOrder {
  id: string;
  orderNumber: string; // مثال: "WO-2026-008"
  bomId: string;
  bomCode: string;
  finishedItemId: string;
  finishedItemSku: string;
  finishedItemNameAr: string;
  targetQuantity: number; // الكمية المستهدفة (مثلاً 100 زجاجة)
  actualCompletedQuantity?: number; // الكمية الفعلية المعبأة السليمة (مثلاً 98)
  scrapBrokenQuantity?: number; // تالف التعبئة غير الطبيعي (مثلاً 2 زجاجة مكسورة)
  costCenterId: string;
  costCenterNameAr: string;
  status: WorkOrderStatus;
  assignedTankId?: string;
  assignedTankNumber?: string;
  startDate: string;
  macerationStartDate?: string;
  macerationTargetEndDate?: string;
  actualBottlingDate?: string;
  completedDate?: string;
  
  // حوكمة التعتيق وتصريح التعبئة المبكرة
  isEarlyReleaseAuthorized?: boolean;
  earlyReleaseAuthorizedBy?: string;
  earlyReleaseReason?: string;

  // التكاليف الصناعية للتشغيلة
  standardTotalCost: number;
  actualRawMaterialCost: number;
  actualPackagingCost: number;
  actualDirectLaborCost: number;
  actualOverheadCost: number;
  totalActualCost: number;
  unitActualCost: number; // تكلفة الزجاجة الفعلية النهائية
  costVariance: number; // انحراف التكلفة (فعلي - معياري)

  // القيود اليومية المرتبطة بالتشغيلة
  rawMaterialJournalEntryId?: string; // قيد صرف الخامات للتشغيل
  completionJournalEntryId?: string;  // قيد استلام التام وحساب التالف وإقفال التشغيل
  
  createdBatchNumber?: string; // رقم دفعة المنتج التام المنشأة
  supervisorName: string;
  notes?: string;
}

export interface MacerationTank {
  id: string;
  tankNumber: string; // "TANK-SS-01"
  nameAr: string;
  capacityLiters: number;
  currentWorkOrderId?: string;
  currentOrderNumber?: string;
  currentPerfumeName?: string;
  volumeLiters?: number;
  status: "EMPTY" | "OCCUPIED" | "CLEANING" | "MAINTENANCE";
  temperatureC: number;
  macerationStartDate?: string;
  macerationEndDate?: string;
  daysRemaining?: number;
}
