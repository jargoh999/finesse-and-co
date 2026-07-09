'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Palette } from 'lucide-react';

// IMPORTANT: Theme switcher component for toggling between gold and ash themes
// This component allows users to switch between white/gold and white/ash color schemes
export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col items-center">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === 'gold' ? 'ash' : 'gold')}
        className="text-gray-400 hover:text-gray-600 rounded-full h-9 w-9 flex items-center justify-center"
        title={theme === 'gold' ? 'Switch to Ash Theme' : 'Switch to Gold Theme'}
        aria-label={theme === 'gold' ? 'Switch to Ash Theme' : 'Switch to Gold Theme'}
      >
        <Palette className="h-4.5 w-4.5" />
      </Button>
      <span className="text-[9px] text-gray-400 sm:hidden mt-0.5">
        {theme === 'gold' ? 'Gold' : 'Ash'}
      </span>
    </div>
  );
}
