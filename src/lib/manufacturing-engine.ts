import { BillOfMaterials, WorkOrder, MacerationTank } from "../types/manufacturing";
import { JournalEntry, JournalEntryLine } from "../types/accounting";

/**
 * حساب التكلفة المعيارية لتركيبة العطر (BOM Standard Cost)
 */
export function calculateBomStandardCost(bom: BillOfMaterials) {
  let rawMaterialCost = 0;
  let packagingCost = 0;

  for (const comp of bom.components) {
    const totalCompCost = comp.quantityPerUnit * comp.standardCostPerUnit;
    if (comp.phase === "MIXING_RAW") {
      rawMaterialCost += totalCompCost;
    } else {
      packagingCost += totalCompCost;
    }
  }

  const directMaterialCostPerUnit = rawMaterialCost + packagingCost;
  const laborPerUnit = bom.standardLaborCostPerBatch / bom.batchSizeStandard;
  const overheadPerUnit = bom.standardOverheadCostPerBatch / bom.batchSizeStandard;
  const unitStandardCost = directMaterialCostPerUnit + laborPerUnit + overheadPerUnit;
  const totalStandardCost = unitStandardCost * bom.batchSizeStandard;

  return {
    rawMaterialCostPerUnit: Math.round(rawMaterialCost * 100) / 100,
    packagingCostPerUnit: Math.round(packagingCost * 100) / 100,
    laborPerUnit: Math.round(laborPerUnit * 100) / 100,
    overheadPerUnit: Math.round(overheadPerUnit * 100) / 100,
    unitStandardCost: Math.round(unitStandardCost * 100) / 100,
    totalStandardCost: Math.round(totalStandardCost * 100) / 100,
  };
}

/**
 * فحص حوكمة التعتيق وصلاحية التعبئة
 * لا يُسمح بالتعبئة إلا بعد اكتمال المدة القانونية للتعتيق أو صدور تصريح رسمي من المدير
 */
export function evaluateMacerationLock(
  workOrder: WorkOrder,
  tank?: MacerationTank
): {
  isLocked: boolean;
  canBottle: boolean;
  statusBadge: "LOCKED" | "OVERRIDDEN" | "MATURED";
  message: string;
  daysRemaining: number;
} {
  const daysRem = tank?.daysRemaining ?? 0;

  if (workOrder.isEarlyReleaseAuthorized) {
    return {
      isLocked: false,
      canBottle: true,
      statusBadge: "OVERRIDDEN",
      message: `مسموح بالتعبئة بتفويض استثنائي من: ${workOrder.earlyReleaseAuthorizedBy || "الإدارة العامة"} (سبب: ${workOrder.earlyReleaseReason || "طلب عاجل"})`,
      daysRemaining: daysRem,
    };
  }

  if (daysRem <= 0 || workOrder.status === "READY_FOR_BOTTLING") {
    return {
      isLocked: false,
      canBottle: true,
      statusBadge: "MATURED",
      message: "اكتملت فترة التعتيق بنجاح ومطابق لاختبار النقاء وثبات الرائحة.",
      daysRemaining: 0,
    };
  }

  return {
    isLocked: true,
    canBottle: false,
    statusBadge: "LOCKED",
    message: `محظور التعبئة: متبقي ${daysRem} يوماً على اكتمال التعتيق الكيميائي. يتطلب تفويضاً إدارياً للتجاوز.`,
    daysRemaining: daysRem,
  };
}

/**
 * توليد قيد اليومية الآلي لصرف خامات الزيت والكحول إلى إنتاج تحت التشغيل (WIP)
 */
export function generateRawMaterialIssueEntry(
  workOrder: WorkOrder,
  bom: BillOfMaterials,
  multiplier: number = 1
): JournalEntry {
  const lines: JournalEntryLine[] = [];
  let totalOilCost = 0;
  let totalSolventCost = 0;

  for (const comp of bom.components) {
    if (comp.phase === "MIXING_RAW") {
      const lineCost = comp.quantityPerUnit * comp.standardCostPerUnit * multiplier;
      if (comp.category === "FRAGRANCE_OIL") {
        totalOilCost += lineCost;
      } else {
        totalSolventCost += lineCost;
      }
    }
  }

  const totalRawCost = totalOilCost + totalSolventCost;

  // 1. مدين: حـ/ إنتاج تحت التشغيل - تعتيق ومزج (110404)
  lines.push({
    id: `jl-wip-${Date.now()}-1`,
    accountId: "110404",
    accountCode: "110404",
    accountNameAr: "مخزون إنتاج تحت التشغيل (WIP - خلط وتعتيق)",
    debit: totalRawCost,
    credit: 0,
    description: `صرف خامات خلط وتعتيق لأمر التشغيل ${workOrder.orderNumber} (${workOrder.finishedItemNameAr})`,
    costCenterId: workOrder.costCenterId,
  });

  // 2. دائن: حـ/ مخزون الزيوت العطرية (110401)
  if (totalOilCost > 0) {
    lines.push({
      id: `jl-oil-${Date.now()}-2`,
      accountId: "110401",
      accountCode: "110401",
      accountNameAr: "مخزون الزيوت العطرية المركزة",
      debit: 0,
      credit: totalOilCost,
      description: `خروج زيوت خام لأمر تشغيل ${workOrder.orderNumber}`,
      costCenterId: workOrder.costCenterId,
    });
  }

  // 3. دائن: حـ/ مخزون الكحول والمذيبات (110402)
  if (totalSolventCost > 0) {
    lines.push({
      id: `jl-solv-${Date.now()}-3`,
      accountId: "110402",
      accountCode: "110402",
      accountNameAr: "مخزون الكحول الإيثيلي والمذيبات",
      debit: 0,
      credit: totalSolventCost,
      description: `صرف كحول ومثبتات لأمر تشغيل ${workOrder.orderNumber}`,
      costCenterId: workOrder.costCenterId,
    });
  }

  return {
    id: `je-wo-raw-${Date.now()}`,
    entryNumber: `JV-MFG-RAW-${Date.now().toString().slice(-4)}`,
    date: new Date().toISOString().split("T")[0],
    description: `صرف خامات الزيوت والكحول للتشغيل والتعتيق [${workOrder.orderNumber}]`,
    referenceType: "MANUFACTURING",
    referenceId: workOrder.orderNumber,
    costCenterId: workOrder.costCenterId,
    lines,
    totalDebit: totalRawCost,
    totalCredit: totalRawCost,
    status: "POSTED",
    createdAt: new Date().toISOString(),
    createdBy: "محرك التصنيع الآلي (Perfume Engine)",
  };
}

