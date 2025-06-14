
import { BookOpen, Paragraphs, Check, Link2, BookKey, BadgeCheck, Wand2 } from "lucide-react";

export type ModuleKind =
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
  color: string;
  icon: React.FC<{ size?: number }>;
  defaultPrompt: string;
}

export const MODULE_DEFINITIONS: AIModuleDefinition[] = [
  {
    type: "text-extractor",
    label: "Text Extractor",
    color: "bg-indigo-500",
    icon: BookOpen,
    defaultPrompt: "You extract the main raw text content from input documents. Only return text, no formatting.",
  },
  {
    type: "paragraph-splitter",
    label: "Paragraph Splitter",
    color: "bg-orange-500",
    icon: Paragraphs,
    defaultPrompt: "You separate the provided raw text into logical paragraphs. Return a JSON array of paragraph strings.",
  },
  {
    type: "grammar-checker",
    label: "Grammar Checker",
    color: "bg-green-500",
    icon: Check,
    defaultPrompt: "You critique each paragraph for spelling and grammar errors, returning suggestions for improvement in JSON.",
  },
  {
    type: "citation-finder",
    label: "Citation Finder",
    color: "bg-rose-500",
    icon: Link2,
    defaultPrompt: "You extract all citation references and bibliographic entries from the paragraphs, returning JSON.",
  },
  {
    type: "citation-verifier",
    label: "Citation Verifier",
    color: "bg-blue-600",
    icon: BookKey,
    defaultPrompt: "You check if citations are real and accurate, returning a JSON verification result for each one.",
  },
  {
    type: "style-guide-enforcer",
    label: "Style-Guide Enforcer",
    color: "bg-yellow-400",
    icon: BadgeCheck,
    defaultPrompt: "You analyze paragraphs for adherence to a specified style guide and suggest any changes.",
  },
  {
    type: "custom",
    label: "Custom Helper",
    color: "bg-violet-700",
    icon: Wand2,
    defaultPrompt: "You have a custom AI assistant role. Edit the prompt to define its function.",
  },
];
