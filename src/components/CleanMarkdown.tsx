'use client';

import React from 'react';

// Helper to strip markdown formatting characters completely, leaving clean plain text
export function stripMarkdown(text: string): string {
  if (!text) return '';
  return text
    // Remove headers with or without spaces
    .replace(/^#{1,6}\s*/gm, '')
    // Remove bold asterisks
    .replace(/\*\*/g, '')
    // Remove italics
    .replace(/\*/g, '')
    .replace(/_/g, '')
    // Remove divider characters
    .replace(/[-*_]{3,}/g, '')
    // Remove bullet indicators and any following spaces
    .replace(/^\s*[-*+•]\s+/gm, '')
    .trim();
}

interface CleanMarkdownProps {
  text: string;
}

export function CleanMarkdown({ text }: CleanMarkdownProps) {
  if (!text) return null;

  // Helper to parse inline styles like **bold** and *italic*
  const parseInlineStyles = (line: string): React.ReactNode[] => {
    // Split by ** for bold parts
    const boldParts = line.split('**');
    return boldParts.flatMap((part, bIdx) => {
      // Even index: regular text, Odd index: bold
      const isBold = bIdx % 2 !== 0;
      
      // Split by * for italics
      const italicParts = part.split('*');
      const nodes = italicParts.map((subPart, iIdx) => {
        const isItalic = iIdx % 2 !== 0;
        if (isItalic) {
          return <em key={`em-${bIdx}-${iIdx}`} className="italic text-[#58A6FF] font-semibold not-italic">{subPart}</em>;
        }
        return subPart;
      });

      if (isBold) {
        return <strong key={`strong-${bIdx}`} className="font-extrabold text-[#58A6FF]">{nodes}</strong>;
      }
      return nodes;
    });
  };

  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        // Remove or ignore multiple asterisks/lines like *****, ---, ===
        if (trimmed.match(/^[*=-]{3,}$/)) {
          return null;
        }

        // Header parsing: e.g. ### Header or ####Header
        const headerMatch = trimmed.match(/^(#{1,6})\s*(.*)$/);
        if (headerMatch && headerMatch[2]) {
          const level = headerMatch[1].length;
          const content = headerMatch[2].trim();
          if (level <= 3) {
            return (
              <h3 key={idx} className="text-sm font-bold text-[#58A6FF] border-b border-[#1E2333] pb-1 pt-3 tracking-wide mt-3 mb-1 font-sans">
                {parseInlineStyles(content)}
              </h3>
            );
          } else {
            return (
              <h4 key={idx} className="text-xs font-bold text-[#E6EDF3] mt-3 mb-1 tracking-wide font-sans">
                {parseInlineStyles(content)}
              </h4>
            );
          }
        }

        // Bullet point parsing: e.g. *   Item or - Item
        const listMatch = trimmed.match(/^([-*+•])\s+(.*)$/);
        if (listMatch) {
          const content = listMatch[2].trim();
          return (
            <div key={idx} className="pl-4 relative py-1 text-[#E6EDF3] font-sans text-[11px] flex items-start">
              <span className="inline-block h-1.5 w-1.5 bg-[#58A6FF] rounded-full shrink-0 mr-2 mt-1.5" />
              <div className="flex-1">{parseInlineStyles(content)}</div>
            </div>
          );
        }

        // Empty lines
        if (!trimmed) {
          return <div key={idx} className="h-2" />;
        }

        // Regular paragraph text
        return (
          <p key={idx} className="font-sans text-[11px] text-[#8B949E] leading-normal my-1">
            {parseInlineStyles(line)}
          </p>
        );
      })}
    </>
  );
}

