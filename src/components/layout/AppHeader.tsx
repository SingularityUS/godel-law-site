
/**
 * AppHeader Component
 * 
 * Purpose: Application header with branding, document controls, ChatGPT status, and user section
 * This component provides the top-level navigation and controls for the AI Workbench
 * application, including document management, ChatGPT connection monitoring, and user authentication.
 * 
 * Key Responsibilities:
 * - Displays application branding and title
 * - Houses document upload and library controls
 * - Shows ChatGPT API connection status and token usage
 * - Shows user authentication information and logout
 * - Maintains consistent header styling and layout
 * 
 * Integration Points:
 * - Receives document management callbacks from parent
 * - Integrates with DocumentUpload and DocumentControls components
 * - Displays real-time ChatGPT API status via ChatGPTStatus component
 * - Coordinates with UserSection for authentication display
 * - Maintains responsive design for different screen sizes
 * 
 * Architecture Benefits:
 * - Separates header concerns from main page logic
 * - Provides reusable header component for future pages
 * - Improves maintainability through focused responsibility
 * - Enables independent testing of header functionality
 */

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

      {/* ChatGPT Status Row */}
      <div className="flex justify-center items-center py-2 px-8 border-t border-gray-200 bg-gray-50">
        <ChatGPTStatus />
      </div>
    </header>
  );
};

export default AppHeader;
