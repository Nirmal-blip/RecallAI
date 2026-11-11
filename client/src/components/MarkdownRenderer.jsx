import { useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Code2,
  Info,
  Lightbulb,
  AlertTriangle,
  Flame
} from "lucide-react";

/**
 * Enhanced Markdown & Code Block Renderer (Light Theme)
 * Renders rich typography, syntax blocks, tables, lists, callouts, and links.
 */
export default function MarkdownRenderer({ content = "" }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopyCode = (code, index) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!content) return null;

  // Split content into blocks: Code blocks vs Text/Markdown blocks
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({
        type: "markdown",
        content: content.slice(lastIndex, match.index)
      });
    }

    blocks.push({
      type: "code",
      language: match[1] || "plaintext",
      content: match[2].trimEnd()
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    blocks.push({
      type: "markdown",
      content: content.slice(lastIndex)
    });
  }

  return (
    <div className="markdown-body space-y-3.5 text-[14px] leading-relaxed text-slate-800">
      {blocks.map((block, idx) => {
        if (block.type === "code") {
          return (
            <CodeBlock
              key={`code-${idx}`}
              language={block.language}
              code={block.content}
              isCopied={copiedIndex === idx}
              onCopy={() => handleCopyCode(block.content, idx)}
            />
          );
        }

        return <MarkdownSection key={`md-${idx}`} text={block.content} />;
      })}
    </div>
  );
}

/**
 * Modern High-Contrast Code Block
 */
