export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export type AccountNature = 'DEBIT' | 'CREDIT';

export interface Account {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  type: AccountType;
  nature: AccountNature;
  parentId: string | null;
  level: number;
  isLeaf: boolean;
  description: string;
  balance: number;
  isActive?: boolean;
}

export type JournalEntryStatus = 'DRAFT' | 'POSTED' | 'REVERSED';

export interface JournalEntryLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountNameAr: string;
  description?: string;
  debit: number;
  credit: number;
  costCenterId?: string;
  costCenterNameAr?: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  referenceType: 
    | 'MANUAL' 
    | 'OPENING' 
    | 'PURCHASE' 
    | 'PRODUCTION' 
    | 'MANUFACTURING'
    | 'SHOPIFY_SALE' 
    | 'SALES_INVOICE'
    | 'COGS'
    | 'SETTLEMENT' 
    | 'BANK_TRANSFER';
  referenceId?: string;
  status: JournalEntryStatus;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  createdAt: string;
  createdBy: string;
  costCenterId?: string;
  costCenterNameAr?: string;
  isReversal?: boolean;
  reversalOfId?: string;
  reversalReason?: string;
}

export interface TrialBalanceRow {
  accountCode: string;
  accountNameAr: string;
  accountType: AccountType;
  nature: AccountNature;
  debit: number;
  credit: number;
  netBalance: number;
}

export interface CostCenter {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  type: 'PRODUCTION_LINE' | 'SALES_CHANNEL' | 'ADMIN' | 'OTHER';
  status: 'ACTIVE' | 'INACTIVE';
  description: string;
  totalDebit: number;   // المصاريف والتكاليف
  totalCredit: number;  // الإيرادات
  netProfit: number;    // صافي الربح = الإيرادات - المصاريف
}
