import React, { useState, useRef, useEffect, useCallback } from 'react';
import { WorkspaceWindow } from '../../types';
import { useSupercomputer } from '../../context/SupercomputerContext';
import {
  Pin,
  Minus,
  Maximize2,
  Minimize2,
  X,
  Sparkles,
  Scale,
  Globe,
  FileText,
  FileCode,
  Bell,
  Activity,
  Copy,
  Layers,
} from 'lucide-react';
import { ResearchView } from './WindowContents/ResearchView';
import { ComparisonView } from './WindowContents/ComparisonView';
import { WebsiteView } from './WindowContents/WebsiteView';
import { NotesView } from './WindowContents/NotesView';
import { RemindersView } from './WindowContents/RemindersView';
import { CodeView } from './WindowContents/CodeView';
import { SystemMonitorView } from './WindowContents/SystemMonitorView';

interface Props {
  windowItem: WorkspaceWindow;
}

export const FloatingWindow: React.FC<Props> = ({ windowItem }) => {
  const {
    activeWindowId,
    focusWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    pinWindow,
    updateWindowPosition,
    updateWindowSize,
    createNewWindow,
  } = useSupercomputer();

  const isFocused = activeWindowId === windowItem.id;
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number }>({
    x: 0,
    y: 0,
    posX: 0,
    posY: 0,
  });

  const resizeStartRef = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  // Drag handlers
  const handleMouseDownHeader = (e: React.MouseEvent) => {
    if (windowItem.isMaximized) return;
    focusWindow(windowItem.id);
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: windowItem.position.x,
      posY: windowItem.position.y,
    };
    e.preventDefault();
  };

  const handleMouseDownResize = (e: React.MouseEvent) => {
    if (windowItem.isMaximized) return;
    focusWindow(windowItem.id);
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: windowItem.size.width,
      height: windowItem.size.height,
    };
    e.stopPropagation();
    e.preventDefault();
  };

  // Window event listeners for drag/resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        const newX = Math.max(0, Math.min(window.innerWidth - 120, dragStartRef.current.posX + dx));
        const newY = Math.max(20, Math.min(window.innerHeight - 100, dragStartRef.current.posY + dy));
        updateWindowPosition(windowItem.id, { x: newX, y: newY });
      } else if (isResizing) {
        const dw = e.clientX - resizeStartRef.current.x;
        const dh = e.clientY - resizeStartRef.current.y;
        const newWidth = Math.max(340, Math.min(window.innerWidth - 40, resizeStartRef.current.width + dw));
        const newHeight = Math.max(240, Math.min(window.innerHeight - 80, resizeStartRef.current.height + dh));
        updateWindowSize(windowItem.id, { width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, windowItem.id, updateWindowPosition, updateWindowSize]);

  // Render Icon according to Window Type
  const renderWindowIcon = () => {
    switch (windowItem.type) {
      case 'RESEARCH':
        return <Sparkles className="w-3.5 h-3.5 text-cyan-400" />;
      case 'COMPARISON':
        return <Scale className="w-3.5 h-3.5 text-sky-400" />;
      case 'WEBSITE':
        return <Globe className="w-3.5 h-3.5 text-emerald-400" />;
      case 'NOTES':
        return <FileText className="w-3.5 h-3.5 text-amber-400" />;
      case 'CODE':
        return <FileCode className="w-3.5 h-3.5 text-indigo-400" />;
      case 'REMINDER':
        return <Bell className="w-3.5 h-3.5 text-rose-400" />;
      case 'SYSTEM_MONITOR':
        return <Activity className="w-3.5 h-3.5 text-teal-400" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  // Render Window Inner Content
  const renderContent = () => {
    switch (windowItem.data.type) {
      case 'RESEARCH':
        return <ResearchView windowItem={windowItem} content={windowItem.data.content} />;
      case 'COMPARISON':
        return <ComparisonView windowItem={windowItem} content={windowItem.data.content} />;
      case 'WEBSITE':
        return <WebsiteView windowItem={windowItem} content={windowItem.data.content} />;
      case 'NOTES':
        return <NotesView windowItem={windowItem} content={windowItem.data.content} />;
      case 'CODE':
        return <CodeView windowItem={windowItem} content={windowItem.data.content} />;
      case 'REMINDER':
        return <RemindersView windowItem={windowItem} />;
      case 'SYSTEM_MONITOR':
        return <SystemMonitorView windowItem={windowItem} />;
      default:
        return <div className="p-4 text-xs font-mono text-slate-400">Loading module...</div>;
    }
  };

  const handleDuplicate = () => {
    createNewWindow(
      windowItem.type,
      `${windowItem.title} (Copy)`,
      (windowItem.data as any).content,
      { x: windowItem.position.x + 30, y: windowItem.position.y + 30 },
      windowItem.size
    );
  };

  // Minimized Window Bar Representation
  if (windowItem.isMinimized) {
    return (
      <div
        onClick={() => focusWindow(windowItem.id)}
        className="fixed bottom-20 p-2 rounded-lg bg-slate-900/90 border border-slate-700/80 hover:border-cyan-500/80 shadow-2xl flex items-center gap-2 cursor-pointer transition-all hover:scale-105 backdrop-blur-md"
        style={{
          left: `${windowItem.position.x}px`,
          zIndex: windowItem.zIndex,
        }}
      >
        {renderWindowIcon()}
        <span className="text-xs font-mono text-slate-200 truncate max-w-[140px]">
          {windowItem.title}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            minimizeWindow(windowItem.id);
          }}
          className="text-slate-400 hover:text-cyan-400 p-0.5"
          title="Restore window"
        >
          <Maximize2 className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            closeWindow(windowItem.id);
          }}
          className="text-slate-400 hover:text-rose-400 p-0.5"
          title="Close window"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  // Active / Normal / Maximized Window
  const windowStyle: React.CSSProperties = windowItem.isMaximized
    ? {
        position: 'fixed',
        left: '20px',
        top: '60px',
        width: 'calc(100vw - 40px)',
        height: 'calc(100vh - 160px)',
        zIndex: windowItem.zIndex,
      }
    : {
        position: 'fixed',
        left: `${windowItem.position.x}px`,
        top: `${windowItem.position.y}px`,
        width: `${windowItem.size.width}px`,
        height: `${windowItem.size.height}px`,
        zIndex: windowItem.zIndex,
      };

  return (
    <div
      onClick={() => focusWindow(windowItem.id)}
      style={windowStyle}
      className={`rounded-xl bg-slate-950/85 backdrop-blur-xl border transition-shadow duration-200 flex flex-col overflow-hidden select-none ${
        isFocused
          ? 'border-cyan-500/60 shadow-[0_0_30px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/30'
          : 'border-slate-800/80 shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:border-slate-700'
      }`}
    >
      {/* Corner Futuristic Grid Decals */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-400/70 pointer-events-none" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyan-400/70 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyan-400/70 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-400/70 pointer-events-none" />

      {/* Header Bar */}
      <div
        onMouseDown={handleMouseDownHeader}
        className={`px-3 py-2 flex items-center justify-between border-b cursor-grab active:cursor-grabbing transition-colors ${
          isFocused
            ? 'bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border-cyan-500/40 text-slate-100'
            : 'bg-slate-900/60 border-slate-800 text-slate-400'
        }`}
      >
        {/* Title and Icon */}
        <div className="flex items-center gap-2 overflow-hidden mr-2">
          {renderWindowIcon()}
          <span className="text-xs font-mono font-semibold tracking-wide truncate">
            {windowItem.title}
          </span>
          {windowItem.isPinned && (
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
              PINNED
            </span>
          )}
        </div>

        {/* Window Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDuplicate();
            }}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
            title="Duplicate screen"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              pinWindow(windowItem.id);
            }}
            className={`p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer ${
              windowItem.isPinned ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
            title={windowItem.isPinned ? 'Unpin window' : 'Pin window'}
          >
            <Pin className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              minimizeWindow(windowItem.id);
            }}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Minimize window"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              maximizeWindow(windowItem.id);
            }}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title={windowItem.isMaximized ? 'Restore window size' : 'Maximize window'}
          >
            {windowItem.isMaximized ? (
              <Minimize2 className="w-3 h-3" />
            ) : (
              <Maximize2 className="w-3 h-3" />
            )}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              closeWindow(windowItem.id);
            }}
            className="p-1 rounded hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            title="Close window"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 p-3.5 overflow-hidden flex flex-col bg-slate-950/50">
        {renderContent()}
      </div>

      {/* Resize Handle (Bottom-Right) */}
      {!windowItem.isMaximized && (
        <div
          onMouseDown={handleMouseDownResize}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5 pointer-events-auto"
          title="Drag to resize"
        >
          <div className="w-2 h-2 border-r-2 border-b-2 border-cyan-500/60" />
        </div>
      )}
    </div>
  );
};
