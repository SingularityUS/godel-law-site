
import React, { useState, useEffect } from "react";
import { Handle, Position, Node } from "@xyflow/react";
import { X, Settings, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { MODULE_DEFINITIONS, ModuleKind } from "@/data/modules";
import { useModuleColors } from "@/hooks/useModuleColors";
import ChatGPTIndicator from "./ChatGPTIndicator";

export interface HelperNodeData extends Record<string, unknown> {
  moduleType: ModuleKind;
  promptOverride?: string;
  isProcessing?: boolean;
  isCompleted?: boolean;
  hasError?: boolean;
}

export interface HelperNode extends Node {
  type: "helper";
  data: HelperNodeData;
}

interface HelperNodeProps {
  data: HelperNodeData;
  selected?: boolean;
  id: string;
}

const getModuleDef = (type: ModuleKind) =>
  MODULE_DEFINITIONS.find((m) => m.type === type)!;

const HelperNodeComponent: React.FC<HelperNodeProps> = ({ 
  data, 
  selected, 
  id 
}) => {
  const module = getModuleDef(data.moduleType);
  const { getModuleColor } = useModuleColors();
  const [nodeColor, setNodeColor] = useState(getModuleColor(id));

  // Listen for color changes
  useEffect(() => {
    const handleColorChange = (event: CustomEvent) => {
      if (event.detail.nodeId === id) {
        setNodeColor(event.detail.color);
      }
    };

    window.addEventListener('nodeColorChanged', handleColorChange as EventListener);
    return () => window.removeEventListener('nodeColorChanged', handleColorChange as EventListener);
  }, [id]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const event = new CustomEvent('deleteNode', { detail: { nodeId: id } });
    window.dispatchEvent(event);
  };

  const handleSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    const event = new CustomEvent('openNodeSettings', { detail: { nodeId: id } });
    window.dispatchEvent(event);
  };

  // Determine text color based on background
  const isWhiteBackground = nodeColor === 'bg-white';
  const textColor = isWhiteBackground ? 'text-black' : 'text-white';
  const iconColor = isWhiteBackground ? 'text-black' : 'text-white';

  // Check if module supports ChatGPT
  const supportsChatGPT = module.supportsChatGPT || data.moduleType === 'chatgpt-assistant';

  // Determine node border based on execution state
  let borderClass = 'border-black';
  if (data.isProcessing) {
    borderClass = 'border-yellow-500 border-4';
  } else if (data.isCompleted) {
    borderClass = 'border-green-500 border-4';
  } else if (data.hasError) {
    borderClass = 'border-red-500 border-4';
  }

  return (
    <div
      className={`w-32 h-24 border-2 cursor-pointer relative group hover:shadow-lg ${nodeColor} ${borderClass} ${
        selected ? "ring-4 ring-black z-10" : "ring-0"
      }`}
      style={{ fontFamily: 'Courier New, monospace' }}
    >
      {/* ChatGPT Indicator */}
      <ChatGPTIndicator 
        isActive={supportsChatGPT}
        className="z-20"
      />

      {/* Execution Status Indicator */}
      {(data.isProcessing || data.isCompleted || data.hasError) && (
        <div className="absolute -top-1 -left-1 z-20">
          {data.isProcessing && (
            <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
              <Loader2 size={12} className="text-white animate-spin" />
            </div>
          )}
          {data.isCompleted && (
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle size={12} className="text-white" />
            </div>
          )}
          {data.hasError && (
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <AlertCircle size={12} className="text-white" />
            </div>
          )}
        </div>
      )}

      {/* Action buttons - only visible on hover or when selected */}
      <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ opacity: selected ? 1 : undefined }}>
        <button
          onClick={handleSettings}
          className="w-5 h-5 bg-black text-white flex items-center justify-center text-xs z-20"
          aria-label="Module settings"
          title="Settings"
        >
          ⚙
        </button>
        <button
          onClick={handleDelete}
          className="w-5 h-5 bg-black text-white flex items-center justify-center text-xs z-20"
          aria-label="Delete helper node"
          title="Delete"
        >
          ×
        </button>
      </div>
      
      {/* Module content */}
      <div className="flex flex-col items-center justify-center h-full p-2">
        <span className={`${iconColor} drop-shadow text-lg mb-1`}>
          <module.icon size={20} />
        </span>
        <span className={`text-xs font-bold ${textColor} text-center leading-tight`}>{module.label}</span>
      </div>
      
      {/* Prompt status indicator */}
      <div className={`absolute bottom-1 left-1 text-xs ${textColor}/90`}>
        {data.promptOverride ? "●" : "○"}
      </div>
      
      {/* React Flow handles - square style */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 bg-black border-none rounded-none" 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-black border-none rounded-none" 
      />
    </div>
  );
};

export default HelperNodeComponent;
