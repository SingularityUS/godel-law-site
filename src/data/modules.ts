import { FileText, FileSearch, SplitSquareHorizontal, BookOpenCheck, ListChecks, TextQuote, MessageSquare, LayoutDashboard, FileJson2, BrainCircuit, BadgeInfo, GraduationCap, Search, Sparkles, Lightbulb, ShieldCheck, PiggyBank, Gavel, Scale, Landmark, Briefcase, ClipboardList, FileSignature, MessageSquarePlus, FileType, CircleUserRound, Inbox, LucideIcon } from "lucide-react";

export interface ModuleDefinition {
  type: ModuleKind;
  label: string;
  icon: LucideIcon;
  category: ModuleCategory;
  description: string;
  supportsChatGPT: boolean;
  defaultPrompt: string;
}

export type ModuleKind =
  | "document-input"
  | "text-extractor"
  | "paragraph-splitter"
  | "grammar-checker"
  | "legal-summary"
  | "legal-qa"
  | "contract-analyzer"
  | "legal-translator"
  | "legal-researcher"
  | "clause-identifier"
  | "risk-assessor"
  | "compliance-checker";

export type ModuleCategory = "input" | "processing" | "analysis" | "utility";

export const MODULE_DEFINITIONS: ModuleDefinition[] = [
  {
    type: "document-input",
    label: "Document Input",
    icon: FileText,
    category: "input",
    description: "Upload and input legal documents",
    supportsChatGPT: false,
    defaultPrompt: ""
  },
  {
    type: "text-extractor",
    label: "Text Extractor", 
    icon: FileSearch,
    category: "processing",
    description: "Extract and format text content from documents",
    supportsChatGPT: false, // Changed from true to false
    defaultPrompt: "Extract and structure the text content from the provided document, preserving all important information and formatting."
  },
  {
    type: "paragraph-splitter",
    label: "Paragraph Splitter",
    icon: SplitSquareHorizontal,
    category: "processing", 
    description: "Split document into individual paragraphs for analysis",
    supportsChatGPT: true,
    defaultPrompt: "Split the provided legal document text into individual paragraphs. For each paragraph, provide: 1) A unique paragraph ID, 2) The complete paragraph text, 3) A brief summary of the paragraph's legal significance. Maintain the original order and preserve all content. Format as JSON with 'paragraphs' array containing objects with 'id', 'text', and 'summary' fields."
  },
  {
    type: "grammar-checker",
    label: "Grammar Checker",
    icon: BookOpenCheck,
    category: "analysis",
    description: "Analyze and correct grammar and style in legal documents",
    supportsChatGPT: true,
    defaultPrompt: "Analyze the provided legal text for grammar, style, and clarity. Provide a detailed analysis of each paragraph, including suggestions for improvement and corrections. Focus on legal writing conventions and terminology. Return a JSON object with 'analysis' (array of paragraph analyses) and 'overallAssessment' (summary of writing quality)."
  },
  {
    type: "legal-summary",
    label: "Legal Summary",
    icon: TextQuote,
    category: "analysis",
    description: "Generate concise summaries of legal documents",
    supportsChatGPT: true,
    defaultPrompt: "Create a concise and accurate summary of the provided legal document. Focus on key facts, legal issues, and conclusions. The summary should be no more than 200 words."
  },
  {
    type: "legal-qa",
    label: "Legal Q&A",
    icon: MessageSquare,
    category: "analysis",
    description: "Answer questions about legal documents",
    supportsChatGPT: true,
    defaultPrompt: "Answer the following question about the provided legal document: [QUESTION]. Provide a detailed and accurate answer based on the document's content. Cite specific sections or clauses to support your answer."
  },
  {
    type: "contract-analyzer",
    label: "Contract Analyzer",
    icon: FileJson2,
    category: "analysis",
    description: "Analyze contracts for key terms and potential issues",
    supportsChatGPT: true,
    defaultPrompt: "Analyze the provided contract and identify key terms, obligations, and potential risks. Provide a summary of the contract's main provisions and highlight any clauses that may be problematic or require further review."
  },
  {
    type: "legal-translator",
    label: "Legal Translator",
    icon: GraduationCap,
    category: "utility",
    description: "Translate legal documents between languages",
    supportsChatGPT: true,
    defaultPrompt: "Translate the provided legal document from [SOURCE_LANGUAGE] to [TARGET_LANGUAGE]. Ensure the translation is accurate and preserves the legal meaning and intent of the original document."
  },
  {
    type: "legal-researcher",
    label: "Legal Researcher",
    icon: Search,
    category: "utility",
    description: "Research legal precedents and statutes",
    supportsChatGPT: true,
    defaultPrompt: "Research legal precedents and statutes related to the following topic: [TOPIC]. Provide a summary of relevant cases, statutes, and regulations, and explain how they apply to the topic."
  },
  {
    type: "clause-identifier",
    label: "Clause Identifier",
    icon: ClipboardList,
    category: "analysis",
    description: "Identify and extract specific clauses from legal documents",
    supportsChatGPT: true,
    defaultPrompt: "Identify and extract all clauses related to [CLAUSE_TYPE] from the provided legal document. Provide the text of each clause and a brief explanation of its meaning and significance."
  },
  {
    type: "risk-assessor",
    label: "Risk Assessor",
    icon: ShieldCheck,
    category: "analysis",
    description: "Assess legal risks associated with a document or situation",
    supportsChatGPT: true,
    defaultPrompt: "Assess the legal risks associated with the following document or situation: [DESCRIPTION]. Identify potential liabilities, compliance issues, and other legal concerns. Provide recommendations for mitigating these risks."
  },
  {
    type: "compliance-checker",
    label: "Compliance Checker",
    icon: ListChecks,
    category: "analysis",
    description: "Check legal documents for compliance with regulations",
    supportsChatGPT: true,
    defaultPrompt: "Check the provided legal document for compliance with the following regulations: [REGULATIONS]. Identify any areas where the document may not comply and provide recommendations for ensuring compliance."
  }
];
