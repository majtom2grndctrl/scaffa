import { useState } from 'react';
import { ProjectGraphTable } from '../components/ProjectGraphTable';
import { PreviewSessionList } from '../components/PreviewSessionList';
import { InspectorPanel } from '../components/InspectorPanel';
import { RoutesPanel } from '../components/RoutesPanel';
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
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
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-6">
          <RoutesPanel />
          <ProjectGraphTable />
          <PreviewSessionList />
        </section>
        <section>
          <InspectorPanel />
        </section>
      </div>
    </div>
  );
};
