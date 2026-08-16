import React from 'react';
import { ComparisonContent, WorkspaceWindow } from '../../../types';
import { useSupercomputer } from '../../../context/SupercomputerContext';
import { Scale, CheckCircle2, ArrowRight, Sparkles, FileText } from 'lucide-react';

interface Props {
  windowItem: WorkspaceWindow;
  content: ComparisonContent;
}

export const ComparisonView: React.FC<Props> = ({ content }) => {
  const { createNewWindow } = useSupercomputer();

  const handleExportNote = () => {
    createNewWindow('NOTES', `Comparison: ${content.topicA} vs ${content.topicB}`, {
      title: `${content.topicA} vs ${content.topicB}`,
      text: `# Comparison Analysis\n\n**Verdict:** ${content.verdict}\n\n### Matrix\n${content.matrix.map((m) => `- **${m.category}:** ${content.topicA} (${m.itemA}) vs ${content.topicB} (${m.itemB}) [Advantage: ${m.advantage}]`).join('\n')}\n\n### Recommendation\n${content.recommendation}`,
      tags: ['comparison', 'analysis'],
      updatedAt: Date.now(),
    });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto space-y-4 pr-1 text-slate-200 select-text">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
          <Scale className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold uppercase truncate">
            {content.topicA} <span className="text-slate-500">VS</span> {content.topicB}
          </span>
        </div>
        <button
          type="button"
          onClick={handleExportNote}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer text-xs flex items-center gap-1 font-mono"
        >
          <FileText className="w-3.5 h-3.5 text-sky-400" />
          <span>Save Note</span>
        </button>
      </div>

      {/* Executive Verdict Box */}
      <div className="p-3.5 rounded-lg bg-gradient-to-br from-cyan-950/40 via-slate-900/60 to-slate-950/80 border border-cyan-500/30">
        <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-cyan-400 mb-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>EXECUTIVE VERDICT</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">{content.verdict}</p>
      </div>

      {/* Comparative Matrix Table */}
      {content.matrix && content.matrix.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-mono font-semibold text-slate-400 uppercase">
            DIMENSIONAL COMPARISON MATRIX
          </div>
          <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/60">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <th className="p-2.5">DIMENSION</th>
                  <th className="p-2.5 text-cyan-400">{content.topicA}</th>
                  <th className="p-2.5 text-sky-400">{content.topicB}</th>
                  <th className="p-2.5 text-right">ADVANTAGE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {content.matrix.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-2.5 font-medium text-slate-300 font-mono text-[11px] bg-slate-950/40">
                      {row.category}
                    </td>
                    <td
                      className={`p-2.5 ${
                        row.advantage === 'A' ? 'text-cyan-300 font-medium bg-cyan-950/20' : 'text-slate-400'
                      }`}
                    >
                      {row.itemA}
                    </td>
                    <td
                      className={`p-2.5 ${
                        row.advantage === 'B' ? 'text-sky-300 font-medium bg-sky-950/20' : 'text-slate-400'
                      }`}
                    >
                      {row.itemB}
                    </td>
                    <td className="p-2.5 text-right font-mono text-[10px]">
                      {row.advantage === 'A' && (
                        <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                          {content.topicA}
                        </span>
                      )}
                      {row.advantage === 'B' && (
                        <span className="px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/60">
                          {content.topicB}
                        </span>
                      )}
                      {row.advantage === 'EQUAL' && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">TIE / EQUAL</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Key Differences */}
      {content.keyDifferences && content.keyDifferences.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-mono font-semibold text-slate-400 uppercase">
            KEY ARCHITECTURAL DIFFERENCES
          </div>
          <div className="space-y-1.5">
            {content.keyDifferences.map((diff, i) => (
              <div
                key={i}
                className="p-2.5 rounded bg-slate-900/40 border border-slate-800 flex items-start gap-2 text-xs text-slate-300"
              >
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>{diff}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation */}
      {content.recommendation && (
        <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold font-mono text-[11px] mb-0.5 text-emerald-400">
              STRATEGIC RECOMMENDATION
            </div>
            <p className="text-slate-300 font-sans">{content.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
};
