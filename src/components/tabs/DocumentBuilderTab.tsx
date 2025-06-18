
import React from "react";
import { FileText, Plus, Settings } from "lucide-react";

const DocumentBuilderTab: React.FC = () => {
  return (
    <div className="flex-1 overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-6">
            <FileText size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Document Builder</h2>
            <p className="text-gray-500 text-lg">
              Create and customize documents with AI assistance
            </p>
          </div>
          
          <div className="space-y-4 text-sm text-gray-400">
            <div className="flex items-center justify-center gap-2">
              <Plus size={16} />
              <span>Template Creation</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Settings size={16} />
              <span>Document Configuration</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <FileText size={16} />
              <span>Output Generation</span>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-700 font-medium">Coming Soon</p>
            <p className="text-blue-600 text-sm mt-1">
              This feature is currently under development
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentBuilderTab;
