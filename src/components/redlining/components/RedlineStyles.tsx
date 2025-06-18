
/**
 * RedlineStyles Component
 * 
 * Purpose: Provides CSS styles for redline suggestions
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
      cursor: text;
      padding: 1px 2px;
      border-radius: 2px;
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
  `;

  return <style dangerouslySetInnerHTML={{ __html: redlineStyles }} />;
};

export default RedlineStyles;
