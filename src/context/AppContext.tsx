import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fetchApi } from "../utils/api";

export interface CompanySettings {
  companyName: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  slogan: string;
}

export interface AppContextType {
  currentUser: any;
  setCurrentUser: (user: any) => void;
  companySettings: CompanySettings;
  setCompanySettings: (settings: CompanySettings) => void;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  refreshCompanySettings: () => Promise<void>;
  logout: () => Promise<void>;
}

const defaultCompanySettings: CompanySettings = {
  companyName: "CONG TY LUAT TNHH ANH DUONG LEGAL",
  address: "Tòa nhà Bitexco, 2 Hải Triều, Bến Nghé, Quận 1, TP. Hồ Chí Minh",
  email: "contact@anhduonglaw.vn",
  phone: "1900 6000",
  website: "https://anhduonglaw.vn",
  slogan: "Ánh sáng pháp lý - Niềm tin vững bền"
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [companySettings, setCompanySettingsState] = useState<CompanySettings>(() => {
    try {
      const saved = localStorage.getItem("company_settings");
      return saved ? JSON.parse(saved) : defaultCompanySettings;
    } catch {
      return defaultCompanySettings;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  const setCompanySettings = (settings: CompanySettings) => {
    setCompanySettingsState(settings);
    try {
      localStorage.setItem("company_settings", JSON.stringify(settings));
    } catch (e) {
      console.warn("Failed to persist company settings to localStorage", e);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await fetchApi("/api/auth/me");
      if (res && res.ok) {
        const data = await res.json();
        if (data && data.user) {
          setCurrentUser(data.user);
          return;
        }
      }
      
      // Fallback to /api/me
      const resFallback = await fetchApi("/api/me");
      if (resFallback && resFallback.ok) {
        const dataFallback = await resFallback.json();
        if (dataFallback && dataFallback.user) {
          setCurrentUser(dataFallback.user);
          return;
        }
      }
      
      setCurrentUser(null);
    } catch (err) {
      console.warn("Failed to fetch user:", err);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCompanySettings = async () => {
    // Optionally fetch from database endpoint if ever implemented on server.
    // Otherwise keep using local state.
  };

  const logout = async () => {
    try {
      await fetchApi("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.warn("Logout request failed:", e);
    }
    try {
      localStorage.removeItem("token");
    } catch (e) {}
    setCurrentUser(null);
    window.location.href = "/";
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        companySettings,
        setCompanySettings,
        isLoading,
        refreshUser,
        refreshCompanySettings,
        logout
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
