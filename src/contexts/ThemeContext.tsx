import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'dark' | 'light' | 'cyber' | 'pastel' | 'pony';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themes = {
  dark: {
    '--color-void': '#000000',
    '--color-dark': '#0a0a0a',
    '--color-surface': '#141414',
    '--color-accent': '#00ff88',
    '--color-text-primary': '#ffffff',
    '--color-text-secondary': '#888888',
    '--color-text-dim': '#444444',
  },
  light: {
    '--color-void': '#fafafa',
    '--color-dark': '#f0f0f0',
    '--color-surface': '#ffffff',
    '--color-accent': '#00d068',
    '--color-text-primary': '#1a1a1a',
    '--color-text-secondary': '#5a5a5a',
    '--color-text-dim': '#a0a0a0',
  },
  cyber: {
    '--color-void': '#0a0015',
    '--color-dark': '#15001f',
    '--color-surface': '#1f0a2a',
    '--color-accent': '#ff00ff',
    '--color-text-primary': '#00ffff',
    '--color-text-secondary': '#ff88ff',
    '--color-text-dim': '#8844aa',
  },
  pastel: {
    '--color-void': '#fef3f8',
    '--color-dark': '#ffe8f3',
    '--color-surface': '#fff5fb',
    '--color-accent': '#ff9ec7',
    '--color-text-primary': '#5a4a6a',
    '--color-text-secondary': '#9a8aa8',
    '--color-text-dim': '#d4c8e0',
  },
  pony: {
    '--color-void': '#ffe0f4',
    '--color-dark': '#ffc8e8',
    '--color-surface': '#ffebf7',
    '--color-accent': '#ff6ec7',
    '--color-text-primary': '#8b2c8b',
    '--color-text-secondary': '#d946ef',
    '--color-text-dim': '#f0b3f0',
  },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    const themeColors = themes[theme];
    
    Object.entries(themeColors).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    
    root.setAttribute('data-theme', theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}