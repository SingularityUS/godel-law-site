
/**
 * OutputPanelHeader Component
 * 
 * Purpose: Header controls for the final output panel
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Copy, Download, X, Maximize2, Minimize2, FileText, Scale } from "lucide-react";

interface OutputPanelHeaderProps {
  isLegalPipeline: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onClose: () => void;
}

const OutputPanelHeader: React.FC<OutputPanelHeaderProps> = ({
  isLegalPipeline,
  isExpanded,
  onToggleExpanded,
  onCopy,
  onDownload,
  onClose
}) => {
  return (
    <div className="flex items-center justify-between">
      <CardTitle className="text-lg font-bold flex items-center gap-2">
        {isLegalPipeline ? <Scale size={20} /> : <FileText size={20} />}
        {isLegalPipeline ? 'Legal Analysis Results' : 'Pipeline Output'}
      </CardTitle>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleExpanded}
          className="h-6 w-6 p-0"
        >
          {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopy}
          className="h-6 w-6 p-0"
          title="Copy to clipboard"
        >
          <Copy size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDownload}
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
  );
};

export default OutputPanelHeader;
