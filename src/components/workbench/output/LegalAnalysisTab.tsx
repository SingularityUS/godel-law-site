
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import CitationFinderWarning from "../CitationFinderWarning";

interface LegalAnalysisTabProps {
  output: any;
}

const LegalAnalysisTab: React.FC<LegalAnalysisTabProps> = ({ output }) => {
  // Extract citation data
  const citationData = output?.output?.citations || output?.citations || [];
  const citationStats = output?.output?.processingStats || output?.processingStats;
  const citationError = output?.metadata?.error || output?.error;
  const userFriendlyError = output?.metadata?.userFriendlyError;
  
  // Extract grammar data
  const grammarAnalysis = output?.output?.analysis || output?.analysis || [];
  const grammarStats = output?.output?.processingStats;
  const overallAssessment = output?.output?.overallAssessment;

  const renderCitationAnalysis = () => {
    // Show warning if there's a citation finder error
    if (citationError) {
      return (
        <div>
          <CitationFinderWarning 
            error={userFriendlyError || citationError} 
            className="mb-4"
          />
          
          {/* Still show empty state for consistency */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Citation Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-sm">
                No citation data available for analysis.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Citation Analysis
            {citationData.length > 0 && (
              <Badge variant="secondary">
                {citationData.length} citation{citationData.length !== 1 ? 's' : ''} found
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {citationData.length === 0 ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm">No citations found in document</span>
            </div>
          ) : (
            <div className="space-y-4">
              {citationStats && (
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Paragraphs Processed:</span>
                    <div className="text-lg font-bold text-blue-600">
                      {citationStats.paragraphsProcessed}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Citations Found:</span>
                    <div className="text-lg font-bold text-green-600">
                      {citationStats.citationsFound}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Avg per Paragraph:</span>
                    <div className="text-lg font-bold text-purple-600">
                      {citationStats.averageCitationsPerParagraph.toFixed(1)}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                {citationData.map((citation: any, index: number) => (
                  <div key={citation.id || index} className="border rounded p-3 bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant={citation.isComplete ? "default" : "destructive"}>
                        {citation.type}
                      </Badge>
                      <div className="flex gap-1">
                        {citation.needsVerification && (
                          <Badge variant="outline" className="text-yellow-600">
                            Needs Verification
                          </Badge>
                        )}
                        {!citation.isComplete && (
                          <Badge variant="destructive">
                            Incomplete
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium mb-1">Original Text:</div>
                      <div className="bg-white p-2 rounded border font-mono text-xs">
                        {citation.originalText}
                      </div>
                      {citation.bluebookFormat && citation.bluebookFormat !== citation.originalText && (
                        <>
                          <div className="font-medium mb-1 mt-3">Suggested Format:</div>
                          <div className="bg-green-50 p-2 rounded border font-mono text-xs">
                            {citation.bluebookFormat}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderGrammarAnalysis = () => {
    if (!grammarAnalysis || grammarAnalysis.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Grammar Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-sm">
              No grammar analysis data available.
            </p>
          </CardContent>
        </Card>
      );
    }

    const totalErrors = overallAssessment?.totalErrors || 0;
    const errorTypes = overallAssessment?.errorsByType || {};

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Grammar Analysis
            {totalErrors > 0 && (
              <Badge variant="destructive">
                {totalErrors} error{totalErrors !== 1 ? 's' : ''} found
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {totalErrors === 0 ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm">No grammar errors found</span>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.keys(errorTypes).length > 0 && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {Object.entries(errorTypes).map(([type, count]) => (
                    <div key={type}>
                      <span className="font-medium capitalize">{type.replace(/([A-Z])/g, ' $1')}:</span>
                      <div className="text-lg font-bold text-red-600">{count as number}</div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="space-y-2">
                {grammarAnalysis.slice(0, 5).map((analysis: any, index: number) => (
                  <div key={index} className="border rounded p-3 bg-gray-50">
                    <div className="text-sm">
                      <div className="font-medium mb-1">Paragraph {index + 1}:</div>
                      <div className="text-gray-600">
                        {analysis.errors?.length || 0} error{(analysis.errors?.length || 0) !== 1 ? 's' : ''} found
                      </div>
                      {analysis.errors && analysis.errors.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {analysis.errors.slice(0, 3).map((error: any, errorIndex: number) => (
                            <div key={errorIndex} className="text-xs">
                              <Badge variant="outline" className="mr-2">
                                {error.type}
                              </Badge>
                              {error.description}
                            </div>
                          ))}
                          {analysis.errors.length > 3 && (
                            <div className="text-xs text-gray-500">
                              ... and {analysis.errors.length - 3} more error{analysis.errors.length - 3 !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {grammarAnalysis.length > 5 && (
                  <div className="text-sm text-gray-500 text-center">
                    ... and {grammarAnalysis.length - 5} more paragraph{grammarAnalysis.length - 5 !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {renderCitationAnalysis()}
      {renderGrammarAnalysis()}
    </div>
  );
};

export default LegalAnalysisTab;
