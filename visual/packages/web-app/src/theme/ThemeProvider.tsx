import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeId = 'lavender-press' | 'night-edition' | 'newsprint' | 'swiss-poster';

export interface ThemeOption {
  id: ThemeId;
  label: string;
  desc: string;
  swatch: [string, string, string];
}

export const THEMES: ThemeOption[] = [
  { id: 'lavender-press', label: 'Lavender Press', desc: 'Editorial lilac paper + violet masthead', swatch: ['#E8E6EF', '#6C50F6', '#121116'] },
  { id: 'night-edition', label: 'Night Edition', desc: 'Charcoal dark mode + amber masthead', swatch: ['#121318', '#F2B84B', '#ECEAF2'] },
  { id: 'newsprint', label: 'Newsprint', desc: 'Warm archival stock + ink masthead', swatch: ['#F0EADB', '#1A1714', '#2C4F8C'] },
  { id: 'swiss-poster', label: 'Swiss Poster', desc: 'International Style red + cobalt', swatch: ['#F3F1EC', '#D7141A', '#1E4FD6'] },
];

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'lavender-press',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem('sdd.theme.v1') as ThemeId | null;
      if (saved && THEMES.some((t) => t.id === saved)) return saved;
    } catch {
      // ignore storage errors
    }
    return 'lavender-press';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('sdd.theme.v1', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
