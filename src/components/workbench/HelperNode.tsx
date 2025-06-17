import React, { useState, useEffect } from "react";
import { Handle, Position, Node } from "@xyflow/react";
import { X, Settings } from "lucide-react";
import { MODULE_DEFINITIONS, ModuleKind } from "@/data/modules";
import { useModuleColors } from "@/hooks/useModuleColors";
import ChatGPTIndicator from "./ChatGPTIndicator";
import ExecutionStatusIndicator from "./ExecutionStatusIndicator";

// Add index signature for compatibility with React Flow
interface HelperNodeData extends Record<string, unknown> {
  moduleType: ModuleKind;
  promptOverride?: string;
  executionStatus?: {
    status: 'idle' | 'queued' | 'processing' | 'completed' | 'error';
    data?: any;
    error?: string;
    progress?: string;
  };
}

export type HelperNode = Node<HelperNodeData>;

interface HelperNodeProps {
  data: HelperNodeData;
  selected?: boolean;
  id: string;
}

/**
 * Helper function to get module definition from the modules registry
 */
const getModuleDef = (type: ModuleKind) => MODULE_DEFINITIONS.find((m) => m.type === type)!;

/**
 * Format module-specific progress display
 */
const formatModuleProgress = (progress: any, moduleType: ModuleKind): string | null => {
  if (!progress || !progress.includes('/')) return null;
  
  const [completed, total] = progress.split('/').map(Number);
  
  switch (moduleType) {
    case 'paragraph-splitter':
      return `Chunk ${completed}/${total}`;
    case 'grammar-checker':
      return `Para ${completed}/${total}`;
    case 'citation-finder':
      return `Para ${completed}/${total}`;
    case 'citation-verifier':
      return `Cite ${completed}/${total}`;
    case 'style-guide-enforcer':
      return `Para ${completed}/${total}`;
    default:
      return `${completed}/${total}`;
  }
};

/**
 * Extract enhanced processing statistics from execution data
 */
const getProcessingStats = (data: any, moduleType: ModuleKind): string | null => {
  if (!data) return null;
  
  try {
    // For text extractor (pass-through)
    if (moduleType === 'text-extractor') {
      if (data.metadata?.passedThrough) {
        return `Pass-through`;
      }
      return null;
    }
    
    // For paragraph splitter
    if (moduleType === 'paragraph-splitter' && data.output) {
      const paragraphs = data.output.paragraphs || data.output.totalParagraphs;
      if (Array.isArray(paragraphs)) {
        return `${paragraphs.length}p`;
      } else if (typeof paragraphs === 'number') {
        return `${paragraphs}p`;
      }
    }
    
    // For grammar checker
    if (moduleType === 'grammar-checker' && data.output) {
      const analysis = data.output.analysis;
      const stats = data.output.processingStats;
      const overall = data.output.overallAssessment;
      
      if (analysis && Array.isArray(analysis)) {
        const processed = analysis.length;
        const totalErrors = overall?.totalErrors || 0;
        return `${processed}p, ${totalErrors}e`;
      } else if (stats?.paragraphsAnalyzed) {
        const totalErrors = overall?.totalErrors || 0;
        return `${stats.paragraphsAnalyzed}p, ${totalErrors}e`;
      }
    }
    
    // For citation modules
    if (moduleType === 'citation-finder' && data.output) {
      const citations = data.output.citations || data.output.totalCitations;
      if (Array.isArray(citations)) {
        return `${citations.length}c`;
      } else if (typeof citations === 'number') {
        return `${citations}c`;
      }
    }
    
    if (moduleType === 'citation-verifier' && data.output) {
      const verified = data.output.verifiedCitations?.length || data.output.totalVerified || 0;
      const invalid = data.output.invalidCitations?.length || data.output.totalInvalid || 0;
      if (verified || invalid) {
        return `${verified}v, ${invalid}i`;
      }
    }
    
    // For other modules, try to extract relevant counts
    if (data.output) {
      // Look for common count properties
      const counts = [];
      if (data.output.totalCitations) counts.push(`${data.output.totalCitations}c`);
      if (data.output.totalParagraphs) counts.push(`${data.output.totalParagraphs}p`);
      if (data.output.totalSections) counts.push(`${data.output.totalSections}s`);
      
      if (counts.length > 0) return counts.join(', ');
    }
    
    // Check for chunk processing
    if (data.metadata?.chunkCount) {
      return `${data.metadata.chunkCount} chunks`;
    }
    
    return null;
  } catch (error) {
    console.warn('Error extracting processing stats:', error);
    return null;
  }
};

const HelperNodeComponent: React.FC<HelperNodeProps> = ({ 
  data, 
  selected, 
  id 
}) => {
  const module = getModuleDef(data.moduleType);
  const { getModuleColor } = useModuleColors();
  const [nodeColor, setNodeColor] = useState(getModuleColor(id));

  // Listen for color change events and update local state
  useEffect(() => {
    const handleColorChange = (event: CustomEvent) => {
      if (event.detail.nodeId === id) {
        setNodeColor(event.detail.color);
      }
    };

    window.addEventListener('moduleColorChanged', handleColorChange as EventListener);
    return () => {
      window.removeEventListener('moduleColorChanged', handleColorChange as EventListener);
    };
  }, [id]);

  // Update color when getModuleColor result changes
  useEffect(() => {
    setNodeColor(getModuleColor(id));
  }, [id, getModuleColor]);

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

  // Check if module supports ChatGPT and if it's a legal processing module
  const supportsChatGPT = module.supportsChatGPT || data.moduleType === 'chatgpt-assistant';
  const isLegalModule = ['text-extractor', 'paragraph-splitter', 'grammar-checker', 'citation-finder', 'citation-verifier', 'style-guide-enforcer'].includes(data.moduleType);

  // Get execution status and enhanced progress
  const executionStatus = data.executionStatus?.status || 'idle';
  const isProcessing = executionStatus === 'processing';
  const progress = data.executionStatus?.progress;
  const processingStats = getProcessingStats(data.executionStatus?.data, data.moduleType);
  
  // Format progress for display
  const formattedProgress = formatModuleProgress(progress, data.moduleType);

  return (
    <div
      className={`w-32 h-24 border-2 border-black cursor-pointer relative group hover:shadow-lg ${nodeColor} ${
        selected ? "ring-4 ring-black z-10" : "ring-0"
      }`}
      style={{ fontFamily: 'Courier New, monospace' }}
    >
      {/* Execution Status Indicator */}
      <ExecutionStatusIndicator 
        status={executionStatus}
        error={data.executionStatus?.error}
      />

      {/* Enhanced ChatGPT Indicator for Legal Processing */}
      <ChatGPTIndicator 
        isActive={supportsChatGPT}
        isProcessing={isProcessing}
        isLegalModule={isLegalModule}
        className="z-20"
      />

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
        
        {/* Enhanced progress indicator during processing */}
        {formattedProgress && isProcessing && (
          <div className={`text-xs ${textColor}/90 mt-1 font-mono`}>
            {formattedProgress}
          </div>
        )}
        
        {/* Processing stats when completed */}
        {processingStats && executionStatus === 'completed' && (
          <div className={`text-xs ${textColor}/80 mt-1 font-mono`}>
            {processingStats}
          </div>
        )}
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
