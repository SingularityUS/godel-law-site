
/**
 * WorkspaceSidebarHeader Component
 * 
 * Purpose: Header controls for the workspace sidebar
 * Extracted from WorkspaceSidebar for better organization
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft } from "lucide-react";

interface WorkspaceSidebarHeaderProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

const WorkspaceSidebarHeader: React.FC<WorkspaceSidebarHeaderProps> = ({
  isOpen,
  onClose,
  onToggle
}) => {
  if (!isOpen) {
    return (
      <div className="flex items-center justify-center p-4 border-b bg-gray-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="flex items-center gap-2"
        >
          <ChevronLeft size={16} />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 border-b bg-gray-50 flex-shrink-0">
      <h3 className="font-semibold text-gray-800">Pipeline Results</h3>
      <Button variant="ghost" size="sm" onClick={onClose}>
        <X size={16} />
      </Button>
    </div>
  );
};

export default WorkspaceSidebarHeader;
