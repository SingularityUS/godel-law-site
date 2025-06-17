
/**
 * LegalAnalysisTab Component
 * 
 * Purpose: Displays detailed legal analysis results
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LegalAnalysisTabProps {
  output: any;
}

const LegalAnalysisTab: React.FC<LegalAnalysisTabProps> = ({ output }) => {
  const formatOutput = (data: any): string => {
    if (typeof data === 'string') {
      return data;
    }
    return JSON.stringify(data, null, 2);
  };

  return (
    <div className="space-y-4 h-full overflow-auto">
      {output.results?.filter((r: any) => r.moduleType !== 'document-input').map((result: any, index: number) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="text-sm capitalize">
              {result.moduleType?.replace('-', ' ')} Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">
              {formatOutput(result.result?.output || result.result)}
            </pre>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default LegalAnalysisTab;
