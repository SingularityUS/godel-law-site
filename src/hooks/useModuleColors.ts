
import { useState, useEffect } from 'react';
import { ModuleKind } from '@/data/modules';

export interface ModuleColorSettings {
  [nodeId: string]: string;
}

export interface RecentColors {
  colors: string[];
}

const DEFAULT_COLOR = 'bg-slate-600';
const RECENT_COLORS_KEY = 'lovable-recent-colors';
const MODULE_COLORS_KEY = 'lovable-module-colors';

export const useModuleColors = () => {
  const [moduleColors, setModuleColors] = useState<ModuleColorSettings>({});
  const [recentColors, setRecentColors] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const storedColors = localStorage.getItem(MODULE_COLORS_KEY);
    const storedRecent = localStorage.getItem(RECENT_COLORS_KEY);
    
    if (storedColors) {
      setModuleColors(JSON.parse(storedColors));
    }
    
    if (storedRecent) {
      setRecentColors(JSON.parse(storedRecent));
    }
  }, []);

  const setModuleColor = (nodeId: string, color: string) => {
    const newColors = { ...moduleColors, [nodeId]: color };
    setModuleColors(newColors);
    localStorage.setItem(MODULE_COLORS_KEY, JSON.stringify(newColors));
    
    // Add to recent colors
    addToRecentColors(color);
  };

  const addToRecentColors = (color: string) => {
    const newRecent = [color, ...recentColors.filter(c => c !== color)].slice(0, 8);
    setRecentColors(newRecent);
    localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(newRecent));
  };

  const getModuleColor = (nodeId: string): string => {
    return moduleColors[nodeId] || DEFAULT_COLOR;
  };

  const resetModuleColor = (nodeId: string) => {
    const newColors = { ...moduleColors };
    delete newColors[nodeId];
    setModuleColors(newColors);
    localStorage.setItem(MODULE_COLORS_KEY, JSON.stringify(newColors));
  };

  const resetAllColors = () => {
    setModuleColors({});
    localStorage.removeItem(MODULE_COLORS_KEY);
  };

  return {
    getModuleColor,
    setModuleColor,
    resetModuleColor,
    resetAllColors,
    recentColors,
    addToRecentColors
  };
};
