
import React, { useEffect, useState } from 'react';
import { AIModuleDefinition } from '@/data/modules';
import ColorPicker from '@/components/ui/color-picker';
import { useModuleColors } from '@/hooks/useModuleColors';

interface ModuleSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  nodeId: string;
  moduleLabel: string;
  moduleIcon: React.ReactNode;
  systemPrompt: string;
  promptOverride: string | undefined;
  onPromptChange: (newPrompt: string) => void;
  onSave: () => void;
}

const ModuleSettingsDrawer = ({
  open,
  onClose,
  nodeId,
  moduleLabel,
  moduleIcon,
  systemPrompt,
  promptOverride,
  onPromptChange,
  onSave,
}: ModuleSettingsDrawerProps) => {
  const [localPrompt, setLocalPrompt] = useState(promptOverride ?? "");
  const { getModuleColor, setModuleColor, resetModuleColor, recentColors } = useModuleColors();

  useEffect(() => {
    setLocalPrompt(promptOverride ?? "");
  }, [open, promptOverride]);

  const currentColor = getModuleColor(nodeId);

  const handleColorChange = (color: string) => {
    setModuleColor(nodeId, color);
  };

  const handleColorReset = () => {
    resetModuleColor(nodeId);
  };

  const handleSave = () => {
    onPromptChange(localPrompt);
    onSave();
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-[400px] max-w-[95vw] bg-white shadow-2xl border-l border-gray-200 z-50 transition-transform duration-300 ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
      style={{ willChange: "transform" }}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <span className="text-xl">{moduleIcon}</span>
          <span className="font-semibold text-lg">{moduleLabel}</span>
        </div>
        <button
          className="text-gray-600 hover:text-black px-2 py-1 rounded"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="px-6 py-4 flex flex-col gap-6 h-full overflow-y-auto">
        {/* Color Settings */}
        <div className="border-b pb-4">
          <ColorPicker
            currentColor={currentColor}
            onColorChange={handleColorChange}
            onReset={handleColorReset}
            recentColors={recentColors}
          />
        </div>

        {/* Prompt Settings */}
        <div>
          <div className="text-xs font-semibold text-gray-600 mb-1">Default System Prompt</div>
          <div className="text-sm bg-gray-100 border px-3 py-3 rounded whitespace-pre-line mb-2">{systemPrompt}</div>
        </div>
        
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Your Prompt Refinement</label>
          <textarea
            className="w-full p-2 border rounded h-32 font-mono text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
            placeholder="Add or edit prompt..."
            value={localPrompt}
            onChange={(e) => setLocalPrompt(e.target.value)}
          />
          <div className="flex mt-4">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary text-white rounded font-semibold shadow hover:bg-primary/80 transition-all"
            >
              Save
            </button>
            <button
              onClick={onClose}
              className="ml-2 px-3 py-2 text-gray-600 hover:bg-gray-200 rounded font-medium"
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
        
        <div className="text-xs text-gray-400 mt-8">
          All changes are immediately effective for this helper.<br />
          We log results so you can roll back poor experiments later.
        </div>
      </div>
    </div>
  );
};

export default ModuleSettingsDrawer;
