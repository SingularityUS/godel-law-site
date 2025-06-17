
/**
 * useOutputPanel Hook
 * 
 * Purpose: Shared logic for output panel operations
 */

import { useCallback } from "react";

export const useOutputPanel = (output: any) => {
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
    copyToClipboard(formatOutput(output));
  }, [copyToClipboard, formatOutput, output]);

  const handleDownload = useCallback(() => {
    downloadAsFile(
      formatOutput(output), 
      `legal-analysis-${new Date().toISOString().slice(0, 19)}.json`
    );
  }, [downloadAsFile, formatOutput, output]);

  return {
    formatOutput,
    copyToClipboard,
    downloadAsFile,
    handleCopy,
    handleDownload
  };
};
