
import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import ColorPicker from "@/components/ui/color-picker";
import { useModuleColors } from "@/hooks/useModuleColors";

interface ModuleSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  nodeId: string;
  moduleLabel: string;
  moduleIcon: React.ReactNode;
  systemPrompt: string;
  promptOverride: string;
  onPromptChange: (prompt: string) => void;
  onSave: () => void;
}

const ModuleSettingsDrawer: React.FC<ModuleSettingsDrawerProps> = ({
  open,
  onClose,
  nodeId,
  moduleLabel,
  moduleIcon,
  systemPrompt,
  promptOverride,
  onPromptChange,
  onSave,
}) => {
  const { getModuleColor, setModuleColor, resetModuleColor, recentColors } = useModuleColors();
  const currentColor = getModuleColor(nodeId);

  const handleColorChange = (color: string) => {
    setModuleColor(nodeId, color);
  };

  const handleResetColor = () => {
    resetModuleColor(nodeId);
  };

  const handleSave = () => {
    onSave();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-96 border-l-2 border-black bg-white"
        style={{ fontFamily: 'Courier New, monospace' }}
      >
        <SheetHeader className="border-b-2 border-black pb-4 mb-4">
          <SheetTitle className="flex items-center gap-3 text-lg font-bold text-black">
            {moduleIcon}
            {moduleLabel.toUpperCase()}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Color Section */}
          <div className="space-y-3">
            <Label className="text-sm font-bold text-black uppercase">Module Color</Label>
            <div className="space-y-3">
              <ColorPicker
                currentColor={currentColor}
                onColorChange={handleColorChange}
                onReset={handleResetColor}
                recentColors={recentColors}
              />
            </div>
          </div>

          {/* Prompt Section */}
          <div className="space-y-3">
            <Label className="text-sm font-bold text-black uppercase">Custom Prompt</Label>
            <div className="space-y-3">
              <div className="p-3 border-2 border-black bg-gray-50">
                <Label className="text-xs font-bold text-gray-700 uppercase block mb-2">
                  Default System Prompt:
                </Label>
                <p className="text-xs text-gray-700 leading-relaxed">{systemPrompt}</p>
              </div>
              
              <div>
                <Label className="text-xs font-bold text-black uppercase block mb-2">
                  Override Prompt (Optional):
                </Label>
                <Textarea
                  value={promptOverride}
                  onChange={(e) => onPromptChange(e.target.value)}
                  placeholder="Enter custom prompt to override the default..."
                  className="min-h-24 border-2 border-black resize-none font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6 pt-4 border-t-2 border-black">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 border-2 border-black font-bold"
          >
            CANCEL
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-black text-white hover:bg-gray-800 font-bold"
          >
            SAVE
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ModuleSettingsDrawer;
