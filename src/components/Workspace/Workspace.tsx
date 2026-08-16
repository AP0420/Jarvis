import React from 'react';
import { useSupercomputer } from '../../context/SupercomputerContext';
import { FloatingWindow } from './FloatingWindow';

export const Workspace: React.FC = () => {
  const { windows } = useSupercomputer();

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {windows.map((w) => (
        <div key={w.id} className="pointer-events-auto">
          <FloatingWindow windowItem={w} />
        </div>
      ))}
    </div>
  );
};
