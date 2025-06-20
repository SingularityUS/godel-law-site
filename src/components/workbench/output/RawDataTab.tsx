
/**
 * RawDataTab Component
 * 
 * Purpose: Displays filtered raw output data from selected modules
 */

import React, { useState, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import ModuleSelector from "./ModuleSelector";
import { MODULE_DEFINITIONS } from "@/data/modules";

interface RawDataTabProps {
  output: any;
}

const RawDataTab: React.FC<RawDataTabProps> = ({ output }) => {
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Extract available modules from pipeline results
  const availableModules = useMemo(() => {
    if (!output?.pipelineResults || !Array.isArray(output.pipelineResults)) {
      return [];
    }

    return output.pipelineResults.map((result: any) => {
      const dataString = JSON.stringify(result.result || {});
      return {
        nodeId: result.nodeId,
        moduleType: result.moduleType,
        dataSize: new Blob([dataString]).size,
        processingTime: result.result?.metadata?.processingTime
      };
    });
  }, [output]);

  // Auto-select first module if none selected
  React.useEffect(() => {
    if (availableModules.length > 0 && selectedModules.length === 0) {
      setSelectedModules([availableModules[0].nodeId]);
    }
  }, [availableModules, selectedModules.length]);

  // Filter and format data from selected modules
  const filteredData = useMemo(() => {
    if (!output?.pipelineResults || selectedModules.length === 0) {
      return '';
    }

    const selectedResults = output.pipelineResults.filter((result: any) => 
      selectedModules.includes(result.nodeId)
    );

    let formattedData = '';

    selectedResults.forEach((result: any, index: number) => {
      const moduleDef = MODULE_DEFINITIONS.find(m => m.type === result.moduleType);
      const moduleLabel = moduleDef?.label || result.moduleType;
      
      formattedData += `\n${'='.repeat(60)}\n`;
      formattedData += `MODULE: ${moduleLabel.toUpperCase()}\n`;
      formattedData += `Node ID: ${result.nodeId}\n`;
      formattedData += `Type: ${result.moduleType}\n`;
      
      if (result.result?.metadata?.processingTime) {
        formattedData += `Processing Time: ${result.result.metadata.processingTime}ms\n`;
      }
      
      formattedData += `${'='.repeat(60)}\n\n`;

      try {
        const dataToShow = result.result || {};
        formattedData += JSON.stringify(dataToShow, null, 2);
      } catch (error) {
        formattedData += `[Error formatting data: ${error.message}]`;
      }

      if (index < selectedResults.length - 1) {
        formattedData += '\n\n';
      }
    });

    return formattedData;
  }, [output, selectedModules]);

  // Apply search filter
  const displayData = useMemo(() => {
    if (!searchTerm.trim()) return filteredData;
    
    const lines = filteredData.split('\n');
    const filteredLines = lines.filter(line => 
      line.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filteredLines.join('\n');
  }, [filteredData, searchTerm]);

  const handleExport = () => {
    const dataToExport = filteredData;
    const blob = new Blob([dataToExport], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipeline-data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const dataSize = new Blob([displayData]).size;
  const isLargeData = dataSize > 100 * 1024; // 100KB threshold

  return (
    <div className="flex h-full">
      <ModuleSelector
        availableModules={availableModules}
        selectedModules={selectedModules}
        onSelectionChange={setSelectedModules}
      />
      
      <div className="flex-1 flex flex-col">
        {/* Controls Header */}
        <div className="border-b bg-white p-3 flex items-center gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search in raw data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-8"
            />
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={!filteredData}
            className="h-8"
          >
            <Download size={14} className="mr-1" />
            Export
          </Button>
        </div>

        {/* Data Display */}
        <div className="flex-1 p-4">
          {isLargeData && (
            <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              ⚠️ Large dataset detected ({(dataSize / 1024).toFixed(1)} KB). Consider selecting fewer modules for better performance.
            </div>
          )}
          
          {selectedModules.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p className="text-lg mb-2">No modules selected</p>
                <p className="text-sm">Select one or more modules from the left panel to view their raw data</p>
              </div>
            </div>
          ) : (
            <Textarea
              value={displayData}
              readOnly
              className="w-full h-full resize-none border-none p-0 font-mono text-xs"
              placeholder={filteredData ? "Use search above to filter data..." : "No data available"}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default RawDataTab;
