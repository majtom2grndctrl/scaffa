import { ProjectGraphTable } from '../components/ProjectGraphTable';
import { PreviewSessionList } from '../components/PreviewSessionList';
import { InspectorPanel } from '../components/InspectorPanel';
import { RoutesPanel } from '../components/RoutesPanel';
import { EditorViewport } from '../components/EditorViewport';

export const Workbench = () => {
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
