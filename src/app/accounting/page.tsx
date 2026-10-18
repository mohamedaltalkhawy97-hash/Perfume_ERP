"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Building2, 
  Receipt, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  Layers, 
  BookOpen, 
  Scale, 
  Sparkles,
  Trash2,
  Printer,
  Folder,
  FolderOpen,
  FileText,
  Wallet,
  TrendingUp,
  Calendar,
  X,
  FileSpreadsheet,
  Target,
  FolderPlus,
  ArrowRight,
  Pencil,
  ChevronDown,
  ChevronRight,
  CreditCard,
  ArrowRightLeft,
  DollarSign,
  AlertTriangle
} from "lucide-react";
import { INITIAL_CHART_OF_ACCOUNTS } from "@/lib/default-accounts";
import { INITIAL_COST_CENTERS } from "@/lib/default-cost-centers";
import { Account, JournalEntry, JournalEntryLine, CostCenter } from "@/types/accounting";
import { 
  validateJournalEntry, 
  calculateUpdatedAccountBalances, 
  createReversalJournalEntry, 
  generateTrialBalance 
} from "@/lib/accounting-engine";

function AccountingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  type TabType = "chart" | "cost_centers" | "banks" | "entries" | "trial";
  const [activeTab, setActiveTab] = useState<TabType>("chart");

  const [accounts, setAccounts] = useState<Account[]>(INITIAL_CHART_OF_ACCOUNTS);
  const [costCenters, setCostCenters] = useState<CostCenter[]>(INITIAL_COST_CENTERS);
  
  // Sample initial opening entry
  const [entries, setEntries] = useState<JournalEntry[]>([
    {
      id: "je-open-01",
      entryNumber: "JE-2026-0001",
      date: new Date().toISOString().split("T")[0],
      description: "قيد افتتاحي: إثبات إيداع رأس مال المصنع في البنك التجاري والخزينة الرئيسية",
      referenceType: "OPENING",
      status: "POSTED",
      createdAt: new Date().toISOString(),
      createdBy: "م. محمد جمعة",
      totalDebit: 250000,
      totalCredit: 250000,
      lines: [
        {
          id: "l1",
          accountId: "acc-110101",
          accountCode: "110101",
          accountNameAr: "الخزينة الرئيسية (الكاش)",
          description: "حصة نقدية في الخزينة الرئيسية",
          debit: 50000,
          credit: 0,
        },
        {
          id: "l2",
          accountId: "acc-110102",
          accountCode: "110102",
          accountNameAr: "الحساب البنكي (البنك التجاري CIB)",
          description: "إيداع بنكي لحساب تأسيس المصنع",
          debit: 200000,
          credit: 0,
        },
        {
          id: "l3",
          accountId: "acc-3101",
          accountCode: "3101",
          accountNameAr: "رأس المال المدفوع",
          description: "إثبات رأس مال الشركاء المسجل",
          debit: 0,
          credit: 250000,
        },
      ],
    },
  ]);

  // Read URL params on load or change
  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabType;
    if (tabParam && ["chart", "cost_centers", "banks", "entries", "trial"].includes(tabParam)) {
      setActiveTab(tabParam);
    }

    const actionParam = searchParams.get("action");
    if (actionParam === "new_entry") {
      setShowNewEntryModal(true);
    } else if (actionParam === "new_cost_center") {
      openAddCostCenter();
    } else if (actionParam === "new_account") {
      openAddSubAccountModal();
    }
  }, [searchParams]);

  // Switch Tab Handler with URL sync
  const handleSwitchTab = (tab: TabType) => {
    setActiveTab(tab);
    window.history.replaceState(null, "", `/accounting?tab=${tab}`);
  };

  // Filters for Chart of Accounts
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  // Collapsed accounts state (for expandable tree view)
  const [collapsedIds, setCollapsedIds] = useState<Record<string, boolean>>({});
  const toggleCollapse = (accId: string) => {
    setCollapsedIds((prev) => ({ ...prev, [accId]: !prev[accId] }));
  };

  // Statement / Ledger modal state
  const [selectedAccountForStatement, setSelectedAccountForStatement] = useState<Account | null>(null);

  // ==========================================
  // MODAL 1: ADD SUB-ACCOUNT (إضافة حساب فرعي)
  // ==========================================
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccParentId, setNewAccParentId] = useState<string>("");
  const [newAccCode, setNewAccCode] = useState("");
  const [newAccNameAr, setNewAccNameAr] = useState("");
  const [newAccNameEn, setNewAccNameEn] = useState("");
  const [newAccDesc, setNewAccDesc] = useState("");

  const handleSelectParentForNewAccount = (parentId: string) => {
    setNewAccParentId(parentId);
    const parent = accounts.find((a) => a.id === parentId);
    if (parent) {
      const siblings = accounts.filter((a) => a.parentId === parentId);
      let nextSuffix = "01";
      if (siblings.length > 0) {
        const lastSibling = siblings[siblings.length - 1];
        const numPart = parseInt(lastSibling.code.slice(parent.code.length)) || siblings.length;
        nextSuffix = String(numPart + 1).padStart(2, "0");
      }
      setNewAccCode(`${parent.code}${nextSuffix}`);
    }
  };

  const openAddSubAccountModal = (parentAcc?: Account) => {
    const parent = parentAcc || accounts.find((a) => !a.isLeaf) || accounts[0];
    if (parent) {
      handleSelectParentForNewAccount(parent.id);
    }
    setNewAccNameAr("");
    setNewAccNameEn("");
    setNewAccDesc("");
    setShowAddAccountModal(true);
  };

  const handleSaveSubAccount = () => {
    if (!newAccCode || !newAccNameAr || !newAccParentId) {
      alert("يرجى ملء جميع الحقول الإلزامية.");
      return;
    }

    const parent = accounts.find((a) => a.id === newAccParentId);
    if (!parent) return;

    if (accounts.some((a) => a.code === newAccCode)) {
      alert(`كود الحساب ${newAccCode} موجود بالفعل! يرجى اختيار كود آخر.`);
      return;
    }

    const newAccount: Account = {
      id: `acc-${newAccCode}`,
      code: newAccCode,
      nameAr: newAccNameAr,
      nameEn: newAccNameEn || newAccNameAr,
      type: parent.type,
      nature: parent.nature,
      level: parent.level + 1,
      parentId: parent.id,
      isLeaf: true,
      balance: 0,
      description: newAccDesc || `حساب فرعي تابع لـ ${parent.nameAr}`,
      isActive: true,
    };

    const updatedAccounts = accounts.map((a) => {
      if (a.id === parent.id && a.isLeaf) {
        return { ...a, isLeaf: false };
      }
      return a;
    });

    setAccounts([...updatedAccounts, newAccount]);
    setShowAddAccountModal(false);
  };

  // ==========================================
  // EDIT & DELETE ACCOUNT HANDLERS
  // ==========================================
  const [showEditAccountModal, setShowEditAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editAccNameAr, setEditAccNameAr] = useState("");
  const [editAccNameEn, setEditAccNameEn] = useState("");
  const [editAccDesc, setEditAccDesc] = useState("");

  const handleOpenEditAccount = (acc: Account) => {
    setEditingAccount(acc);
    setEditAccNameAr(acc.nameAr);
    setEditAccNameEn(acc.nameEn);
    setEditAccDesc(acc.description || "");
    setShowEditAccountModal(true);
  };

  const handleSaveEditAccount = () => {
    if (!editingAccount || !editAccNameAr) return;
    setAccounts(accounts.map((a) => 
      a.id === editingAccount.id 
        ? { ...a, nameAr: editAccNameAr, nameEn: editAccNameEn || editAccNameAr, description: editAccDesc } 
        : a
    ));
    setShowEditAccountModal(false);
  };

  const handleDeleteAccount = (acc: Account) => {
    const hasChildren = accounts.some((a) => a.parentId === acc.id);
    if (hasChildren) {
      alert(`⚠️ لا يمكن حذف الحساب [${acc.nameAr}] كود (${acc.code}) لأنه يحتوي على حسابات فرعية متفرعة منه.`);
      return;
    }

    if (acc.balance !== 0) {
      alert(`⚠️ لا يمكن حذف الحساب [${acc.nameAr}] لأن رصيده الدفتري ليس صفراً (${acc.balance.toLocaleString("ar-EG")} ج.م).`);
      return;
    }

    const hasJournalLines = entries.some((je) => 
      je.lines.some((l) => l.accountId === acc.id || l.accountCode === acc.code)
    );
    if (hasJournalLines) {
      alert(`⚠️ حماية تدقيقية: لا يمكن حذف الحساب [${acc.nameAr}] لأنه مسجل به حركات وقيود يومية سابقة.`);
      return;
    }

    if (confirm(`هل أنت متأكد من رغبتك في حذف الحساب [${acc.nameAr}] كود: ${acc.code} نهائياً؟`)) {
      setAccounts(accounts.filter((a) => a.id !== acc.id));
    }
  };

  // ==========================================
  // MODAL 2: ADD COST CENTER (إضافة مركز تكلفة)
  // ==========================================
  const [showAddCostCenterModal, setShowAddCostCenterModal] = useState(false);
  const [ccCode, setCcCode] = useState("");
  const [ccNameAr, setCcNameAr] = useState("");
  const [ccType, setCcType] = useState<CostCenter["type"]>("PRODUCTION_LINE");
  const [ccDesc, setCcDesc] = useState("");

  const openAddCostCenter = () => {
    setCcCode(`CC-${100 + costCenters.length + 1}`);
    setCcNameAr("");
    setCcType("PRODUCTION_LINE");
    setCcDesc("");
    setShowAddCostCenterModal(true);
  };

  const handleSaveCostCenter = () => {
    if (!ccCode || !ccNameAr) {
      alert("يرجى إدخال كود واسم مركز التكلفة.");
      return;
    }

    const newCC: CostCenter = {
      id: `cc-${Date.now()}`,
      code: ccCode,
      nameAr: ccNameAr,
      nameEn: ccNameAr,
      type: ccType,
      status: "ACTIVE",
      description: ccDesc || "مركز تكلفة للنشاط",
      totalDebit: 0,
      totalCredit: 0,
      netProfit: 0,
    };

    setCostCenters([...costCenters, newCC]);
    setShowAddCostCenterModal(false);
  };

  // ==========================================
  // MODAL 3: JOURNAL ENTRY WITH COST CENTERS
  // ==========================================
  const [showNewEntryModal, setShowNewEntryModal] = useState(false);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0]);
  const [entryDesc, setEntryDesc] = useState("");
  const [entryLines, setEntryLines] = useState<Array<{ 
    accountId: string; 
    debit: number; 
    credit: number; 
    description: string;
    costCenterId?: string;
  }>>([
    { accountId: "", debit: 0, credit: 0, description: "", costCenterId: "" },
    { accountId: "", debit: 0, credit: 0, description: "", costCenterId: "" },
  ]);

  // Leaf accounts for entry posting
  const leafAccounts = useMemo(() => accounts.filter((a) => a.isLeaf), [accounts]);

  // Live validation
  const validation = useMemo(() => {
    return validateJournalEntry(entryLines, accounts);
  }, [entryLines, accounts]);

  const nextEntryNumber = useMemo(() => {
    return `JE-2026-${String(entries.length + 1).padStart(4, "0")}`;
  }, [entries]);

  const addEntryLine = () => {
    setEntryLines([...entryLines, { accountId: "", debit: 0, credit: 0, description: "", costCenterId: "" }]);
  };

  const removeEntryLine = (index: number) => {
    if (entryLines.length <= 2) return;
    setEntryLines(entryLines.filter((_, idx) => idx !== index));
  };

  const handleLineChange = (index: number, field: string, value: any) => {
    const updated = [...entryLines];
    if (field === "debit") {
      updated[index].debit = parseFloat(value) || 0;
      if (updated[index].debit > 0) updated[index].credit = 0;
    } else if (field === "credit") {
      updated[index].credit = parseFloat(value) || 0;
      if (updated[index].credit > 0) updated[index].debit = 0;
    } else {
      (updated[index] as any)[field] = value;
    }
    setEntryLines(updated);
  };

  // Submit and Post Journal Entry
  const handlePostEntry = () => {
    if (!validation.isValid) return;

    const formattedLines: JournalEntryLine[] = entryLines.map((line, idx) => {
      const acc = accounts.find((a) => a.id === line.accountId)!;
      const cc = costCenters.find((c) => c.id === line.costCenterId);
      return {
        id: `line-${Date.now()}-${idx}`,
        accountId: acc.id,
        accountCode: acc.code,
        accountNameAr: acc.nameAr,
        description: line.description || entryDesc,
        debit: line.debit,
        credit: line.credit,
        costCenterId: line.costCenterId,
        costCenterNameAr: cc ? cc.nameAr : undefined,
      };
    });

    const newEntry: JournalEntry = {
      id: `je-${Date.now()}`,
      entryNumber: nextEntryNumber,
      date: entryDate,
      description: entryDesc || "قيد يومية يدوي",
      referenceType: "MANUAL",
      status: "POSTED",
      lines: formattedLines,
      totalDebit: validation.totalDebit,
      totalCredit: validation.totalCredit,
      createdAt: new Date().toISOString(),
      createdBy: "م. محمد جمعة",
    };

    setEntries([newEntry, ...entries]);
    setAccounts(calculateUpdatedAccountBalances(accounts, formattedLines));

    setShowNewEntryModal(false);
    setEntryDesc("");
    setEntryLines([
      { accountId: "", debit: 0, credit: 0, description: "", costCenterId: "" },
      { accountId: "", debit: 0, credit: 0, description: "", costCenterId: "" },
    ]);

    // Switch to entries tab to view the posted entry
    handleSwitchTab("entries");
  };

  // Reverse Entry Handler
  const handleReverseEntry = (entry: JournalEntry) => {
    if (confirm(`هل أنت متأكد من عكس وإلغاء القيد [${entry.entryNumber}]؟ سيتم توليد قيد عكسي معتمد.`)) {
      const reversal = createReversalJournalEntry(entry, "عكس قيد بتوجيه الإدارة المالية", "م. محمد جمعة");
      setEntries([reversal, ...entries.map((e) => e.id === entry.id ? { ...e, status: "REVERSED" as const } : e)]);
      setAccounts(calculateUpdatedAccountBalances(accounts, reversal.lines));
    }
  };

  // ==========================================
  // MODAL 4: BANK & CASH TRANSFER (تحويل أموال)
  // ==========================================
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferFromAcc, setTransferFromAcc] = useState("acc-110101");
  const [transferToAcc, setTransferToAcc] = useState("acc-110102");
  const [transferAmount, setTransferAmount] = useState<number>(10000);
  const [transferDesc, setTransferDesc] = useState("إيداع نقدي من الخزينة لحساب البنك CIB");

  const handleExecuteTransfer = () => {
    if (transferAmount <= 0) {
      alert("يرجى إدخال مبلغ صحيح للتحويل.");
      return;
    }
    if (transferFromAcc === transferToAcc) {
      alert("لا يمكن التحويل لنفس الحساب.");
      return;
    }

    const fromAcc = accounts.find((a) => a.id === transferFromAcc);
    const toAcc = accounts.find((a) => a.id === transferToAcc);
    if (!fromAcc || !toAcc) return;

    const entryLines: JournalEntryLine[] = [
      {
        id: `tl-1-${Date.now()}`,
        accountId: toAcc.id,
        accountCode: toAcc.code,
        accountNameAr: toAcc.nameAr,
        debit: transferAmount,
        credit: 0,
        description: `استلام تحويل من ${fromAcc.nameAr}`,
      },
      {
        id: `tl-2-${Date.now()}`,
        accountId: fromAcc.id,
        accountCode: fromAcc.code,
        accountNameAr: fromAcc.nameAr,
        debit: 0,
        credit: transferAmount,
        description: `تحويل صادر إلى ${toAcc.nameAr}`,
      },
    ];

    const transferEntry: JournalEntry = {
      id: `je-transfer-${Date.now()}`,
      entryNumber: `JV-TRF-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split("T")[0],
      description: transferDesc,
      referenceType: "BANK_TRANSFER",
      status: "POSTED",
      lines: entryLines,
      totalDebit: transferAmount,
      totalCredit: transferAmount,
      createdAt: new Date().toISOString(),
      createdBy: "أمين الخزينة والحسابات",
    };

    setEntries([transferEntry, ...entries]);
    setAccounts(calculateUpdatedAccountBalances(accounts, entryLines));
    setShowTransferModal(false);
    alert(`✅ تم إتمام التحويل المالي (${transferAmount.toLocaleString("ar-EG")} ج.م) وقيده في الدفاتر بنجاح!`);
  };

  // Trial Balance calculation
  const trialBalance = useMemo(() => {
    return generateTrialBalance(accounts);
  }, [accounts]);

  // Cash and Bank Balances
  const cashAndBanksBalance = useMemo(() => {
    return accounts
      .filter((a) => a.code.startsWith("1101") && a.isLeaf)
      .reduce((sum, a) => sum + a.balance, 0);
  }, [accounts]);

  const accountTypeNames: Record<string, string> = {
    ASSET: "أصول",
    LIABILITY: "خصوم",
    EQUITY: "حقوق ملكية",
    REVENUE: "إيرادات",
    EXPENSE: "مصروفات وتكاليف",
  };

  const costCenterTypeNames: Record<string, string> = {
    PRODUCTION_LINE: "خط إنتاج وتصنيع",
    SALES_CHANNEL: "قناة مبيعات وتوزيع",
    ADMINISTRATIVE: "إداري وعمومي",
  };

  // Filtered accounts for display
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const matchesSearch = acc.nameAr.includes(searchQuery) || acc.code.includes(searchQuery);
      const matchesType = typeFilter === "ALL" || acc.type === typeFilter;
      
      // If a parent is collapsed, check if this account is a descendant of a collapsed account
      if (acc.parentId && collapsedIds[acc.parentId]) {
        return false;
      }

      return matchesSearch && matchesType;
    });
  }, [accounts, searchQuery, typeFilter, collapsedIds]);

  return (
    <div className="space-y-6">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & BREADCRUMBS & ACTION BUTTONS                              */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5 font-medium">
            <span>الرئيسية</span>
            <span>/</span>
            <span className="text-blue-700 font-bold">الحسابات العامة ومراكز التكلفة</span>
          </nav>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                الحسابات العامة، القيود، ومراكز التكلفة
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                دليل وشجرة الحسابات، دفاتر القيود اليومية، ميزان المراجعة، ومراكز ربحية خطوط الإنتاج
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Add Sub-Account Button */}
          <button
            onClick={() => openAddSubAccountModal()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-emerald-600" />
            <span>+ إضافة حساب فرعي</span>
          </button>

          {/* Add Cost Center Button */}
          <button
            onClick={openAddCostCenter}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer"
          >
            <Target className="w-4 h-4 text-purple-600" />
            <span>+ مركز تكلفة</span>
          </button>

          {/* Add Journal Entry Button */}
          <button
            onClick={() => setShowNewEntryModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ أضف قيد يومية</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DAFTRA 4 SUMMARY KPI CARDS                                            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Cash & Banks */}
        <div 
          onClick={() => handleSwitchTab("banks")}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between cursor-pointer hover:border-emerald-500 transition-all"
        >
          <div className="space-y-1">
            <span className="block text-xs font-medium text-slate-500">النقدية والبنوك المتاحة</span>
            <span className="text-2xl font-black font-mono text-emerald-700 block tracking-tight">
              {cashAndBanksBalance.toLocaleString("ar-EG")} <span className="text-xs font-sans text-slate-500 font-normal">ج.م</span>
            </span>
            <span className="text-[11px] text-slate-400 block">الخزينة (50k) + البنك CIB (200k)</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Total Assets */}
        <div 
          onClick={() => handleSwitchTab("chart")}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between cursor-pointer hover:border-blue-500 transition-all"
        >
          <div className="space-y-1">
            <span className="block text-xs font-medium text-slate-500">إجمالي الأصول (المدينة)</span>
            <span className="text-2xl font-black font-mono text-blue-700 block tracking-tight">
              {trialBalance.totalDebit.toLocaleString("ar-EG")} <span className="text-xs font-sans text-slate-500 font-normal">ج.م</span>
            </span>
            <span className="text-[11px] text-slate-400 block">نقدية + مخازن خامات ومواد</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Active Cost Centers */}
        <div 
          onClick={() => handleSwitchTab("cost_centers")}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between cursor-pointer hover:border-purple-500 transition-all"
        >
          <div className="space-y-1">
            <span className="block text-xs font-medium text-slate-500">مراكز التكلفة النشطة</span>
            <span className="text-2xl font-black font-mono text-purple-700 block tracking-tight">
              {costCenters.length} <span className="text-xs font-sans text-slate-500 font-normal">مراكز</span>
            </span>
            <span className="text-[11px] text-purple-700 font-bold block">خطوط إنتاج وقنوات مبيعات</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
            <Target className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Accounting Balance Status */}
        <div 
          onClick={() => handleSwitchTab("trial")}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between cursor-pointer hover:border-emerald-500 transition-all"
        >
          <div className="space-y-1">
            <span className="block text-xs font-bold text-slate-700">توازن الدفاتر المحاسبية</span>
            <span className="text-sm font-extrabold text-emerald-800 block">
              {trialBalance.isBalanced ? "متطابق ومتوازن 100%" : "يوجد فارق غير متوازن"}
            </span>
            <span className="text-[11px] text-slate-500 block">معادلة القيد المزدوج الإلزامية</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
            <Scale className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. 5 SUB-TABS NAVIGATION STRIP                                            */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        
        <div className="flex border-b border-slate-200 px-4 gap-6 overflow-x-auto">
          {/* Tab 1: Chart */}
          <button
            onClick={() => handleSwitchTab("chart")}
            className={`py-3.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === "chart"
                ? "border-emerald-700 text-emerald-800 font-extrabold"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>دليل وشجرة الحسابات ({accounts.length})</span>
          </button>

          {/* Tab 2: Cost Centers */}
          <button
            onClick={() => handleSwitchTab("cost_centers")}
            className={`py-3.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === "cost_centers"
                ? "border-purple-700 text-purple-800 font-extrabold"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Target className="w-4 h-4 text-purple-600" />
            <span>مراكز التكلفة وخطوط الإنتاج ({costCenters.length})</span>
          </button>

          {/* Tab 3: Banks & Cash Boxes (NEW) */}
          <button
            onClick={() => handleSwitchTab("banks")}
            className={`py-3.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === "banks"
                ? "border-blue-700 text-blue-800 font-extrabold"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <CreditCard className="w-4 h-4 text-blue-600" />
            <span>الخزائن والحسابات البنكية (Cash & Banks)</span>
          </button>

          {/* Tab 4: Journal Entries */}
          <button
            onClick={() => handleSwitchTab("entries")}
            className={`py-3.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === "entries"
                ? "border-emerald-700 text-emerald-800 font-extrabold"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>دفتر القيود اليومية ({entries.length})</span>
          </button>

          {/* Tab 5: Trial Balance */}
          <button
            onClick={() => handleSwitchTab("trial")}
            className={`py-3.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === "trial"
                ? "border-emerald-700 text-emerald-800 font-extrabold"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Scale className="w-4 h-4 text-emerald-600" />
            <span>ميزان المراجعة (Trial Balance)</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: CHART OF ACCOUNTS (Tree View with Expand/Collapse)                 */}
        {/* ========================================================================= */}
        {activeTab === "chart" && (
          <div className="p-4 space-y-4">
            
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 shrink-0" />
                <input
                  type="text"
                  placeholder="ابحث برقم الكود أو اسم الحساب..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-9 pl-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                <span className="text-xs text-slate-500 font-bold shrink-0 ml-1">تصفية:</span>
                {["ALL", "ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-3 py-1 text-xs rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      typeFilter === type
                        ? "bg-emerald-700 text-white"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {type === "ALL" ? "الكل" : accountTypeNames[type]}
                  </button>
                ))}
              </div>
            </div>

            {/* Tree Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-32">كود الحساب</th>
                    <th className="py-3 px-4">اسم الحساب في الدليل</th>
                    <th className="py-3 px-4 w-28">النوع</th>
                    <th className="py-3 px-4 w-28">طبيعة الحساب</th>
                    <th className="py-3 px-4 w-36">المستوى والتصنيف</th>
                    <th className="py-3 px-4 text-left w-36">الرصيد الدفتري</th>
                    <th className="py-3 px-4 text-center w-28">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAccounts.map((acc) => {
                    const isParent = !acc.isLeaf;
                    const isCollapsed = collapsedIds[acc.id];

                    return (
                      <tr 
                        key={acc.id}
                        className={`hover:bg-slate-50/80 transition-colors group ${
                          acc.level === 1 ? "bg-slate-50/70 font-extrabold text-slate-900" : ""
                        }`}
                      >
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-700">
                          {acc.code}
                        </td>

                        <td className="py-2.5 px-4">
                          <div 
                            className="flex items-center gap-1.5"
                            style={{ paddingRight: `${(acc.level - 1) * 20}px` }}
                          >
                            {isParent ? (
                              <button
                                onClick={() => toggleCollapse(acc.id)}
                                className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer transition-colors"
                                title={isCollapsed ? "توسيع الشجرة" : "طي الشجرة"}
                              >
                                {isCollapsed ? (
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5 text-emerald-700" />
                                )}
                              </button>
                            ) : (
                              <span className="w-5 inline-block text-slate-300 text-center">•</span>
                            )}

                            {isParent ? (
                              <Folder className={`w-4 h-4 shrink-0 ${isCollapsed ? "text-amber-500" : "text-amber-600"}`} />
                            ) : (
                              <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            )}

                            <span 
                              onClick={() => {
                                if (acc.isLeaf) setSelectedAccountForStatement(acc);
                              }}
                              className={`cursor-pointer hover:text-emerald-700 transition-colors ${
                                acc.level === 1 ? "text-sm font-black text-slate-900" : acc.isLeaf ? "text-slate-800 font-medium hover:underline" : "font-bold text-slate-800"
                              }`}
                            >
                              {acc.nameAr}
                            </span>
                            
                            {acc.nameEn && (
                              <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                                ({acc.nameEn})
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {accountTypeNames[acc.type]}
                          </span>
                        </td>

                        <td className="py-2.5 px-4 text-xs font-mono">
                          {acc.nature === "DEBIT" ? (
                            <span className="text-blue-700 font-bold">• مدين (+)</span>
                          ) : (
                            <span className="text-amber-700 font-bold">• دائن (-)</span>
                          )}
                        </td>

                        <td className="py-2.5 px-4 text-xs">
                          {acc.isLeaf ? (
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-200">
                              حساب تحليلي
                            </span>
                          ) : (
                            <span className="text-slate-600">رئيسي (مستوى {acc.level})</span>
                          )}
                        </td>

                        <td className="py-2.5 px-4 text-left font-mono font-bold">
                          {acc.isLeaf ? (
                            <span className={acc.balance > 0 ? "text-emerald-700 font-extrabold" : acc.balance < 0 ? "text-red-600 font-extrabold" : "text-slate-400"}>
                              {acc.balance.toLocaleString("ar-EG")} ج.م
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        <td className="py-2.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* 1. Add Sub-Account */}
                            <button
                              onClick={() => openAddSubAccountModal(acc)}
                              className="w-7 h-7 rounded-md flex items-center justify-center text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                              title={`إضافة حساب فرعي تحت ${acc.nameAr}`}
                            >
                              <Plus className="w-3.5 h-3.5 text-emerald-600" />
                            </button>

                            {/* 2. Edit Account */}
                            <button
                              onClick={() => handleOpenEditAccount(acc)}
                              className="w-7 h-7 rounded-md flex items-center justify-center text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                              title={`تعديل اسم وبيانات ${acc.nameAr}`}
                            >
                              <Pencil className="w-3.5 h-3.5 text-blue-600" />
                            </button>

                            {/* 3. Delete Account */}
                            <button
                              onClick={() => handleDeleteAccount(acc)}
                              className="w-7 h-7 rounded-md flex items-center justify-center text-slate-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                              title={`حذف الحساب ${acc.nameAr}`}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: COST CENTERS (مراكز التكلفة)                                       */}
        {/* ========================================================================= */}
        {activeTab === "cost_centers" && (
          <div className="p-4 space-y-4">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-purple-50/70 border border-purple-200 p-4 rounded-xl text-xs text-purple-950">
              <div className="flex items-center gap-2.5">
                <Target className="w-6 h-6 text-purple-700 shrink-0" />
                <div>
                  <strong className="block text-sm font-extrabold text-purple-900">
                    مراكز التكلفة وخطوط الإنتاج (Cost Centers P&L)
                  </strong>
                  <span className="text-slate-600 block mt-0.5 leading-relaxed">
                    تتبع أرباح ومصروفات كل خط إنتاج عطور (فرنسي، شرقي، معطرات) وقنوات البيع (معرض الكاشير، متجر Shopify) بشكل مستقل.
                  </span>
                </div>
              </div>

              <button
                onClick={openAddCostCenter}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-xs transition-all shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ إضافة خط إنتاج / مركز تكلفة</span>
              </button>
            </div>

            {/* Cost Centers Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-28">كود المركز</th>
                    <th className="py-3 px-4">اسم مركز التكلفة والنشاط</th>
                    <th className="py-3 px-4 w-36">النوع والتصنيف</th>
                    <th className="py-3 px-4 text-left w-36">المصاريف المحملة (ج.م)</th>
                    <th className="py-3 px-4 text-left w-36">الإيرادات المحققة (ج.م)</th>
                    <th className="py-3 px-4 text-left w-36">صافي الربحية (ج.م)</th>
                    <th className="py-3 px-4 text-center w-24">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {costCenters.map((cc) => (
                    <tr key={cc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-extrabold text-purple-700">
                        {cc.code}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block text-xs">{cc.nameAr}</span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">{cc.description}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {costCenterTypeNames[cc.type]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-left font-mono font-bold text-amber-700">
                        {cc.totalDebit > 0 ? cc.totalDebit.toLocaleString("ar-EG") : "0"} ج.م
                      </td>
                      <td className="py-3 px-4 text-left font-mono font-bold text-blue-700">
                        {cc.totalCredit > 0 ? cc.totalCredit.toLocaleString("ar-EG") : "0"} ج.م
                      </td>
                      <td className="py-3 px-4 text-left font-mono font-extrabold">
                        <span className={cc.netProfit > 0 ? "text-emerald-700" : cc.netProfit < 0 ? "text-red-600" : "text-slate-500"}>
                          {cc.netProfit.toLocaleString("ar-EG")} ج.م
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          نشط
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: BANKS & CASH BOXES (الخزائن والحسابات البنكية)                      */}
        {/* ========================================================================= */}
        {activeTab === "banks" && (
          <div className="p-4 space-y-6">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-blue-50 border border-blue-200 p-4 rounded-xl text-xs text-blue-950">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-6 h-6 text-blue-700 shrink-0" />
                <div>
                  <strong className="block text-sm font-extrabold text-blue-900">
                    الخزائن النقدية، الحسابات البنكية، ووسطاء التحصيل الإلكتروني
                  </strong>
                  <span className="text-slate-600 block mt-0.5 leading-relaxed">
                    إدارة السيولة النقدية بمصنع العطور، حساب البنك التجاري الدولي (CIB)، ومحافظ الدفع الإلكتروني وإنستاباي.
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowTransferModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-all shrink-0 cursor-pointer"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>+ تحويل أموال بين الخزائن والبنوك</span>
              </button>
            </div>

            {/* Treasury Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Account 1: Main Cash Box */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-emerald-700">110101</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">نقدية كاش</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">الخزينة الرئيسية للمصنع</h4>
                  <p className="text-xs text-slate-500">مسؤول الخزينة: أمين الصندوق</p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">الرصيد الفعلي:</span>
                  <span className="font-mono text-base font-black text-emerald-700">50,000 ج.م</span>
                </div>
              </div>

              {/* Account 2: CIB Bank Account */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-700">110102</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">بنك تجاري</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">البنك التجاري الدولي (CIB)</h4>
                  <p className="text-xs text-slate-500">حساب جارٍ رقم: 1000459821</p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">الرصيد الدفتري:</span>
                  <span className="font-mono text-base font-black text-blue-700">200,000 ج.م</span>
                </div>
              </div>

              {/* Account 3: E-Wallets & InstaPay */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-purple-700">110103</span>
                  <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">إنستاباي</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">محافظ إلكترونية وإنستاباي</h4>
                  <p className="text-xs text-slate-500">رقم الهاتف: 01099988776</p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">الرصيد الحالي:</span>
                  <span className="font-mono text-base font-bold text-slate-600">0.00 ج.م</span>
                </div>
              </div>

              {/* Account 4: Paymob & Tap Gateway */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-700">110204</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">وسيط معلق</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">وسيط بوابات الدفع (Paymob)</h4>
                  <p className="text-xs text-slate-500">مبيعات متجر شوبيفاي المعلقة</p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">الرصيد المعلق:</span>
                  <span className="font-mono text-base font-black text-amber-700">3,477 ج.م</span>
                </div>
              </div>

            </div>

            {/* Cash Movements Ledger */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-slate-800">حركات القيود اليومية المؤثرة على الخزائن والبنوك:</h3>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-right">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4 w-28">رقم القيد</th>
                      <th className="py-2.5 px-4 w-28">التاريخ</th>
                      <th className="py-2.5 px-4">البيان التوضيحي للحركة</th>
                      <th className="py-2.5 px-4 w-44">الحساب المتأثر</th>
                      <th className="py-2.5 px-4 text-left w-32">وارد (مدين)</th>
                      <th className="py-2.5 px-4 text-left w-32">صادر (دائن)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {entries.flatMap((entry) => 
                      entry.lines
                        .filter((l) => l.accountCode.startsWith("1101") || l.accountCode.startsWith("1102"))
                        .map((line, idx) => (
                          <tr key={`${entry.id}-${idx}`} className="hover:bg-slate-50">
                            <td className="py-2.5 px-4 font-mono font-bold text-slate-700">{entry.entryNumber}</td>
                            <td className="py-2.5 px-4 font-mono text-slate-500">{entry.date}</td>
                            <td className="py-2.5 px-4 font-medium text-slate-900">{line.description || entry.description}</td>
                            <td className="py-2.5 px-4 font-bold text-slate-800">{line.accountNameAr}</td>
                            <td className="py-2.5 px-4 text-left font-mono font-bold text-emerald-700">
                              {line.debit > 0 ? `${line.debit.toLocaleString("ar-EG")} ج.م` : "-"}
                            </td>
                            <td className="py-2.5 px-4 text-left font-mono font-bold text-red-600">
                              {line.credit > 0 ? `${line.credit.toLocaleString("ar-EG")} ج.م` : "-"}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: JOURNAL ENTRIES (سجل القيود اليومية)                                */}
        {/* ========================================================================= */}
        {activeTab === "entries" && (
          <div className="p-4 space-y-4">
            
            <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-lg text-xs text-emerald-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>قاعدة النزاهة المالية:</strong> القيود اليومية المعتمدة غير قابلة للتعديل المباشر أو الحذف، ويتم تصحيحها عبر <strong>قيد عكس وتصحيح</strong>.
                </span>
              </div>
              <button
                onClick={() => setShowNewEntryModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>قيد جديد</span>
              </button>
            </div>

            <div className="space-y-4">
              {entries.map((entry) => (
                <div 
                  key={entry.id}
                  className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden"
                >
                  {/* Entry Header */}
                  <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-extrabold text-xs bg-slate-200 px-2.5 py-1 rounded text-slate-800">
                        {entry.entryNumber}
                      </span>
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{entry.date}</span>
                      </span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold ${
                        entry.status === "POSTED"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-red-100 text-red-800 border border-red-200"
                      }`}>
                        {entry.status === "POSTED" ? "مرحّل بالدفاتر" : "تم إلغاؤه وعكسه"}
                      </span>
                      {entry.isReversal && (
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold border border-blue-200">
                          قيد عكس وتصحيح
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">مسؤول الإدخال: <strong className="text-slate-700">{entry.createdBy}</strong></span>
                      {entry.status === "POSTED" && !entry.isReversal && (
                        <button
                          onClick={() => handleReverseEntry(entry)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                          <span>عكس وإلغاء القيد</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="px-4 py-2.5 text-xs font-bold text-slate-800 bg-white">
                    {entry.description}
                  </div>

                  {/* Lines Table */}
                  <table className="w-full text-xs text-right border-t border-slate-100">
                    <thead className="bg-slate-50/60 text-slate-500 text-[11px] font-bold">
                      <tr>
                        <th className="py-2.5 px-4 w-28">كود الحساب</th>
                        <th className="py-2.5 px-4">اسم الحساب</th>
                        <th className="py-2.5 px-4 w-44">مركز التكلفة</th>
                        <th className="py-2.5 px-4">البيان التوضيحي</th>
                        <th className="py-2.5 px-4 text-left w-36">مدين (ج.م)</th>
                        <th className="py-2.5 px-4 text-left w-36">دائن (ج.م)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {entry.lines.map((l, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 font-mono text-slate-600 font-bold">{l.accountCode}</td>
                          <td className="py-2.5 px-4 font-bold text-slate-800">{l.accountNameAr}</td>
                          <td className="py-2.5 px-4">
                            {l.costCenterNameAr ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                                <Target className="w-3 h-3 text-purple-600" />
                                <span>{l.costCenterNameAr}</span>
                              </span>
                            ) : (
                              <span className="text-slate-300 text-xs">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 text-[11px]">{l.description}</td>
                          <td className="py-2.5 px-4 text-left font-mono font-bold text-blue-700">
                            {l.debit > 0 ? l.debit.toLocaleString("ar-EG") : "-"}
                          </td>
                          <td className="py-2.5 px-4 text-left font-mono font-bold text-amber-700">
                            {l.credit > 0 ? l.credit.toLocaleString("ar-EG") : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 text-[11px] font-bold border-t border-slate-200">
                      <tr>
                        <td colSpan={4} className="py-2 px-4 text-slate-600">إجمالي القيد:</td>
                        <td className="py-2 px-4 text-left font-mono font-black text-blue-800">
                          {entry.totalDebit.toLocaleString("ar-EG")} ج.م
                        </td>
                        <td className="py-2 px-4 text-left font-mono font-black text-amber-800">
                          {entry.totalCredit.toLocaleString("ar-EG")} ج.م
                        </td>
                      </tr>
                    </tfoot>
                  </table>

                </div>
              ))}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: TRIAL BALANCE (ميزان المراجعة)                                     */}
        {/* ========================================================================= */}
        {activeTab === "trial" && (
          <div className="p-4 space-y-4">
            
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>ميزان المراجعة التحليلي بالأرصدة (Trial Balance)</span>
              </span>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>طباعة التقرير</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-32">كود الحساب</th>
                    <th className="py-3 px-4">اسم الحساب الفرعي</th>
                    <th className="py-3 px-4 w-36">التبويب</th>
                    <th className="py-3 px-4 text-left w-44">الرصيد المدين (ج.م)</th>
                    <th className="py-3 px-4 text-left w-44">الرصيد الدائن (ج.م)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trialBalance.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-600">{row.accountCode}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-800">{row.accountNameAr}</td>
                      <td className="py-2.5 px-4 text-slate-500">{accountTypeNames[row.accountType]}</td>
                      <td className="py-2.5 px-4 text-left font-mono font-bold text-blue-700">
                        {row.debit > 0 ? row.debit.toLocaleString("ar-EG") : "-"}
                      </td>
                      <td className="py-2.5 px-4 text-left font-mono font-bold text-amber-700">
                        {row.credit > 0 ? row.credit.toLocaleString("ar-EG") : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100/90 font-extrabold border-t-2 border-slate-300 text-xs">
                  <tr>
                    <td colSpan={3} className="py-3 px-4 text-slate-900">المجموع الختامي لميزان المراجعة</td>
                    <td className="py-3 px-4 text-left font-mono text-blue-900 text-sm font-extrabold">
                      {trialBalance.totalDebit.toLocaleString("ar-EG")} ج.م
                    </td>
                    <td className="py-3 px-4 text-left font-mono text-amber-900 text-sm font-extrabold">
                      {trialBalance.totalCredit.toLocaleString("ar-EG")} ج.م
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD SUB-ACCOUNT (إضافة حساب فرعي جديد)                            */}
      {/* ========================================================================= */}
      {showAddAccountModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">إضافة حساب فرعي جديد في الدليل</h3>
                  <p className="text-[11px] text-slate-500">تفريغ حساب تحليلي يقبل ترحيل القيود اليومية</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddAccountModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              {/* Parent Account Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الحساب الأب (الحساب الرئيسي) *</label>
                <select
                  value={newAccParentId}
                  onChange={(e) => handleSelectParentForNewAccount(e.target.value)}
                  className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {accounts
                    .filter((a) => a.level < 4)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.code} - {acc.nameAr} (مستوى {acc.level})
                      </option>
                    ))}
                </select>
              </div>

              {/* Code & Suffix */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">كود الحساب المنشأ تلقائياً *</label>
                <input
                  type="text"
                  value={newAccCode}
                  onChange={(e) => setNewAccCode(e.target.value)}
                  className="w-full h-10 text-xs font-mono font-bold border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Arabic & English Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم الحساب بالعربية *</label>
                  <input
                    type="text"
                    placeholder="مثال: مخزن الزيوت الفرنسية، بنك مصر..."
                    value={newAccNameAr}
                    onChange={(e) => setNewAccNameAr(e.target.value)}
                    className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم الحساب بالإنجليزية (اختياري)</label>
                  <input
                    type="text"
                    placeholder="e.g. French Fragrance Oil Vault"
                    value={newAccNameEn}
                    onChange={(e) => setNewAccNameEn(e.target.value)}
                    className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">وصف الحساب والغرض منه</label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات حول طبيعة الحساب واستخداماته..."
                  value={newAccDesc}
                  onChange={(e) => setNewAccDesc(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

            </div>

            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAddAccountModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveSubAccount}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>حفظ الحساب في الدليل</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT ACCOUNT (تعديل بيانات الحساب)                                */}
      {/* ========================================================================= */}
      {showEditAccountModal && editingAccount && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">تعديل بيانات الحساب: {editingAccount.code}</h3>
                  <p className="text-[11px] text-slate-500">تعديل الاسم والملاحظات للحساب</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditAccountModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">كود الحساب</label>
                <input
                  type="text"
                  disabled
                  value={editingAccount.code}
                  className="w-full h-10 text-xs font-mono font-bold bg-slate-100 border border-slate-200 rounded-lg px-3 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الحساب بالعربية *</label>
                <input
                  type="text"
                  value={editAccNameAr}
                  onChange={(e) => setEditAccNameAr(e.target.value)}
                  className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الحساب بالإنجليزية</label>
                <input
                  type="text"
                  value={editAccNameEn}
                  onChange={(e) => setEditAccNameEn(e.target.value)}
                  className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">وصف الحساب والملاحظات</label>
                <textarea
                  rows={2}
                  value={editAccDesc}
                  onChange={(e) => setEditAccDesc(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

            </div>

            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowEditAccountModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveEditAccount}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>حفظ التعديلات</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD COST CENTER (إضافة مركز تكلفة جديد)                           */}
      {/* ========================================================================= */}
      {showAddCostCenterModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">إضافة مركز تكلفة / خط إنتاج جديد</h3>
                  <p className="text-[11px] text-slate-500">تتبع الربحية والمصروفات المستقلة لكل خط أو قناة</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddCostCenterModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">كود المركز *</label>
                  <input
                    type="text"
                    value={ccCode}
                    onChange={(e) => setCcCode(e.target.value)}
                    className="w-full h-10 text-xs font-mono font-bold border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نوع النشاط *</label>
                  <select
                    value={ccType}
                    onChange={(e) => setCcType(e.target.value as CostCenter["type"])}
                    className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                  >
                    <option value="PRODUCTION_LINE">خط إنتاج وتصنيع</option>
                    <option value="SALES_CHANNEL">قناة مبيعات وتوزيع</option>
                    <option value="ADMINISTRATIVE">إداري وعمومي</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم مركز التكلفة بالعربية *</label>
                <input
                  type="text"
                  placeholder="مثال: خط إنتاج معطرات الجو والفرش، فرع التجمع الخامس..."
                  value={ccNameAr}
                  onChange={(e) => setCcNameAr(e.target.value)}
                  className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الوصف والغرض من مركز التكلفة</label>
                <textarea
                  rows={2}
                  placeholder="وصف طبيعة التكاليف والمبيعات الموجهة لهذا المركز..."
                  value={ccDesc}
                  onChange={(e) => setCcDesc(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

            </div>

            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAddCostCenterModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveCostCenter}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>حفظ مركز التكلفة</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: FUND TRANSFER (تحويل أموال بين الخزائن والبنوك)                   */}
      {/* ========================================================================= */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">تحويل أموال داخلي بين الخزائن والبنوك</h3>
                  <p className="text-[11px] text-slate-500">إثبات حركة قيد مزدوج آلية بين حسابات النقدية والبنوك</p>
                </div>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التحويل من (دائن - مخرج الأموال) *</label>
                  <select
                    value={transferFromAcc}
                    onChange={(e) => setTransferFromAcc(e.target.value)}
                    className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  >
                    {accounts
                      .filter((a) => a.code.startsWith("1101") || a.code.startsWith("1102"))
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} - {a.nameAr}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التحويل إلى (مدين - مستلم الأموال) *</label>
                  <select
                    value={transferToAcc}
                    onChange={(e) => setTransferToAcc(e.target.value)}
                    className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  >
                    {accounts
                      .filter((a) => a.code.startsWith("1101") || a.code.startsWith("1102"))
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} - {a.nameAr}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ المحول (جنيه مصري) *</label>
                <input
                  type="number"
                  min="1"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(parseFloat(e.target.value) || 0)}
                  className="w-full h-10 text-sm font-mono font-black border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">البيان التوضيحي للتحويل</label>
                <input
                  type="text"
                  value={transferDesc}
                  onChange={(e) => setTransferDesc(e.target.value)}
                  className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

            </div>

            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                إلغاء
              </button>
              <button
                onClick={handleExecuteTransfer}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ترحيل قيد التحويل المالي</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ACCOUNT STATEMENT (كشف حساب تحليلي)                              */}
      {/* ========================================================================= */}
      {selectedAccountForStatement && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden">
            
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    كشف حساب تحليلي: {selectedAccountForStatement.code} - {selectedAccountForStatement.nameAr}
                  </h3>
                  <p className="text-[11px] text-slate-500">سجل القيود الدفترية والأرصدة لهذا الحساب</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAccountForStatement(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">طبيعة الحساب:</span>
                  <strong className="font-bold text-slate-900">
                    {selectedAccountForStatement.nature === "DEBIT" ? "مدين (+)" : "دائن (-)"}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">التبويب:</span>
                  <strong className="font-bold text-slate-900">{accountTypeNames[selectedAccountForStatement.type]}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">الرصيد الدفتري الحالي:</span>
                  <strong className="font-mono text-sm font-black text-emerald-700">
                    {selectedAccountForStatement.balance.toLocaleString("ar-EG")} ج.م
                  </strong>
                </div>
              </div>

              <div className="space-y-2">
                <span className="block text-xs font-extrabold text-slate-800">الحركات والقيود المسجلة:</span>
                <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-60 overflow-y-auto">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0">
                      <tr>
                        <th className="py-2 px-3">رقم القيد</th>
                        <th className="py-2 px-3">التاريخ</th>
                        <th className="py-2 px-3">البيان</th>
                        <th className="py-2 px-3 text-left">مدين</th>
                        <th className="py-2 px-3 text-left">دائن</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {entries.flatMap((entry) => 
                        entry.lines
                          .filter((l) => l.accountId === selectedAccountForStatement.id || l.accountCode === selectedAccountForStatement.code)
                          .map((l, i) => (
                            <tr key={`${entry.id}-${i}`} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-mono font-bold text-slate-700">{entry.entryNumber}</td>
                              <td className="py-2 px-3 font-mono text-slate-500">{entry.date}</td>
                              <td className="py-2 px-3 text-slate-800">{l.description || entry.description}</td>
                              <td className="py-2 px-3 text-left font-mono font-bold text-blue-700">
                                {l.debit > 0 ? `${l.debit.toLocaleString("ar-EG")} ج.م` : "-"}
                              </td>
                              <td className="py-2 px-3 text-left font-mono font-bold text-amber-700">
                                {l.credit > 0 ? `${l.credit.toLocaleString("ar-EG")} ج.م` : "-"}
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedAccountForStatement(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: ADD JOURNAL ENTRY WITH COST CENTERS (إضافة قيد يومية)             */}
      {/* ========================================================================= */}
      {showNewEntryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
            
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    إنشاء قيد يومية محاسبي مزدوج (Journal Entry)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    مع إلزامية التوازن المدين = الدائن وتخصيص مراكز التكلفة لخطوط الإنتاج والقنوات
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewEntryModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم القيد المتسلسل</label>
                  <input
                    type="text"
                    disabled
                    value={nextEntryNumber}
                    className="w-full h-10 text-xs font-mono font-bold bg-slate-100 border border-slate-200 rounded-lg px-3 text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ القيد *</label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">البيان العام للقيد *</label>
                  <input
                    type="text"
                    placeholder="مثال: إثبات مصاريف كهرباء المصنع، سداد دفعة مورد..."
                    value={entryDesc}
                    onChange={(e) => setEntryDesc(e.target.value)}
                    className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              {/* Lines table */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800">أطراف القيد (الحسابات والمبالغ ومراكز التكلفة):</span>
                  <button
                    onClick={addEntryLine}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة طرف قيد آخر</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-100 px-3 py-2 text-[11px] font-bold text-slate-700 grid grid-cols-12 gap-2">
                    <span className="col-span-4">الحساب التحليلي</span>
                    <span className="col-span-3">مركز التكلفة (اختياري)</span>
                    <span className="col-span-2 text-left">مدين (ج.م)</span>
                    <span className="col-span-2 text-left">دائن (ج.م)</span>
                    <span className="col-span-1 text-center">حذف</span>
                  </div>

                  <div className="divide-y divide-slate-100 p-2 space-y-2">
                    {entryLines.map((line, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        {/* 1. Account Selector */}
                        <div className="col-span-4">
                          <select
                            value={line.accountId}
                            onChange={(e) => handleLineChange(idx, "accountId", e.target.value)}
                            className="w-full h-9 text-xs border border-slate-300 rounded-lg px-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                          >
                            <option value="">-- اختر الحساب --</option>
                            {leafAccounts.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.code} - {a.nameAr}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 2. Cost Center */}
                        <div className="col-span-3">
                          <select
                            value={line.costCenterId || ""}
                            onChange={(e) => handleLineChange(idx, "costCenterId", e.target.value)}
                            className="w-full h-9 text-xs border border-slate-300 rounded-lg px-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                          >
                            <option value="">-- بدون مركز تكلفة --</option>
                            {costCenters.map((cc) => (
                              <option key={cc.id} value={cc.id}>
                                {cc.code} - {cc.nameAr}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 3. Debit Input */}
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="0"
                            placeholder="0.00"
                            value={line.debit || ""}
                            onChange={(e) => handleLineChange(idx, "debit", e.target.value)}
                            className="w-full h-9 text-xs font-mono font-bold text-left text-blue-700 border border-slate-300 rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* 4. Credit Input */}
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="0"
                            placeholder="0.00"
                            value={line.credit || ""}
                            onChange={(e) => handleLineChange(idx, "credit", e.target.value)}
                            className="w-full h-9 text-xs font-mono font-bold text-left text-amber-700 border border-slate-300 rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>

                        {/* 5. Delete Action */}
                        <div className="col-span-1 flex justify-center">
                          {entryLines.length > 2 ? (
                            <button
                              onClick={() => removeEntryLine(idx)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-slate-300 text-xs">-</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary Footer */}
                  <div className="grid grid-cols-12 gap-2 items-center bg-slate-50 px-4 py-2.5 border-t border-slate-200 text-xs font-bold text-slate-700">
                    <div className="col-span-7">إجمالي طرفي القيد:</div>
                    <div className="col-span-2 text-left font-mono text-blue-700 font-black">
                      {validation.totalDebit.toLocaleString("ar-EG")} ج.م
                    </div>
                    <div className="col-span-2 text-left font-mono text-amber-700 font-black">
                      {validation.totalCredit.toLocaleString("ar-EG")} ج.م
                    </div>
                  </div>

                </div>
              </div>

              {/* Live Balance Difference Indicator */}
              <div className={`p-4 rounded-xl border ${
                validation.isValid 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-950" 
                  : "bg-amber-50 border-amber-200 text-amber-950"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {validation.isValid ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                    )}
                    <div>
                      <span className="text-xs font-bold block">
                        {validation.isValid ? "القيد متوازن محاسبياً وجاهز للترحيل" : "القيد غير متوازن: شرط التساوي غير متحقق"}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {validation.isValid ? "إجمالي المدين يطابق الدائن تماماً بنسبة 100%" : "يجب أن يتطابق مجموع المدين مع مجموع الدائن"}
                      </span>
                    </div>
                  </div>

                  <span className="font-mono text-xs font-bold bg-white px-3 py-1.5 rounded border border-slate-200">
                    الفارق: <strong className={validation.difference === 0 ? "text-emerald-700" : "text-red-600"}>
                      {Math.abs(validation.difference).toLocaleString("ar-EG")} ج.م
                    </strong>
                  </span>
                </div>
              </div>

            </div>

            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowNewEntryModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                إلغاء
              </button>
              <button
                disabled={!validation.isValid}
                onClick={handlePostEntry}
                className={`inline-flex items-center gap-2 px-6 py-2 text-xs font-bold text-white rounded-lg shadow-xs transition-colors ${
                  validation.isValid 
                    ? "bg-emerald-600 hover:bg-emerald-700 cursor-pointer" 
                    : "bg-slate-300 cursor-not-allowed opacity-60"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ترحيل القيد بالدفاتر ومراكز التكلفة</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default function AccountingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500 font-bold">جاري تحميل شجرة الحسابات...</div>}>
      <AccountingPageContent />
    </Suspense>
  );
}
