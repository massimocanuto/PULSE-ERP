import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark" | "sand" | "celeste" | "glass" | "ubuntu" | "apple" | "google" | "windows";
type FontFamily = "monospace" | "sans-serif" | "apple" | "ubuntu" | "google";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  fontFamily: FontFamily;
  setFontFamily: (font: FontFamily) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pulse-erp-theme") as Theme;
      if (saved && ["light", "dark", "sand", "celeste", "glass", "ubuntu", "apple", "google", "windows"].includes(saved)) {
        return saved;
      }
    }
    return "light";
  });

  const [fontFamily, setFontFamily] = useState<FontFamily>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pulse-erp-font") as FontFamily;
      if (saved && ["monospace", "sans-serif", "apple", "ubuntu", "google"].includes(saved)) {
        return saved;
      }
    }
    return "monospace";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark", "sand", "celeste", "glass", "ubuntu", "apple", "google", "windows");
    if (theme !== "light") {
      root.classList.add(theme);
    }
    localStorage.setItem("pulse-erp-theme", theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("font-monospace", "font-sans-serif", "font-apple", "font-ubuntu", "font-google");
    root.classList.add(`font-${fontFamily}`);
    localStorage.setItem("pulse-erp-font", fontFamily);
  }, [fontFamily]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, fontFamily, setFontFamily }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
