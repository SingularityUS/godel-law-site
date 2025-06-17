
/**
 * RawDataTab Component
 * 
 * Purpose: Displays raw output data in a textarea
 */

import React from "react";
import { Textarea } from "@/components/ui/textarea";

interface RawDataTabProps {
  output: any;
}

const RawDataTab: React.FC<RawDataTabProps> = ({ output }) => {
  const formatOutput = (data: any): string => {
    if (typeof data === 'string') {
      return data;
    }
    return JSON.stringify(data, null, 2);
  };

  return (
    <Textarea
      value={formatOutput(output)}
      readOnly
      className="w-full h-full resize-none border-none p-0 font-mono text-xs"
    />
  );
};

export default RawDataTab;
