
/**
 * DataPreviewEdge Component
 * 
 * Purpose: Custom React Flow edge that displays data preview boxes
 * This component creates edges with data inspection capabilities,
 * showing input/output data at the connection midpoint.
 */

import React from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  Edge,
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

  return (
    <>
      {/* Base edge path */}
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{
          ...style,
          stroke: data?.edgeData?.isProcessing ? '#3b82f6' : '#333',
          strokeWidth: data?.edgeData?.isProcessing ? 3 : 2,
          animation: data?.edgeData?.isProcessing ? 'pulse 1s infinite' : 'none'
        }} 
      />
      
      {/* Data preview box at edge midpoint */}
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
          {data?.edgeData && (
            <DataPreviewBox
              edgeData={data.edgeData}
              onSimulateProcessing={data.onSimulateProcessing}
            />
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default DataPreviewEdge;
