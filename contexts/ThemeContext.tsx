'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// IMPORTANT: Define color themes for the application
// Theme 1: White and Gold (default)
// Theme 2: White and Ash (alternative)
type Theme = 'gold' | 'ash';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colors: {
    primary: string;
    primaryHover: string;
    primaryLight: string;
    background: string;
    backgroundLight: string;
    border: string;
    text: string;
    textSecondary: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// IMPORTANT: Color palettes for each theme
const themeColors = {
  gold: {
    primary: '#c7b793',
    primaryHover: '#b8a57e',
    primaryLight: '#c7b793/10',
    background: '#faf8f5',
    backgroundLight: '#faf8f5/80',
    border: '#c7b793/15',
    text: '#a38c5b',
    textSecondary: '#c7b793'
  },
  ash: {
    primary: '#6b7280',
    primaryHover: '#4b5563',
    primaryLight: '#6b7280/10',
    background: '#f9fafb',
    backgroundLight: '#f9fafb/80',
    border: '#e5e7eb',
    text: '#6b7280',
    textSecondary: '#9ca3af'
  }
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  // IMPORTANT: Load theme from localStorage or use default (gold)
  const [theme, setThemeState] = useState<Theme>('gold');

  useEffect(() => {
    // Load theme from localStorage on mount
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && (savedTheme === 'gold' || savedTheme === 'ash')) {
      setThemeState(savedTheme);
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const colors = themeColors[theme];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors }}>
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
