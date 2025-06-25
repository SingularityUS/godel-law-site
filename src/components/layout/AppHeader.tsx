
import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserSection from './UserSection';

interface AppHeaderProps {
  onToggleLibrary?: () => void;
  showLibraryToggle?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({ 
  onToggleLibrary, 
  showLibraryToggle = false 
}) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900">Legal AI Workspace</h1>
          
          {showLibraryToggle && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleLibrary}
              className="flex items-center gap-2"
            >
              <FileText size={16} />
              Document Library
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/citation-settings')}
            className="flex items-center gap-2"
          >
            <Settings size={16} />
            Citation Settings
          </Button>
          
          <UserSection />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
