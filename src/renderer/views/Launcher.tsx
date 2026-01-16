import { useMemo, useState } from 'react';
import { useWorkspaceStore } from '../state/workspaceStore';
import { useSessionStore } from '../state/sessionStore';
import { StartPreviewDialog } from '../components/StartPreviewDialog';
import type { WorkspaceInfo } from '../../shared/index.js';

export const Launcher = () => {
  const {
    recents,
    error,
    isLoading,
    clearError,
    pickWorkspace,
    activateWorkspace,
    cancelPick,
    openDemo,
    openRecent,
    removeRecent,
  } = useWorkspaceStore((state) => ({
    recents: state.recents,
    error: state.error,
    isLoading: state.isLoading,
    clearError: state.clearError,
    pickWorkspace: state.pickWorkspace,
    activateWorkspace: state.activateWorkspace,
    cancelPick: state.cancelPick,
    openDemo: state.openDemo,
    openRecent: state.openRecent,
    removeRecent: state.removeRecent,
  }));

  const setAutoStartTarget = useSessionStore((state) => state.setAutoStartTarget);

  const [isBusy, setIsBusy] = useState(false);
  
  // State for the configuration flow
  const [isConfiguringSession, setIsConfiguringSession] = useState(false);

  const showDemo = import.meta.env.DEV;

  const errorPath = useMemo(() => {
    if (!error?.details || typeof error.details !== 'object') {
      return null;
    }
    const details = error.details as { path?: unknown };
    return typeof details.path === 'string' ? details.path : null;
  }, [error]);

  const errorRecent = errorPath
    ? recents.find((workspace) => workspace.path === errorPath)
    : null;

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    []
  );

  const formatLastOpened = (value?: string) => {
    if (!value) return 'Unknown';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return formatter.format(date);
  };

  const handleAction = async (action: () => Promise<void>) => {
    setIsBusy(true);
    try {
      await action();
    } finally {
      setIsBusy(false);
    }
  };

  // Intercept Open Workspace
  const handleOpenWorkspace = async () => {
    setIsBusy(true);
    try {
      const workspace = await pickWorkspace();
      if (workspace) {
        setIsConfiguringSession(true);
      }
    } finally {
      setIsBusy(false);
    }
  };

  // Handle Session Configuration Confirmation
  const handleStartSession = async (target: {
    type: 'app';
    url?: string;
    launcherId?: string;
    launcherOptions?: Record<string, unknown>;
  }) => {
    // 1. Set the auto-start target for the workbench
    setAutoStartTarget(target);
    
    // 2. Activate the workspace (promotes staging -> current -> transitions route)
    activateWorkspace();
    
    // Reset local state
    setIsConfiguringSession(false);
  };

  const handleCancelSession = () => {
    cancelPick();
    setIsConfiguringSession(false);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Session Configuration Dialog */}
      <StartPreviewDialog
        isOpen={isConfiguringSession}
        onClose={handleCancelSession}
        onStartSession={handleStartSession}
      />

      {error ? (
        <div className="rounded-lg border border-danger bg-danger-subtle px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-danger-strong">
                Workspace failed to open
              </p>
              <p className="mt-1 text-xs text-fg">{error.message}</p>
            </div>
            <div className="flex items-center gap-2">
              {errorRecent ? (
                <button
                  type="button"
                  onClick={() => removeRecent(errorRecent.path)}
                  className="rounded border border-danger px-2 py-1 text-xs text-danger-strong hover:bg-danger-subtle"
                >
                  Remove from recents
                </button>
              ) : null}
              <button
                type="button"
                onClick={clearError}
                className="rounded border border-subtle px-2 py-1 text-xs text-fg-muted hover:text-fg"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-lg border border-default bg-surface-panel p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
                Launcher
              </p>
              <h2 className="mt-2 text-xl font-semibold text-fg">
                Open a workspace to begin
              </h2>
              <p className="mt-2 text-sm text-fg-subtle">
                Scaffa loads your project config, starts the extension host, and
                drops you into the Workbench.
              </p>
            </div>
            <div className="rounded-md border border-subtle bg-surface-inset px-3 py-2 text-xs text-fg-subtle">
              <p className="font-mono">scaffa.config.js</p>
              <p className="mt-1">Required at workspace root</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleOpenWorkspace}
              disabled={isBusy}
              className="rounded-md border border-default bg-surface-2 px-4 py-2 text-sm font-medium text-fg hover:border-strong hover:bg-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              Open Workspace
            </button>
            {showDemo ? (
              <button
                type="button"
                onClick={() => handleAction(openDemo)}
                disabled={isBusy}
                className="rounded-md border border-subtle bg-surface-inset px-4 py-2 text-sm font-medium text-fg-muted hover:text-fg disabled:cursor-not-allowed disabled:opacity-60"
              >
                Open Demo Workspace
              </button>
            ) : null}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-subtle bg-surface-inset p-3">
              <p className="text-xs font-semibold text-fg">What gets loaded</p>
              <ul className="mt-2 space-y-1 text-xs text-fg-subtle">
                <li>Extensions + registries</li>
                <li>Preview launchers</li>
                <li>Override persistence</li>
              </ul>
            </div>
            <div className="rounded-md border border-subtle bg-surface-inset p-3">
              <p className="text-xs font-semibold text-fg">Need to prep?</p>
              <p className="mt-2 text-xs text-fg-subtle">
                Scaffa loads <span className="font-mono">scaffa.config.js</span>{' '}
                at runtime. You can author in{' '}
                <span className="font-mono">scaffa.config.ts</span>, but compile
                it to <span className="font-mono">scaffa.config.js</span>.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-default bg-surface-panel p-6">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
              Recent Workspaces
            </h3>
            {isLoading ? (
              <span className="text-xs text-fg-subtle">Loading...</span>
            ) : null}
          </div>

          <div className="mt-4 space-y-2">
            {recents.length === 0 && !isLoading ? (
              <div className="rounded-md border border-subtle bg-surface-inset p-4 text-center text-xs text-fg-subtle">
                No recent workspaces yet.
              </div>
            ) : null}

            {recents.map((workspace) => (
              <div
                key={workspace.path}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-subtle bg-surface-inset px-3 py-2"
              >
                <button
                  type="button"
                  onClick={() => handleAction(() => openRecent(workspace.path))}
                  disabled={isBusy}
                  className="min-w-0 flex-1 text-left disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <p className="truncate text-sm font-medium text-fg">
                    {workspace.name}
                  </p>
                  <p className="truncate text-xs text-fg-subtle">
                    {workspace.path}
                  </p>
                  <p className="mt-1 text-[11px] text-fg-subtle">
                    Last opened {formatLastOpened(workspace.lastOpened)}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => removeRecent(workspace.path)}
                  disabled={isBusy}
                  className="rounded border border-subtle px-2 py-1 text-xs text-fg-muted hover:text-fg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
