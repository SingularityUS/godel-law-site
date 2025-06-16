
import { MODULE_DEFINITIONS, AIModuleDefinition } from "@/data/modules";
import { useModuleColors } from "@/hooks/useModuleColors";

interface ModulePaletteProps {
  onDragStart: (module: AIModuleDefinition, event: React.DragEvent) => void;
}

const ModulePalette = ({ onDragStart }: ModulePaletteProps) => {
  const { getModuleColor } = useModuleColors();

  return (
    <div className="w-full flex gap-4 flex-wrap py-2 px-1 overflow-x-auto">
      {MODULE_DEFINITIONS.map((mod) => {
        // For palette items, we use the default color since these aren't instances yet
        const paletteColor = mod.color;
        
        return (
          <div
            key={mod.type}
            className={`flex flex-col items-center p-2 rounded-md shadow-md cursor-grab select-none hover:scale-105 transition-transform ${paletteColor}`}
            draggable
            onDragStart={(e) => onDragStart(mod, e)}
            title={mod.label}
          >
            <span className="mb-1 text-white drop-shadow">
              <mod.icon size={28} />
            </span>
            <span className="text-xs font-semibold text-white">{mod.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default ModulePalette;
