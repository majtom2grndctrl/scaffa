import { useEffect, useRef } from "react";
import { ProjectGraphTable } from "../components/ProjectGraphTable";
import { PreviewSessionList } from "../components/PreviewSessionList";
import { InspectorPanel } from "../components/InspectorPanel";
import { RoutesPanel } from "../components/RoutesPanel";
import { EditorViewport } from "../components/EditorViewport";
import { useSessionStore } from "../state/sessionStore";

export const Workbench = () => {
  const { autoStartTarget, setAutoStartTarget } = useSessionStore((state) => ({
    autoStartTarget: state.autoStartTarget,
    setAutoStartTarget: state.setAutoStartTarget,
  }));

  // Track if we're already starting to prevent duplicate requests (StrictMode double-mount)
  const isStartingRef = useRef(false);

  useEffect(() => {
    // If there's a pending auto-start target (from the Launcher), start the session
    if (autoStartTarget && !isStartingRef.current) {
      console.log(
        "[Workbench] Auto-starting session for target:",
        autoStartTarget,
      );
      isStartingRef.current = true;

      window.skaffa.preview
        .startSession({ target: autoStartTarget })
        .catch((err) => {
          console.error("[Workbench] Failed to auto-start session:", err);
        })
        .finally(() => {
          // Clear the target so we don't try again on re-renders
          setAutoStartTarget(null);
          isStartingRef.current = false;
        });
    }
  }, [autoStartTarget, setAutoStartTarget]);

  return (
    <div className="flex h-full overflow-hidden bg-surface-app">
      {/* Left sidebar: project navigation */}
      <aside className="flex w-64 flex-col border-r border-default bg-surface-panel">
        <div className="flex flex-col gap-6 overflow-y-auto">
          <RoutesPanel />
          <ProjectGraphTable />
          <PreviewSessionList />
        </div>
      </aside>

      {/* Center workspace: primary editing surface */}
      <main className="flex flex-1 flex-col bg-surface-app">
        <EditorViewport />
      </main>

      {/* Right sidebar: inspectors + tools */}
      <aside className="flex w-80 flex-col border-l border-default bg-surface-panel">
        <div className="h-full overflow-y-auto">
          <InspectorPanel />
        </div>
      </aside>
    </div>
  );
};
