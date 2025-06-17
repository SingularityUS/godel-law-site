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
  | "chatgpt-assistant"
  | "custom";

export interface AIModuleDefinition {
  type: ModuleKind;
  label: string;
  color: string;
  icon: LucideIcon;
  defaultPrompt: string;
  supportsChatGPT?: boolean;
  outputFormat?: 'text' | 'json' | 'structured';
  isDeprecated?: boolean;
  isPassThrough?: boolean;
}

// Enhanced with legal-specific prompts for law firm document processing
export const MODULE_DEFINITIONS: AIModuleDefinition[] = [
  {
    type: "document-input",
    label: "Document Input",
    color: "bg-slate-600",
    icon: BookOpen,
    defaultPrompt: "This node represents an uploaded legal document for processing in the pipeline.",
  },
  {
    type: "text-extractor",
    label: "Text Extractor",
    color: "bg-slate-400",
    icon: ArrowDown,
    defaultPrompt: "DEPRECATED: This module now acts as a pass-through. Text extraction is handled automatically during document processing. This module will be removed in future versions.",
    supportsChatGPT: false,
    outputFormat: 'json',
    isDeprecated: true,
    isPassThrough: true
  },
  {
    type: "paragraph-splitter",
    label: "Paragraph Splitter",
    color: "bg-slate-600",
    icon: Divide,
    defaultPrompt: `You are a legal document paragraph analyzer. Split the provided legal text into logical paragraphs while maintaining legal document structure:

- Preserve numbered sections (1., 2., 3., etc.)
- Maintain subsection hierarchy (a., b., c., etc.)
- Keep related clauses together
- Separate whereas clauses, recitals, and operative provisions
- Maintain citation integrity within paragraphs
- Process ALL content provided, ensuring no paragraphs are missed
- Handle both single documents and chunked content appropriately

Return a structured JSON array with ALL paragraphs:
{
  "paragraphs": [
    {
      "id": "p1",
      "type": "recital|operative|signature|exhibit|body",
      "sectionNumber": "1.1",
      "content": "paragraph text",
      "containsCitations": boolean,
      "isNumbered": boolean
    }
  ],
  "totalParagraphs": number,
  "documentStructure": "simple|complex|multi-level",
  "processingMetadata": {
    "chunksProcessed": number,
    "contentLength": number,
    "estimatedReadingTime": number
  }
}

IMPORTANT: Ensure ALL content is processed and no paragraphs are truncated or missed.`,
    supportsChatGPT: true,
    outputFormat: 'json'
  },
  {
    type: "grammar-checker",
    label: "Grammar Checker",
    color: "bg-slate-600",
    icon: ArrowUp,
    defaultPrompt: `You are a legal writing specialist trained in proper legal grammar, style, and formatting. Analyze ALL paragraphs provided for:

LEGAL WRITING STANDARDS:
- Proper legal terminology usage
- Consistent verb tenses (past/present)
- Active vs. passive voice appropriateness
- Sentence structure clarity
- Parallel construction in lists
- Proper use of legal Latin phrases
- Citation format consistency (Bluebook/local rules)

Process ALL paragraphs in the input array. For each paragraph, provide analysis:
{
  "analysis": [
    {
      "paragraphId": "p1",
      "original": "original paragraph text",
      "suggestions": [
        {
          "issue": "grammar|style|clarity|legal_terminology",
          "description": "explanation of the issue",
          "suggestion": "specific improvement suggestion",
          "severity": "minor|moderate|major"
        }
      ],
      "corrected": "corrected paragraph text with all changes applied",
      "legalWritingScore": number (1-10),
      "improvementSummary": "brief summary of changes made"
    }
  ],
  "overallAssessment": {
    "totalParagraphs": number,
    "totalErrors": number,
    "writingQuality": "excellent|good|needs_improvement|poor",
    "recommendations": ["list of general writing improvements"],
    "processingMetadata": {
      "paragraphsAnalyzed": number,
      "averageScore": number,
      "totalSuggestions": number
    }
  }
}

CRITICAL: Process every single paragraph provided in the input. Do not truncate or skip any paragraphs.`,
    supportsChatGPT: true,
    outputFormat: 'json'
  },
  {
    type: "citation-finder",
    label: "Citation Finder",
    color: "bg-slate-600",
    icon: Divide,
    defaultPrompt: `You are a legal citation specialist. Identify and extract all legal citations, references, and authorities from the text:

FIND AND ANALYZE:
- Case citations (with proper case name, court, year)
- Statutory references (USC, state codes, regulations)
- Secondary authorities (law reviews, treatises)
- Internal cross-references
- Incomplete or malformed citations

Return structured citation data:
{
  "citations": [
    {
      "id": "cite1",
      "type": "case|statute|regulation|secondary|internal",
      "text": "original citation text",
      "parsed": {
        "caseName": "if applicable",
        "court": "if applicable", 
        "year": "if applicable",
        "volume": "if applicable",
        "reporter": "if applicable",
        "page": "if applicable"
      },
      "location": "paragraph/section where found",
      "isComplete": boolean,
      "needsVerification": boolean,
      "bluebookFormat": "proper Bluebook citation format"
    }
  ],
  "summary": {
    "totalCitations": number,
    "caseCount": number,
    "statuteCount": number,
    "incompleteCount": number
  }
}`,
    supportsChatGPT: true,
    outputFormat: 'json'
  },
  {
    type: "citation-verifier",
    label: "Citation Verifier",
    color: "bg-slate-600",
    icon: ArrowDown,
    defaultPrompt: `You are a legal citation verification specialist. Verify the accuracy and format compliance of legal citations:

VERIFICATION TASKS:
- Check Bluebook format compliance
- Verify case name accuracy
- Confirm court and jurisdiction
- Check year and reporter accuracy
- Validate parallel citations
- Flag potentially outdated authorities

Return verification results:
{
  "verificationResults": [
    {
      "citationId": "cite1",
      "originalCitation": "original text",
      "status": "verified|needs_correction|cannot_verify|outdated",
      "issues": [
        {
          "type": "format|accuracy|currency|completeness",
          "description": "specific issue found",
          "correction": "suggested correction"
        }
      ],
      "correctedCitation": "properly formatted citation",
      "confidence": number (1-10),
      "lastVerified": "current date"
    }
  ],
  "overallReport": {
    "totalVerified": number,
    "needsCorrection": number,
    "cannotVerify": number,
    "recommendManualReview": ["list of citations needing human review"]
  }
}`,
    supportsChatGPT: true,
    outputFormat: 'json'
  },
  {
    type: "style-guide-enforcer",
    label: "Style-Guide Enforcer",
    color: "bg-slate-600",
    icon: ArrowUp,
    defaultPrompt: `You are a legal style guide enforcement specialist. Analyze text for adherence to legal writing style guides (Bluebook, local court rules, firm style):

STYLE GUIDE CHECKS:
- Citation format consistency (Bluebook Rule 1-21)
- Capitalization rules for legal terms
- Abbreviation standards
- Quotation and punctuation rules
- Font and formatting requirements
- Court-specific local rules compliance

Provide style conformance analysis:
{
  "styleAnalysis": [
    {
      "section": "section identifier",
      "violations": [
        {
          "rule": "specific style rule violated",
          "violation": "text that violates rule",
          "correction": "corrected version",
          "ruleReference": "Bluebook rule number or local rule cite"
        }
      ],
      "complianceScore": number (1-10)
    }
  ],
  "summary": {
    "overallCompliance": number (1-10),
    "totalViolations": number,
    "majorIssues": number,
    "recommendations": ["list of style improvements"],
    "styleGuideUsed": "Bluebook 21st|Local Rules|Firm Style"
  }
}`,
    supportsChatGPT: true,
    outputFormat: 'json'
  },
  {
    type: "chatgpt-assistant",
    label: "ChatGPT Assistant",
    color: "bg-emerald-600",
    icon: MessageSquare,
    defaultPrompt: `You are a legal AI assistant specializing in document analysis for law firms. Process and analyze legal content based on the input data. Provide clear, structured responses following legal writing standards and maintaining confidentiality. Focus on supporting first-year associate tasks such as document review, citation checking, and legal writing improvement.`,
    supportsChatGPT: true,
    outputFormat: 'json'
  },
  {
    type: "custom",
    label: "Custom Helper",
    color: "bg-slate-600",
    icon: Divide,
    defaultPrompt: "You have a custom AI assistant role for legal document processing. Edit the prompt to define its function and enable ChatGPT processing if needed.",
    supportsChatGPT: true,
    outputFormat: 'text'
  },
];
