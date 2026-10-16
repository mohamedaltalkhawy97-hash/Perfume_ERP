import { Account, JournalEntry, JournalEntryLine, TrialBalanceRow } from '@/types/accounting';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  totalDebit: number;
  totalCredit: number;
  difference: number;
}

/**
 * فحص صحة وتوازن القيد المحاسبي المزدوج
 */
export function validateJournalEntry(
  lines: Array<{ accountId: string; debit: number; credit: number; description?: string }>,
  accounts: Account[]
): ValidationResult {
  const errors: string[] = [];

  if (!lines || lines.length < 2) {
    errors.push('يجب أن يحتوي القيد على طرفين على الأقل (حساب مدين وحساب دائن).');
  }

  let totalDebit = 0;
  let totalCredit = 0;

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const debit = Number(line.debit) || 0;
    const credit = Number(line.credit) || 0;

    if (debit < 0 || credit < 0) {
      errors.push(`السطر ${lineNum}: لا يمكن إدخال مبالغ سالبة في القيد.`);
    }

    if (debit === 0 && credit === 0) {
      errors.push(`السطر ${lineNum}: يجب تحديد مبلغ في خانة المدين أو الدائن.`);
    }

    if (debit > 0 && credit > 0) {
      errors.push(`السطر ${lineNum}: لا يمكن وضع مبلغ في المدين والدائن لنفس الحساب في نفس السطر.`);
    }

    const account = accounts.find((a) => a.id === line.accountId);
    if (!account) {
      errors.push(`السطر ${lineNum}: الحساب المحدد غير موجود في شجرة الحسابات.`);
    } else if (!account.isLeaf) {
      errors.push(`السطر ${lineNum}: الحساب "${account.nameAr}" هو حساب رئيسي/تجميعي، ولا تقبل المحاسبة الترحيل إلا على الحسابات الفرعية النهائية.`);
    }

    totalDebit += debit;
    totalCredit += credit;
  });

  // التحقق من التوازن الرياضي الحتمي
  const difference = Math.round((totalDebit - totalCredit) * 100) / 100;

  if (Math.abs(difference) > 0.001) {
    errors.push(`القيد غير متوازن رياضياً: إجمالي المدين (${totalDebit.toLocaleString('ar-EG')} ج.م) لا يتساوى مع إجمالي الدائن (${totalCredit.toLocaleString('ar-EG')} ج.م). الفارق: ${Math.abs(difference).toLocaleString('ar-EG')} ج.م.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    totalDebit,
    totalCredit,
    difference,
  };
}

/**
 * تحديث أرصدة شجرة الحسابات بعد ترحيل القيد
 */
export function calculateUpdatedAccountBalances(
  accounts: Account[],
  lines: JournalEntryLine[]
): Account[] {
  const accountMap = new Map(accounts.map((acc) => [acc.id, { ...acc }]));

  lines.forEach((line) => {
    const account = accountMap.get(line.accountId);
    if (account) {
      const debit = Number(line.debit) || 0;
      const credit = Number(line.credit) || 0;

      // الأصول والمصروفات طبيعتها مدينة: تزيد بالمدين وتنقص بالدائن
      if (account.nature === 'DEBIT') {
        account.balance += (debit - credit);
      } else {
        // الخصوم وحقوق الملكية والإيرادات طبيعتها دائنة: تزيد بالدائن وتنقص بالمدين
        account.balance += (credit - debit);
      }
    }
  });

  return Array.from(accountMap.values());
}

/**
 * توليد قيد عكسي لتصحيح أو إلغاء قيد سابق دون حذفه
 */
export function createReversalJournalEntry(
  originalEntry: JournalEntry,
  reversalReason: string,
  user: string = 'مدير النظام'
): JournalEntry {
  const reversedLines: JournalEntryLine[] = originalEntry.lines.map((line) => ({
    id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    accountId: line.accountId,
    accountCode: line.accountCode,
    accountNameAr: line.accountNameAr,
    description: `عكس: ${line.description || originalEntry.description}`,
    debit: line.credit, // عكس المدين ليصبح دائناً
    credit: line.debit, // عكس الدائن ليصبح مديناً
  }));

  return {
    id: `je-rev-${Date.now()}`,
    entryNumber: `REV-${originalEntry.entryNumber}`,
    date: new Date().toISOString().split('T')[0],
    description: `قيد عكس وتصحيح للقيد (${originalEntry.entryNumber}): ${reversalReason}`,
    referenceType: 'MANUAL',
    status: 'POSTED',
    lines: reversedLines,
    totalDebit: originalEntry.totalCredit,
    totalCredit: originalEntry.totalDebit,
    createdAt: new Date().toISOString(),
    createdBy: user,
    isReversal: true,
    reversalOfId: originalEntry.id,
    reversalReason,
  };
}

/**
 * استخراج ميزان المراجعة (Trial Balance) والتأكد من توازن كل الحسابات
 */
export function generateTrialBalance(accounts: Account[]): {
  rows: TrialBalanceRow[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
} {
  const leafAccounts = accounts.filter((a) => a.isLeaf);
  const rows: TrialBalanceRow[] = [];

  let totalDebit = 0;
  let totalCredit = 0;

  leafAccounts.forEach((acc) => {
    let debit = 0;
    let credit = 0;

    if (acc.nature === 'DEBIT') {
      if (acc.balance >= 0) {
        debit = acc.balance;
      } else {
        credit = Math.abs(acc.balance);
      }
    } else {
      if (acc.balance >= 0) {
        credit = acc.balance;
      } else {
        debit = Math.abs(acc.balance);
      }
    }

    totalDebit += debit;
    totalCredit += credit;

    rows.push({
      accountCode: acc.code,
      accountNameAr: acc.nameAr,
      accountType: acc.type,
      nature: acc.nature,
      debit,
      credit,
      netBalance: acc.balance,
    });
  });

  const isBalanced = Math.abs(Math.round((totalDebit - totalCredit) * 100) / 100) < 0.01;

  return {
    rows,
    totalDebit,
    totalCredit,
    isBalanced,
  };
}
