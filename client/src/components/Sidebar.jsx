import { useMemo, useState } from "react";
import {
  Bot,
  Plus,
  Search,
  MessageSquare,
  Clock3,
  Command,
  Trash2,
  Edit2,
  Check,
  X,
  Brain,
  ChevronRight
} from "lucide-react";

export default function Sidebar({
  onNewChat,
  conversations = [],
  onSelectChat,
  activeId,
  onDeleteChat,
  onRenameChat,
  onOpenMemoryModal,
  onClearAllChats
}) {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  // Group conversations by date
  const groups = useMemo(() => {
    const filtered = conversations.filter((chat) =>
      (chat.title || "New conversation")
        .toLowerCase()
        .includes(search.toLowerCase())
    );

    const result = {
      Today: [],
      Yesterday: [],
      "Previous 7 days": [],
      Older: []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    filtered.forEach((chat) => {
      const date = new Date(chat.updatedAt || chat.createdAt || now);
      const chatDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );

      const diff = Math.floor((today - chatDay) / 86400000);

      if (diff <= 0) result.Today.push(chat);
      else if (diff === 1) result.Yesterday.push(chat);
      else if (diff <= 7) result["Previous 7 days"].push(chat);
      else result.Older.push(chat);
    });

    return result;
  }, [conversations, search]);

  const totalChats = Object.values(groups).reduce(
    (total, chats) => total + chats.length,
    0
  );

  const startEditing = (chat, e) => {
    e.stopPropagation();
    setEditingId(chat._id);
    setEditTitle(chat.title || "");
  };

  const handleSaveRename = async (chatId, e) => {
    e?.stopPropagation();
    if (editTitle.trim()) {
      await onRenameChat?.(chatId, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e) => {
    e?.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = async (chatId, e) => {
    e.stopPropagation();
    if (confirmDeleteId === chatId) {
      await onDeleteChat?.(chatId);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(chatId);
    }
  };

  return (
    <aside className="flex h-screen w-72 min-w-72 shrink-0 flex-col bg-white border-r border-slate-200 text-slate-800">
      {/* BRAND & LOGO BAR */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex h-12 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20">
              <Bot size={22} className="text-white" />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[16px] font-extrabold tracking-tight text-slate-900">
                  Recall<span className="text-violet-600">AI</span>
                </span>
                <span className="rounded-md bg-violet-50 px-1.5 py-0.5 font-mono text-[9px] font-bold text-violet-700 border border-violet-200">
                  v2.4
                </span>
              </div>
              <span className="text-[10px] tracking-wide text-slate-400">
                Contextual Neural Assistant
              </span>
            </div>
          </div>

          <button
            onClick={onOpenMemoryModal}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-violet-600"
            title="Inspect Memory Architecture"
          >
            <Brain size={18} />
          </button>
        </div>

        {/* NEW CONVERSATION BUTTON */}
        <button
          onClick={onNewChat}
          className="group relative mt-4 flex h-11 w-full items-center gap-3 overflow-hidden rounded-xl bg-violet-600 px-3.5 text-xs font-semibold text-white shadow-md shadow-violet-500/20 transition-all hover:bg-violet-700 active:scale-[0.98]"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/20 transition group-hover:rotate-90">
            <Plus size={16} strokeWidth={2.5} />
          </div>
          <span>New conversation</span>
          <span className="ml-auto flex items-center gap-1 rounded-md bg-black/15 px-2 py-0.5 font-mono text-[10px] text-white/90">
            <Command size={10} /> K
          </span>
        </button>
      </div>

      {/* SEARCH CONVERSATIONS */}
      <div className="px-4 py-2.5">
        <div className="flex h-9 items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-violet-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-violet-500/10">
          <Search size={14} className="shrink-0 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="h-full min-w-0 flex-1 bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-[11px] text-slate-400 hover:text-slate-700"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* HISTORY HEADER */}
      <div className="flex h-7 shrink-0 items-center justify-between px-5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
        <div className="flex items-center gap-1.5">
          <Clock3 size={12} />
          <span>History</span>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-600">
          {totalChats}
        </span>
      </div>

      {/* CONVERSATION LIST */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-1 space-y-4">
        {totalChats === 0 ? (
          <div className="flex flex-col items-center px-4 py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
              <MessageSquare size={20} />
            </div>
            <p className="text-xs font-bold text-slate-700">
              {search ? "No matching chats" : "No conversations yet"}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              {search
                ? "Try searching another term"
                : "Ask RecallAI anything to start a session."}
            </p>
          </div>
        ) : (
          Object.entries(groups).map(
            ([group, chats]) =>
              chats.length > 0 && (
                <section key={group}>
                  <h3 className="mb-1.5 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {group}
                  </h3>

                  <div className="space-y-0.5">
                    {chats.map((chat) => {
                      const isActive = activeId === chat._id;
                      const isEditing = editingId === chat._id;
                      const isDeleting = confirmDeleteId === chat._id;

                      return (
                        <div
                          key={chat._id}
                          onClick={() => !isEditing && onSelectChat(chat)}
                          className={`group relative flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 text-left transition-all ${
                            isActive
                              ? "bg-violet-50 text-violet-700 border border-violet-200 shadow-xs font-semibold"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                          }`}
                        >
                          <MessageSquare
                            size={14}
                            className={`shrink-0 ${
                              isActive ? "text-violet-600" : "text-slate-400 group-hover:text-slate-600"
                            }`}
                          />

                          {/* INLINE RENAME MODE */}
                          {isEditing ? (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex min-w-0 flex-1 items-center gap-1"
                            >
                              <input
                                autoFocus
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveRename(chat._id, e);
                                  if (e.key === "Escape") handleCancelRename(e);
                                }}
                                className="h-6 w-full rounded border border-violet-400 bg-white px-1.5 text-xs text-slate-900 outline-none"
                              />
                              <button
                                onClick={(e) => handleSaveRename(chat._id, e)}
                                className="text-emerald-600 hover:text-emerald-700"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={handleCancelRename}
                                className="text-slate-400 hover:text-slate-700"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            /* DISPLAY TITLE */
                            <span className="min-w-0 flex-1 truncate text-xs">
                              {chat.title || "New conversation"}
                            </span>
                          )}

                          {/* ACTION BUTTONS ON HOVER */}
                          {!isEditing && (
                            <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                onClick={(e) => startEditing(chat, e)}
                                className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-200/80 hover:text-slate-700"
                                title="Rename chat"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={(e) => handleDelete(chat._id, e)}
                                className={`flex h-6 w-6 items-center justify-center rounded transition ${
                                  isDeleting
                                    ? "bg-rose-500 text-white"
                                    : "text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                }`}
                                title={isDeleting ? "Click again to confirm delete" : "Delete chat"}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )
          )
        )}
      </div>


      {/* FOOTER ACTIONS */}
      <div className="shrink-0 border-t border-slate-200 p-3">
        {totalChats > 0 && (
          <div className="flex justify-between items-center text-[11px] text-slate-400 px-1">
            {confirmClearAll ? (
              <div className="flex items-center justify-between w-full bg-rose-50 border border-rose-200 rounded-lg p-1.5 px-2">
                <span className="text-[10px] text-rose-700 font-bold">Delete all?</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      onClearAllChats?.();
                      setConfirmClearAll(false);
                    }}
                    className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-rose-700"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmClearAll(false)}
                    className="rounded bg-slate-200 px-2 py-0.5 text-[10px] text-slate-700 hover:bg-slate-300"
                  >
                    No
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClearAll(true)}
                className="flex items-center gap-1.5 hover:text-rose-600 transition"
              >
                <Trash2 size={12} />
                <span>Clear history</span>
              </button>
            )}

            <span className="text-[10px] font-mono text-slate-400">Groq • Tavily</span>
          </div>
        )}
      </div>
    </aside>
  );
}
