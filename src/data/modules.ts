
import { 
  FileText, 
  Split, 
  CheckCircle, 
  Search, 
  Shield, 
  Palette, 
  Bot,
  Settings,
  LucideIcon
} from "lucide-react";

export type ModuleKind = 
  | "document-input"
  | "text-extractor"
  | "paragraph-splitter"
  | "grammar-checker"
  | "citation-finder"
  | "citation-verifier"
  | "style-guide-enforcer"
  | "chatgpt-assistant"
  | "custom";

export interface AIModuleDefinition {
  type: ModuleKind;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  supportsChatGPT: boolean;
  isPassThrough?: boolean;
  isDeprecated?: boolean;
  defaultPrompt: string;
}

export const MODULE_DEFINITIONS: AIModuleDefinition[] = [
  {
    type: "text-extractor",
    label: "Text Extractor",
    description: "Extract text content from documents (deprecated - now pass-through)",
    icon: FileText,
    color: "bg-blue-600",
    supportsChatGPT: false,
    isPassThrough: true,
    isDeprecated: true,
    defaultPrompt: "This module is deprecated and passes content through unchanged."
  },
  {
    type: "paragraph-splitter",
    label: "Paragraph Splitter",
    description: "Split text into individual paragraphs for analysis",
    icon: Split,
    color: "bg-green-600",
    supportsChatGPT: true,
    defaultPrompt: `You are a legal document paragraph splitter. Split the provided text into individual paragraphs and return them in a structured JSON format.

Instructions:
1. Split the text into logical paragraphs
2. Remove empty paragraphs and excessive whitespace
3. Number each paragraph sequentially
4. Preserve the original text content exactly
5. Return in the specified JSON format

Return your response as valid JSON in this exact format:
{
  "output": {
    "paragraphs": [
      {
        "id": 1,
        "text": "First paragraph text here..."
      },
      {
        "id": 2, 
        "text": "Second paragraph text here..."
      }
    ],
    "totalParagraphs": 2
  }
}`
  },
  {
    type: "grammar-checker",
    label: "Grammar Checker",
    description: "Check grammar, style, and legal writing quality",
    icon: CheckCircle,
    color: "bg-red-600",
    supportsChatGPT: true,
    defaultPrompt: `You are a legal writing grammar and style checker. Analyze each paragraph for grammar, style, clarity, and legal writing best practices.

For each paragraph, provide:
1. Grammar corrections
2. Style improvements
3. Legal writing suggestions
4. Overall quality score (1-10)

Return your response as valid JSON in this exact format:
{
  "analysis": [
    {
      "paragraphId": 1,
      "text": "Original paragraph text",
      "legalWritingScore": 8,
      "suggestions": [
        {
          "type": "grammar",
          "issue": "Description of issue",
          "suggestion": "Suggested correction",
          "severity": "low|medium|high"
        }
      ]
    }
  ]
}`
  },
  {
    type: "citation-finder",
    label: "Citation Finder",
    description: "Find and identify legal citations in text",
    icon: Search,
    color: "bg-purple-600",
    supportsChatGPT: true,
    defaultPrompt: `You are a legal citation finder. Identify all legal citations in the provided text including case law, statutes, regulations, and secondary sources.

Return your response as valid JSON in this exact format:
{
  "output": {
    "citations": [
      {
        "text": "Full citation text",
        "type": "case|statute|regulation|secondary",
        "location": "paragraph or section where found"
      }
    ],
    "totalCitations": 0
  }
}`
  },
  {
    type: "citation-verifier",
    label: "Citation Verifier", 
    description: "Verify accuracy and format of legal citations",
    icon: Shield,
    color: "bg-yellow-600",
    supportsChatGPT: true,
    defaultPrompt: `You are a legal citation verifier. Check each citation for proper format, accuracy, and completeness according to legal citation standards.

Return your response as valid JSON in this exact format:
{
  "output": {
    "verifiedCitations": [
      {
        "originalCitation": "Original citation text",
        "isValid": true,
        "issues": ["List of formatting or accuracy issues"],
        "correctedCitation": "Properly formatted citation"
      }
    ],
    "totalVerified": 0
  }
}`
  },
  {
    type: "style-guide-enforcer",
    label: "Style Guide Enforcer",
    description: "Enforce consistent legal writing style",
    icon: Palette,
    color: "bg-indigo-600", 
    supportsChatGPT: true,
    defaultPrompt: `You are a legal style guide enforcer. Review the text for consistency with legal writing conventions including tone, formatting, and structure.

Return your response as valid JSON in this exact format:
{
  "output": {
    "styleIssues": [
      {
        "location": "paragraph or section",
        "issue": "Description of style issue",
        "recommendation": "Suggested improvement",
        "priority": "low|medium|high"
      }
    ],
    "overallCompliance": "percentage or score"
  }
}`
  },
  {
    type: "chatgpt-assistant",
    label: "ChatGPT Assistant",
    description: "General AI assistant for custom tasks",
    icon: Bot,
    color: "bg-gray-600",
    supportsChatGPT: true,
    defaultPrompt: "You are a helpful AI assistant. Process the provided content according to the user's instructions and return the results in a clear, structured format."
  },
  {
    type: "custom",
    label: "Custom Module",
    description: "Custom processing module with user-defined prompts",
    icon: Settings,
    color: "bg-orange-600", 
    supportsChatGPT: true,
    defaultPrompt: "Process the provided content according to custom instructions."
  }
];
