import React, { useState } from 'react';
import { ResearchContent, WorkspaceWindow } from '../../../types';
import { useSupercomputer } from '../../../context/SupercomputerContext';
import {
  ExternalLink,
  Search,
  Sparkles,
  TrendingUp,
  TrendingDown,
  FileText,
  Layers,
  ArrowRight,
  Send,
  Copy,
  Check,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import { apiService } from '../../../services/apiService';

interface Props {
  windowItem: WorkspaceWindow;
  content: ResearchContent;
}

export const ResearchView: React.FC<Props> = ({ windowItem, content }) => {
  const {
    createResearchWindow,
    createComparisonWindow,
    createNewWindow,
    windows,
  } = useSupercomputer();

  const [followUpText, setFollowUpText] = useState('');
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);
  const [followUpAnswers, setFollowUpAnswers] = useState<
    { query: string; answer: string; timestamp: number }[]
  >([]);
  const [copied, setCopied] = useState(false);

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpText.trim() || isFollowUpLoading) return;

    const q = followUpText.trim();
    setFollowUpText('');
    setIsFollowUpLoading(true);

    try {
      const answer = await apiService.sendChatMessage(
        q,
        [
          { role: 'system', text: `You are answering questions about this research on "${content.query}":\n${content.summary}` },
        ],
        content
      );

      setFollowUpAnswers((prev) => [...prev, { query: q, answer, timestamp: Date.now() }]);
    } catch (err) {
      console.error('Follow-up failed:', err);
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(
      `RESEARCH: ${content.query}\n\nSUMMARY:\n${content.summary}\n\nKEY FINDINGS:\n${content.keyFindings.join('\n- ')}\n\nSOURCES:\n${content.sources.map((s) => `${s.title}: ${s.url}`).join('\n')}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportToNote = () => {
    createNewWindow('NOTES', `Note: ${content.query}`, {
      title: `Summary of ${content.query}`,
      text: `# Research: ${content.query}\n\n${content.summary}\n\n### Key Findings\n${content.keyFindings.map((f) => `- ${f}`).join('\n')}`,
      tags: ['research', 'export'],
      updatedAt: Date.now(),
    });
  };

  // Find other research windows for quick 1-click comparison
  const otherResearchWindows = windows.filter(
    (w) => (w.type === 'RESEARCH' || w.type === 'COMPARISON') && w.id !== windowItem.id
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto space-y-4 pr-1 text-slate-200 select-text">
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="truncate max-w-[280px]">QUERY: {content.query}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopySummary}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer text-xs flex items-center gap-1 font-mono"
            title="Copy research summary"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            type="button"
            onClick={handleExportToNote}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer text-xs flex items-center gap-1 font-mono"
            title="Export as persistent note"
          >
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span>Save Note</span>
          </button>
          <button
            type="button"
            onClick={() => createResearchWindow(content.query, true)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer text-xs flex items-center gap-1 font-mono"
            title="Open in new separate screen"
          >
            <Layers className="w-3.5 h-3.5 text-teal-400" />
            <span>New Screen</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      {content.metrics && content.metrics.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {content.metrics.map((m, i) => (
            <div
              key={i}
              className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between"
            >
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                {m.label}
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-semibold font-mono text-cyan-300">{m.value}</span>
                {m.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
                {m.trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-rose-400" />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Synthesis / Executive Summary */}
      <div className="p-3.5 rounded-lg bg-slate-950/70 border border-cyan-500/20 shadow-inner">
        <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-cyan-400 mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI EXECUTIVE SYNTHESIS</span>
        </div>
        <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-2 whitespace-pre-line font-sans">
          {content.summary}
        </div>
      </div>

      {/* Key Findings */}
      {content.keyFindings && content.keyFindings.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-mono font-semibold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>KEY FINDINGS & INTELLIGENCE</span>
          </div>
          <div className="space-y-1.5">
            {content.keyFindings.map((finding, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-md bg-slate-900/40 border border-slate-800/70 flex items-start gap-2.5 text-xs text-slate-300"
              >
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
                  #{idx + 1}
                </span>
                <p className="leading-snug">{finding}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verified Google Search Sources */}
      {content.sources && content.sources.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-mono font-semibold text-slate-400 tracking-wider uppercase flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>VERIFIED SEARCH GROUNDING SOURCES ({content.sources.length})</span>
            </div>
            <span className="text-[10px] text-emerald-400/80 font-mono">LIVE WEB DATA</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {content.sources.map((source, idx) => (
              <a
                key={idx}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-md bg-slate-900/50 hover:bg-slate-850 border border-slate-800/80 hover:border-cyan-500/40 transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 line-clamp-2 transition-colors">
                    {source.title || source.domain}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 flex-shrink-0 mt-0.5 transition-colors" />
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] font-mono text-slate-500 group-hover:text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
                  <span className="truncate">{source.domain || source.url}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Quick Compare Section */}
      {otherResearchWindows.length > 0 && (
        <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/70 space-y-2">
          <span className="text-xs font-mono font-semibold text-slate-400 uppercase">
            COMPARE WITH ACTIVE RESEARCH SCREENS:
          </span>
          <div className="flex flex-wrap gap-2">
            {otherResearchWindows.map((other) => (
              <button
                key={other.id}
                type="button"
                onClick={() => createComparisonWindow(content.query, other.title)}
                className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-cyan-950/70 border border-slate-700 hover:border-cyan-500 text-xs text-slate-300 hover:text-cyan-300 font-mono transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Compare vs "{other.title.slice(0, 24)}..."</span>
                <ArrowRight className="w-3 h-3 text-cyan-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Related Explorations (Click to create new research window) */}
      {content.relatedTopics && content.relatedTopics.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-mono font-semibold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
            <Search className="w-3 h-3 text-sky-400" />
            <span>RELATED RESEARCH VECTORS (CLICK TO EXPLORE)</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {content.relatedTopics.map((topic, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => createResearchWindow(topic, true)}
                className="px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/50 text-xs text-slate-300 hover:text-cyan-300 transition-all font-mono flex items-center gap-1 cursor-pointer"
              >
                <PlusCircle className="w-3 h-3 text-cyan-400" />
                <span>{topic}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* In-window Follow-up Q&A Thread */}
      {followUpAnswers.length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-slate-800">
          <span className="text-xs font-mono font-semibold text-cyan-400 uppercase">
            FOLLOW-UP RESEARCH THREAD
          </span>
          {followUpAnswers.map((item, i) => (
            <div key={i} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
              <div className="text-xs font-semibold text-cyan-300 flex items-center gap-1 font-mono">
                <span>Q:</span> {item.query}
              </div>
              <div className="text-xs text-slate-300 leading-relaxed font-sans">{item.answer}</div>
            </div>
          ))}
        </div>
      )}

      {/* Follow-up Question Input Form */}
      <form onSubmit={handleFollowUpSubmit} className="pt-2 sticky bottom-0 bg-slate-950/90 backdrop-blur-md pb-1">
        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800 focus-within:border-cyan-500 transition-colors">
          <input
            type="text"
            value={followUpText}
            onChange={(e) => setFollowUpText(e.target.value)}
            placeholder="Ask follow-up query on this research..."
            disabled={isFollowUpLoading}
            className="flex-1 bg-transparent px-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none font-sans"
          />
          <button
            type="submit"
            disabled={!followUpText.trim() || isFollowUpLoading}
            className="p-1.5 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white transition-colors cursor-pointer flex items-center justify-center"
          >
            {isFollowUpLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
