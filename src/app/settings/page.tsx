"use client";

import React, { useState } from "react";
import {
  Settings,
  Building2,
  Scale,
  ShieldCheck,
  CheckCircle2,
  Save,
  Globe,
  FileText,
  Percent,
  DollarSign,
  Warehouse,
  Sparkles,
} from "lucide-react";

export default function SettingsPage() {
  const [companyName, setCompanyName] = useState("مصنع العطور الفاخرة للزيوت العطرية (ش.م.م)");
  const [taxNumber, setTaxNumber] = useState("498-321-765");
  const [commercialReg, setCommercialReg] = useState("184520 - القاهرة");
  const [vatRate, setVatRate] = useState(14);
  const [whtRate, setWhtRate] = useState(1);
  const [currency, setCurrency] = useState("EGP");
  const [factoryAddress, setFactoryAddress] = useState("المنطقة الصناعية الثالثة - التجمع الخامس - القاهرة");
  const [etaStatus, setEtaStatus] = useState("CONNECTED");

  const handleSaveSettings = () => {
    alert("✅ تم حفظ إعدادات المصنع والضرائب بنجاح!");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5 font-medium">
            <span>الرئيسية</span>
            <span>/</span>
            <span className="text-blue-700 font-bold">إعدادات المصنع والضرائب</span>
          </nav>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-300">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                إعدادات المصنع، الضرائب، والفاتورة الإلكترونية
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                تكوين البطاقة الضريبية، السجل التجاري، نسبة ضريبة القيمة المضافة 14%، والربط مع منظومة الضرائب المصرية (ETA)
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>حفظ التعديلات</span>
        </button>
      </div>

      {/* 2. Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Legal & Company Info */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-blue-700" />
            <h3 className="font-extrabold text-slate-900 text-sm">البيانات القانونية للمنشأة</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الاسم القانوني للمصنع *</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم التسجيل الضريبي (البطاقة الضريبية) *</label>
              <input
                type="text"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                className="w-full h-10 text-xs font-mono font-bold border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم السجل التجاري *</label>
              <input
                type="text"
                value={commercialReg}
                onChange={(e) => setCommercialReg(e.target.value)}
                className="w-full h-10 text-xs font-mono font-bold border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">عنوان المقر الصناعي والمصنع</label>
              <input
                type="text"
                value={factoryAddress}
                onChange={(e) => setFactoryAddress(e.target.value)}
                className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Tax & Accounting Rules */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Scale className="w-5 h-5 text-emerald-700" />
            <h3 className="font-extrabold text-slate-900 text-sm">المحددات الضريبية والمحاسبية</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ضريبة القيمة المضافة الافتراضية (%)</label>
                <input
                  type="number"
                  value={vatRate}
                  onChange={(e) => setVatRate(parseFloat(e.target.value) || 14)}
                  className="w-full h-10 text-xs font-mono font-black text-rose-700 border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">14% المعيار المصري العام</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ضريبة الخصم من المنبع WHT (%)</label>
                <input
                  type="number"
                  value={whtRate}
                  onChange={(e) => setWhtRate(parseFloat(e.target.value) || 1)}
                  className="w-full h-10 text-xs font-mono font-black text-blue-700 border border-slate-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">1% لتوريدات سلع الجملة</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">العملة الأساسية للنظام</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 bg-white font-bold text-slate-800"
              >
                <option value="EGP">جنيه مصري (EGP)</option>
                <option value="USD">دولار أمريكي (USD)</option>
                <option value="EUR">يورو (EUR)</option>
              </select>
            </div>

            {/* ETA Integration Status */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1 text-xs text-emerald-950">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>منظومة الفاتورة الإلكترونية المصرية (ETA):</span>
                </span>
                <span className="font-mono text-[10px] font-black bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                  متصل ومفعل
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                يتم تكويد العطور بـ (GS1 / EGS) وربط الفواتير الصادرة برقم UUID الإلكتروني المعتمد من مصلحة الضرائب المصرية.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
