
/**
 * PipelineValidation Component
 * 
 * Purpose: Handles validation logic and display for legal document processing pipelines
 */

import React from "react";
import { AlertCircle, Scale, FileText } from "lucide-react";
import { AllNodes } from "@/types/workbench";
import { Edge } from "@xyflow/react";

interface ValidationResult {
  isValid: boolean;
  message: string;
  severity: 'error' | 'warning' | 'success';
}

interface PipelineValidationProps {
  nodes: AllNodes[];
  edges: Edge[];
}

const PipelineValidation: React.FC<PipelineValidationProps> = ({ nodes, edges }) => {
  // Get execution order for proper pipeline validation
  const getExecutionOrder = (startNodeId: string): string[] => {
    const visited = new Set<string>();
    const queue = [startNodeId];
    const executionOrder: string[] = [];

    while (queue.length > 0) {
      const currentNodeId = queue.shift()!;
      if (visited.has(currentNodeId)) continue;

      visited.add(currentNodeId);
      executionOrder.push(currentNodeId);

      // Find connected nodes (targets of edges from current node)
      const connectedEdges = edges.filter(edge => edge.source === currentNodeId);
      const nextNodes = connectedEdges.map(edge => edge.target);
      
      nextNodes.forEach(nodeId => {
        if (!visited.has(nodeId)) {
          queue.push(nodeId);
        }
      });
    }

    return executionOrder;
  };

  // Enhanced validation for legal document processing
  const validateLegalPipeline = (): ValidationResult => {
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

    // Get the full execution order for the first document input node
    const firstDocNode = documentInputNodes[0];
    const executionOrder = getExecutionOrder(firstDocNode.id);
    
    // Get all module types in the execution pipeline
    const pipelineModuleTypes = executionOrder
      .map(nodeId => nodes.find(n => n.id === nodeId)?.data?.moduleType)
      .filter(type => type && type !== 'document-input');

    // Check for recommended legal processing sequence
    const hasTextExtractor = pipelineModuleTypes.includes('text-extractor');
    const hasParagraphSplitter = pipelineModuleTypes.includes('paragraph-splitter');
    const hasGrammarChecker = pipelineModuleTypes.includes('grammar-checker');

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

  if (!validation.message) return null;

  return (
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
  );
};

export default PipelineValidation;
export type { ValidationResult };
