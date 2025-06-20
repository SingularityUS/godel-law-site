
/**
 * ModuleSelector Component
 * 
 * Purpose: Allows users to select which modules' raw data to display
 */

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { MODULE_DEFINITIONS } from "@/data/modules";
import { Badge } from "@/components/ui/badge";

interface ModuleSelectorProps {
  availableModules: Array<{
    nodeId: string;
    moduleType: string;
    dataSize: number;
    processingTime?: number;
  }>;
  selectedModules: string[];
  onSelectionChange: (selectedModules: string[]) => void;
}

const ModuleSelector: React.FC<ModuleSelectorProps> = ({
  availableModules,
  selectedModules,
  onSelectionChange
}) => {
  const handleModuleToggle = (nodeId: string) => {
    const newSelection = selectedModules.includes(nodeId)
      ? selectedModules.filter(id => id !== nodeId)
      : [...selectedModules, nodeId];
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    onSelectionChange(availableModules.map(m => m.nodeId));
  };

  const handleDeselectAll = () => {
    onSelectionChange([]);
  };

  const formatDataSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatProcessingTime = (time?: number) => {
    if (!time) return '';
    return `${time}ms`;
  };

  return (
    <div className="border-r bg-gray-50 p-4 min-w-[280px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Module Data Sources</h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            className="h-6 px-2 text-xs"
          >
            All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeselectAll}
            className="h-6 px-2 text-xs"
          >
            None
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {availableModules.map((module) => {
          const moduleDef = MODULE_DEFINITIONS.find(m => m.type === module.moduleType);
          const isSelected = selectedModules.includes(module.nodeId);
          
          return (
            <div
              key={module.nodeId}
              className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => handleModuleToggle(module.nodeId)}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={isSelected}
                  onChange={() => handleModuleToggle(module.nodeId)}
                  className="mt-0.5"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {moduleDef?.icon && <moduleDef.icon size={16} className="text-gray-600" />}
                    <span className="font-medium text-sm truncate">
                      {moduleDef?.label || module.moduleType}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 text-xs text-gray-500">
                    <Badge variant="secondary" className="text-xs py-0">
                      {formatDataSize(module.dataSize)}
                    </Badge>
                    {module.processingTime && (
                      <Badge variant="outline" className="text-xs py-0">
                        {formatProcessingTime(module.processingTime)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {availableModules.length === 0 && (
        <div className="text-center text-gray-500 text-sm py-8">
          No module data available
        </div>
      )}
    </div>
  );
};

export default ModuleSelector;
