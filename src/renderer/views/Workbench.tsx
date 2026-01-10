import { ProjectGraphTable } from '../components/ProjectGraphTable';
import { PreviewSessionList } from '../components/PreviewSessionList';
import { InspectorPanel } from '../components/InspectorPanel';
import { useProjectSnapshotStore } from '../state/projectSnapshotStore';

export const Workbench = () => {
  const selectedInstanceId = useProjectSnapshotStore(
    (state) => state.selectedInstanceId
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <section className="space-y-6">
        <ProjectGraphTable />
        <PreviewSessionList />
      </section>
      <section>
        <InspectorPanel selectedInstanceId={selectedInstanceId} />
      </section>
    </div>
  );
};
