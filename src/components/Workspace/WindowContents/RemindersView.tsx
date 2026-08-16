import React, { useState } from 'react';
import { WorkspaceWindow } from '../../../types';
import { useSupercomputer } from '../../../context/SupercomputerContext';
import { Bell, CheckCircle, Clock, Trash2, Plus } from 'lucide-react';

interface Props {
  windowItem: WorkspaceWindow;
}

export const RemindersView: React.FC<Props> = () => {
  const { reminders, addReminder, completeReminder, deleteReminder } = useSupercomputer();
  const [newTitle, setNewTitle] = useState('');
  const [minutes, setMinutes] = useState('30');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addReminder(newTitle.trim(), parseInt(minutes, 10) || 30);
    setNewTitle('');
  };

  return (
    <div className="flex flex-col h-full space-y-4 text-slate-200">
      {/* Add reminder form */}
      <form onSubmit={handleAdd} className="flex gap-2 pb-3 border-b border-slate-800">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New reminder task..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
        />
        <select
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
        >
          <option value="5">in 5m</option>
          <option value="15">in 15m</option>
          <option value="30">in 30m</option>
          <option value="60">in 1 hr</option>
          <option value="120">in 2 hrs</option>
          <option value="1440">tomorrow</option>
        </select>
        <button
          type="submit"
          disabled={!newTitle.trim()}
          className="px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-mono flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </form>

      {/* Reminders List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {reminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 font-mono text-xs space-y-2">
            <Bell className="w-6 h-6 text-slate-600" />
            <span>NO ACTIVE REMINDERS SCHEDULED</span>
          </div>
        ) : (
          reminders.map((rem) => {
            const isDue = rem.dueTime <= Date.now();
            const timeStr = new Date(rem.dueTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            const dateStr = new Date(rem.dueTime).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={rem.id}
                className={`p-3 rounded-lg border flex items-center justify-between gap-2 transition-colors ${
                  rem.isCompleted
                    ? 'bg-slate-950/40 border-slate-850 opacity-60'
                    : isDue
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-750'
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => completeReminder(rem.id)}
                    className="cursor-pointer text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    <CheckCircle
                      className={`w-4 h-4 ${rem.isCompleted ? 'text-emerald-400' : 'text-slate-600'}`}
                    />
                  </button>
                  <div className="overflow-hidden">
                    <p
                      className={`text-xs font-medium truncate ${
                        rem.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'
                      }`}
                    >
                      {rem.title}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 mt-0.5">
                      <Clock className="w-3 h-3 text-cyan-400/70" />
                      <span>{timeStr}</span>
                      <span>•</span>
                      <span>{dateStr}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => deleteReminder(rem.id)}
                  className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Delete reminder"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
