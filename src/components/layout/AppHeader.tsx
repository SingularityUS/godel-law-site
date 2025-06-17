
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
}

const AppHeader: React.FC<AppHeaderProps> = ({
  onFilesAccepted,
  onUploadComplete,
  onLibraryOpen
}) => {
  return (
    <header className="border-b-2 border-black bg-white">
      {/* Main header row */}
      <div className="flex justify-between items-center py-4 px-8">
        {/* Application Branding */}
        <div className="flex items-center gap-3">
          <BookOpen size={32} className="text-black" />
          <h1 className="text-2xl font-bold tracking-tight text-black">AI PRODUCTION LINE BUILDER</h1>
        </div>
        
        {/* Right Section - Document Controls and User Section */}
        <div className="flex items-center gap-6">
          <DocumentControls 
            onFilesAccepted={onFilesAccepted}
            onUploadComplete={onUploadComplete}
            onLibraryOpen={onLibraryOpen}
          />
          
          <UserSection />
        </div>
      </div>

      {/* ChatGPT Status Row - Narrow, right-aligned, white background */}
      <div className="flex justify-end items-center py-1 px-8 bg-white">
        <ChatGPTStatus />
      </div>
    </header>
  );
};

export default AppHeader;
