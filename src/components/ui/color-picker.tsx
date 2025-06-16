
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Palette, RotateCcw } from 'lucide-react';

interface ColorPickerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
  onReset: () => void;
  recentColors: string[];
}

const PRESET_COLORS = [
  'bg-slate-600', 'bg-gray-600', 'bg-zinc-600', 'bg-stone-600',
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
  'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
  'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
  'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
  'bg-rose-500'
];

// Convert Tailwind class to hex color for the color input
const tailwindToHex = (bgClass: string): string => {
  const colorMap: { [key: string]: string } = {
    'bg-slate-600': '#475569',
    'bg-gray-600': '#4b5563',
    'bg-zinc-600': '#52525b',
    'bg-stone-600': '#57534e',
    'bg-red-500': '#ef4444',
    'bg-orange-500': '#f97316',
    'bg-amber-500': '#f59e0b',
    'bg-yellow-500': '#eab308',
    'bg-lime-500': '#84cc16',
    'bg-green-500': '#22c55e',
    'bg-emerald-500': '#10b981',
    'bg-teal-500': '#14b8a6',
    'bg-cyan-500': '#06b6d4',
    'bg-sky-500': '#0ea5e9',
    'bg-blue-500': '#3b82f6',
    'bg-indigo-500': '#6366f1',
    'bg-violet-500': '#8b5cf6',
    'bg-purple-500': '#a855f7',
    'bg-fuchsia-500': '#d946ef',
    'bg-pink-500': '#ec4899',
    'bg-rose-500': '#f43f5e'
  };
  return colorMap[bgClass] || '#475569';
};

// Convert hex to closest Tailwind class
const hexToTailwind = (hex: string): string => {
  // This is a simplified mapping - in a real app you might want more sophisticated color matching
  const colorMap: { [key: string]: string } = {
    '#475569': 'bg-slate-600',
    '#4b5563': 'bg-gray-600',
    '#52525b': 'bg-zinc-600',
    '#57534e': 'bg-stone-600',
    '#ef4444': 'bg-red-500',
    '#f97316': 'bg-orange-500',
    '#f59e0b': 'bg-amber-500',
    '#eab308': 'bg-yellow-500',
    '#84cc16': 'bg-lime-500',
    '#22c55e': 'bg-green-500',
    '#10b981': 'bg-emerald-500',
    '#14b8a6': 'bg-teal-500',
    '#06b6d4': 'bg-cyan-500',
    '#0ea5e9': 'bg-sky-500',
    '#3b82f6': 'bg-blue-500',
    '#6366f1': 'bg-indigo-500',
    '#8b5cf6': 'bg-violet-500',
    '#a855f7': 'bg-purple-500',
    '#d946ef': 'bg-fuchsia-500',
    '#ec4899': 'bg-pink-500',
    '#f43f5e': 'bg-rose-500'
  };
  return colorMap[hex] || 'bg-slate-600';
};

const ColorPicker: React.FC<ColorPickerProps> = ({
  currentColor,
  onColorChange,
  onReset,
  recentColors
}) => {
  const [customHex, setCustomHex] = useState(tailwindToHex(currentColor));

  const handleCustomColorChange = (hex: string) => {
    setCustomHex(hex);
    onColorChange(hexToTailwind(hex));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Module Color</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="h-7 px-2"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset
        </Button>
      </div>

      {/* Current Color Preview */}
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded border-2 border-gray-300 ${currentColor}`} />
        <span className="text-sm text-gray-600">Current color</span>
      </div>

      {/* Custom Color Picker */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-600">Custom Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={customHex}
            onChange={(e) => handleCustomColorChange(e.target.value)}
            className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
          />
          <span className="text-xs text-gray-500">{customHex}</span>
        </div>
      </div>

      {/* Recent Colors */}
      {recentColors.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Recent Colors</label>
          <div className="grid grid-cols-8 gap-1">
            {recentColors.map((color, index) => (
              <button
                key={index}
                className={`w-6 h-6 rounded border border-gray-300 hover:border-gray-500 transition-colors ${color}`}
                onClick={() => onColorChange(color)}
                title={color}
              />
            ))}
          </div>
        </div>
      )}

      {/* Preset Colors */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-600">Preset Colors</label>
        <div className="grid grid-cols-7 gap-1">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              className={`w-6 h-6 rounded border border-gray-300 hover:border-gray-500 transition-colors ${color}`}
              onClick={() => onColorChange(color)}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;
