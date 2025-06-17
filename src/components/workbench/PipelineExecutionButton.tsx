
/**
 * PipelineExecutionButton Component
 * 
 * Purpose: Provides controls for running the legal document processing pipeline
 * Enhanced with legal-specific validation and guidance
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Square, AlertCircle, Scale, FileText } from "lucide-react";
import { AllNodes } from "@/types/workbench";
import { Edge } from "@xyflow/react";

interface PipelineExecutionButtonProps {
  nodes: AllNodes[];
  edges: Edge[];
  isExecuting: boolean;
  onExecute: () => void;
  onStop: () => void;
}

const PipelineExecutionButton: React.FC<PipelineExecutionButtonProps> = ({
  nodes,
  edges,
  isExecuting,
  onExecute,
  onStop
}) => {
  // Enhanced validation for legal document processing
  const validateLegalPipeline = () => {
    const documentInputNodes = nodes.filter(node => node.data?.moduleType === 'document-input');
    
    if (documentInputNodes.length === 0) {
      return { 
        isValid: false, 
        message: 'No legal documents uploaded. Add a document to begin analysis.',
        severity: 'error'
      };
    }

    // Check if there are any connected processing modules
    const hasConnectedNodes = edges.some(edge => 
      documentInputNodes.some(doc => doc.id === edge.source)
    );

    if (!hasConnectedNodes) {
      return { 
        isValid: false, 
        message: 'No processing modules connected. Connect text extractor, grammar checker, or other modules.',
        severity: 'error'
      };
    }

    // Check for recommended legal processing sequence
    const connectedModuleTypes = new Set();
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (sourceNode?.data?.moduleType === 'document-input' && targetNode) {
        connectedModuleTypes.add(targetNode.data?.moduleType);
      }
    });

    // Recommend legal processing best practices
    const hasTextExtractor = connectedModuleTypes.has('text-extractor');
    const hasParagraphSplitter = connectedModuleTypes.has('paragraph-splitter');
    const hasGrammarChecker = connectedModuleTypes.has('grammar-checker');

    if (!hasTextExtractor) {
      return {
        isValid: true,
        message: 'Consider adding Text Extractor for better document processing.',
        severity: 'warning'
      };
    }

    if (hasTextExtractor && !hasParagraphSplitter) {
      return {
        isValid: true,
        message: 'Consider adding Paragraph Splitter after Text Extractor for structured analysis.',
        severity: 'warning'
      };
    }

    if (hasParagraphSplitter && !hasGrammarChecker) {
      return {
        isValid: true,
        message: 'Consider adding Grammar Checker for complete legal document review.',
        severity: 'warning'
      };
    }

    return { 
      isValid: true, 
      message: 'Legal document processing pipeline ready.',
      severity: 'success'
    };
  };

  const validation = validateLegalPipeline();

  const handleExecute = () => {
    if (validation.isValid && !isExecuting) {
      onExecute();
    }
  };

  const handleStop = () => {
    if (isExecuting) {
      onStop();
    }
  };

  const getValidationIcon = () => {
    switch (validation.severity) {
      case 'error':
        return <AlertCircle size={12} className="text-red-600" />;
      case 'warning':
        return <AlertCircle size={12} className="text-yellow-600" />;
      case 'success':
        return <Scale size={12} className="text-green-600" />;
      default:
        return <FileText size={12} className="text-gray-600" />;
    }
  };

  return (
    <div className="flex items-center gap-3">
      {validation.message && (
        <div className={`flex items-center gap-2 text-xs px-3 py-1 rounded ${
          validation.severity === 'error' ? 'bg-red-50 border border-red-200' :
          validation.severity === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
          'bg-green-50 border border-green-200'
        }`}>
          {getValidationIcon()}
          <span className={
            validation.severity === 'error' ? 'text-red-700' :
            validation.severity === 'warning' ? 'text-yellow-700' :
            'text-green-700'
          }>
            {validation.message}
          </span>
        </div>
      )}
      
      {isExecuting ? (
        <Button
          onClick={handleStop}
          variant="destructive"
          size="sm"
          className="flex items-center gap-2"
        >
          <Square size={14} />
          Stop Legal Analysis
        </Button>
      ) : (
        <Button
          onClick={handleExecute}
          disabled={!validation.isValid}
          variant="default"
          size="sm"
          className="flex items-center gap-2"
        >
          <Scale size={14} />
          Run Legal Analysis
        </Button>
      )}
    </div>
  );
};

export default PipelineExecutionButton;
