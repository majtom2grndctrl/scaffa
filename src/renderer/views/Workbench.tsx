import { useState } from 'react';
import { ProjectGraphTable } from '../components/ProjectGraphTable';
import { PreviewSessionList } from '../components/PreviewSessionList';
import { InspectorPanel } from '../components/InspectorPanel';
import { RoutesPanel } from '../components/RoutesPanel';
import { EditorViewport } from '../components/EditorViewport';
import { useInspectorStore } from '../state/inspectorStore';
import { Button } from '../components/ui/button';

export const Workbench = () => {
  const overrides = useInspectorStore((state) => state.overrides);
  const [saveStatus, setSaveStatus] = useState<{
    status: 'idle' | 'saving' | 'success' | 'error';
    message?: string;
  }>({ status: 'idle' });

  const handleSave = async () => {
    setSaveStatus({ status: 'saving', message: 'Saving overrides...' });

    try {
      const result = await window.scaffa.overrides.save({});
      if (result.ok) {
        setSaveStatus({
          status: 'success',
          message: `Saved ${result.appliedCount} override${result.appliedCount === 1 ? '' : 's'}.`,
        });
        return;
      }

      const firstFailure = result.failed[0];
      setSaveStatus({
        status: 'error',
        message: firstFailure
          ? `Save failed: ${firstFailure.result.message}`
          : 'Save failed.',
      });
    } catch (error) {
      setSaveStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Save failed.',
      });
    }
  };

  return (
    <div className="flex h-full flex-col bg-surface-app">
      {/* Top toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-default bg-surface-panel p-3">
        <Button
          type="button"
          onClick={handleSave}
          disabled={overrides.length === 0 || saveStatus.status === 'saving'}
        >
          {saveStatus.status === 'saving' ? 'Saving…' : 'Save to Disk'}
        </Button>
        {saveStatus.status !== 'idle' && saveStatus.message ? (
          <span
            className={
              saveStatus.status === 'error'
                ? 'text-xs text-warning'
                : 'text-xs text-fg-muted'
            }
          >
            {saveStatus.message}
          </span>
        ) : null}
        {overrides.length === 0 ? (
          <span className="text-xs text-fg-muted">No overrides to save.</span>
        ) : null}
      </div>

      {/* Docked IDE layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar: project navigation */}
        <aside className="flex w-64 flex-col border-r border-default bg-surface-panel">
          <div className="flex flex-col gap-6 overflow-y-auto p-4">
            <RoutesPanel />
            <ProjectGraphTable />
            <PreviewSessionList />
          </div>
        </aside>

        {/* Center workspace: primary editing surface */}
        <main className="flex flex-1 flex-col bg-surface-app">
          <div className="h-full p-4">
            <EditorViewport />
          </div>
        </main>

        {/* Right sidebar: inspectors + tools */}
        <aside className="flex w-80 flex-col border-l border-default bg-surface-panel">
          <div className="h-full overflow-y-auto p-4">
            <InspectorPanel />
          </div>
        </aside>
      </div>
    </div>
  );
};
