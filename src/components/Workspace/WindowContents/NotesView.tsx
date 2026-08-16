import React, { useState } from 'react';
import { NoteContent, WorkspaceWindow } from '../../../types';
import { useSupercomputer } from '../../../context/SupercomputerContext';
import { Save, Copy, Check, Tag, Sparkles } from 'lucide-react';
import { apiService } from '../../../services/apiService';

interface Props {
  windowItem: WorkspaceWindow;
  content: NoteContent;
}

export const NotesView: React.FC<Props> = ({ windowItem, content }) => {
  const { updateWindowSize } = useSupercomputer();
  const [text, setText] = useState(content.text);
  const [copied, setCopied] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAISummarize = async () => {
    if (!text.trim() || isSummarizing) return;
    setIsSummarizing(true);
    try {
      const summary = await apiService.sendChatMessage(
        `Summarize and organize this note cleanly into bullet points:\n\n${text}`,
        []
      );
      setText((prev) => `${prev}\n\n---\n### 🤖 AI Summary\n${summary}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3 text-slate-200">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400">
          <Tag className="w-3.5 h-3.5" />
          <span>{content.tags?.join(', ') || 'general'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAISummarize}
            disabled={isSummarizing}
            className="px-2 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>{isSummarizing ? 'Synthesizing...' : 'AI Enhance'}</span>
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer text-xs font-mono flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Note Textarea */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1 w-full bg-slate-950/50 border border-slate-800/80 rounded-lg p-3 text-xs sm:text-sm text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-cyan-500/50 resize-none"
        placeholder="Write note or paste intelligence..."
      />

      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
        <span>WORDS: {text.trim() ? text.trim().split(/\s+/).length : 0}</span>
        <span>LAST UPDATED: {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
};
