
/**
 * useOutputPanel Hook
 * 
 * Purpose: Shared logic for output panel operations and state management
 */

import { useCallback, useState } from "react";

export const useOutputPanel = () => {
  const [output, setOutput] = useState<any>(null);
  const [isOutputOpen, setIsOutputOpen] = useState(false);

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
  }, []);

  const toggleOutput = useCallback(() => {
    setIsOutputOpen(prev => !prev);
  }, []);

  const openOutput = useCallback((newOutput: any) => {
    setOutput(newOutput);
    setIsOutputOpen(true);
  }, []);

  return {
    output,
    isOutputOpen,
    formatOutput,
    copyToClipboard,
    downloadAsFile,
    handleCopy,
    handleDownload,
    closeOutput,
    toggleOutput,
    openOutput,
    setOutput
  };
};
