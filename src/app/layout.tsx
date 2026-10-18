import type { Metadata } from "next";
import { Suspense } from "react";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "نظام إدارة مصنع العطور | قيود ERP الصناعي",
  description: "نظام سحابي صناعي ومحاسبي متكامل لإدارة التصنيع والمخازن والمحاسبة لمصانع العطور",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="antialiased min-h-screen bg-slate-100/70 font-sans text-slate-900 flex">
        {/* Right Sidebar (Daftra Style) */}
        <Suspense fallback={<aside className="w-64 bg-white shrink-0 min-h-screen border-l border-slate-200" />}>
          <Sidebar />
        </Suspense>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
          <Header />
          <div className="flex-1">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
