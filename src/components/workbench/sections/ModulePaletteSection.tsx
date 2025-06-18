
/**
 * ModulePaletteSection Component
 * 
 * Purpose: Dedicated section container for the module palette
 * Provides consistent styling and structure for the palette area
 * 
 * Responsibilities:
 * - Renders the module palette with proper styling
 * - Handles drag-start events for modules
 * - Maintains visual separation from workspace
 */

import React from "react";
import ModulePalette from "../../ModulePalette";

interface ModulePaletteSectionProps {
  onDragStart: (mod: any, event: React.DragEvent) => void;
}

const ModulePaletteSection: React.FC<ModulePaletteSectionProps> = ({
  onDragStart
}) => {
  return (
    <div className="w-full border-b-2 border-black bg-white">
      <ModulePalette onDragStart={onDragStart} />
    </div>
  );
};

export default ModulePaletteSection;
