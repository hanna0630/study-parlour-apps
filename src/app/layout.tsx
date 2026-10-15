import type { Metadata } from "next";
import React from "react";
import { AppProvider } from "@/context/AppContext";
import SidebarNav from "@/components/SidebarNav";

export const metadata: Metadata = {
  title: "Study Parlour Management Platform",
  description: "Auditable multi-currency learning ledger and scheduler structures",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased m-0 bg-slate-50 text-slate-900 flex">
        <AppProvider>
          {/* Notion Inspired Navigation Sidebar Component */}
          <SidebarNav />
          
          {/* Main Visual Workspace Content Area */}
          <div className="flex-1 flex flex-col min-h-screen">
            <main className="flex-1 p-8 box-border max-w-7xl w-full mx-auto">
              {children}
            </main>
            
            <footer className="py-4 text-center text-[10px] font-medium tracking-wide uppercase text-slate-400 bg-white border-t border-slate-200">
              &copy; {new Date().getFullYear()} Study Parlour. Real-time Multi-Currency Isolation Protocol Engaged.
            </footer>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