function CodeBlock({ language, code, isCopied, onCopy }) {
  const lineCount = code.split("\n").length;

  return (
    <div className="group/code my-3.5 overflow-hidden rounded-xl border border-slate-700 bg-[#0f172a] shadow-md">
      {/* Code Header Bar */}
      <div className="flex h-9 items-center justify-between border-b border-slate-700/80 bg-[#1e293b] px-3.5 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 opacity-70">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="ml-2 flex items-center gap-1.5 font-mono text-[11px] font-medium lowercase text-violet-300">
            <Code2 size={13} className="text-violet-400" />
            {language}
          </span>
          <span className="text-[10px] text-slate-400">
            • {lineCount} {lineCount === 1 ? "line" : "lines"}
          </span>
        </div>

        <button
          onClick={onCopy}
          className="flex items-center gap-1.5 rounded-md border border-slate-600 bg-slate-700/60 px-2.5 py-1 text-[11px] font-medium text-slate-200 transition hover:bg-slate-600 hover:text-white"
          title="Copy code to clipboard"
        >
          {isCopied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/**
 * Parses markdown paragraphs, lists, tables, blockquotes, alerts, and inline styles
 */
function MarkdownSection({ text }) {
  const lines = text.split("\n");
  const elements = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    // Horizontal Rule (--- or ***)
    if (/^(---|===|\*\*\*)$/.test(line.trim())) {
      elements.push(
        <hr key={`hr-${index}`} className="my-4 border-t border-slate-200" />
      );
      index++;
      continue;
    }

    // Callout Alert Blocks (> [!NOTE], > [!TIP], > [!WARNING], > [!IMPORTANT])
    const calloutMatch = line.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)$/i);
    if (calloutMatch) {
      const type = calloutMatch[1].toUpperCase();
      const calloutLines = [];
      if (calloutMatch[2]) calloutLines.push(calloutMatch[2]);
      index++;

      while (index < lines.length && lines[index].startsWith(">")) {
        calloutLines.push(lines[index].replace(/^>\s?/, ""));
        index++;
      }

      elements.push(
        <CalloutAlert key={`callout-${index}`} type={type} lines={calloutLines} />
      );
      continue;
    }

    // Standard Blockquote (> quote)
    if (line.startsWith(">")) {
      const quoteLines = [];
      while (index < lines.length && lines[index].startsWith(">")) {
        quoteLines.push(lines[index].replace(/^>\s?/, ""));
        index++;
      }
      elements.push(
        <blockquote
          key={`quote-${index}`}
          className="my-3 rounded-r-xl border-l-4 border-violet-500 bg-violet-50/60 px-4 py-2.5 text-slate-700 italic"
        >
          {quoteLines.map((ql, qIdx) => (
            <p key={qIdx} className="leading-relaxed">
              <InlineText text={ql} />
            </p>
          ))}
        </blockquote>
      );
      continue;
    }

    // Headings (#, ##, ###, ####)
    if (line.startsWith("#")) {
      const match = line.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const headingText = match[2];

        if (level === 1) {
          elements.push(
            <h1
              key={`h1-${index}`}
              className="mt-5 mb-2.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl"
            >
              <InlineText text={headingText} />
            </h1>
          );
        } else if (level === 2) {
          elements.push(
            <h2
              key={`h2-${index}`}
              className="mt-4 mb-2 pb-1 text-lg font-bold tracking-tight text-slate-900 border-b border-slate-200"
            >
              <InlineText text={headingText} />
            </h2>
          );
        } else if (level === 3) {
          elements.push(
            <h3
              key={`h3-${index}`}
              className="mt-3.5 mb-1.5 text-base font-bold text-slate-800"
            >
              <InlineText text={headingText} />
            </h3>
          );
        } else {
          elements.push(
            <h4
              key={`h4-${index}`}
              className="mt-2.5 mb-1 text-sm font-semibold tracking-wide text-slate-700 uppercase"
            >
              <InlineText text={headingText} />
            </h4>
          );
        }
        index++;
        continue;
      }
    }

    // Tables (| col | col |)
    if (line.includes("|") && lines[index + 1]?.includes("---")) {
      const tableLines = [];
      while (index < lines.length && lines[index].includes("|")) {
        tableLines.push(lines[index]);
        index++;
      }
      elements.push(<MarkdownTable key={`tbl-${index}`} lines={tableLines} />);
      continue;
    }

    // Unordered Lists (- or *)
    if (/^\s*[-*]\s+/.test(line)) {
      const listItems = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        const itemText = lines[index].replace(/^\s*[-*]\s+/, "");
        listItems.push(itemText);
        index++;
      }
      elements.push(
        <ul key={`ul-${index}`} className="my-2.5 space-y-1.5 pl-2">
          {listItems.map((item, lIdx) => (
            <li key={lIdx} className="flex items-start gap-2.5 text-slate-800">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-600" />
              <div className="flex-1">
                <InlineText text={item} />
              </div>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered Lists (1. Item)
    if (/^\s*\d+\.\s+/.test(line)) {
      const listItems = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        const itemText = lines[index].replace(/^\s*\d+\.\s+/, "");
        listItems.push(itemText);
        index++;
      }
      elements.push(
        <ol key={`ol-${index}`} className="my-2.5 space-y-1.5 pl-1">
          {listItems.map((item, lIdx) => (
            <li key={lIdx} className="flex items-start gap-2.5 text-slate-800">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-violet-50 font-mono text-[11px] font-bold text-violet-700 border border-violet-200">
                {lIdx + 1}
              </span>
              <div className="flex-1 pt-0.5">
                <InlineText text={item} />
              </div>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Empty lines
    if (!line.trim()) {
      index++;
      continue;
    }

    // Regular Paragraph
    elements.push(
      <p key={`p-${index}`} className="leading-relaxed text-slate-800">
        <InlineText text={line} />
      </p>
    );
    index++;
  }

  return <>{elements}</>;
}

/**
 * Renders GitHub-style alert callouts (Light Theme)
 */
function CalloutAlert({ type, lines }) {
  const config = {
    NOTE: {
      icon: Info,
      border: "border-blue-200",
      bg: "bg-blue-50/90",
      text: "text-blue-700",
      label: "Note"
    },
    TIP: {
      icon: Lightbulb,
      border: "border-emerald-200",
      bg: "bg-emerald-50/90",
      text: "text-emerald-700",
      label: "Tip"
    },
    IMPORTANT: {
      icon: Flame,
      border: "border-violet-200",
      bg: "bg-violet-50/90",
      text: "text-violet-700",
      label: "Important"
    },
    WARNING: {
      icon: AlertTriangle,
      border: "border-amber-200",
      bg: "bg-amber-50/90",
      text: "text-amber-800",
      label: "Warning"
    },
    CAUTION: {
      icon: AlertTriangle,
      border: "border-rose-200",
      bg: "bg-rose-50/90",
      text: "text-rose-700",
      label: "Caution"
    }
  }[type] || {
    icon: Info,
    border: "border-violet-200",
    bg: "bg-violet-50/90",
    text: "text-violet-700",
    label: "Info"
  };

  const Icon = config.icon;

  return (
    <div
      className={`my-3.5 rounded-xl border ${config.border} ${config.bg} p-3.5 shadow-xs`}
    >
      <div className={`flex items-center gap-2 font-bold text-xs ${config.text} mb-1.5`}>
        <Icon size={15} />
        <span className="uppercase tracking-wider">{config.label}</span>
      </div>
      <div className="space-y-1 text-xs leading-relaxed text-slate-700 pl-6">
        {lines.map((l, i) => (
          <p key={i}>
            <InlineText text={l} />
          </p>
        ))}
      </div>
    </div>
  );
}

/**
 * Formats Markdown tables cleanly (Light Theme)
 */
function MarkdownTable({ lines }) {
  if (lines.length < 2) return null;

  const headerLine = lines[0];
  const rows = lines.slice(2);

  const parseCells = (row) =>
    row
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());

  const headers = parseCells(headerLine);

  return (
    <div className="my-3.5 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left text-xs text-slate-800">
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-900 font-bold">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-3.5 py-2.5 font-bold text-slate-900">
                <InlineText text={h} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, rIdx) => {
            const cells = parseCells(row);
            return (
              <tr key={rIdx} className="hover:bg-slate-50/70 transition">
                {cells.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3.5 py-2">
                    <InlineText text={cell} />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Handles inline markdown:
 * - Bold: **text**
 * - Italic: *text* or _text_
 * - Strikethrough: ~~text~~
 * - Inline code: `code`
 * - Links: [label](url)
 */
function InlineText({ text }) {
  if (!text) return null;

  const tokenRegex = /(`[^`]+`)|(\[[^\]]+\]\([^)]+\))|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(~~[^~]+~~)/g;

  const elements = [];
  let lastIdx = 0;
  let match;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      elements.push(text.slice(lastIdx, match.index));
    }

    const token = match[0];

    // Inline Code: `code`
    if (token.startsWith("`") && token.endsWith("`")) {
      elements.push(
        <code
          key={`c-${match.index}`}
          className="mx-0.5 rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[12px] text-violet-700 font-medium"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    // Links: [Label](url)
    else if (token.startsWith("[") && token.includes("](") && token.endsWith(")")) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const label = linkMatch[1];
        const url = linkMatch[2];
        elements.push(
          <a
            key={`l-${match.index}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 font-semibold text-violet-600 hover:text-violet-700 underline underline-offset-3 transition"
          >
            {label}
            <ExternalLink size={11} className="inline ml-0.5 opacity-80" />
          </a>
        );
      } else {
        elements.push(token);
      }
    }
    // Bold: **text**
    else if (token.startsWith("**") && token.endsWith("**")) {
      elements.push(
        <strong key={`b-${match.index}`} className="font-bold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    }
    // Italic: *text*
    else if (token.startsWith("*") && token.endsWith("*")) {
      elements.push(
        <em key={`i-${match.index}`} className="italic text-slate-700">
          {token.slice(1, -1)}
        </em>
      );
    }
    // Strikethrough: ~~text~~
    else if (token.startsWith("~~") && token.endsWith("~~")) {
      elements.push(
        <del key={`s-${match.index}`} className="line-through text-slate-400">
          {token.slice(2, -2)}
        </del>
      );
    }

    lastIdx = match.index + token.length;
  }

  if (lastIdx < text.length) {
    elements.push(text.slice(lastIdx));
  }

  return <>{elements}</>;
}
