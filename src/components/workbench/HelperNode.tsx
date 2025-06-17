
import React, { useCallback } from "react";
import { Handle, Position } from "@xyflow/react";
import { ModuleKind, MODULE_DEFINITIONS } from "@/data/modules";
import { FileText, FileSearch, SplitSquareHorizontal, CheckCircle, Clock, AlertCircle, Play } from "lucide-react";
import ExecutionStatusIndicator from "./ExecutionStatusIndicator";

const nodeStyles =
  "flex flex-col items-center justify-center rounded-md border border-gray-200 bg-white shadow-sm p-4 w-48 h-32 overflow-hidden";

export interface HelperNodeData {
  moduleType: ModuleKind;
  moduleLabel?: string;
  icon?: React.FC;
  promptOverride?: string;
  executionStatus?: {
    status: 'idle' | 'queued' | 'processing' | 'completed' | 'error';
    error?: string;
    progress?: string;
    debugInfo?: {
      totalChunks?: number;
      totalParagraphs?: number;
    };
  };
}

export type HelperNode = {
  id: string;
  type: "helper";
  position: { x: number; y: number };
  data: HelperNodeData;
};

interface HelperNodeProps {
  data: HelperNodeData;
  id: string;
}

const HelperNode: React.FC<HelperNodeProps> = ({ data, id }) => {
  const handleClick = useCallback(() => {
    const event = new CustomEvent('openNodeSettings', {
      detail: {
        nodeId: id
      }
    });
    window.dispatchEvent(event);
  }, [id]);

  const executionStatus = data.executionStatus || { status: 'idle' };

  // Get module definition to access icon and label
  const moduleDef = MODULE_DEFINITIONS.find(m => m.type === data.moduleType);
  const IconComponent = data.icon || moduleDef?.icon;
  const moduleLabel = data.moduleLabel || moduleDef?.label || data.moduleType;

  return (
    <div className={`relative ${nodeStyles}`} onClick={handleClick}>
      <Handle type="target" position={Position.Left} />
      
      {/* Execution Status Indicator with debug info */}
      <ExecutionStatusIndicator 
        status={executionStatus.status}
        error={executionStatus.error}
        debugInfo={executionStatus.debugInfo}
      />
      
      {IconComponent && <IconComponent size={32} className="text-gray-700" />}
      <div className="text-sm font-medium text-gray-800 mt-2">{moduleLabel}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default HelperNode;
