
/**
 * Flow Node Manager Module
 * 
 * Purpose: Node management utilities and color coordination
 * This module provides utilities for node appearance and behavior
 * including color management and minimap customization.
 * 
 * Key Responsibilities:
 * - Determines node colors for minimap display
 * - Integrates with module color customization system
 * - Provides node appearance utilities
 * - Manages visual consistency across flow components
 * 
 * Integration Points:
 * - Uses useModuleColors hook for custom color schemes
 * - Coordinates with WorkbenchControls for minimap styling
 * - Integrates with node components for visual feedback
 * - Maintains consistency with overall design system
 * 
 * Color Management:
 * 1. Document nodes use consistent slate color
 * 2. Helper nodes use custom colors from module system
 * 3. Fallback colors ensure visual consistency
 * 4. Minimap colors convert Tailwind classes to hex values
 */

import { Node } from "@xyflow/react";
import { useModuleColors } from "@/hooks/useModuleColors";

export const useFlowNodeManager = () => {
  const { getModuleColor } = useModuleColors();

  /**
   * Determines node color for the minimap based on node type and custom colors
   */
  const getNodeColor = (n: Node) => {
    const nodeData = n.data as any;
    if (nodeData.moduleType === "document-input") {
      return "#e2e8f0"; // slate-200 for document nodes
    }
    
    // Use custom color if available, otherwise use default
    const customColor = getModuleColor(n.id);
    const colorClass = customColor.replace("bg-", "");
    
    // Convert Tailwind class to hex for minimap
    const colorMap: { [key: string]: string } = {
      'slate-600': '#475569',
      'gray-600': '#4b5563',
      'red-500': '#ef4444',
      'blue-500': '#3b82f6',
      'green-500': '#22c55e',
      'purple-500': '#a855f7',
      'orange-500': '#f97316',
      'yellow-500': '#eab308'
    };
    
    return colorMap[colorClass] || '#475569';
  };

  return {
    getNodeColor
  };
};
