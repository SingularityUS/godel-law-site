
import React from 'react';

interface RedlineControlsProps {
  hasValidData: boolean;
  onOpenRedlining: () => void;
  isLoading?: boolean;
}

const RedlineControls: React.FC<RedlineControlsProps> = ({
  hasValidData,
  onOpenRedlining,
  isLoading = false
}) => {
  if (!hasValidData) {
    return null;
  }

  return (
    <div className="flex justify-end mb-4">
      <button 
        onClick={onOpenRedlining}
        disabled={isLoading}
        className="bg-blue-500 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2 px-4 rounded transition-colors"
      >
        {isLoading ? 'Loading...' : 'Open Redlining'}
      </button>
    </div>
  );
};

export default RedlineControls;
