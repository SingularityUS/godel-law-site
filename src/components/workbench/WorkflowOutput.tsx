
/**
 * WorkflowOutput Component
 * 
 * Purpose: Displays the final output from workflow execution
 * Shows formatted results and provides download options
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Copy, X } from "lucide-react";
import { ExecutionStep } from "@/hooks/workbench/useWorkflowExecution";
import { toast } from "sonner";

interface WorkflowOutputProps {
  isOpen: boolean;
  onClose: () => void;
  finalOutput: any;
  executionHistory: ExecutionStep[];
}

const WorkflowOutput: React.FC<WorkflowOutputProps> = ({
  isOpen,
  onClose,
  finalOutput,
  executionHistory
}) => {
  if (!isOpen) return null;

  const handleCopyOutput = () => {
    const outputText = typeof finalOutput === 'string' 
      ? finalOutput 
      : JSON.stringify(finalOutput, null, 2);
    
    navigator.clipboard.writeText(outputText);
    toast.success("Output copied to clipboard");
  };

  const handleDownloadOutput = () => {
    const outputText = typeof finalOutput === 'string' 
      ? finalOutput 
      : JSON.stringify(finalOutput, null, 2);
    
    const blob = new Blob([outputText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-output-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Output downloaded");
  };

  const formatOutput = (output: any) => {
    if (typeof output === 'string') {
      return output;
    }
    return JSON.stringify(output, null, 2);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Workflow Output</CardTitle>
            <CardDescription>
              Final result from your AI processing pipeline
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyOutput}>
              <Copy size={16} />
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadOutput}>
              <Download size={16} />
              Download
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
            {/* Execution History */}
            <div className="lg:col-span-1">
              <h3 className="font-semibold mb-3">Execution Steps</h3>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {executionHistory.map((step, index) => (
                    <div key={step.nodeId} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          Step {index + 1}
                        </span>
                        <Badge 
                          variant={
                            step.status === 'completed' ? 'default' :
                            step.status === 'processing' ? 'secondary' :
                            step.status === 'error' ? 'destructive' : 'outline'
                          }
                        >
                          {step.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 mb-1">
                        {step.moduleType.replace('-', ' ').toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {step.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Final Output */}
            <div className="lg:col-span-2">
              <h3 className="font-semibold mb-3">Final Output</h3>
              <ScrollArea className="h-[400px]">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {formatOutput(finalOutput)}
                  </pre>
                </div>
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowOutput;
