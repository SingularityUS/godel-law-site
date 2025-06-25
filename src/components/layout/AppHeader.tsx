
import React from "react";
import DocumentControls from "./DocumentControls";
import UserSection from "./UserSection";
import ChatGPTStatus from "./ChatGPTStatus";

export type UploadedFile = File & {
  preview?: string;
  extractedText?: string;
};

interface AppHeaderProps {
  onFilesAccepted: (files: UploadedFile[]) => void;
  onUploadComplete: () => void;
  onLibraryOpen: () => void;
  onDocumentAdded?: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  onFilesAccepted,
  onUploadComplete,
  onLibraryOpen,
  onDocumentAdded,
  activeTab,
  onTabChange
}) => {
  return <header className="border-b-2 border-black bg-white">
      <div className="flex justify-between items-center py-4 px-8">
        <div className="flex items-center gap-3">
          <img 
            src="/lovable-uploads/55e034c9-5545-436e-aa13-325632103439.png" 
            alt="Gödel Logo" 
            className="w-8 h-8 object-contain"
          />
          <h1 className="text-2xl font-bold tracking-tight text-black">Gödel</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <DocumentControls onFilesAccepted={onFilesAccepted} onUploadComplete={onUploadComplete} onLibraryOpen={onLibraryOpen} onDocumentAdded={onDocumentAdded} />
          
          <UserSection />
        </div>
      </div>

      <div className="flex justify-between items-center py-2 px-8 bg-white border-t border-gray-200">
        <div className="flex items-center gap-1">
          <button onClick={() => onTabChange('workspace')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'workspace' ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'}`}>
            Workspace
          </button>
          <button onClick={() => onTabChange('document-analyzer')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'document-analyzer' ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'}`}>
            Document Analyzer
          </button>
          <button onClick={() => onTabChange('document-builder')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'document-builder' ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'}`}>
            Document Builder
          </button>
        </div>
        
        <ChatGPTStatus />
      </div>
    </header>;
};

export default AppHeader;
