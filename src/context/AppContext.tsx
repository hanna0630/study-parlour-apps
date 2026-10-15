"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type AppRole = "owner" | "administrator" | "tutor" | "parent" | "student";
export type Locale = "en" | "id";

export interface BrandingSettings {
  academyName: string;
  logoUrl: string | null;
  contactEmail: string;
  billingCurrency: string;
}

interface UserSession {
  id: string;
  fullName: string;
  email: string;
  role: AppRole;
  permissions: string[];
}

interface AppContextType {
  user: UserSession | null;
  locale: Locale;
  setLocale: (lang: Locale) => void;
  branding: BrandingSettings;
  updateBranding: (settings: Partial<BrandingSettings>) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  
  // Confie Placeholder Branding configurations as required by spec
  const [branding, setBranding] = useState<BrandingSettings>({
    academyName: "Study Parlour Academy",
    logoUrl: null, // Neutral placeholder used until asset uploaded
    contactEmail: "billing@studyparlour.com",
    billingCurrency: "IDR",
  });

  // Demo Environment User Data Session matching permission constraints
  const [user, setUser] = useState<UserSession | null>({
    id: "usr_01jk84",
    fullName: "Hanna Asy-Syarifah",
    email: "hanna@studyparlour.com",
    role: "owner", // Five principal roles system configuration
    permissions: ["all_access"],
  });

  const updateBranding = (newSettings: Partial<BrandingSettings>) => {
    setBranding((prev) => ({ ...prev, ...newSettings }));
  };

  const logout = () => {
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AppContext.Provider value={{ user, locale, setLocale, branding, updateBranding, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be applied inside an AppProvider container context");
  return context;
}
