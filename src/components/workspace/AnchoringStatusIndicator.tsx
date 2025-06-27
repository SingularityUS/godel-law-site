
import React from "react";
import { CheckCircle, AlertCircle, RotateCw, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AnchoringStatus } from "@/hooks/useAnchoringStatus";

interface AnchoringStatusIndicatorProps {
  status: AnchoringStatus;
  progress?: number;
  message?: string;
  anchorCount?: number;
  className?: string;
}

const AnchoringStatusIndicator: React.FC<AnchoringStatusIndicatorProps> = ({
  status,
  progress,
  message,
  anchorCount,
  className = ""
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'processing':
        return {
          icon: <RotateCw size={12} className="animate-spin" />,
          color: "bg-yellow-500",
          textColor: "text-yellow-700",
          label: "Processing",
          tooltip: message || `Anchoring in progress${progress ? ` (${progress}%)` : ''}...`
        };
      case 'complete':
        return {
          icon: <CheckCircle size={12} />,
          color: "bg-green-500",
          textColor: "text-green-700",
          label: "Complete",
          tooltip: message || `Anchoring complete${anchorCount ? ` with ${anchorCount} anchors` : ''}`
        };
      case 'error':
        return {
          icon: <AlertCircle size={12} />,
          color: "bg-red-500",
          textColor: "text-red-700",
          label: "Error",
          tooltip: message || "Anchoring failed"
        };
      default:
        return {
          icon: <Clock size={12} />,
          color: "bg-gray-400",
          textColor: "text-gray-600",
          label: "Idle",
          tooltip: "No anchoring process active"
        };
    }
  };

  const config = getStatusConfig();

  if (status === 'idle') {
    return null; // Don't show anything for idle state
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-1 ${className}`}>
            <div className={`w-2 h-2 rounded-full ${config.color} flex items-center justify-center`}>
              <div className="w-1 h-1 bg-white rounded-full" />
            </div>
            <div className={`text-xs font-medium ${config.textColor} flex items-center gap-1`}>
              {config.icon}
              <span className="hidden sm:inline">{config.label}</span>
              {status === 'processing' && progress !== undefined && (
                <span className="text-xs">({progress}%)</span>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{config.tooltip}</p>
          {status === 'processing' && progress !== undefined && (
            <div className="mt-1 w-32 bg-gray-200 rounded-full h-1">
              <div 
                className="bg-yellow-500 h-1 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AnchoringStatusIndicator;
