
/**
 * FullJsonViewer Component
 * 
 * Purpose: Full-screen modal for viewing complete JSON data
 * Provides syntax highlighting, search, and better navigation for large JSON objects
 */

import React, { useState, useMemo } from "react";
import { X, Copy, Search, Download, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FullJsonViewerProps {
  data: {
    inputData: any;
    outputData: any;
    dataType: 'text' | 'json' | 'binary' | 'error';
  };
  isOpen: boolean;
  onClose: () => void;
}

const FullJsonViewer: React.FC<FullJsonViewerProps> = ({ data, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'input' | 'output' | 'both'>('output');
  const [searchTerm, setSearchTerm] = useState('');
  const [showLineNumbers, setShowLineNumbers] = useState(true);

  const formatJson = (obj: any) => {
    if (typeof obj === 'string') {
      try {
        return JSON.stringify(JSON.parse(obj), null, 2);
      } catch {
        return obj;
      }
    }
    return JSON.stringify(obj, null, 2);
  };

  const highlightSearch = (text: string, search: string) => {
    if (!search) return text;
    const regex = new RegExp(`(${search})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };

  const currentData = useMemo(() => {
    const input = formatJson(data.inputData);
    const output = formatJson(data.outputData);
    
    if (activeTab === 'input') return input;
    if (activeTab === 'output') return output;
    return { input, output };
  }, [data, activeTab]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadJson = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">JSON Data Viewer</h2>
            <div className="flex gap-1">
              <Button
                variant={activeTab === 'output' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('output')}
              >
                Output
              </Button>
              <Button
                variant={activeTab === 'input' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('input')}
              >
                Input
              </Button>
              <Button
                variant={activeTab === 'both' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('both')}
              >
                Both
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search in JSON..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1 border rounded text-sm w-48"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLineNumbers(!showLineNumbers)}
            >
              {showLineNumbers ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(typeof currentData === 'string' ? currentData : JSON.stringify(currentData, null, 2))}
            >
              <Copy size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadJson(
                typeof currentData === 'string' ? currentData : JSON.stringify(currentData, null, 2),
                `data-${activeTab}-${new Date().toISOString().split('T')[0]}.json`
              )}
            >
              <Download size={16} />
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'both' ? (
            <div className="grid grid-cols-2 gap-4 p-4 h-full">
              <div className="flex flex-col">
                <h3 className="font-medium mb-2 flex items-center justify-between">
                  Input Data
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(formatJson(data.inputData))}
                    >
                      <Copy size={12} />
                    </Button>
                  </div>
                </h3>
                <div className="flex-1 overflow-auto bg-gray-50 rounded border p-4">
                  <pre 
                    className="text-xs leading-relaxed font-mono"
                    dangerouslySetInnerHTML={{
                      __html: highlightSearch(formatJson(data.inputData), searchTerm)
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <h3 className="font-medium mb-2 flex items-center justify-between">
                  Output Data
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(formatJson(data.outputData))}
                    >
                      <Copy size={12} />
                    </Button>
                  </div>
                </h3>
                <div className="flex-1 overflow-auto bg-gray-50 rounded border p-4">
                  <pre 
                    className="text-xs leading-relaxed font-mono"
                    dangerouslySetInnerHTML={{
                      __html: highlightSearch(formatJson(data.outputData), searchTerm)
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 h-full">
              <div className="h-full overflow-auto bg-gray-50 rounded border">
                <div className="flex">
                  {showLineNumbers && (
                    <div className="bg-gray-100 p-4 text-xs font-mono text-gray-500 select-none border-r">
                      {(typeof currentData === 'string' ? currentData : JSON.stringify(currentData, null, 2))
                        .split('\n')
                        .map((_, i) => (
                          <div key={i} className="leading-relaxed">
                            {i + 1}
                          </div>
                        ))}
                    </div>
                  )}
                  <div className="flex-1 p-4">
                    <pre 
                      className="text-xs leading-relaxed font-mono"
                      dangerouslySetInnerHTML={{
                        __html: highlightSearch(
                          typeof currentData === 'string' ? currentData : JSON.stringify(currentData, null, 2),
                          searchTerm
                        )
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <div className="text-xs text-gray-600 flex justify-between items-center">
            <span>
              Data Type: {data.dataType?.toUpperCase()} | 
              Size: {new Blob([typeof currentData === 'string' ? currentData : JSON.stringify(currentData)]).size} bytes
            </span>
            <span>
              Use Ctrl+F for additional search functionality
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullJsonViewer;
