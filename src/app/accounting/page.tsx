"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
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
  FileText,
  Wallet,
  TrendingUp,
  Calendar,
  X,
  FileSpreadsheet,
  Target,
  FolderPlus,
  GitFork,
  ArrowRight,
  Pencil
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

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState<"chart" | "entries" | "trial" | "cost_centers">("chart");
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

  // Filters for Chart of Accounts
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  // ==========================================
  // MODAL 1: ADD SUB-ACCOUNT (إضافة حساب فرعي)
  // ==========================================
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccParentId, setNewAccParentId] = useState<string>("");
  const [newAccCode, setNewAccCode] = useState("");
  const [newAccNameAr, setNewAccNameAr] = useState("");
  const [newAccNameEn, setNewAccNameEn] = useState("");
  const [newAccDesc, setNewAccDesc] = useState("");

  // Select Parent Account and Auto-generate next code
  const handleSelectParentForNewAccount = (parentId: string) => {
    setNewAccParentId(parentId);
    const parent = accounts.find((a) => a.id === parentId);
    if (parent) {
      // Find existing children to generate next code
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

  // Open modal with specific parent
  const openAddSubAccountModal = (parent?: Account) => {
    const pId = parent ? parent.id : (accounts.find(a => !a.isLeaf)?.id || "");
    handleSelectParentForNewAccount(pId);
    setNewAccNameAr("");
    setNewAccNameEn("");
    setNewAccDesc("");
    setShowAddAccountModal(true);
  };

  // Save New Sub-Account
  const handleSaveSubAccount = () => {
    if (!newAccParentId || !newAccNameAr || !newAccCode) {
      alert("يرجى ملء الحساب الأب، كود الحساب، واسم الحساب بالعربية.");
      return;
    }

    const parent = accounts.find((a) => a.id === newAccParentId)!;

    const newAccount: Account = {
      id: `acc-${Date.now()}`,
      code: newAccCode,
      nameAr: newAccNameAr,
      nameEn: newAccNameEn || newAccNameAr,
      type: parent.type,
      nature: parent.nature,
      parentId: parent.id,
      level: parent.level + 1,
      isLeaf: true,
      description: newAccDesc || `حساب فرعي تابع لـ ${parent.nameAr}`,
      balance: 0,
    };

    // If parent was a leaf account, it now becomes a non-leaf parent
    const updatedAccounts = accounts.map((acc) => 
      acc.id === parent.id ? { ...acc, isLeaf: false } : acc
    );

    // Insert after the parent and its existing children
    setAccounts([...updatedAccounts, newAccount].sort((a, b) => a.code.localeCompare(b.code)));
    setShowAddAccountModal(false);
  };

  // ==========================================
  // EDIT ACCOUNT STATE & HANDLER (تعديل حساب)
  // ==========================================
  const [showEditAccountModal, setShowEditAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editNameAr, setEditNameAr] = useState("");
  const [editNameEn, setEditNameEn] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const handleOpenEditAccount = (acc: Account) => {
    setEditingAccount(acc);
    setEditNameAr(acc.nameAr);
    setEditNameEn(acc.nameEn);
    setEditDesc(acc.description);
    setShowEditAccountModal(true);
  };

  const handleSaveEditAccount = () => {
    if (!editingAccount || !editNameAr) {
      alert("يرجى إدخال اسم الحساب بالعربية.");
      return;
    }
    setAccounts(accounts.map((a) => 
      a.id === editingAccount.id 
        ? { ...a, nameAr: editNameAr, nameEn: editNameEn || editNameAr, description: editDesc }
        : a
    ));
    setShowEditAccountModal(false);
  };

  // ==========================================
  // DELETE ACCOUNT WITH INTEGRITY CHECKS (حذف حساب)
  // ==========================================
  const handleDeleteAccount = (acc: Account) => {
    // 1. فحص وجود حسابات فرعية
    const hasChildren = accounts.some((a) => a.parentId === acc.id);
    if (hasChildren) {
      alert(`⚠️ لا يمكن حذف الحساب "${acc.nameAr}" (كود: ${acc.code}):\nلأنه حساب رئيسي يحتوي على حسابات فرعية تحته. يرجى حذف الحسابات الفرعية أولاً.`);
      return;
    }

    // 2. فحص وجود حركات بالدفاتر أو رصيد مالي
    const hasEntries = entries.some((entry) => 
      entry.lines.some((line) => line.accountId === acc.id)
    );
    if (hasEntries || Math.abs(acc.balance) > 0.001) {
      alert(`🔒 حظر محاسبي: لا يمكن حذف الحساب "${acc.nameAr}" (كود: ${acc.code}):\nتوجد قيود يومية مسجلة على هذا الحساب أو يوجد رصيد مالي (${acc.balance.toLocaleString('ar-EG')} ج.م).\nلحفظ سلامة ميزان المراجعة والنزاهة القانونية، لا يقبل النظام حذف الحسابات التي تمت عليها حركات مالية.`);
      return;
    }

    // 3. تأكيد الحذف
    if (confirm(`هل أنت متأكد من رغبتك في حذف الحساب "${acc.nameAr}" (كود: ${acc.code}) نهائياً من شجرة الحسابات؟`)) {
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

  // Filtered accounts for display
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const matchesSearch = acc.nameAr.includes(searchQuery) || acc.code.includes(searchQuery);
      const matchesType = typeFilter === "ALL" || acc.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [accounts, searchQuery, typeFilter]);

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

    // Update Accounts
    setEntries([newEntry, ...entries]);
    setAccounts(calculateUpdatedAccountBalances(accounts, formattedLines));

    // Update Cost Centers (if any line has a cost center attached)
    const updatedCCs = costCenters.map((cc) => {
      let addDebit = 0;
      let addCredit = 0;
      formattedLines.forEach((l) => {
        if (l.costCenterId === cc.id) {
          addDebit += l.debit;
          addCredit += l.credit;
        }
      });
      const newDebit = cc.totalDebit + addDebit;
      const newCredit = cc.totalCredit + addCredit;
      return {
        ...cc,
        totalDebit: newDebit,
        totalCredit: newCredit,
        netProfit: newCredit - newDebit,
      };
    });
    setCostCenters(updatedCCs);

    // Reset Form
    setShowNewEntryModal(false);
    setEntryDesc("");
    setEntryLines([
      { accountId: "", debit: 0, credit: 0, description: "", costCenterId: "" },
      { accountId: "", debit: 0, credit: 0, description: "", costCenterId: "" },
    ]);
  };

  // Reversal Entry
  const handleReverseEntry = (entry: JournalEntry) => {
    const reason = prompt("يرجى إدخال سبب إلغاء وعكس هذا القيد المحاسبي:", "تصحيح قيد يدوي");
    if (!reason) return;

    const revEntry = createReversalJournalEntry(entry, reason, "م. محمد جمعة");
    const updatedEntries = entries.map((e) => 
      e.id === entry.id ? { ...e, status: "REVERSED" as const } : e
    );

    setEntries([revEntry, ...updatedEntries]);
    setAccounts(calculateUpdatedAccountBalances(accounts, revEntry.lines));
  };

  // Calculate Trial Balance
  const trialBalance = useMemo(() => generateTrialBalance(accounts), [accounts]);

  // Cash & Banks
  const cashAndBanksBalance = useMemo(() => {
    const cash = accounts.find((a) => a.code === "110101")?.balance || 0;
    const bank = accounts.find((a) => a.code === "110102")?.balance || 0;
    return cash + bank;
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
    ADMIN: "إدارة ومصنع عام",
    OTHER: "أخرى",
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Daftra Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/" className="hover:text-emerald-700 transition-colors">الرئيسية</Link>
            <span>/</span>
            <span className="text-slate-800 font-bold">الحسابات العامة</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            الحسابات العامة ومراكز التكلفة
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Add Sub-Account Button */}
          <button
            onClick={() => openAddSubAccountModal()}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>+ إضافة حساب فرعي</span>
          </button>

          {/* Add Cost Center Button */}
          <button
            onClick={openAddCostCenter}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Target className="w-4 h-4 text-purple-600 shrink-0" />
            <span>+ مركز تكلفة</span>
          </button>

          {/* Add Journal Entry Button */}
          <button
            onClick={() => setShowNewEntryModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>أضف قيد يومية</span>
          </button>
        </div>
      </div>

      {/* Daftra Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Cash & Banks */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-xs font-medium text-slate-500">النقدية والبنوك المتاحة</span>
            <span className="text-lg font-extrabold font-mono text-emerald-700 block tracking-tight">
              {cashAndBanksBalance.toLocaleString("ar-EG")} <span className="text-xs font-sans text-slate-500 font-normal">ج.م</span>
            </span>
            <span className="text-[10px] text-slate-400 block">الخزينة (50k) + البنك CIB (200k)</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/80">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Total Assets */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-xs font-medium text-slate-500">إجمالي الأصول (المدينة)</span>
            <span className="text-lg font-extrabold font-mono text-blue-700 block tracking-tight">
              {trialBalance.totalDebit.toLocaleString("ar-EG")} <span className="text-xs font-sans text-slate-500 font-normal">ج.م</span>
            </span>
            <span className="text-[10px] text-slate-400 block">نقدية + مخازن خامات ومواد</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/80">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Active Cost Centers */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-xs font-medium text-slate-500">مراكز التكلفة النشطة</span>
            <span className="text-lg font-extrabold font-mono text-purple-700 block tracking-tight">
              {costCenters.length} <span className="text-xs font-sans text-slate-500 font-normal">مراكز</span>
            </span>
            <span className="text-[10px] text-slate-400 block">خطوط إنتاج وقنوات مبيعات</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100/80">
            <Target className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Accounting Balance Status */}
        <div className={`p-4 rounded-xl border shadow-xs flex items-center justify-between ${
          trialBalance.isBalanced 
            ? "bg-emerald-50/70 border-emerald-200" 
            : "bg-red-50 border-red-200"
        }`}>
          <div className="space-y-1">
            <span className="block text-xs font-bold text-slate-700">توازن الدفاتر المحاسبية</span>
            <span className={`text-sm font-extrabold block ${
              trialBalance.isBalanced ? "text-emerald-800" : "text-red-700"
            }`}>
              {trialBalance.isBalanced ? "متطابق ومتوازن 100%" : "يوجد فارق غير متوازن"}
            </span>
            <span className="text-[10px] text-slate-500 block">معادلة القيد المزدوج الإلزامية</span>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            trialBalance.isBalanced ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}>
            <Scale className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Daftra Sub-Navigation Tabs (Now 4 Tabs) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/60 px-3 pt-2.5 gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab("chart")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 border-t-2 shrink-0 ${
              activeTab === "chart"
                ? "bg-white text-emerald-800 border-emerald-600 shadow-xs font-extrabold"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>دليل وشجرة الحسابات ({accounts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("cost_centers")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 border-t-2 shrink-0 ${
              activeTab === "cost_centers"
                ? "bg-white text-purple-800 border-purple-600 shadow-xs font-extrabold"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            }`}
          >
            <Target className="w-4 h-4 text-purple-600 shrink-0" />
            <span>مراكز التكلفة ({costCenters.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("entries")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 border-t-2 shrink-0 ${
              activeTab === "entries"
                ? "bg-white text-emerald-800 border-emerald-600 shadow-xs font-extrabold"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>دفتر القيود اليومية ({entries.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("trial")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 border-t-2 shrink-0 ${
              activeTab === "trial"
                ? "bg-white text-emerald-800 border-emerald-600 shadow-xs font-extrabold"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            }`}
          >
            <Scale className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>ميزان المراجعة (Trial Balance)</span>
          </button>
        </div>

        {/* ========================================== */}
        {/* TAB 1: CHART OF ACCOUNTS (Tree View)       */}
        {/* ========================================== */}
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
                  className="w-full pr-9 pl-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                <span className="text-xs text-slate-500 font-bold shrink-0 ml-1">تصفية:</span>
                {["ALL", "ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-bold whitespace-nowrap transition-colors ${
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
                            className="flex items-center gap-2"
                            style={{ paddingRight: `${(acc.level - 1) * 20}px` }}
                          >
                            <div className="w-5 h-5 flex items-center justify-center shrink-0">
                              {isParent ? (
                                <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                              ) : (
                                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                            </div>
                            <span className={isParent ? "font-bold text-slate-900" : "text-slate-700"}>
                              {acc.nameAr}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                              ({acc.nameEn})
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 inline-block">
                            {accountTypeNames[acc.type]}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={`text-[11px] font-bold inline-flex items-center gap-1 ${
                            acc.nature === "DEBIT" ? "text-blue-700" : "text-amber-700"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${acc.nature === "DEBIT" ? "bg-blue-600" : "bg-amber-600"}`}></span>
                            <span>{acc.nature === "DEBIT" ? "مدين (+)" : "دائن (-)"}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                          {acc.isLeaf ? (
                            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
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

        {/* ========================================== */}
        {/* TAB 2: COST CENTERS (مراكز التكلفة)        */}
        {/* ========================================== */}
        {activeTab === "cost_centers" && (
          <div className="p-4 space-y-4">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-purple-50/70 border border-purple-200 p-3.5 rounded-lg text-xs text-purple-950">
              <div className="flex items-center gap-2.5">
                <Target className="w-5 h-5 text-purple-700 shrink-0" />
                <div>
                  <strong className="block text-sm font-extrabold text-purple-900">
                    مراكز التكلفة لمصنع العطور (Cost Centers P&L)
                  </strong>
                  <span className="text-slate-600 block mt-0.5">
                    تتبع أرباح ومصروفات كل خط إنتاج عطور (فرنسي، شرقي، معطرات) وقنوات البيع (معرض الكاشير، متجر Shopify) بشكل مستقل.
                  </span>
                </div>
              </div>

              <button
                onClick={openAddCostCenter}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-xs transition-all shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة خط إنتاج / مركز تكلفة</span>
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

        {/* ========================================== */}
        {/* TAB 3: JOURNAL ENTRIES (سجل القيود)       */}
        {/* ========================================== */}
        {activeTab === "entries" && (
          <div className="p-4 space-y-4">
            
            <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-lg text-xs text-emerald-900 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>قاعدة النزاهة المالية المطبقة:</strong> جميع القيود بالدفاتر مقفلة ولا تحذف. أي تعديل يتم بإنشاء <strong>قيد عكس وتصحيح</strong> موثق بالسبب والتاريخ.
              </span>
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
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-md transition-colors"
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
                          <td className="py-2.5 px-4 text-slate-500">{l.description || "-"}</td>
                          <td className="py-2.5 px-4 text-left font-mono font-bold text-blue-700">
                            {l.debit > 0 ? l.debit.toLocaleString("ar-EG") : "-"}
                          </td>
                          <td className="py-2.5 px-4 text-left font-mono font-bold text-amber-700">
                            {l.credit > 0 ? l.credit.toLocaleString("ar-EG") : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-xs">
                      <tr>
                        <td colSpan={4} className="py-2.5 px-4 text-slate-700">الإجمالي المتوازن</td>
                        <td className="py-2.5 px-4 text-left font-mono text-blue-800 font-extrabold">
                          {entry.totalDebit.toLocaleString("ar-EG")} ج.م
                        </td>
                        <td className="py-2.5 px-4 text-left font-mono text-amber-800 font-extrabold">
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

        {/* ========================================== */}
        {/* TAB 4: TRIAL BALANCE                       */}
        {/* ========================================== */}
        {activeTab === "trial" && (
          <div className="p-4 space-y-4">
            
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>ميزان المراجعة التحليلي بالأرصدة (Trial Balance)</span>
              </span>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs"
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
                  className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                >
                  <option value="">-- اختر الحساب الأب --</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.code} - {acc.nameAr} ({accountTypeNames[acc.type]})
                    </option>
                  ))}
                </select>
              </div>

              {/* Account Code & Nature */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">كود الحساب المقترح *</label>
                  <input
                    type="text"
                    value={newAccCode}
                    onChange={(e) => setNewAccCode(e.target.value)}
                    className="w-full h-10 text-xs font-mono font-bold border border-slate-300 rounded-lg px-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">طبيعة الحساب (تلقائي)</label>
                  <input
                    type="text"
                    disabled
                    value={accounts.find(a => a.id === newAccParentId)?.nature === "DEBIT" ? "مدين (+)" : "دائن (-)"}
                    className="w-full h-10 text-xs font-bold border border-slate-200 rounded-lg px-3 bg-slate-100 text-slate-600"
                  />
                </div>
              </div>

              {/* Arabic Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الحساب بالعربية *</label>
                <input
                  type="text"
                  placeholder="مثال: زيت باتشولي إندونيسي نقي، زجاجات عطر 50 مل شفاف..."
                  value={newAccNameAr}
                  onChange={(e) => setNewAccNameAr(e.target.value)}
                  className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* English Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الحساب بالإنجليزية (اختياري)</label>
                <input
                  type="text"
                  placeholder="e.g. Pure Indonesian Patchouli Oil"
                  value={newAccNameEn}
                  onChange={(e) => setNewAccNameEn(e.target.value)}
                  className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الوصف أو الملاحظات</label>
                <input
                  type="text"
                  placeholder="ملاحظات توضيحية حول طبيعة الصنف أو الحساب..."
                  value={newAccDesc}
                  onChange={(e) => setNewAccDesc(e.target.value)}
                  className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

            </div>

            {/* Modal Actions */}
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
                <span>حفظ وإضافة الحساب للدليل</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1.5: EDIT ACCOUNT (تعديل اسم وبيانات الحساب)                         */}
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
                  <h3 className="text-sm font-extrabold text-slate-900">تعديل بيانات الحساب المحاسبي</h3>
                  <p className="text-[11px] text-slate-500 font-mono">كود الحساب: {editingAccount.code}</p>
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
              
              {/* Account Code & Nature (Locked) */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="block text-[11px] font-bold text-slate-500 mb-0.5">كود الحساب (مقفل)</span>
                  <span className="font-mono font-extrabold text-slate-800 text-sm">{editingAccount.code}</span>
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-500 mb-0.5">الرصيد الدفتري الحالي</span>
                  <span className="font-mono font-extrabold text-emerald-700 text-sm">
                    {editingAccount.balance.toLocaleString("ar-EG")} ج.م
                  </span>
                </div>
              </div>

              {/* Arabic Name (Editable) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الحساب بالعربية *</label>
                <input
                  type="text"
                  value={editNameAr}
                  onChange={(e) => setEditNameAr(e.target.value)}
                  className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
                />
              </div>

              {/* English Name (Editable) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الحساب بالإنجليزية</label>
                <input
                  type="text"
                  value={editNameEn}
                  onChange={(e) => setEditNameEn(e.target.value)}
                  className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* Description (Editable) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الوصف أو الملاحظات</label>
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

            </div>

            {/* Modal Actions */}
            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowEditAccountModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                إلغاء التراجع
              </button>
              <button
                onClick={handleSaveEditAccount}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>حفظ التعديلات</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD COST CENTER (إضافة مركز تكلفة جديد)                           */}
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
                  <h3 className="text-sm font-extrabold text-slate-900">إضافة مركز تكلفة جديد</h3>
                  <p className="text-[11px] text-slate-500">تخصيص خط إنتاج أو قناة بيع لتحليل الأرباح والخسائر</p>
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
                    onChange={(e) => setCcType(e.target.value as any)}
                    className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  >
                    <option value="PRODUCTION_LINE">خط إنتاج وتصنيع عطور</option>
                    <option value="SALES_CHANNEL">قناة مبيعات وتوزيع</option>
                    <option value="ADMIN">إدارة عامة ومصنع</option>
                    <option value="OTHER">أخرى</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم مركز التكلفة *</label>
                <input
                  type="text"
                  placeholder="مثال: خط إنتاج العطور الزيتية المركزة، معرض مدينة نصر..."
                  value={ccNameAr}
                  onChange={(e) => setCcNameAr(e.target.value)}
                  className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">وصف النشاط</label>
                <input
                  type="text"
                  placeholder="ملاحظات حول طبيعة المصروفات والإيرادات المحملة..."
                  value={ccDesc}
                  onChange={(e) => setCcDesc(e.target.value)}
                  className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
      {/* MODAL 3: JOURNAL ENTRY WITH COST CENTERS (إضافة قيد بمراكز التكلفة)        */}
      {/* ========================================================================= */}
      {showNewEntryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100/80 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">إضافة قيد يومية محاسبي وتوزيع التكاليف</h3>
                    <span className="font-mono text-xs font-bold bg-slate-200/80 text-slate-800 px-2 py-0.5 rounded">
                      {nextEntryNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    التحقق الآلي من شرط توازن القيد مع إمكانية ربط أطراف القيد بمراكز التكلفة
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowNewEntryModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                title="إغلاق النافذة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              
              {/* Header Info */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">بيانات القيد الأساسية</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      تاريخ القيد <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                      className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      البيان العام والشرح للقيد <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: شراء زيوت لافندر لخط العطور الفرنسية، إثبات إيرادات متجر Shopify..."
                      value={entryDesc}
                      onChange={(e) => setEntryDesc(e.target.value)}
                      className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items Table with Cost Center Column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">أطراف وحسابات القيد ومراكز التكلفة</span>
                    <span className="text-[11px] text-slate-400 font-medium">({entryLines.length} أطراف)</span>
                  </div>

                  <button
                    onClick={addEntryLine}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة طرف آخر للقيد</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  
                  {/* Grid Table Header (Now with Cost Center) */}
                  <div className="grid grid-cols-12 gap-2 bg-slate-100/90 px-4 py-2.5 text-slate-700 font-bold text-xs border-b border-slate-200">
                    <div className="col-span-12 sm:col-span-4">الحساب الفرعي (شجرة الحسابات)</div>
                    <div className="col-span-12 sm:col-span-3">مركز التكلفة (اختياري)</div>
                    <div className="col-span-12 sm:col-span-2">البيان التوضيحي</div>
                    <div className="col-span-6 sm:col-span-1 text-left">مدين (+)</div>
                    <div className="col-span-5 sm:col-span-1 text-left">دائن (-)</div>
                    <div className="col-span-1 text-center">حذف</div>
                  </div>

                  {/* Rows List */}
                  <div className="divide-y divide-slate-100 bg-white">
                    {entryLines.map((line, idx) => (
                      <div 
                        key={idx} 
                        className="grid grid-cols-12 gap-2 items-center px-4 py-2.5 hover:bg-slate-50/70 transition-colors"
                      >
                        {/* 1. Account Picker (4 Cols) */}
                        <div className="col-span-12 sm:col-span-4">
                          <select
                            value={line.accountId}
                            onChange={(e) => handleLineChange(idx, "accountId", e.target.value)}
                            className="w-full h-9 text-xs border border-slate-300 rounded-lg px-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                          >
                            <option value="">-- اختر الحساب الفرعي --</option>
                            {leafAccounts.map((acc) => (
                              <option key={acc.id} value={acc.id}>
                                {acc.code} - {acc.nameAr}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 2. Cost Center Picker (3 Cols) */}
                        <div className="col-span-12 sm:col-span-3">
                          <select
                            value={line.costCenterId || ""}
                            onChange={(e) => handleLineChange(idx, "costCenterId", e.target.value)}
                            className="w-full h-9 text-xs border border-slate-300 rounded-lg px-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-700"
                          >
                            <option value="">-- بدون مركز تكلفة --</option>
                            {costCenters.map((cc) => (
                              <option key={cc.id} value={cc.id}>
                                {cc.code} - {cc.nameAr}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 3. Description (2 Cols) */}
                        <div className="col-span-12 sm:col-span-2">
                          <input
                            type="text"
                            placeholder="بيان خاص بالسطر..."
                            value={line.description}
                            onChange={(e) => handleLineChange(idx, "description", e.target.value)}
                            className="w-full h-9 text-xs border border-slate-300 rounded-lg px-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          />
                        </div>

                        {/* 4. Debit (1 Col) */}
                        <div className="col-span-6 sm:col-span-1">
                          <input
                            type="number"
                            placeholder="0.00"
                            value={line.debit || ""}
                            onChange={(e) => handleLineChange(idx, "debit", e.target.value)}
                            className="w-full h-9 text-xs font-mono font-bold text-left text-blue-700 border border-slate-300 rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                        </div>

                        {/* 5. Credit (1 Col) */}
                        <div className="col-span-5 sm:col-span-1">
                          <input
                            type="number"
                            placeholder="0.00"
                            value={line.credit || ""}
                            onChange={(e) => handleLineChange(idx, "credit", e.target.value)}
                            className="w-full h-9 text-xs font-mono font-bold text-left text-amber-700 border border-slate-300 rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                          />
                        </div>

                        {/* 6. Delete Action (1 Col) */}
                        <div className="col-span-1 flex justify-center">
                          {entryLines.length > 2 ? (
                            <button
                              onClick={() => removeEntryLine(idx)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="حذف هذا السطر"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="w-8 h-8 flex items-center justify-center text-slate-200 text-xs">-</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Table Bottom Totals Strip */}
                  <div className="grid grid-cols-12 gap-2 items-center bg-slate-50 px-4 py-2.5 border-t border-slate-200 text-xs font-bold text-slate-700">
                    <div className="col-span-12 sm:col-span-9">
                      إجمالي الأطراف المسجلة في القيد:
                    </div>
                    <div className="col-span-6 sm:col-span-1 text-left font-mono text-blue-700 font-extrabold text-xs">
                      {validation.totalDebit.toLocaleString("ar-EG")} ج.م
                    </div>
                    <div className="col-span-6 sm:col-span-2 text-left font-mono text-amber-700 font-extrabold text-xs">
                      {validation.totalCredit.toLocaleString("ar-EG")} ج.م
                    </div>
                  </div>

                </div>
              </div>

              {/* Balance Feedback Card */}
              <div className={`p-4 rounded-xl border transition-all ${
                validation.isValid 
                  ? "bg-emerald-50/80 border-emerald-200 text-emerald-950" 
                  : "bg-amber-50/80 border-amber-200 text-amber-950"
              }`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      validation.isValid ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
                    }`}>
                      {validation.isValid ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold block">
                        {validation.isValid 
                          ? "القيد متوازن محاسبياً وجاهز للترحيل الفوري بالدفاتر" 
                          : "القيد غير متوازن: شرط التساوي غير متحقق"}
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        {validation.isValid 
                          ? "إجمالي المدين يطابق تماماً إجمالي الدائن بنسبة 100%" 
                          : "المحاسبة لا تقبل ترحيل قيد به فارق حتى لو كان قرشاً واحداً"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs font-bold">
                    <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700">
                      الفارق: <strong className={validation.difference === 0 ? "text-emerald-700" : "text-red-600"}>
                        {Math.abs(validation.difference).toLocaleString("ar-EG")} ج.م
                      </strong>
                    </span>
                  </div>
                </div>

                {!validation.isValid && validation.errors.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-amber-200/60 space-y-1">
                    {validation.errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-600 font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0"></span>
                        <span>{err}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Actions Footer */}
            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={() => setShowNewEntryModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
              >
                إلغاء التراجع
              </button>
              <button
                disabled={!validation.isValid}
                onClick={handlePostEntry}
                className={`inline-flex items-center gap-2 px-6 py-2 text-xs font-bold text-white rounded-lg transition-all shadow-xs ${
                  validation.isValid 
                    ? "bg-emerald-600 hover:bg-emerald-700 cursor-pointer shadow-emerald-700/20" 
                    : "bg-slate-300 cursor-not-allowed opacity-60"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ترحيل القيد بالدفاتر</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
