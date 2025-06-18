
import React from "react";
import { BookOpen } from "lucide-react";
import DocumentControls from "./DocumentControls";
import UserSection from "./UserSection";
import ChatGPTStatus from "./ChatGPTStatus";

export type UploadedFile = File & { preview?: string; extractedText?: string };

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
  return (
    <header className="border-b-2 border-black bg-white">
      <div className="flex justify-between items-center py-4 px-8">
        <div className="flex items-center gap-3">
          <BookOpen size={32} className="text-black" />
          <h1 className="text-2xl font-bold tracking-tight text-black">AI PRODUCTION LINE BUILDER</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <DocumentControls 
            onFilesAccepted={onFilesAccepted}
            onUploadComplete={onUploadComplete}
            onLibraryOpen={onLibraryOpen}
            onDocumentAdded={onDocumentAdded}
          />
          
          <UserSection />
        </div>
      </div>

      <div className="flex justify-between items-center py-2 px-8 bg-white border-t border-gray-200">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onTabChange('document-analyzer')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'document-analyzer'
                ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            Document Analyzer
          </button>
          <button
            onClick={() => onTabChange('document-builder')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'document-builder'
                ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            Document Builder
          </button>
        </div>
        
        <ChatGPTStatus />
      </div>
    </header>
  );
};

export default AppHeader;
