
/**
 * useModuleColors Hook
 * 
 * Purpose: Manages persistent color customization for workbench modules
 * This hook provides a complete color management system for individual nodes,
 * allowing users to customize the visual appearance of their workflow modules
 * while maintaining consistency across sessions.
 * 
 * Key Features:
 * - Persistent storage using localStorage for cross-session consistency
 * - Recent colors tracking for quick access to frequently used colors
 * - Real-time updates across components via custom events
 * - Force update mechanism for immediate visual feedback
 * 
 * Storage Strategy:
 * - Module colors stored as nodeId -> colorClass mapping
 * - Recent colors stored as array of recently used color classes
 * - Automatic cleanup and management of storage data
 * 
 * Integration Points:
 * - Used by HelperNode components for dynamic color application
 * - Integrated with ModuleSettingsDrawer for color picker interface
 * - Works with ColorPicker component for user color selection
 * - Triggers re-renders in AIWorkbench minimap for color updates
 * 
 * Event System:
 * - Dispatches 'moduleColorChanged' events for real-time updates
 * - Components can listen to these events for immediate color changes
 * - Prevents stale color references in cached components
 */

import { useState, useEffect, useCallback } from 'react';
import { ModuleKind } from '@/data/modules';

// Type definitions for color management system
export interface ModuleColorSettings {
  [nodeId: string]: string; // Maps node ID to Tailwind color class
}

export interface RecentColors {
  colors: string[]; // Array of recently used color classes
}

// Constants for storage keys and default values
const DEFAULT_COLOR = 'bg-white';
const RECENT_COLORS_KEY = 'lovable-recent-colors';
const MODULE_COLORS_KEY = 'lovable-module-colors';

export const useModuleColors = () => {
  // State management for colors and recent colors
  const [moduleColors, setModuleColors] = useState<ModuleColorSettings>({});
  const [recentColors, setRecentColors] = useState<string[]>([]);
  
  // Force update trigger for components that need immediate re-rendering
  const [updateTrigger, setUpdateTrigger] = useState(0);

  /**
   * Initialization: Load Stored Data
   * 
   * Runs on hook mount to restore previously saved color settings
   * Handles cases where localStorage might be unavailable or corrupted
   */
  useEffect(() => {
    const storedColors = localStorage.getItem(MODULE_COLORS_KEY);
    const storedRecent = localStorage.getItem(RECENT_COLORS_KEY);
    
    // Safely parse stored color settings
    if (storedColors) {
      try {
        setModuleColors(JSON.parse(storedColors));
      } catch (error) {
        console.warn('Failed to parse stored module colors:', error);
      }
    }
    
    // Safely parse recent colors array
    if (storedRecent) {
      try {
        setRecentColors(JSON.parse(storedRecent));
      } catch (error) {
        console.warn('Failed to parse stored recent colors:', error);
      }
    }
  }, []);

  /**
   * Force Update Mechanism
   * 
   * Triggers re-renders in components that depend on color state
   * Useful when localStorage changes need immediate visual feedback
   */
  const forceUpdate = useCallback(() => {
    setUpdateTrigger(prev => prev + 1);
  }, []);

  /**
   * Set Module Color: Main Color Assignment Function
   * 
   * Updates color for a specific node and manages persistence
   * 
   * Process:
   * 1. Update local state with new color
   * 2. Persist to localStorage for session consistency
   * 3. Add to recent colors for quick access
   * 4. Trigger force update for immediate visual feedback
   * 5. Dispatch custom event for other components
   * 
   * @param nodeId - Unique identifier for the node
   * @param color - Tailwind CSS color class (e.g., 'bg-blue-500')
   */
  const setModuleColor = useCallback((nodeId: string, color: string) => {
    const newColors = { ...moduleColors, [nodeId]: color };
    setModuleColors(newColors);
    
    // Persist to localStorage for cross-session consistency
    localStorage.setItem(MODULE_COLORS_KEY, JSON.stringify(newColors));
    
    // Add to recent colors for user convenience
    addToRecentColors(color);
    
    // Force re-render of components using this hook
    forceUpdate();
    
    // Dispatch custom event for real-time updates in other components
    window.dispatchEvent(new CustomEvent('moduleColorChanged', { 
      detail: { nodeId, color } 
    }));
  }, [moduleColors, forceUpdate]);

  /**
   * Recent Colors Management
   * 
   * Maintains a list of recently used colors for quick access
   * Implements LRU (Least Recently Used) cache behavior
   * 
   * @param color - Color class to add to recent list
   */
  const addToRecentColors = useCallback((color: string) => {
    // Move color to front, remove duplicates, limit to 8 items
    const newRecent = [color, ...recentColors.filter(c => c !== color)].slice(0, 8);
    setRecentColors(newRecent);
    localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(newRecent));
  }, [recentColors]);

  /**
   * Get Module Color: Color Retrieval Function
   * 
   * Returns the current color for a node or default if not set
   * Includes updateTrigger dependency to ensure fresh data
   * 
   * @param nodeId - Node ID to get color for
   * @returns Color class string or default color
   */
  const getModuleColor = useCallback((nodeId: string): string => {
    return moduleColors[nodeId] || DEFAULT_COLOR;
  }, [moduleColors, updateTrigger]);

  /**
   * Reset Individual Module Color
   * 
   * Removes custom color for a specific node, reverting to default
   * 
   * @param nodeId - Node ID to reset color for
   */
  const resetModuleColor = useCallback((nodeId: string) => {
    const newColors = { ...moduleColors };
    delete newColors[nodeId];
    setModuleColors(newColors);
    localStorage.setItem(MODULE_COLORS_KEY, JSON.stringify(newColors));
    forceUpdate();
  }, [moduleColors, forceUpdate]);

  /**
   * Reset All Colors: Bulk Reset Function
   * 
   * Clears all custom colors, reverting all nodes to default
   * Useful for bulk operations or user preference reset
   */
  const resetAllColors = useCallback(() => {
    setModuleColors({});
    localStorage.removeItem(MODULE_COLORS_KEY);
    forceUpdate();
  }, [forceUpdate]);

  // Return public API for color management
  return {
    getModuleColor,
    setModuleColor,
    resetModuleColor,
    resetAllColors,
    recentColors,
    addToRecentColors
  };
};
