
import { ArrowDown, ArrowUp, Divide, BookOpen, MessageSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ModuleKind =
  | "document-input"
  | "text-extractor"
  | "paragraph-splitter"
  | "grammar-checker"
  | "citation-finder"
  | "citation-verifier"
  | "style-guide-enforcer"
  | "chatgpt-assistant" // NEW
  | "custom";

export interface AIModuleDefinition {
  type: ModuleKind;
  label: string;
  color: string;
  icon: LucideIcon;
  defaultPrompt: string;
  supportsChatGPT?: boolean; // NEW: Flag to indicate ChatGPT support
}

// Updated to include ChatGPT capabilities
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
    defaultPrompt: "You extract the main raw text content from input documents. Focus on preserving the structure and meaning while removing formatting artifacts.",
    supportsChatGPT: true,
  },
  {
    type: "paragraph-splitter",
    label: "Paragraph Splitter",
    color: "bg-slate-600",
    icon: Divide,
    defaultPrompt: "You separate the provided raw text into logical paragraphs based on content structure and semantic breaks. Return a JSON array of paragraph strings with proper segmentation.",
    supportsChatGPT: true,
  },
  {
    type: "grammar-checker",
    label: "Grammar Checker",
    color: "bg-slate-600",
    icon: ArrowUp,
    defaultPrompt: "You analyze text for spelling, grammar, and style errors. Provide detailed suggestions for improvement including explanations for each correction in a structured JSON format.",
    supportsChatGPT: true,
  },
  {
    type: "citation-finder",
    label: "Citation Finder",
    color: "bg-slate-600",
    icon: Divide,
    defaultPrompt: "You identify and extract all citation references, bibliographic entries, and academic sources from the text. Return structured JSON with citation details, formats, and locations.",
    supportsChatGPT: true,
  },
  {
    type: "citation-verifier",
    label: "Citation Verifier",
    color: "bg-slate-600",
    icon: ArrowDown,
    defaultPrompt: "You verify the accuracy and validity of citations by checking format compliance, author information, and publication details. Return verification results in JSON format.",
    supportsChatGPT: true,
  },
  {
    type: "style-guide-enforcer",
    label: "Style-Guide Enforcer",
    color: "bg-slate-600",
    icon: ArrowUp,
    defaultPrompt: "You analyze text for adherence to specific style guides (APA, MLA, Chicago, etc.) and suggest corrections for formatting, citations, and structure.",
    supportsChatGPT: true,
  },
  {
    type: "chatgpt-assistant",
    label: "ChatGPT Assistant",
    color: "bg-emerald-600",
    icon: MessageSquare,
    defaultPrompt: "You are a helpful AI assistant that processes and analyzes content based on the input data. Provide clear, structured responses that can be used in document processing workflows.",
    supportsChatGPT: true,
  },
  {
    type: "custom",
    label: "Custom Helper",
    color: "bg-slate-600",
    icon: Divide,
    defaultPrompt: "You have a custom AI assistant role. Edit the prompt to define its function and enable ChatGPT processing if needed.",
    supportsChatGPT: true,
  },
];
