import React, { useState, useRef, useEffect } from 'react';
import { Palette, Moon, Sun, Cpu, Heart, Sparkles } from 'lucide-react';
import { useTheme, Theme } from '../contexts/ThemeContext';

const themeOptions: { value: Theme; label: string; icon: React.ReactNode; description: string }[] = [
  { 
    value: 'dark', 
    label: 'Dark', 
    icon: <Moon className="w-3 h-3" />,
    description: 'Classic dark with green accents'
  },
  { 
    value: 'light', 
    label: 'Light', 
    icon: <Sun className="w-3 h-3" />,
    description: 'Clean and modern light'
  },
  { 
    value: 'cyber', 
    label: 'Cyber', 
    icon: <Cpu className="w-3 h-3" />,
    description: 'Neon cyberpunk vibes'
  },
  { 
    value: 'pastel', 
    label: 'Pastel', 
    icon: <Heart className="w-3 h-3" />,
    description: 'Soft pastel colors'
  },
  { 
    value: 'pony', 
    label: 'My Little Pony', 
    icon: <Sparkles className="w-3 h-3" />,
    description: 'Friendship is Magic! 🦄'
  },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded transition-all duration-200 hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)]"
        title="Change theme"
      >
        <Palette className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--color-surface)] border border-[var(--color-text-dim)] rounded-md shadow-lg overflow-hidden z-50">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setTheme(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-3 flex items-start gap-3 text-left transition-colors duration-200 ${
                theme === option.value
                  ? 'bg-[var(--color-accent)] text-black'
                  : 'hover:bg-[var(--color-dark)] text-[var(--color-text-primary)]'
              }`}
            >
              <div className="mt-0.5">{option.icon}</div>
              <div className="flex-1">
                <div className={`text-sm font-semibold ${
                  theme === option.value ? 'text-black' : ''
                }`}>
                  {option.label}
                </div>
                <div className={`text-xs mt-0.5 ${
                  theme === option.value 
                    ? 'text-black opacity-80' 
                    : 'text-[var(--color-text-secondary)]'
                }`}>
                  {option.description}
                </div>
              </div>
              {theme === option.value && (
                <div className="mt-0.5">✓</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}