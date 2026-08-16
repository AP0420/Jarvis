import React, { useState } from 'react';
import { CodeContent, WorkspaceWindow } from '../../../types';
import { Copy, Check, Terminal, FileCode } from 'lucide-react';

interface Props {
  windowItem: WorkspaceWindow;
  content: CodeContent;
}

export const CodeView: React.FC<Props> = ({ content }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full space-y-2 text-slate-200">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
          <FileCode className="w-4 h-4 text-cyan-400" />
          <span>{content.fileName || `${content.language.toUpperCase()} SNIPPET`}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer text-xs font-mono flex items-center gap-1"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy Code'}</span>
        </button>
      </div>

      {content.explanation && (
        <p className="text-xs text-slate-400 leading-relaxed font-sans">{content.explanation}</p>
      )}

      <div className="flex-1 rounded-lg bg-slate-950 p-3 overflow-auto border border-slate-800 font-mono text-xs text-emerald-300 select-text leading-relaxed">
        <pre>{content.code}</pre>
      </div>
    </div>
  );
};
