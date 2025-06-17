
/**
 * FinalOutputPanel Component
 * 
 * Purpose: Displays the final output of pipeline execution
 * This component shows the processed result after all modules have completed.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download, X, Maximize2, Minimize2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface FinalOutputPanelProps {
  output: any;
  onClose: () => void;
}

const FinalOutputPanel: React.FC<FinalOutputPanelProps> = ({
  output,
  onClose
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!output) return null;

  const formatOutput = (data: any): string => {
    if (typeof data === 'string') {
      return data;
    }
    return JSON.stringify(data, null, 2);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formatOutput(output));
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const downloadAsFile = () => {
    const content = formatOutput(output);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipeline-output-${new Date().toISOString().slice(0, 19)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`fixed ${isExpanded ? 'inset-4' : 'bottom-4 right-4 w-96 max-h-96'} z-50`}>
      <Card className="h-full flex flex-col border-2 border-black bg-white shadow-lg">
        <CardHeader className="flex-shrink-0 border-b-2 border-black pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold">Pipeline Output</CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="h-6 w-6 p-0"
                title="Copy to clipboard"
              >
                <Copy size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadAsFile}
                className="h-6 w-6 p-0"
                title="Download as file"
              >
                <Download size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X size={14} />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-4 overflow-hidden">
          <Textarea
            value={formatOutput(output)}
            readOnly
            className="w-full h-full resize-none border-none p-0 font-mono text-sm"
            style={{ fontFamily: 'Courier New, monospace' }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default FinalOutputPanel;
