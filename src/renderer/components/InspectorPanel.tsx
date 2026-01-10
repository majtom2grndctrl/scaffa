import { useMemo } from 'react';
import { z } from 'zod';

const inspectorSchema = z.object({
  instanceId: z.string(),
  editableProps: z.array(z.string()),
  inspectOnlyProps: z.array(z.string()),
});

type InspectorPanelProps = {
  selectedInstanceId: string | null;
};

export const InspectorPanel = ({ selectedInstanceId }: InspectorPanelProps) => {
  const inspectorData = useMemo(
    () =>
      inspectorSchema.parse({
        instanceId: selectedInstanceId ?? 'unselected',
        editableProps: ['label', 'variant', 'size'],
        inspectOnlyProps: ['onClick', 'icon'],
      }),
    [selectedInstanceId]
  );

  return (
    <div className="rounded-lg border border-default bg-surface-1 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
        Inspector
      </h2>
      <div className="mt-4 space-y-4 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wide text-fg-subtle">
            Instance
          </p>
          <p className="text-fg">{inspectorData.instanceId}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-fg-subtle">
            Editable Props
          </p>
          <ul className="mt-2 space-y-1 text-fg">
            {inspectorData.editableProps.map((prop) => (
              <li key={prop} className="rounded bg-surface-inset px-2 py-1">
                {prop}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-fg-subtle">
            Inspect-only Props
          </p>
          <ul className="mt-2 space-y-1 text-fg-muted">
            {inspectorData.inspectOnlyProps.map((prop) => (
              <li key={prop} className="rounded bg-surface-2 px-2 py-1">
                {prop}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-fg-subtle">
          Forms will be wired with @tanstack/form once edit controls land.
        </p>
      </div>
    </div>
  );
};
