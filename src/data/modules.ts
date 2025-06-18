
import { ArrowDown, ArrowUp, Divide, BookOpen, MessageSquare, Search } from "lucide-react";
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
    color: "bg-slate-600",
    icon: ArrowDown,
    defaultPrompt: `You are a legal document text extraction specialist. Extract all text content from the provided legal document while preserving:
- Document structure and hierarchy (headings, sections, subsections)
- Legal formatting (numbered paragraphs, bullet points, indentation)
- Citations and case references
- Tables, schedules, and exhibits
- Signature blocks and date stamps
- Page numbers and footnotes

Return the extracted text in a structured JSON format:
{
  "documentType": "contract|brief|pleading|memo|other",
  "title": "document title",
  "sections": [
    {
      "heading": "section heading",
      "content": "section text content",
      "subsections": []
    }
  ],
  "citations": ["list of citations found"],
  "metadata": {
    "pageCount": number,
    "hasSignatures": boolean,
    "hasExhibits": boolean
  }
}`,
    supportsChatGPT: false, // Now a pass-through module
    outputFormat: 'json'
  },
  {
    type: "paragraph-splitter",
    label: "Paragraph Splitter",
    color: "bg-slate-600",
    icon: Divide,
    defaultPrompt: `You are a legal document paragraph analyzer. Split ALL provided legal text into logical paragraphs while maintaining legal document structure. Process the ENTIRE document content, not just a sample.

IMPORTANT: Process ALL content provided. Do not limit the number of paragraphs. A legal document may contain hundreds of paragraphs.

- Preserve numbered sections (1., 2., 3., etc.)
- Maintain subsection hierarchy (a., b., c., etc.)
- Keep related clauses together
- Separate whereas clauses, recitals, and operative provisions
- Maintain citation integrity within paragraphs
- Split on natural paragraph breaks (double line breaks, section breaks)
- Include ALL content from the input document

Return a structured JSON array with ALL paragraphs:
{
  "paragraphs": [
    {
      "id": "p1",
      "type": "recital|operative|signature|exhibit|body|heading",
      "sectionNumber": "1.1",
      "content": "paragraph text",
      "containsCitations": boolean,
      "isNumbered": boolean,
      "wordCount": number
    }
  ],
  "totalParagraphs": number,
  "documentStructure": "simple|complex|multi-level",
  "processingStats": {
    "inputWordCount": number,
    "outputWordCount": number,
    "averageParagraphLength": number
  }
}

CRITICAL: Ensure you process ALL input content and return ALL paragraphs, not just the first few.`,
    supportsChatGPT: true,
    outputFormat: 'json'
  },
  {
    type: "grammar-checker",
    label: "Grammar Checker",
    color: "bg-slate-600",
    icon: ArrowUp,
    defaultPrompt: `You are a legal writing specialist trained in proper legal grammar, style, and formatting. Analyze ALL paragraphs provided for:

IMPORTANT: Process ALL paragraphs from the input data. Do not skip any paragraphs.

LEGAL WRITING STANDARDS:
- Proper legal terminology usage
- Consistent verb tenses (past/present)
- Active vs. passive voice appropriateness
- Sentence structure clarity
- Parallel construction in lists
- Proper use of legal Latin phrases
- Citation format consistency (Bluebook/local rules)

For ALL paragraphs, provide comprehensive analysis:
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
    "totalErrors": number,
    "writingQuality": "excellent|good|needs_improvement|poor",
    "recommendations": ["list of general writing improvements"],
    "totalParagraphsProcessed": number,
    "averageScore": number
  },
  "processingStats": {
    "paragraphsAnalyzed": number,
    "totalSuggestions": number,
    "averageImprovementsPerParagraph": number
  }
}

CRITICAL: Process ALL paragraphs from the input. Ensure the analysis array contains entries for every single paragraph provided.`,
    supportsChatGPT: true,
    outputFormat: 'json'
  },
  {
    type: "citation-finder",
    label: "Citation Finder",
    color: "bg-blue-600",
    icon: Search,
    defaultPrompt: `You are a legal citation specialist. Identify and extract ALL Bluebook citations from legal text with precise position tracking.

FIND AND ANALYZE ALL:
- Case citations (with proper case name, court, year)
- Statutory references (USC, state codes, regulations)
- Secondary authorities (law reviews, treatises)
- Internal cross-references
- Incomplete or malformed citations

For EACH citation found, return structured data with EXACT position information:
{
  "citations": [
    {
      "type": "case|statute|regulation|secondary|internal",
      "originalText": "exact citation text as it appears in the document",
      "startPos": number (exact character position where citation starts),
      "endPos": number (exact character position where citation ends),
      "isComplete": boolean,
      "needsVerification": boolean,
      "bluebookFormat": "properly formatted Bluebook citation",
      "parsed": {
        "caseName": "if applicable",
        "court": "if applicable", 
        "year": "if applicable",
        "volume": "if applicable",
        "reporter": "if applicable",
        "page": "if applicable"
      }
    }
  ]
}

CRITICAL REQUIREMENTS:
- Find ALL citations in the text, no matter how many
- Provide EXACT character positions for each citation
- Include incomplete citations that need correction
- Suggest proper Bluebook formatting for each citation
- Process the ENTIRE text provided, not just samples

The positions will be used to highlight citations in the document for legal review.`,
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
