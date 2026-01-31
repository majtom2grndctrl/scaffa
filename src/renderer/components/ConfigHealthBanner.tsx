import { useState, useEffect } from 'react';
import type { GetConfigResponse } from '../../main/ipc/config.js';

/**
 * ConfigHealthBanner
 *
 * Displays a non-blocking banner when there are config validation errors
 * or module activation failures.
 *
 * Design goals:
 * - Visible but not obtrusive
 * - Actionable error messages
 * - Dismissible but persistent (shows on every reload until fixed)
 */
export const ConfigHealthBanner = () => {
  const [configHealth, setConfigHealth] = useState<GetConfigResponse | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Fetch config health on mount
    const fetchConfigHealth = async () => {
      try {
        const result = await window.skaffa.config.get({});
        setConfigHealth(result);
      } catch (error) {
        console.error('[ConfigHealthBanner] Failed to fetch config health:', error);
      }
    };

    void fetchConfigHealth();
  }, []);

  // Don't render if dismissed or no issues
  if (isDismissed || !configHealth) {
    return null;
  }

  const hasConfigError = configHealth.loadError !== null;
  const failedModules = configHealth.moduleActivationStatuses.filter(
    (status) => status.status === 'failed'
  );
  const hasModuleErrors = failedModules.length > 0;

  // Don't render if no errors
  if (!hasConfigError && !hasModuleErrors) {
    return null;
  }

  return (
    <div className="border-b border-red-500/20 bg-red-500/10 px-4 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-red-500">
              Configuration Health Issues
            </span>
            <span className="text-xs text-fg-muted">
              (App may not work as expected)
            </span>
          </div>

          {/* Config validation error */}
          {hasConfigError && configHealth.loadError && (
            <div className="mt-2 rounded border border-red-500/30 bg-red-500/5 p-2">
              <p className="text-xs font-medium text-red-500">
                Config Validation Error ({configHealth.loadError.code})
              </p>
              <p className="mt-1 text-xs text-fg font-mono">
                {configHealth.loadError.message}
              </p>
              <p className="mt-2 text-xs text-fg-muted">
                → Fix the error in <code className="font-mono">skaffa.config.js</code> and reload
                the workspace.
              </p>
            </div>
          )}

          {/* Module activation errors */}
          {hasModuleErrors && (
            <div className="mt-2 space-y-2">
              <p className="text-xs font-medium text-red-500">
                {failedModules.length} module{failedModules.length !== 1 ? 's' : ''} failed to
                activate:
              </p>
              {failedModules.map((moduleStatus) => (
                <div
                  key={moduleStatus.moduleId}
                  className="rounded border border-red-500/30 bg-red-500/5 p-2"
                >
                  <p className="text-xs font-medium text-fg">
                    <span className="font-mono">{moduleStatus.moduleId}</span>
                  </p>
                  {moduleStatus.error && (
                    <>
                      <p className="mt-1 text-xs text-fg font-mono">
                        {moduleStatus.error.message}
                      </p>
                      {moduleStatus.error.stack && (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-xs text-fg-muted hover:text-fg">
                            Show stack trace
                          </summary>
                          <pre className="mt-1 max-h-32 overflow-auto rounded bg-surface-inset p-2 text-[10px] text-fg-muted font-mono">
                            {moduleStatus.error.stack}
                          </pre>
                        </details>
                      )}
                    </>
                  )}
                  <p className="mt-2 text-xs text-fg-muted">
                    → Check the module path in <code className="font-mono">skaffa.config.js</code>{' '}
                    and ensure the module exports an <code className="font-mono">activate</code>{' '}
                    function.
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dismiss button */}
        <button
          onClick={() => setIsDismissed(true)}
          className="text-xs text-fg-muted hover:text-fg"
          aria-label="Dismiss banner"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
