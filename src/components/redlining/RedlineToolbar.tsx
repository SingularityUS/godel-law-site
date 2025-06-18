
/**
 * RedlineToolbar Component
 * 
 * Purpose: Document editing controls and navigation
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  Save, 
  Download, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  XCircle,
  Filter,
  SidebarClose,
  SidebarOpen
} from "lucide-react";
import { RedlineDocument, RedlineState } from "@/types/redlining";

interface RedlineToolbarProps {
  document: RedlineDocument;
  state: RedlineState;
  onClose: () => void;
  onSave: () => void;
  onExport: (format: string) => void;
  onNavigate: (direction: 'next' | 'prev') => void;
  onFilter: (filters: Partial<RedlineState>) => void;
  onToggleSidebar: () => void;
}

const RedlineToolbar: React.FC<RedlineToolbarProps> = ({
  document,
  state,
  onClose,
  onSave,
  onExport,
  onNavigate,
  onFilter,
  onToggleSidebar
}) => {
  const totalSuggestions = document.suggestions.length;
  const processedSuggestions = document.suggestions.filter(s => s.status !== 'pending').length;
  const progress = totalSuggestions > 0 ? (processedSuggestions / totalSuggestions) * 100 : 0;

  return (
    <div className="flex items-center gap-4 p-2 border-b bg-gray-50">
      {/* Navigation Controls */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onNavigate('prev')}
          disabled={state.currentSuggestionIndex <= 0}
        >
          <ChevronLeft size={16} />
        </Button>
        <span className="text-sm font-medium">
          {state.currentSuggestionIndex + 1} of {totalSuggestions}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onNavigate('next')}
          disabled={state.currentSuggestionIndex >= totalSuggestions - 1}
        >
          <ChevronRight size={16} />
        </Button>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 min-w-32">
        <Progress value={progress} className="flex-1" />
        <span className="text-xs text-gray-600">
          {processedSuggestions}/{totalSuggestions}
        </span>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter size={16} className="text-gray-400" />
        <Select
          value={state.filterType}
          onValueChange={(value) => onFilter({ filterType: value as any })}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="grammar">Grammar</SelectItem>
            <SelectItem value="style">Style</SelectItem>
            <SelectItem value="legal">Legal</SelectItem>
            <SelectItem value="clarity">Clarity</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={state.filterSeverity}
          onValueChange={(value) => onFilter({ filterSeverity: value as any })}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline">
          <Check size={16} className="mr-1" />
          Accept All
        </Button>
        <Button size="sm" variant="outline">
          <XCircle size={16} className="mr-1" />
          Reject All
        </Button>
      </div>

      {/* Document Actions */}
      <div className="flex items-center gap-2 ml-auto">
        <Button size="sm" onClick={onToggleSidebar} variant="outline">
          <SidebarClose size={16} />
        </Button>
        
        <Button size="sm" onClick={onSave}>
          <Save size={16} className="mr-1" />
          Save
        </Button>
        
        {/* Fixed Export Dropdown */}
        <div className="relative">
          <Select onValueChange={onExport}>
            <SelectTrigger className="w-28">
              <Download size={16} className="mr-1" />
              <SelectValue placeholder="Export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="docx">DOCX</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="txt">TXT</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button size="sm" variant="outline" onClick={onClose}>
          <X size={16} />
        </Button>
      </div>
    </div>
  );
};

export default RedlineToolbar;
