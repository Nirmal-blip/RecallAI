import {
  X,
  Brain,
  Cpu,
  Clock,
  KeyRound,
  Sparkles,
  Layers
} from "lucide-react";

export default function MemoryModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Dialog (Light Theme) */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200 text-slate-800">
        {/* Top Gradient Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-violet-600 via-indigo-500 to-emerald-500" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 text-violet-600">
              <Brain size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                RecallAI Memory Architecture
                <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-[10px] font-bold text-violet-700 border border-violet-200">
                  v2.4 Pro
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                How RecallAI indexes, stores, and recalls your conversational knowledge
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="max-h-[75vh] overflow-y-auto p-5 sm:p-6 space-y-4">
          
          {/* Overview Banner */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 leading-relaxed">
            RecallAI is not a stateless chatbot. It runs a continuous multi-layered memory pipeline across MongoDB Atlas, local ONNX neural embeddings, and temporal episodic logging, allowing you to ask questions about past discussions with exact dates and concepts.
          </div>

          {/* 4 Layers Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            
            {/* Layer 1: Short-Term Memory */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-violet-300 shadow-xs">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Layers size={17} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">1. Short-Term Context</h3>
                  <span className="text-[10px] text-indigo-600 font-mono font-medium">12-message active buffer</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Maintains immediate conversational flow, understands follow-ups, and prevents repeating facts already established in the active session.
              </p>
            </div>

            {/* Layer 2: Semantic Vector Memory */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-violet-300 shadow-xs">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <Cpu size={17} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">2. Semantic Vector Recall</h3>
                  <span className="text-[10px] text-violet-600 font-mono font-medium">all-MiniLM-L6-v2 ONNX</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Converts user messages into 384-dimensional vector embeddings stored in MongoDB Atlas. Finds past topics even if worded completely differently.
              </p>
            </div>

            {/* Layer 3: Episodic Temporal Memory */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-violet-300 shadow-xs">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Clock size={17} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">3. Episodic / Temporal Log</h3>
                  <span className="text-[10px] text-emerald-600 font-mono font-medium">Asia/Kolkata (IST)</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Tracks temporal milestones: "What did I ask yesterday?", "What was my first question?", and "When was X discussed?" with verifiable dates.
              </p>
            </div>

            {/* Layer 4: Keyword Index */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-violet-300 shadow-xs">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <KeyRound size={17} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">4. Exact Keyword Index</h3>
                  <span className="text-[10px] text-amber-600 font-mono font-medium">Stop-word filtered matching</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Quickly identifies specific names, code libraries, project titles, and acronyms mentioned across prior conversation histories.
              </p>
            </div>

          </div>

          {/* Engine Tech Specs */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles size={14} className="text-violet-600" />
              Connected Neural Stack
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
              <div className="rounded-lg bg-white p-2 border border-slate-200 shadow-xs">
                <span className="block text-[10px] text-slate-400">LLM Engine</span>
                <span className="font-bold text-violet-700">LLaMA 3.3 70B</span>
              </div>
              <div className="rounded-lg bg-white p-2 border border-slate-200 shadow-xs">
                <span className="block text-[10px] text-slate-400">Embeddings</span>
                <span className="font-bold text-indigo-700">384-dim ONNX</span>
              </div>
              <div className="rounded-lg bg-white p-2 border border-slate-200 shadow-xs">
                <span className="block text-[10px] text-slate-400">Vector Storage</span>
                <span className="font-bold text-emerald-700">MongoDB Atlas</span>
              </div>
              <div className="rounded-lg bg-white p-2 border border-slate-200 shadow-xs">
                <span className="block text-[10px] text-slate-400">Live Web</span>
                <span className="font-bold text-amber-700">Tavily Engine</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-3.5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-violet-500/20 hover:bg-violet-700 transition"
          >
            Got it
          </button>
        </div>

      </div>
    </div>
  );
}
