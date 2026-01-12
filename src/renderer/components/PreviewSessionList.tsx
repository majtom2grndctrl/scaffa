import { useRef, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/virtual';
import { useSessionStore } from '../state/sessionStore';
import { StartPreviewDialog } from './StartPreviewDialog';
import { PreviewHint } from './PreviewHint';
import type { PreviewSessionTarget } from '../../shared/index.js';

export const PreviewSessionList = () => {
  const parentRef = useRef<HTMLDivElement>(null);
  const sessions = useSessionStore((state) => state.sessions);
  const addSession = useSessionStore((state) => state.addSession);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Show hint when first session becomes ready
  useEffect(() => {
    const hasReadySession = sessions.some((s) => s.state === 'ready');
    if (hasReadySession && !showHint) {
      setShowHint(true);
    }
  }, [sessions, showHint]);

  const rowVirtualizer = useVirtualizer({
    count: sessions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
  });

  const handleStartSession = async (target: PreviewSessionTarget) => {
    try {
      const response = await window.scaffa.preview.startSession({ target });
      addSession(response.sessionId, target.type);
      console.log('[PreviewSessionList] Started session:', response.sessionId);
    } catch (error) {
      console.error('[PreviewSessionList] Failed to start session:', error);
      throw error;
    }
  };

  const handleStopSession = async (sessionId: string) => {
    try {
      await window.scaffa.preview.stopSession({ sessionId });
      console.log('[PreviewSessionList] Stopped session:', sessionId);
    } catch (error) {
      console.error('[PreviewSessionList] Failed to stop session:', error);
    }
  };

  // Get status label and color
  const getStatusInfo = (state: string) => {
    switch (state) {
      case 'creating':
        return { label: 'Starting', color: 'text-yellow-500' };
      case 'ready':
        return { label: 'Ready', color: 'text-green-500' };
      case 'error':
        return { label: 'Error', color: 'text-red-500' };
      case 'stopped':
        return { label: 'Stopped', color: 'text-fg-subtle' };
      default:
        return { label: 'Unknown', color: 'text-fg-subtle' };
    }
  };

  return (
    <>
      <PreviewHint show={showHint} onComplete={() => setShowHint(false)} />
      <div className="rounded-lg border border-default bg-surface-1 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
            Preview Sessions
          </h2>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="rounded-md border border-accent bg-accent px-3 py-1 text-xs font-medium text-white hover:bg-accent/90"
          >
            Start Session
          </button>
        </div>
        <div
          ref={parentRef}
          className="mt-4 h-56 overflow-auto rounded-md border border-subtle bg-surface-inset"
        >
          {sessions.length === 0 ? (
            <div className="flex h-full items-center justify-center p-4 text-center">
              <div>
                <p className="text-sm text-fg-subtle">No active sessions</p>
                <p className="mt-1 text-xs text-fg-subtle">
                  Click "Start Session" to begin
                </p>
              </div>
            </div>
          ) : (
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const session = sessions[virtualRow.index];
                const statusInfo = getStatusInfo(session.state);
                return (
                  <div
                    key={session.sessionId}
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
                    <div className="flex items-center gap-2">
                      <span className="text-fg">{session.type}</span>
                      {session.error && (
                        <span
                          className="text-xs text-red-500"
                          title={session.error}
                        >
                          ({session.error})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs uppercase tracking-wide ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                      {session.state === 'ready' && (
                        <button
                          onClick={() => handleStopSession(session.sessionId)}
                          className="rounded px-2 py-0.5 text-xs text-fg-subtle hover:bg-surface-2 hover:text-fg"
                          title="Stop session"
                        >
                          Stop
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <StartPreviewDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onStartSession={handleStartSession}
      />
    </>
  );
};
