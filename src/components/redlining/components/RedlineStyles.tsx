
/**
 * RedlineStyles Component
 * 
 * Purpose: Provides CSS styles for redline suggestions with direct editing support
 * Enhanced with comprehensive document formatting styles
 */

import React from 'react';

const RedlineStyles: React.FC = () => {
  const redlineStyles = `
    .redline-suggestion {
      position: relative;
      cursor: pointer;
      transition: all 0.2s ease;
      border-radius: 2px;
      padding: 1px 2px;
      display: inline;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
    }
    
    .redline-suggestion:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      z-index: 10;
    }
    
    .redline-suggestion.selected {
      box-shadow: 0 0 0 2px #3b82f6;
      z-index: 20;
    }
    
    .original-text {
      text-decoration: line-through;
      opacity: 0.7;
      color: #dc2626;
    }
    
    .suggested-text {
      background-color: #dcfce7;
      color: #166534;
      font-weight: 500;
      margin-left: 4px;
      padding: 1px 2px;
      border-radius: 2px;
      cursor: pointer;
      user-select: none;
      -webkit-user-select: none;
    }
    
    .suggested-text:hover {
      background-color: #bbf7d0;
      outline: 1px solid #16a34a;
    }
    
    .redline-accept-btn {
      display: inline-block;
      margin-left: 4px;
      background-color: #16a34a;
      color: white;
      border-radius: 50%;
      width: 16px;
      height: 16px;
      text-align: center;
      line-height: 14px;
      font-size: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      opacity: 0;
      transform: scale(0.8);
      user-select: none;
      -webkit-user-select: none;
    }
    
    .redline-suggestion:hover .redline-accept-btn {
      opacity: 1;
      transform: scale(1);
    }
    
    .redline-accept-btn:hover {
      background-color: #15803d;
      transform: scale(1.1);
    }
    
    .redline-indicator {
      display: inline-block;
      margin-left: 2px;
      font-size: 10px;
      opacity: 0.7;
      user-select: none;
      -webkit-user-select: none;
    }
    
    /* Severity styles */
    .severity-high {
      background-color: #fef2f2;
      border-left: 3px solid #dc2626;
    }
    
    .severity-medium {
      background-color: #fefce8;
      border-left: 3px solid #ca8a04;
    }
    
    .severity-low {
      background-color: #f0fdf4;
      border-left: 3px solid #16a34a;
    }
    
    /* Type styles */
    .type-grammar { border-color: #3b82f6; }
    .type-style { border-color: #8b5cf6; }
    .type-legal { border-color: #f97316; }
    .type-clarity { border-color: #06b6d4; }
    
    /* Direct editing styles */
    [contenteditable] {
      cursor: text;
    }
    
    [contenteditable]:focus {
      outline: none;
    }
    
    /* Prevent editing of redline elements */
    .redline-suggestion * {
      pointer-events: auto;
      user-select: none;
      -webkit-user-select: none;
    }
    
    .redline-accept-btn {
      pointer-events: auto;
    }
    
    /* Enhanced Document Formatting Styles */
    .document-content .text-center {
      text-align: center !important;
    }
    
    .document-content .text-right {
      text-align: right !important;
    }
    
    .document-content .text-justify {
      text-align: justify !important;
    }
    
    .document-content .text-indent {
      text-indent: 0.5in !important;
    }
    
    .document-content .margin-left {
      margin-left: 0.5in !important;
    }
    
    .document-content .document-title {
      font-size: 16pt !important;
      font-weight: bold !important;
      text-align: center !important;
      margin: 12pt 0 !important;
      line-height: 1.2 !important;
    }
    
    .document-content .heading-1 {
      font-size: 14pt !important;
      font-weight: bold !important;
      margin: 12pt 0 6pt 0 !important;
      line-height: 1.2 !important;
    }
    
    .document-content .heading-2 {
      font-size: 13pt !important;
      font-weight: bold !important;
      margin: 10pt 0 6pt 0 !important;
      line-height: 1.2 !important;
    }
    
    .document-content .heading-3 {
      font-size: 12pt !important;
      font-weight: bold !important;
      margin: 8pt 0 4pt 0 !important;
      line-height: 1.2 !important;
    }
    
    .document-content ul, .document-content ol {
      margin: 6pt 0 !important;
      padding-left: 24pt !important;
    }
    
    .document-content li {
      margin: 3pt 0 !important;
      line-height: 1.15 !important;
    }
    
    .document-content u {
      text-decoration: underline !important;
    }
    
    .document-content s {
      text-decoration: line-through !important;
    }
    
    .document-content strong {
      font-weight: bold !important;
    }
    
    .document-content em {
      font-style: italic !important;
    }
    
    .document-content p {
      margin: 6pt 0 !important;
      line-height: 1.15 !important;
    }
    
    .document-content .list-paragraph {
      margin-left: 0.5in !important;
    }
    
    .document-content .tab-1 {
      margin-left: 0.5in !important;
    }
    
    .document-content .tab-2 {
      margin-left: 1in !important;
    }
    
    .document-content .tab-3 {
      margin-left: 1.5in !important;
    }
    
    .document-content .tab-4 {
      margin-left: 2in !important;
    }
    
    .formatted-document {
      line-height: 1.15 !important;
    }
    
    .formatted-document p {
      margin: 6pt 0 !important;
    }
    
    .formatted-document ul {
      list-style-type: disc !important;
      margin: 6pt 0 !important;
      padding-left: 24pt !important;
    }
    
    .formatted-document ol {
      list-style-type: decimal !important;
      margin: 6pt 0 !important;
      padding-left: 24pt !important;
    }
    
    .formatted-document li {
      margin: 3pt 0 !important;
      line-height: 1.15 !important;
    }
  `;

  return <style dangerouslySetInnerHTML={{ __html: redlineStyles }} />;
};

export default RedlineStyles;
