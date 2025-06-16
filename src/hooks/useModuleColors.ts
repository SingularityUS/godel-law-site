
import { useState, useEffect, useCallback } from 'react';
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
  const [updateTrigger, setUpdateTrigger] = useState(0);

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

  const forceUpdate = useCallback(() => {
    setUpdateTrigger(prev => prev + 1);
  }, []);

  const setModuleColor = useCallback((nodeId: string, color: string) => {
    const newColors = { ...moduleColors, [nodeId]: color };
    setModuleColors(newColors);
    localStorage.setItem(MODULE_COLORS_KEY, JSON.stringify(newColors));
    
    // Add to recent colors
    addToRecentColors(color);
    
    // Force re-render of components using this hook
    forceUpdate();
    
    // Also dispatch a custom event for components that need to update
    window.dispatchEvent(new CustomEvent('moduleColorChanged', { 
      detail: { nodeId, color } 
    }));
  }, [moduleColors, forceUpdate]);

  const addToRecentColors = useCallback((color: string) => {
    const newRecent = [color, ...recentColors.filter(c => c !== color)].slice(0, 8);
    setRecentColors(newRecent);
    localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(newRecent));
  }, [recentColors]);

  const getModuleColor = useCallback((nodeId: string): string => {
    return moduleColors[nodeId] || DEFAULT_COLOR;
  }, [moduleColors, updateTrigger]);

  const resetModuleColor = useCallback((nodeId: string) => {
    const newColors = { ...moduleColors };
    delete newColors[nodeId];
    setModuleColors(newColors);
    localStorage.setItem(MODULE_COLORS_KEY, JSON.stringify(newColors));
    forceUpdate();
  }, [moduleColors, forceUpdate]);

  const resetAllColors = useCallback(() => {
    setModuleColors({});
    localStorage.removeItem(MODULE_COLORS_KEY);
    forceUpdate();
  }, [forceUpdate]);

  return {
    getModuleColor,
    setModuleColor,
    resetModuleColor,
    resetAllColors,
    recentColors,
    addToRecentColors
  };
};
