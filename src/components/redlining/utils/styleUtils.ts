
/**
 * Style Utilities
 * 
 * Purpose: CSS class generation and styling utilities for redline suggestions
 */

export const getSeverityClass = (severity: string): string => {
  switch (severity) {
    case 'high': return 'severity-high';
    case 'medium': return 'severity-medium';
    case 'low': return 'severity-low';
    default: return 'severity-medium';
  }
};

export const getTypeClass = (type: string): string => {
  switch (type) {
    case 'grammar': return 'type-grammar';
    case 'style': return 'type-style';
    case 'legal': return 'type-legal';
    case 'clarity': return 'type-clarity';
    default: return 'type-grammar';
  }
};

export const getTypeIcon = (type: string): string => {
  switch (type) {
    case 'grammar': return '✓';
    case 'style': return '✦';
    case 'legal': return '⚖';
    case 'clarity': return '💡';
    default: return '✓';
  }
};
