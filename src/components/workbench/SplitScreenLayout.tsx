
/**
 * SplitScreenLayout Component
 * 
 * Purpose: Manages split-screen view for workbench and results
 * Handles layout transitions and panel resizing
 */

import React, { useState } from "react";
import { Separator } from "@/components/ui/separator";

interface SplitScreenLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  showSplit: boolean;
}

const SplitScreenLayout: React.FC<SplitScreenLayoutProps> = ({
  leftPanel,
  rightPanel,
  showSplit
}) => {
  const [leftWidth, setLeftWidth] = useState(50);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!showSplit) return;

    const startX = e.clientX;
    const startLeftWidth = leftWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const containerWidth = window.innerWidth;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newLeftWidth = Math.max(20, Math.min(80, startLeftWidth + deltaPercent));
      setLeftWidth(newLeftWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (!showSplit) {
    return <div className="w-full h-full">{leftPanel}</div>;
  }

  return (
    <div className="w-full h-full flex transition-all duration-300 ease-in-out">
      {/* Left Panel - Workbench */}
      <div 
        className="h-full transition-all duration-300 ease-in-out"
        style={{ width: `${leftWidth}%` }}
      >
        {leftPanel}
      </div>

      {/* Resizable Separator */}
      <div
        className="w-1 bg-gray-300 hover:bg-gray-400 cursor-col-resize flex items-center justify-center transition-colors"
        onMouseDown={handleMouseDown}
        title="Drag to resize panels"
      >
        <div className="w-0.5 h-8 bg-gray-500 rounded-full" />
      </div>

      {/* Right Panel - Results */}
      <div 
        className="h-full transition-all duration-300 ease-in-out"
        style={{ width: `${100 - leftWidth}%` }}
      >
        {rightPanel}
      </div>
    </div>
  );
};

export default SplitScreenLayout;
