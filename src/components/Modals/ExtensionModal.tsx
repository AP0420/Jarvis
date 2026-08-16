import React, { useState } from 'react';
import { useSupercomputer } from '../../context/SupercomputerContext';
import { extensionBridge } from '../../services/extensionBridge';
import { X, Chrome, Download, Check, ShieldCheck, FileCode, ExternalLink, RefreshCw } from 'lucide-react';

export const ExtensionModal: React.FC = () => {
  const { isExtensionModalOpen, setExtensionModalOpen } = useSupercomputer();
  const [activeFile, setActiveFile] = useState<string>('manifest.json');
  const [downloaded, setDownloaded] = useState(false);

  if (!isExtensionModalOpen) return null;

  const files = extensionBridge.generateExtensionFiles();

  const handleDownloadAll = () => {
    // Generate individual downloadable files
    Object.entries(files).forEach(([filename, content]) => {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl h-[600px] rounded-2xl bg-slate-950 border border-sky-500/40 shadow-[0_0_50px_rgba(56,189,248,0.2)] flex flex-col overflow-hidden text-slate-200 font-sans">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-950 border border-sky-750 text-sky-400">
              <Chrome className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono text-slate-100 tracking-wider uppercase">
                JARVIS COMPANION BROWSER EXTENSION
              </h2>
              <p className="text-[10px] font-mono text-slate-400">
                Architectural bridge for tab manipulation, automated navigation, and page inspection
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setExtensionModalOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* File list */}
          <div className="w-48 border-r border-slate-800 bg-slate-950/90 p-2 space-y-1 font-mono text-xs">
            <div className="text-[10px] text-slate-500 px-2 py-1 uppercase">Extension Files</div>
            {Object.keys(files).map((fileName) => (
              <button
                key={fileName}
                type="button"
                onClick={() => setActiveFile(fileName)}
                className={`w-full text-left px-2.5 py-1.5 rounded flex items-center gap-2 transition-colors cursor-pointer ${
                  activeFile === fileName
                    ? 'bg-sky-950 text-sky-300 border border-sky-800 font-semibold'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{fileName}</span>
              </button>
            ))}

            <div className="pt-4 px-2 space-y-2">
              <div className="text-[10px] text-slate-500 font-mono">STATUS:</div>
              <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Ready to Load</span>
              </div>
            </div>
          </div>

          {/* Code Viewer & Setup Instructions */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col space-y-3 bg-slate-950/50">
            {/* Quick steps banner */}
            <div className="p-3 rounded-lg bg-sky-950/30 border border-sky-500/30 text-xs text-sky-200 space-y-1">
              <div className="font-semibold font-mono text-[11px] text-sky-400">
                HOW TO INSTALL IN CHROME OR EDGE:
              </div>
              <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-slate-300 font-sans">
                <li>Click <strong>Download Extension Files</strong> below into a folder.</li>
                <li>Open <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">chrome://extensions</code> or <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">edge://extensions</code>.</li>
                <li>Turn ON <strong>Developer Mode</strong> in the top right.</li>
                <li>Click <strong>Load Unpacked</strong> and select your folder!</li>
              </ol>
            </div>

            {/* Code view */}
            <div className="flex-1 rounded-lg bg-slate-900/90 border border-slate-800 p-3 overflow-auto font-mono text-xs text-emerald-300 select-text leading-relaxed">
              <div className="flex justify-between items-center text-[10px] text-slate-500 pb-2 mb-2 border-b border-slate-800">
                <span>FILE: {activeFile}</span>
                <span>{activeFile.endsWith('.json') ? 'JSON' : activeFile.endsWith('.js') ? 'JAVASCRIPT' : 'HTML/MARKDOWN'}</span>
              </div>
              <pre>{files[activeFile as keyof typeof files]}</pre>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Secure Web-Messaging Architecture (Manifest V3)</span>
          </div>

          <button
            type="button"
            onClick={handleDownloadAll}
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-sky-950 transition-colors"
          >
            {downloaded ? <Check className="w-4 h-4 text-emerald-300" /> : <Download className="w-4 h-4" />}
            <span>{downloaded ? 'Files Downloaded!' : 'Download Extension Files'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
