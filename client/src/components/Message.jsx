import { useState } from "react";
import {
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  Globe,
  Brain,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";

const formatTime = (isoString) => {
  if (!isoString) return "";
  try {
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "";
  }
};

export default function Message({
  message,
  isLatestAssistant,
  onRegenerate,
  onCopySuccess
}) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [showMemoryBreakdown, setShowMemoryBreakdown] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    onCopySuccess?.("Response copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const sources = message.sources || [];
  const memoryStats = message.memoryStats || {
    total:
      (message.memoriesUsed || 0) +
      (message.episodicMemoriesUsed || 0) +
      (message.semanticMemoriesUsed || 0),
    keyword: message.memoriesUsed || 0,
    episodic: message.episodicMemoriesUsed || 0,
    semantic: message.semanticMemoriesUsed || 0
  };

  const hasMemories = memoryStats.total > 0 || memoryStats.keyword > 0 || memoryStats.episodic > 0 || memoryStats.semantic > 0;

  return (
    <div
      className={`group relative mb-6 flex w-full items-start gap-3 sm:gap-4 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {/* ASSISTANT AVATAR */}
      {!isUser && (
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-violet-300 bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md shadow-violet-500/20">
          <Bot size={18} className="text-white" />
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
        </div>
      )}

      {/* MESSAGE CONTAINER */}
      <div
        className={`relative min-w-0 ${
          isUser
            ? "max-w-[85%] sm:max-w-[75%]"
            : "max-w-[95%] flex-1 sm:max-w-[88%]"
        }`}
      >
        {isUser ? (
          /* USER MESSAGE BUBBLE */
          <div className="relative overflow-hidden rounded-2xl rounded-tr-xs bg-violet-600 px-4 py-3 shadow-md shadow-violet-600/15 sm:px-5">
            <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed text-white">
              {message.content}
            </p>
          </div>
        ) : (
          /* ASSISTANT MESSAGE CARD (LIGHT THEME) */
          <div className="relative rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">

            {/* WEB SOURCES CITATION CAROUSEL */}
            {sources.length > 0 && (
              <div className="mb-4">
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-700">
                  <Globe size={12} />
                  <span>Web Sources Consulted</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sources.map((src, sIdx) => {
                    let domain = "web";
                    try {
                      domain = new URL(src.url).hostname.replace("www.", "");
                    } catch {
                      // fallback
                    }

                    return (
                      <a
                        key={sIdx}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/source flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:border-amber-400 hover:bg-amber-50/50 hover:text-amber-900"
                        title={src.title}
                      >
                        <Globe size={11} className="text-slate-400 group-hover/source:text-amber-600 transition" />
                        <span className="max-w-[150px] truncate">{src.title || domain}</span>
                        <ExternalLink size={10} className="opacity-60" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* RICH MARKDOWN MESSAGE BODY */}
            <MarkdownRenderer content={message.content} />

            {/* BOTTOM ACTIONS BAR */}
            <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-2.5 text-slate-500">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition hover:bg-slate-100 hover:text-slate-800"
                  title="Copy full response"
                >
                  {copied ? (
                    <>
                      <Check size={12} className="text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                {isLatestAssistant && onRegenerate && (
                  <button
                    onClick={onRegenerate}
                    className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition hover:bg-slate-100 hover:text-slate-800"
                    title="Regenerate response"
                  >
                    <RotateCcw size={12} />
                    <span>Regenerate</span>
                  </button>
                )}
              </div>

              <span className="text-[10px] text-slate-400">
                {formatTime(message.createdAt)}
              </span>
            </div>
          </div>
        )}

        {/* TIME STAMP (FOR USER) */}
        {isUser && (
          <p className="mt-1.5 text-right text-[10px] text-slate-400">
            {formatTime(message.createdAt)}
          </p>
        )}
      </div>

      {/* USER AVATAR */}
      {isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-violet-200 bg-violet-100 text-violet-700 shadow-xs">
          <User size={17} />
        </div>
      )}
    </div>
  );
}
