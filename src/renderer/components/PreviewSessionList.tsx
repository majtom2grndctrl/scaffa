import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/virtual';

const sessions = Array.from({ length: 12 }, (_, index) => ({
  id: `session-${index + 1}`,
  label: index === 0 ? 'app' : `component-${index + 1}`,
  status: index === 0 ? 'Running' : 'Idle',
}));

export const PreviewSessionList = () => {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: sessions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
  });

  return (
    <div className="rounded-lg border border-default bg-surface-1 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
        Preview Sessions
      </h2>
      <div
        ref={parentRef}
        className="mt-4 h-56 overflow-auto rounded-md border border-subtle bg-surface-inset"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const session = sessions[virtualRow.index];
            return (
              <div
                key={session.id}
                className="flex items-center justify-between border-b border-subtle px-3 text-sm"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <span className="text-fg">{session.label}</span>
                <span className="text-xs uppercase tracking-wide text-fg-subtle">
                  {session.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
