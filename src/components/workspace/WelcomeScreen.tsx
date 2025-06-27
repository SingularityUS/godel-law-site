
import React from "react";
import { Bot } from "lucide-react";

interface WelcomeScreenProps {
  onFileDrop?: (event: React.DragEvent) => void;
  onDragOver?: (event: React.DragEvent) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onFileDrop,
  onDragOver
}) => {
  return (
    <div 
      className="h-full flex items-center justify-center text-center"
      onDrop={onFileDrop}
      onDragOver={onDragOver}
    >
      <div className="text-gray-500">
        <Bot size={64} className="mx-auto mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold mb-2">GPT-4.1 Workspace</h3>
        <p className="text-sm mb-2">Advanced AI with 200K token context window</p>
        <p className="text-xs">Drop documents here or start a conversation</p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
