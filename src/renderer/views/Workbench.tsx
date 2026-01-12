import { ProjectGraphTable } from '../components/ProjectGraphTable';
import { PreviewSessionList } from '../components/PreviewSessionList';
import { InspectorPanel } from '../components/InspectorPanel';
import { RoutesPanel } from '../components/RoutesPanel';

export const Workbench = () => {
  return (
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
  );
};
