
import { ArrowDown, ArrowUp, Divide, BookOpen } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ModuleKind =
  | "document-input" // NEW
  | "text-extractor"
  | "paragraph-splitter"
  | "grammar-checker"
  | "citation-finder"
  | "citation-verifier"
  | "style-guide-enforcer"
  | "custom";

export interface AIModuleDefinition {
  type: ModuleKind;
  label: string;
  color: string; // This is now the default color, can be overridden per instance
  icon: LucideIcon;
  defaultPrompt: string;
}

// Updated to use monochromatic design by default
export const MODULE_DEFINITIONS: AIModuleDefinition[] = [
  {
    type: "document-input",
    label: "Document Input",
    color: "bg-slate-600",
    icon: BookOpen,
    defaultPrompt: "This node represents an uploaded document for processing in the pipeline.",
  },
  {
    type: "text-extractor",
    label: "Text Extractor",
    color: "bg-slate-600",
    icon: ArrowDown,
    defaultPrompt: "You extract the main raw text content from input documents. Only return text, no formatting.",
  },
  {
    type: "paragraph-splitter",
    label: "Paragraph Splitter",
    color: "bg-slate-600",
    icon: Divide,
    defaultPrompt: "You separate the provided raw text into logical paragraphs. Return a JSON array of paragraph strings.",
  },
  {
    type: "grammar-checker",
    label: "Grammar Checker",
    color: "bg-slate-600",
    icon: ArrowUp,
    defaultPrompt: "You critique each paragraph for spelling and grammar errors, returning suggestions for improvement in JSON.",
  },
  {
    type: "citation-finder",
    label: "Citation Finder",
    color: "bg-slate-600",
    icon: Divide,
    defaultPrompt: "You extract all citation references and bibliographic entries from the paragraphs, returning JSON.",
  },
  {
    type: "citation-verifier",
    label: "Citation Verifier",
    color: "bg-slate-600",
    icon: ArrowDown,
    defaultPrompt: "You check if citations are real and accurate, returning a JSON verification result for each one.",
  },
  {
    type: "style-guide-enforcer",
    label: "Style-Guide Enforcer",
    color: "bg-slate-600",
    icon: ArrowUp,
    defaultPrompt: "You analyze paragraphs for adherence to a specified style guide and suggest any changes.",
  },
  {
    type: "custom",
    label: "Custom Helper",
    color: "bg-slate-600",
    icon: Divide,
    defaultPrompt: "You have a custom AI assistant role. Edit the prompt to define its function.",
  },
];
