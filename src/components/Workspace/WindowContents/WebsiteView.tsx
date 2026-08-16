import React, { useState } from 'react';
import { WebsiteContent, WorkspaceWindow } from '../../../types';
import { ExternalLink, Globe, Shield, RefreshCw, Maximize2, Sparkles, Copy, Check } from 'lucide-react';
import { useSupercomputer } from '../../../context/SupercomputerContext';

interface Props {
  windowItem: WorkspaceWindow;
  content: WebsiteContent;
}

export const WebsiteView: React.FC<Props> = ({ content }) => {
  const { createResearchWindow } = useSupercomputer();
  const [copied, setCopied] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  const handleOpenTab = () => {
    window.open(content.url, '_blank', 'noopener,noreferrer');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResearchSite = () => {
    createResearchWindow(`Analyze and explain the latest developments and features on ${content.title || content.url}`, true);
  };

  // Determine domain
  let domain = 'Web';
  try {
    const u = new URL(content.url);
    domain = u.hostname.replace(/^www\./, '');
  } catch {
    domain = content.title || 'Web';
  }

  return (
    <div className="flex flex-col h-full justify-between space-y-2 text-slate-200">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2 overflow-hidden">
          <Globe className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
          <span className="font-semibold text-slate-100 truncate">{content.title || domain}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer text-[11px] flex items-center gap-1"
            title="Copy URL"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
          <button
            type="button"
            onClick={handleResearchSite}
            className="p-1 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 transition-colors cursor-pointer text-[10px] flex items-center gap-1"
            title="AI Research on this website"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>AI Intel</span>
          </button>
        </div>
      </div>

      {/* Screen Frame / Preview Area */}
      <div className="flex-1 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 relative flex flex-col">
        {!iframeError ? (
          <iframe
            src={content.url}
            title={content.title || 'Web Preview'}
            className="w-full h-full border-0 bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            onError={() => setIframeError(true)}
          />
        ) : null}

        {/* Fallback Overlay / Direct Link Info Card */}
        {iframeError && (
          <div className="absolute inset-0 p-4 bg-gradient-to-b from-slate-900 via-slate-950 to-black flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center shadow-lg shadow-cyan-950">
              <Globe className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-mono uppercase">{content.title || domain}</h3>
              <p className="text-xs text-cyan-300 font-mono break-all mt-1">{content.url}</p>
            </div>
            <p className="text-xs text-slate-400 max-w-xs font-sans">
              Launched in active browser tab. Click below to focus or re-open anytime.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Actions Bar */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleOpenTab}
          className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-cyan-950 cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Launch in New Tab</span>
        </button>

        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono text-emerald-400">
          <Shield className="w-3 h-3" />
          <span>LIVE TAB OPEN</span>
        </div>
      </div>
    </div>
  );
};