/**
 * توليد قيد اليومية الآلي لإتمام التعبئة واستلام تام الصنع وإثبات التالف
 */
export function generateWorkOrderCompletionEntry(params: {
  workOrder: WorkOrder;
  bom: BillOfMaterials;
  goodQuantity: number;
  brokenScrapQuantity: number;
  unitFinalCost: number;
  actualPackagingCost: number;
  actualLaborCost: number;
  actualOverheadCost: number;
}): JournalEntry {
  const {
    workOrder,
    goodQuantity,
    brokenScrapQuantity,
    unitFinalCost,
    actualPackagingCost,
    actualLaborCost,
    actualOverheadCost,
  } = params;

  const totalFinishedGoodsValue = goodQuantity * unitFinalCost;
  const totalScrapLoss = brokenScrapQuantity * unitFinalCost;
  const totalDebit = totalFinishedGoodsValue + totalScrapLoss;

  const lines: JournalEntryLine[] = [];

  // 1. مدين: مخزون عطور تامة الصنع (110405) بالكمية السليمة المستلمة
  lines.push({
    id: `jl-comp-fg-${Date.now()}`,
    accountId: "110405",
    accountCode: "110405",
    accountNameAr: "مخزون عطور ومنتجات تامة الصنع",
    debit: totalFinishedGoodsValue,
    credit: 0,
    description: `استلام ${goodQuantity} زجاجة تامة الصنع لأمر تشغيل ${workOrder.orderNumber}`,
    costCenterId: workOrder.costCenterId,
  });

  // 2. مدين: خسائر تلف وفاقد غير طبيعي (5201) في حالة وجود كسر أثناء التعبئة
  if (totalScrapLoss > 0) {
    lines.push({
      id: `jl-comp-scrap-${Date.now()}`,
      accountId: "5201",
      accountCode: "520101",
      accountNameAr: "خسائر تالف وفاقد تصنيع غير طبيعي",
      debit: totalScrapLoss,
      credit: 0,
      description: `إثبات كسر وتلف ${brokenScrapQuantity} زجاجة أثناء التعبئة والكبس [${workOrder.orderNumber}]`,
      costCenterId: workOrder.costCenterId,
    });
  }

  // 3. دائن: إقفال مخزون إنتاج تحت التشغيل (110404)
  lines.push({
    id: `jl-comp-wip-close-${Date.now()}`,
    accountId: "110404",
    accountCode: "110404",
    accountNameAr: "مخزون إنتاج تحت التشغيل (WIP - خلط وتعتيق)",
    debit: 0,
    credit: workOrder.actualRawMaterialCost,
    description: `إقفال خامات التشغيل المستنفذة لأمر ${workOrder.orderNumber}`,
    costCenterId: workOrder.costCenterId,
  });

  // 4. دائن: صرف مخزون مستلزمات التعبئة والتغليف (110403)
  if (actualPackagingCost > 0) {
    lines.push({
      id: `jl-comp-pack-${Date.now()}`,
      accountId: "110403",
      accountCode: "110403",
      accountNameAr: "مخزون مستلزمات تعبئة وتغليف (زجاجات، مضخات، علب)",
      debit: 0,
      credit: actualPackagingCost,
      description: `صرف زجاجات وبخاخات وعلب لأمر ${workOrder.orderNumber}`,
      costCenterId: workOrder.costCenterId,
    });
  }

  // 5. دائن: تكاليف صناعية غير مباشرة محملة (510201)
  const remainingCredit = (actualLaborCost || 0) + (actualOverheadCost || 0);
  if (remainingCredit > 0) {
    lines.push({
      id: `jl-comp-moh-${Date.now()}`,
      accountId: "5102",
      accountCode: "510201",
      accountNameAr: "تكاليف صناعية غير مباشرة محملة (MOH Applied)",
      debit: 0,
      credit: remainingCredit,
      description: `تحميل عمالة وتكاليف صناعية إضافية لأمر ${workOrder.orderNumber}`,
      costCenterId: workOrder.costCenterId,
    });
  }

  return {
    id: `je-wo-comp-${Date.now()}`,
    entryNumber: `JV-MFG-COMP-${Date.now().toString().slice(-4)}`,
    date: new Date().toISOString().split("T")[0],
    description: `إتمام تشغيل واستلام تام الصنع [${workOrder.orderNumber}] - ${workOrder.finishedItemNameAr}`,
    referenceType: "MANUFACTURING",
    referenceId: workOrder.orderNumber,
    costCenterId: workOrder.costCenterId,
    lines,
    totalDebit,
    totalCredit: totalDebit,
    status: "POSTED",
    createdAt: new Date().toISOString(),
    createdBy: "محرك التصنيع الآلي (Perfume Engine)",
  };
}
