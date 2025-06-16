
/**
 * DataPreviewEdge Component
 * 
 * Purpose: Custom React Flow edge that displays data preview boxes when selected
 * This component creates edges with optional data inspection capabilities,
 * showing input/output data only when the edge is clicked to reduce clutter.
 */

import React from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  EdgeProps
} from "@xyflow/react";
import DataPreviewBox from "./DataPreviewBox";

interface DataPreviewEdgeProps extends EdgeProps {
  data?: {
    edgeData?: {
      inputData: any;
      outputData: any;
      dataType: 'text' | 'json' | 'binary' | 'error';
      isProcessing: boolean;
    };
    onSimulateProcessing?: () => void;
    label?: string;
    isSelected?: boolean;
    onEdgeClick?: (edgeId: string) => void;
  };
}

const DataPreviewEdge: React.FC<DataPreviewEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const hasData = Boolean(data?.edgeData);
  const isSelected = Boolean(data?.isSelected);
  const isProcessing = Boolean(data?.edgeData?.isProcessing);

  const handleEdgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasData && data?.onEdgeClick) {
      data.onEdgeClick(id);
    }
  };

  // Style the edge based on its state
  const edgeStyle = {
    ...style,
    stroke: isSelected 
      ? '#3b82f6' 
      : isProcessing 
        ? '#3b82f6' 
        : hasData 
          ? '#6b7280' 
          : '#333',
    strokeWidth: isSelected ? 3 : isProcessing ? 3 : hasData ? 2.5 : 2,
    cursor: hasData ? 'pointer' : 'default',
    animation: isProcessing ? 'pulse 1s infinite' : 'none'
  };

  return (
    <>
      {/* Base edge path with click handling */}
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={edgeStyle}
        onClick={handleEdgeClick}
      />
      
      {/* Small data indicator dot when data is available but not selected */}
      {hasData && !isSelected && (
        <EdgeLabelRenderer>
          <div
            className="data-indicator-dot nodrag nopan"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
              zIndex: 999,
            }}
            onClick={handleEdgeClick}
          >
            <div className="w-3 h-3 rounded-full border-2 border-blue-500 hover:border-blue-600 cursor-pointer shadow-sm" />
          </div>
        </EdgeLabelRenderer>
      )}
      
      {/* Data preview box when selected */}
      {hasData && isSelected && data?.edgeData && (
        <EdgeLabelRenderer>
          <div
            className="data-preview-edge-label nodrag nopan"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
              zIndex: 1000,
            }}
          >
            <DataPreviewBox
              edgeData={data.edgeData}
              onSimulateProcessing={data.onSimulateProcessing}
            />
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default DataPreviewEdge;
