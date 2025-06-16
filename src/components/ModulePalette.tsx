
import { MODULE_DEFINITIONS, AIModuleDefinition } from "@/data/modules";

interface ModulePaletteProps {
  onDragStart: (module: AIModuleDefinition, event: React.DragEvent) => void;
}

const ModulePalette = ({ onDragStart }: ModulePaletteProps) => {
  return (
    <div className="w-full flex gap-2 flex-wrap py-2 px-1 overflow-x-auto">
      {MODULE_DEFINITIONS.map((mod) => {
        return (
          <div
            key={mod.type}
            className={`w-24 h-16 border-2 border-black cursor-grab select-none hover:shadow-lg transition-shadow ${mod.color}`}
            draggable
            onDragStart={(e) => onDragStart(mod, e)}
            title={mod.label}
            style={{ fontFamily: 'Courier New, monospace' }}
          >
            <div className="flex flex-col items-center justify-center h-full p-1">
              <span className="text-white drop-shadow mb-1">
                <mod.icon size={16} />
              </span>
              <span className="text-xs font-bold text-white text-center leading-tight">{mod.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ModulePalette;
