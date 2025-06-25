
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, RotateCcw, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCitationSettings } from '@/hooks/useCitationSettings';
import { useAuth } from '@/hooks/useAuth';

const CitationSettings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings, isLoading, isSaving, saveSettings, resetToDefault, getCurrentPrompt } = useCitationSettings();
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    if (settings) {
      setPrompt(settings.prompt);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await saveSettings(prompt);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleReset = async () => {
    try {
      await resetToDefault();
      setPrompt(getCurrentPrompt());
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to access citation settings.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Citation Settings</h1>
              <p className="text-gray-600">Configure your citation extraction prompt</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText size={20} />
                  Citation Extraction Prompt
                </CardTitle>
                <CardDescription>
                  Customize the prompt used by GPT-4.1 to extract and correct legal citations according to The Bluebook format.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="prompt">System Prompt</Label>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter your citation extraction prompt..."
                    className="min-h-[400px] font-mono text-sm"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500">
                    This prompt will be sent to GPT-4.1 for citation analysis. Ensure it includes proper JSON schema and formatting instructions.
                  </p>
                </div>

                <Separator />

                <div className="flex gap-3">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || isLoading || !prompt.trim()}
                    className="flex items-center gap-2"
                  >
                    <Save size={16} />
                    {isSaving ? 'Saving...' : 'Save Settings'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={isSaving || isLoading}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw size={16} />
                    Reset to Default
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Information Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Citation Extraction Process</h4>
                  <ol className="list-decimal list-inside space-y-1 text-gray-600">
                    <li>Document is sent to GPT-4.1 with your custom prompt</li>
                    <li>AI identifies legal citations in the text</li>
                    <li>Each citation is analyzed against Bluebook format</li>
                    <li>Corrections are suggested where needed</li>
                    <li>Results are returned as structured JSON</li>
                  </ol>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Prompt Requirements</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>Must specify JSON output format</li>
                    <li>Should include citation type classification</li>
                    <li>Must define status categories (Error, Uncertain, Correct)</li>
                    <li>Should include Bluebook reference guidelines</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Output Schema</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-50 p-3 rounded-md overflow-x-auto">
{`[
  {
    "anchor": "P-00042",
    "start_offset": 12,
    "end_offset": 31,
    "type": "case",
    "status": "Error",
    "errors": ["Rule 10.1.2 – missing pincite"],
    "orig": "Original citation",
    "suggested": "Corrected citation"
  }
]`}
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitationSettings;
