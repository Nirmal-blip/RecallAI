import { useEffect, useRef, useState, useCallback, useMemo, memo } from "react";
import {
  Bot,
  Send,
  Globe,
  Brain,
  LoaderCircle,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowDown,
  Zap,
  Square,
  CornerDownLeft,
  Download,
  Edit3,
  Check
} from "lucide-react";

import { sendMessage } from "../api";
import Sidebar from "./Sidebar";
import Message from "./Message";
import MemoryModal from "./MemoryModal";
import Toast from "./Toast";

// Helper to determine if an error was caused by request cancellation
function axiosIsCancel(err) {
  return err?.__CANCEL__ === true || err?.code === "ERR_CANCELED";
}

export default function Chat({
  conversationId,
  onConversationCreated,
  messages,
  setMessages,
  loadingChat = false,
  conversations = [],
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  onClearAllChats
}) {
  // State Management
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  const [memoryModalOpen, setMemoryModalOpen] = useState(false);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState("success");

  // Inline Title Rename State
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  // Refs
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Memoized Values
  const activeConversation = useMemo(
    () => conversations.find((c) => c._id === conversationId),
    [conversations, conversationId]
  );

  const activeTitle = activeConversation?.title || "New Session";

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  // Callbacks & Helpers
  const showToast = useCallback((message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
  }, []);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  const adjustTextareaHeight = () => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
  };

  // Lifecycle Effects
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K & Cmd+/ / Ctrl+/)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onNewChat?.();
        showToast("Started a new conversation", "info");
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNewChat, showToast]);

  // Scroll Handling
  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const isFar = el.scrollHeight - el.scrollTop - el.clientHeight > 220;
    setShowScrollButton(isFar);
  };

  const handleInputChange = (event) => {
    setInput(event.target.value);
    adjustTextareaHeight();
  };

  // Generation Handlers
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLoading(false);
    showToast("Generation stopped by user", "info");
  };

  const handleSend = async (customMessage) => {
    const textToSend = (customMessage ?? input).trim();
    if (!textToSend || loading || loadingChat) return;

    setInput("");
    setError("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const userMessage = {
      role: "user",
      content: textToSend,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    abortControllerRef.current = new AbortController();

    try {
      const data = await sendMessage(
        textToSend,
        conversationId,
        abortControllerRef.current.signal,
        webSearchEnabled
      );

      if (!data?.answer) {
        throw new Error("RecallAI returned an empty response.");
      }

      if (!conversationId && onConversationCreated) {
        onConversationCreated(data.conversationId, textToSend);
      }

      const assistantMessage = {
        role: "assistant",
        content: data.answer,
        sources: data.sources || [],
        memoryStats: data.memoryStats || {
          total: data.memoriesUsed || 0,
          keyword: data.memoriesUsed || 0,
          episodic: data.episodicMemoriesUsed || 0,
          semantic: data.semanticMemoriesUsed || 0
        },
        createdAt: new Date().toISOString()
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      if (err.name === "CanceledError" || err.name === "AbortError" || axiosIsCancel(err)) {
        return;
      }

      console.error("Chat error:", err);
      const errMsg =
        err.response?.data?.error ||
        err.message ||
        "Could not connect to RecallAI. Please verify backend status.";
      setError(errMsg);
      showToast(errMsg, "error");
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleRegenerate = () => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMessage) {
      handleSend(lastUserMessage.content);
    }
  };

  // Export to Markdown
  const handleExportMarkdown = () => {
    if (messages.length === 0) return;

    let md = `# RecallAI Session: ${activeTitle}\n`;
    md += `Exported on: ${new Date().toLocaleString()}\n\n---\n\n`;

    messages.forEach((m) => {
      const role = m.role === "user" ? "### 👤 User" : "### 🤖 RecallAI";
      md += `${role} (${new Date(m.createdAt || Date.now()).toLocaleTimeString()}):\n\n${m.content}\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `RecallAI-${(activeTitle || "chat").replace(/\s+/g, "_")}.md`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Conversation exported as Markdown");
  };

  // Title Editing Handlers
  const handleStartTitleEdit = () => {
    if (!conversationId) return;
    setTitleDraft(activeTitle);
    setIsEditingTitle(true);
  };

  const handleSaveTitleEdit = async () => {
    if (titleDraft.trim() && conversationId) {
      await onRenameChat?.(conversationId, titleDraft.trim());
      showToast("Conversation renamed");
    }
    setIsEditingTitle(false);
  };

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-slate-50 text-slate-900 antialiased">
      {/* Toast Overlay */}
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />

      {/* Memory Architecture Modal */}
      <MemoryModal isOpen={memoryModalOpen} onClose={() => setMemoryModalOpen(false)} />

      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs transition-opacity md:hidden"
        />
      )}

      {/* Collapsible Sidebar */}
      <aside
        className={`absolute inset-y-0 left-0 z-40 flex h-full shrink-0 flex-col border-r border-slate-200 bg-white shadow-xl transition-all duration-300 ease-in-out md:static md:shadow-none ${
          sidebarOpen
            ? "w-72 translate-x-0 opacity-100"
            : "w-0 -translate-x-full opacity-0 pointer-events-none md:w-0"
        }`}
      >
        <div className="flex h-full w-72 flex-col">
          <Sidebar
            onNewChat={onNewChat}
            conversations={conversations}
            onSelectChat={onSelectChat}
            activeId={conversationId}
            onDeleteChat={onDeleteChat}
            onRenameChat={onRenameChat}
            onOpenMemoryModal={() => setMemoryModalOpen(true)}
            onClearAllChats={onClearAllChats}
          />
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-slate-50">
        
        {/* Top Navigation Bar */}
        <HeaderBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeTitle={activeTitle}
          conversationId={conversationId}
          isEditingTitle={isEditingTitle}
          titleDraft={titleDraft}
          setTitleDraft={setTitleDraft}
          handleStartTitleEdit={handleStartTitleEdit}
          handleSaveTitleEdit={handleSaveTitleEdit}
          setIsEditingTitle={setIsEditingTitle}
          webSearchEnabled={webSearchEnabled}
          setWebSearchEnabled={setWebSearchEnabled}
          hasMessages={messages.length > 0}
          handleExportMarkdown={handleExportMarkdown}
          setMemoryModalOpen={setMemoryModalOpen}
          showToast={showToast}
        />

        {/* Scrollable Chat Canvas */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="relative min-h-0 flex-1 overflow-y-auto scroll-smooth"
        >
          <div className="mx-auto w-full max-w-(--breakpoint-md) px-4 py-8 sm:px-6 md:py-10">
            {messages.length === 0 && !loadingChat && <EmptyState greeting={greeting} />}

            {loadingChat && (
              <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-500 animate-in fade-in">
                <LoaderCircle size={28} className="animate-spin text-violet-600" />
                <span className="text-xs font-semibold">Retrieving conversation context...</span>
              </div>
            )}

            {!loadingChat &&
              messages.map((message, index) => (
                <Message
                  key={`${message.createdAt || "msg"}-${index}`}
                  message={message}
                  isLatestAssistant={index === messages.length - 1 && message.role === "assistant"}
                  onRegenerate={handleRegenerate}
                  onCopySuccess={(msg) => showToast(msg, "success")}
                />
              ))}

            {loading && <ThinkingSkeleton />}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Scroll-To-Bottom Floating Action Button */}
        {showScrollButton && (
          <button
            onClick={() => scrollToBottom("smooth")}
            aria-label="Scroll to bottom"
            className="absolute bottom-28 right-6 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-xl transition hover:bg-violet-600 hover:text-white"
          >
            <ArrowDown size={16} />
          </button>
        )}

        {/* Inline Error Alert */}
        {error && (
          <div className="mx-auto w-full max-w-(--breakpoint-md) px-4 sm:px-6">
            <div className="mb-3 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-800 shadow-xs">
              <div className="flex items-center gap-2">
                <Zap size={15} className="shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => setError("")}
                className="ml-2 text-[10px] font-bold underline hover:text-rose-950"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Input Composer Dock */}
        <ComposerFooter
          input={input}
          loading={loading}
          loadingChat={loadingChat}
          textareaRef={textareaRef}
          handleInputChange={handleInputChange}
          handleKeyDown={handleKeyDown}
          handleSend={handleSend}
          handleStopGeneration={handleStopGeneration}
        />
      </main>
    </div>
  );
}

/* ============================================================================
 * SUB-COMPONENTS
 * ============================================================================ */

const HeaderBar = memo(function HeaderBar({
  sidebarOpen,
  setSidebarOpen,
  activeTitle,
  conversationId,
  isEditingTitle,
  titleDraft,
  setTitleDraft,
  handleStartTitleEdit,
  handleSaveTitleEdit,
  setIsEditingTitle,
  webSearchEnabled,
  setWebSearchEnabled,
  hasMessages,
  handleExportMarkdown,
  setMemoryModalOpen,
  showToast
}) {
  return (
    <header className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md shadow-xs sm:px-6">
      {/* Left Section: Sidebar Toggle & Active Title */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={() => setSidebarOpen((prev) => !prev)}
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </button>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 text-violet-600 shadow-xs">
          <Bot size={20} />
        </div>

        {/* Title & Renaming Input */}
        <div className="min-w-0 max-w-[200px] sm:max-w-md">
          {isEditingTitle ? (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                type="text"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitleEdit();
                  if (e.key === "Escape") setIsEditingTitle(false);
                }}
                className="h-7 rounded border border-violet-400 bg-white px-2 text-xs font-bold text-slate-900 outline-hidden"
              />
              <button
                onClick={handleSaveTitleEdit}
                className="text-emerald-600 hover:text-emerald-700"
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <div className="group flex items-center gap-2">
              <h2
                onClick={handleStartTitleEdit}
                className="truncate text-sm font-bold tracking-tight text-slate-900 transition cursor-pointer hover:text-violet-600"
                title={conversationId ? "Click to rename" : activeTitle}
              >
                {activeTitle}
              </h2>
              {conversationId && (
                <button
                  onClick={handleStartTitleEdit}
                  className="text-slate-400 opacity-0 transition group-hover:opacity-100 hover:text-slate-600"
                >
                  <Edit3 size={12} />
                </button>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            
            <span className="font-semibold text-violet-600">Memory Engine Active</span>
          </div>
        </div>
      </div>

   
    </header>
  );
});

const EmptyState = memo(function EmptyState({ greeting }) {
  return (
    <div className="flex min-h-[calc(100dvh-240px)] flex-col items-center justify-center text-center animate-in fade-in duration-300">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-violet-300 bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-xl shadow-violet-500/25">
          <Bot size={40} className="text-white" />
        </div>
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
        {greeting}, Explorer.
      </h1>
    </div>
  );
});

const ThinkingSkeleton = memo(function ThinkingSkeleton() {
  return (
    <div className="mb-6 flex items-start gap-3 sm:gap-4 animate-in fade-in">
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md">
        <Bot size={18} className="text-white" />
        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-amber-400 animate-pulse" />
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-violet-600 animate-bounce" />
          <span className="h-2 w-2 rounded-full bg-violet-600 animate-bounce [animation-delay:150ms]" />
          <span className="h-2 w-2 rounded-full bg-violet-600 animate-bounce [animation-delay:300ms]" />
          <span className="ml-2 text-xs font-semibold text-slate-700">
            RecallAI Thinking...
          </span>
        </div>
      </div>
    </div>
  );
});

const ComposerFooter = memo(function ComposerFooter({
  input,
  loading,
  loadingChat,
  textareaRef,
  handleInputChange,
  handleKeyDown,
  handleSend,
  handleStopGeneration
}) {
  return (
    <footer className="shrink-0 border-t border-slate-200/80 bg-white/95 px-4 py-4 backdrop-blur-md sm:px-6">
      <div className="mx-auto w-full max-w-(--breakpoint-md)">
        <div className="relative flex flex-col rounded-2xl border border-slate-300 bg-white shadow-lg shadow-slate-200/50 transition-all focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask RecallAI anything, or query past memories..."
            rows={1}
            disabled={loadingChat}
            className="max-h-48 min-h-[50px] w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-[14px] leading-relaxed text-slate-900 outline-hidden placeholder:text-slate-400 disabled:opacity-50"
          />

          <div className="flex items-center justify-between px-3 pb-2.5 pt-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="hidden text-[11px] text-slate-400 sm:inline">
                ⌘K for new chat
              </span>
            </div>

            <div className="flex items-center gap-2">
              {input.length > 0 && (
                <span className="font-mono text-[10px] text-slate-400">
                  {input.length} chars
                </span>
              )}

              {loading ? (
                <button
                  onClick={handleStopGeneration}
                  title="Stop generating"
                  aria-label="Stop generating"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-white transition hover:bg-rose-600 shadow-md"
                >
                  <Square size={13} className="fill-current" />
                </button>
              ) : (
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || loadingChat}
                  title="Send message (Enter)"
                  aria-label="Send message"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 shadow-md shadow-violet-500/20"
                >
                  <Send size={15} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between px-1 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Zap size={12} className="text-violet-600" />
            <span>RecallAI verifies context across semantic vectors and episodic timestamps.</span>
          </div>
          <span className="hidden items-center gap-1 text-slate-400 sm:flex">
            <CornerDownLeft size={10} /> <kbd className="font-sans">Enter</kbd> to send
          </span>
        </div>
      </div>
    </footer>
  );
});