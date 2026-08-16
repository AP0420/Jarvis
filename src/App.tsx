import React from 'react';
import { SupercomputerProvider } from './context/SupercomputerContext';
import { CentralCore } from './components/AICore/CentralCore';
import { Workspace } from './components/Workspace/Workspace';
import { CommandBar } from './components/CommandBar/CommandBar';
import { GestureHUD } from './components/Gestures/GestureHUD';
import { TelemetryOverlay } from './components/HUD/TelemetryOverlay';
import { CommandCenterModal } from './components/Modals/CommandCenterModal';
import { ExtensionModal } from './components/Modals/ExtensionModal';
import { PeopleModal } from './components/Modals/PeopleModal';

export function App() {
  return (
    <SupercomputerProvider>
      <main className="relative w-screen h-screen overflow-hidden bg-[#030712] text-slate-100 flex flex-col justify-between select-none">
        {/* Ambient HUD Corner Telemetry */}
        <TelemetryOverlay />

        {/* Central Futuristic AI Core */}
        <CentralCore />

        {/* Multi-Window Floating Workspace Layer */}
        <Workspace />

        {/* Real Computer Vision Gesture Tracking HUD */}
        <GestureHUD />

        {/* Bottom Supercomputer Command Hub */}
        <CommandBar />

        {/* Modals */}
        <CommandCenterModal />
        <ExtensionModal />
        <PeopleModal />
      </main>
    </SupercomputerProvider>
  );
}

export default App;
