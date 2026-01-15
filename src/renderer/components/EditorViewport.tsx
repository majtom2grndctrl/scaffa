import { useEffect, useRef } from 'react';
import { useSessionStore } from '../state/sessionStore';

/**
 * EditorViewport: Measures and reports the preview viewport bounds to the main process.
 *
 * v0 behavior:
 * - The first ready "app" session is displayed in the Editor View.
 * - This component measures its container and sends bounds to main.
 * - Main attaches the BrowserView to the measured region.
 */
export const EditorViewport = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sessions = useSessionStore((state) => state.sessions);

  // v0 policy: First app session that reaches ready state
  const activeSession = sessions.find((s) => s.type === 'app' && s.state === 'ready');

  useEffect(() => {
    if (!containerRef.current || !activeSession) {
      return;
    }

    const updateViewportBounds = () => {
      if (!containerRef.current || !activeSession) {
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();

      // Send bounds to main process
      window.scaffa.preview
        .setViewport({
          sessionId: activeSession.sessionId,
          bounds: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
        })
        .catch((error) => {
          console.error('[EditorViewport] Failed to set viewport bounds:', error);
        });
    };

    // Set initial bounds
    updateViewportBounds();

    // Observe resize
    const resizeObserver = new ResizeObserver(() => {
      updateViewportBounds();
    });

    resizeObserver.observe(containerRef.current);

    // Also listen for window resize (for DPI changes, window movement, etc.)
    window.addEventListener('resize', updateViewportBounds);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateViewportBounds);
    };
  }, [activeSession]);

  if (!activeSession) {
    return (
      <div className="flex items-center justify-center rounded-md border border-default bg-surface-panel p-6 text-center text-sm text-fg-muted">
        <p>No preview session active. Start an app session to see your application here.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full min-h-[400px] w-full rounded-md border border-default bg-surface-inset"
      data-preview-viewport
    >
      {/* The BrowserView will be overlaid here by the main process */}
    </div>
  );
};
