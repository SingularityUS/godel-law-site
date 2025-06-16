
/**
 * AppHeader Component
 * 
 * Purpose: Application header with branding, document controls, and user section
 * This component provides the top-level navigation and controls for the AI Workbench
 * application, including document management and user authentication.
 * 
 * Key Responsibilities:
 * - Displays application branding and title
 * - Houses document upload and library controls
 * - Shows user authentication information and logout
 * - Maintains consistent header styling and layout
 * 
 * Integration Points:
 * - Receives document management callbacks from parent
 * - Integrates with DocumentUpload and DocumentControls components
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
    <header className="flex justify-between items-center py-4 px-8 border-b-2 border-black bg-white">
      {/* Application Branding */}
      <div className="flex items-center gap-3">
        <BookOpen size={32} className="text-black" />
        <h1 className="text-2xl font-bold tracking-tight text-black">AI PRODUCTION LINE BUILDER</h1>
      </div>
      
      {/* Document Management Controls */}
      <DocumentControls 
        onFilesAccepted={onFilesAccepted}
        onUploadComplete={onUploadComplete}
        onLibraryOpen={onLibraryOpen}
      />

      {/* User Authentication Section */}
      <UserSection />
    </header>
  );
};

export default AppHeader;
