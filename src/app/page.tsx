import Link from "next/link";
import { 
  Building2, 
  Boxes, 
  FlaskConical, 
  Receipt, 
  ShoppingCart, 
  ShieldCheck, 
  FileText,
  Clock,
  Sparkles,
  ArrowLeft,
  Wallet,
  TrendingUp,
  AlertTriangle,
  Package,
  Layers,
  ArrowUpRight
} from "lucide-react";

export default function Home() {
  const kpis = [
    {
      title: "النقدية والبنوك الحالية",
      value: "250,000 ج.م",
      sub: "الخزينة (50k) + بنك CIB (200k)",
      icon: Wallet,
      color: "text-emerald-700 bg-emerald-50 border-emerald-100",
    },
    {
      title: "قيمة رأس المال المسجل",
      value: "250,000 ج.م",
      sub: "حقوق ملكية الشركاء المودعة",
      icon: Building2,
      color: "text-blue-700 bg-blue-50 border-blue-100",
    },
    {
      title: "المخازن والمواد الخام",
      value: "41,500+ ج.م",
      sub: "خامات زيوت، كحول، وزجاجات",
      icon: Boxes,
      color: "text-amber-700 bg-amber-50 border-amber-100",
    },
    {
      title: "أوامر تصنيع قيد التعتيق",
      value: "0 أوامر",
      sub: "الرقابة الصارمة على مدة التعتيق",
      icon: FlaskConical,
      color: "text-purple-700 bg-purple-50 border-purple-100",
    },
  ];

  const modules = [
    {
      title: "الحسابات العامة والقيود اليومية",
      description: "دليل الحسابات المصرية التخصصية لمصنع العطور، ميزان المراجعة، ومحرك القيود المزدوجة المتوازنة.",
      icon: Receipt,
      status: "جاهزة ومفعلة (المرحلة 1)",
      statusColor: "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold",
      iconColor: "text-emerald-700 bg-emerald-100/70",
      href: "/accounting",
      btnText: "فتح الحسابات العامة",
      active: true,
    },
    {
      title: "المخازن وتتبع دفعات الخامات",
      description: "بطاقات الأصناف (زيوت، كحول، مستلزمات تعبئة)، تقييم بالمتوسط المرجح المتحرك، وتتبع أرقام التشغيلات (Batches).",
      icon: Boxes,
      status: "جاهزة ومفعلة (المرحلة 2)",
      statusColor: "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold",
      iconColor: "text-blue-600 bg-blue-100/70",
      href: "/inventory",
      btnText: "فتح المخازن والخامات",
      active: true,
    },
    {
      title: "التصنيع وتكلفة العطور (BOM)",
      description: "وصفات الإنتاج بالمليلتر والجرام، أوامر التشغيل، قفل فترة التعتيق الإلزامية، وتحميل التكاليف الصناعية غير المباشرة.",
      icon: FlaskConical,
      status: "جاهزة ومفعلة (المرحلة 3)",
      statusColor: "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold",
      iconColor: "text-purple-600 bg-purple-100/70",
      href: "/manufacturing",
      btnText: "فتح التصنيع وأوامر التشغيل",
      active: true,
    },
    {
      title: "المبيعات وربط متجر Shopify",
      description: "فواتير نقاط البيع، مبيعات الجملة، ومزامنة طلبات ومخزون Shopify وفصل حسابات الشحن وبوابات الدفع.",
      icon: ShoppingCart,
      status: "جاهزة ومفعلة (المرحلة 4)",
      statusColor: "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold",
      iconColor: "text-rose-600 bg-rose-100/70",
      href: "/sales",
      btnText: "فتح فواتير المبيعات ونقاط البيع",
      active: true,
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Daftra Welcome Bar */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900">
              مرحباً بك في نظام دفترة لمصنع العطور
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
              الفرع الرئيسي
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            المنظومة الصناعية والمحاسبية المتكاملة لإدارة التصنيع والمخازن والمبيعات وفق المعايير المصرية
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/accounting"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-xs transition-all"
          >
            <Receipt className="w-4 h-4" />
            <span>الدخول للحسابات العامة</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Daftra KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="block text-xs font-medium text-slate-500">{kpi.title}</span>
                <span className="text-lg font-extrabold font-mono text-slate-900 mt-1 block">
                  {kpi.value}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">{kpi.sub}</span>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${kpi.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Approved Specifications Banner */}
      <div className="bg-gradient-to-l from-slate-900 to-slate-800 text-white rounded-lg p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>وثيقة القرارات المعتمدة لمصنع العطور (PROJECT_SPEC.md)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            تم ضبط المعايير المحاسبية المعتمدة: تقييم المخزون بـ (المتوسط المرجح المتحرك)، القفل التلقائي لفترة التعتيق، وتوزيع التكاليف الصناعية على أساس الأنشطة وساعات التشغيل.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs bg-slate-800 text-amber-300 border border-slate-700 px-3 py-1.5 rounded font-mono">
            EGP | 14% VAT
          </span>
        </div>
      </div>

      {/* Modules Grid (Daftra Cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-800">
            أقسام النظام الأساسية (Modules)
          </h2>
          <span className="text-xs text-slate-500">حسب خطة البناء المتسلسلة</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.map((m, idx) => {
            const Icon = m.icon;
            return (
              <div
                key={idx}
                className={`bg-white rounded-lg border p-5 shadow-xs flex flex-col justify-between gap-4 transition-all ${
                  m.active 
                    ? "border-emerald-300 ring-2 ring-emerald-500/10 hover:border-emerald-400" 
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${m.iconColor}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm">{m.title}</h3>
                        <span className={`inline-block mt-0.5 text-[10px] px-2 py-0.2 rounded-full border ${m.statusColor}`}>
                          {m.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {m.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  {m.active ? (
                    <Link
                      href={m.href}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded transition-all shadow-2xs"
                    >
                      <span>{m.btnText}</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-semibold">
                      يبدأ العمل بها فور اعتماد المرحلة السابقة
                    </span>
                  )}
                  <span className="text-xs font-mono text-slate-400">#0{idx + 1}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
