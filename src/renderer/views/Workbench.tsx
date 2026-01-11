import { ProjectGraphTable } from '../components/ProjectGraphTable';
import { PreviewSessionList } from '../components/PreviewSessionList';
import { InspectorPanel } from '../components/InspectorPanel';

export const Workbench = () => {
  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <section className="space-y-6">
        <ProjectGraphTable />
        <PreviewSessionList />
      </section>
      <section>
        <InspectorPanel />
      </section>
    </div>
  );
};
