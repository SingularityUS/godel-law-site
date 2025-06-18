
/**
 * useOutputPanel Hook
 * 
 * Purpose: Shared logic for output panel operations and state management
 * Enhanced to support immediate opening on pipeline execution start
 */

import { useCallback, useState } from "react";

export const useOutputPanel = () => {
  const [output, setOutput] = useState<any>(null);
  const [isOutputOpen, setIsOutputOpen] = useState(false);
  const [isPipelineExecuting, setIsPipelineExecuting] = useState(false);

  const formatOutput = useCallback((data: any): string => {
    if (typeof data === 'string') {
      return data;
    }
    return JSON.stringify(data, null, 2);
  }, []);

  const copyToClipboard = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, []);

  const downloadAsFile = useCallback((content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleCopy = useCallback(() => {
    if (output) {
      copyToClipboard(formatOutput(output));
    }
  }, [copyToClipboard, formatOutput, output]);

  const handleDownload = useCallback(() => {
    if (output) {
      downloadAsFile(
        formatOutput(output), 
        `legal-analysis-${new Date().toISOString().slice(0, 19)}.json`
      );
    }
  }, [downloadAsFile, formatOutput, output]);

  const closeOutput = useCallback(() => {
    setIsOutputOpen(false);
    setIsPipelineExecuting(false);
    setOutput(null); // Clear output when closing
  }, []);

  const toggleOutput = useCallback(() => {
    setIsOutputOpen(prev => !prev);
  }, []);

  const openOutput = useCallback((newOutput: any) => {
    setOutput(newOutput);
    setIsOutputOpen(true);
    setIsPipelineExecuting(false);
  }, []);

  // Enhanced method to open sidebar immediately when pipeline starts
  const openForPipelineExecution = useCallback(() => {
    console.log('useOutputPanel: Opening sidebar for pipeline execution');
    setIsPipelineExecuting(true);
    setIsOutputOpen(true);
    setOutput(null); // Clear previous output
  }, []);

  // Enhanced method to handle pipeline completion
  const handlePipelineCompletion = useCallback((finalOutput: any) => {
    console.log('useOutputPanel: Handling pipeline completion with output:', finalOutput);
    setOutput(finalOutput);
    setIsPipelineExecuting(false);
    // Keep sidebar open
  }, []);

  return {
    output,
    isOutputOpen,
    isPipelineExecuting,
    formatOutput,
    copyToClipboard,
    downloadAsFile,
    handleCopy,
    handleDownload,
    closeOutput,
    toggleOutput,
    openOutput,
    openForPipelineExecution,
    handlePipelineCompletion,
    setOutput
  };
};
