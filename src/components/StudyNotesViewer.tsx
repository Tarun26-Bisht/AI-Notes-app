import React, { useState } from 'react';
import {
  GraduationCap,
  Lightbulb,
  BookOpen,
  HelpCircle,
  Code,
  CheckCircle,
  Copy,
  Check
} from 'lucide-react';

interface StudyNotesViewerProps {
  content: string;
}

export const StudyNotesViewer: React.FC<StudyNotesViewerProps> = ({ content }) => {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIndex(idx);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  // Helper to format inline markdown (bold, code, italics)
  const formatInline = (text: string) => {
    // Split by inline code `...`
    const codeParts = text.split(/(`[^`]+`)/g);

    return codeParts.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 mx-0.5 text-xs font-mono bg-blue-50 text-blue-800 rounded border border-blue-200"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      // Handle bold **text**
      const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
      return boldParts.map((bPart, j) => {
        if (bPart.startsWith('**') && bPart.endsWith('**') && bPart.length > 4) {
          return (
            <strong key={`${i}-${j}`} className="font-semibold text-slate-900">
              {bPart.slice(2, -2)}
            </strong>
          );
        }

        // Handle italics *text*
        const italicParts = bPart.split(/(\*[^*]+\*)/g);
        return italicParts.map((iPart, k) => {
          if (iPart.startsWith('*') && iPart.endsWith('*') && iPart.length > 2) {
            return (
              <em key={`${i}-${j}-${k}`} className="italic text-slate-700">
                {iPart.slice(1, -1)}
              </em>
            );
          }
          return iPart;
        });
      });
    });
  };

  // Split content by lines and group into structured blocks
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeBlockIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Code block start/end
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        const codeText = codeBuffer.join('\n');
        const currentIndex = codeBlockIndex++;
        elements.push(
          <div key={`code-${i}`} className="my-3 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 text-slate-100 font-mono text-xs">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5" />
                <span>Code / Formula Snippet</span>
              </span>
              <button
                onClick={() => handleCopyCode(codeText, currentIndex)}
                className="hover:text-white flex items-center gap-1 transition-colors"
              >
                {copiedCodeIndex === currentIndex ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 overflow-x-auto whitespace-pre leading-relaxed">{codeText}</pre>
          </div>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      continue;
    }

    // Empty lines
    if (!trimmed) {
      elements.push(<div key={`empty-${i}`} className="h-2" />);
      continue;
    }

    // Dividers
    if (trimmed === '---' || trimmed === '***') {
      elements.push(<hr key={`hr-${i}`} className="my-4 border-slate-200" />);
      continue;
    }

    // Level 1 Heading (# Title)
    if (trimmed.startsWith('# ')) {
      elements.push(
        <div key={`h1-${i}`} className="mt-4 mb-3 pb-2 border-b border-blue-100">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
            <GraduationCap className="w-5 h-5 text-blue-600 shrink-0" />
            <span>{trimmed.slice(2)}</span>
          </h2>
        </div>
      );
      continue;
    }

    // Level 2 Heading (## Section)
    if (trimmed.startsWith('## ')) {
      elements.push(
        <div key={`h2-${i}`} className="mt-5 mb-2.5">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
            <span>{trimmed.slice(3)}</span>
          </h3>
        </div>
      );
      continue;
    }

    // Level 3 Heading (### Subsection)
    if (trimmed.startsWith('### ')) {
      const headingText = trimmed.slice(4);
      const isExamTip = /exam|pitfall|tip|mistake/i.test(headingText);
      const isQuiz = /quiz|recall|question/i.test(headingText);

      elements.push(
        <div
          key={`h3-${i}`}
          className={`mt-4 mb-2 p-2.5 rounded-lg border flex items-center gap-2 ${
            isExamTip
              ? 'bg-amber-50/70 border-amber-200 text-amber-900 font-bold'
              : isQuiz
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 font-bold'
              : 'bg-slate-100/70 border-slate-200 text-slate-900 font-bold'
          }`}
        >
          {isExamTip ? (
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
          ) : isQuiz ? (
            <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <span className="w-1.5 h-3.5 bg-blue-600 rounded-full shrink-0" />
          )}
          <h4 className="text-xs font-bold uppercase tracking-wider">{headingText}</h4>
        </div>
      );
      continue;
    }

    // Callout / Blockquote (> quote)
    if (trimmed.startsWith('> ')) {
      elements.push(
        <div
          key={`quote-${i}`}
          className="my-2 p-3 bg-blue-50/50 border-l-3 border-blue-500 rounded-r-lg text-xs text-blue-950 leading-relaxed font-medium"
        >
          {formatInline(trimmed.slice(2))}
        </div>
      );
      continue;
    }

    // Bullet points (- or * or •)
    if (/^[-*•]\s+/.test(trimmed)) {
      const bulletContent = trimmed.replace(/^[-*•]\s+/, '');
      elements.push(
        <div key={`bullet-${i}`} className="flex items-start gap-2.5 my-1 text-xs text-slate-700 leading-relaxed pl-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
          <span className="flex-1">{formatInline(bulletContent)}</span>
        </div>
      );
      continue;
    }

    // Numbered lists (1. , 2. )
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      const num = numberedMatch[1];
      const text = numberedMatch[2];
      elements.push(
        <div key={`num-${i}`} className="flex items-start gap-2.5 my-1 text-xs text-slate-800 leading-relaxed pl-1">
          <span className="font-mono font-bold text-[11px] text-blue-600 bg-blue-50 border border-blue-200 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
            {num}
          </span>
          <span className="flex-1 pt-0.5">{formatInline(text)}</span>
        </div>
      );
      continue;
    }

    // Regular paragraph text
    elements.push(
      <p key={`p-${i}`} className="text-xs text-slate-700 leading-relaxed my-1">
        {formatInline(trimmed)}
      </p>
    );
  }

  return (
    <div className="study-notes-container bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      {elements}
    </div>
  );
};
