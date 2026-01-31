import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { PreviewLauncherDescriptor } from "../../shared/index.js";

interface StartPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onStartSession: (target: {
    type: "app";
    url?: string;
    launcherId?: string;
    launcherOptions?: Record<string, unknown>;
  }) => Promise<void>;
}

type PreviewMode = "attached" | "managed";

export const StartPreviewDialog = ({
  isOpen,
  onClose,
  onStartSession,
}: StartPreviewDialogProps) => {
  const [mode, setMode] = useState<PreviewMode>("managed");
  const [url, setUrl] = useState("http://localhost:5173");
  const [selectedLauncher, setSelectedLauncher] = useState<string>("");
  const [launchers, setLaunchers] = useState<PreviewLauncherDescriptor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load available launchers when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadLaunchers();
    }
  }, [isOpen]);

  const loadLaunchers = async () => {
    try {
      const response = await window.skaffa.preview.getLaunchers({});
      setLaunchers(response.launchers);

      // Auto-select first launcher if available
      if (response.launchers.length > 0 && !selectedLauncher) {
        setSelectedLauncher(response.launchers[0].id);
      }
    } catch (error) {
      console.error("[StartPreviewDialog] Failed to load launchers:", error);
      setError("Failed to load available launchers");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === "attached") {
        // Validate URL
        try {
          new URL(url);
        } catch {
          setError(
            "Invalid URL. Must include protocol (http:// or https://). Example: http://localhost:5173",
          );
          setIsLoading(false);
          return;
        }

        await onStartSession({
          type: "app",
          url,
        });
      } else {
        // Managed mode
        if (!selectedLauncher) {
          setError("Please select a launcher");
          setIsLoading(false);
          return;
        }

        await onStartSession({
          type: "app",
          launcherId: selectedLauncher,
          launcherOptions: {},
        });
      }

      // Success - close dialog
      onClose();
    } catch (error) {
      console.error("[StartPreviewDialog] Failed to start session:", error);
      setError(
        error instanceof Error
          ? error.message
          : mode === "attached"
            ? "Failed to start attached preview"
            : "Failed to start managed preview",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-default bg-surface-overlay p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-fg">Start Preview Session</h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Main Inputs based on Mode */}
          {mode === "attached" && (
            <div>
              <label
                htmlFor="url"
                className="mb-2 block text-sm font-medium text-fg-muted"
              >
                Preview URL
              </label>
              <input
                id="url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="http://localhost:5173"
                disabled={isLoading}
                className="w-full rounded-md border border-subtle bg-input px-3 py-2 text-sm text-fg placeholder-fg-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="mt-1 text-xs text-fg-subtle">
                Enter the URL of your running dev server (must include http://
                or https://)
              </p>
            </div>
          )}

          {mode === "managed" && (
            <div>
              <label
                htmlFor="launcher"
                className="mb-2 block text-sm font-medium text-fg-muted"
              >
                Launcher
              </label>
              {launchers.length === 0 ? (
                <div className="rounded-md border border-subtle bg-surface-inset p-3 text-sm text-fg-subtle">
                  No launchers available. Install a launcher module to use
                  managed mode.
                </div>
              ) : (
                <>
                  <select
                    id="launcher"
                    value={selectedLauncher}
                    onChange={(e) => setSelectedLauncher(e.target.value)}
                    disabled={isLoading}
                    className="w-full rounded-md border border-subtle bg-input px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {launchers.map((launcher) => (
                      <option key={launcher.id} value={launcher.id}>
                        {launcher.displayName}
                      </option>
                    ))}
                  </select>
                  {selectedLauncher && (
                    <p className="mt-1 text-xs text-fg-subtle">
                      {launchers.find((l) => l.id === selectedLauncher)
                        ?.description ||
                        "Skaffa will start and manage this dev server"}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Advanced Options Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1 text-xs font-medium text-fg-muted hover:text-fg"
            >
              {showAdvanced ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              Advanced Options
            </button>

            {/* Advanced Content */}
            {showAdvanced && (
              <div className="mt-2 space-y-4 rounded-md border border-subtle bg-surface-inset p-3">
                {/* Mode Selection */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-fg-muted">
                    Preview Mode
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMode("attached")}
                      className={`flex-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                        mode === "attached"
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-subtle bg-surface-panel text-fg-subtle hover:border-default hover:text-fg"
                      }`}
                    >
                      Attached
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("managed")}
                      disabled={launchers.length === 0}
                      className={`flex-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        mode === "managed"
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-subtle bg-surface-panel text-fg-subtle hover:border-default hover:text-fg"
                      }`}
                    >
                      Managed
                    </button>
                  </div>
                  <p className="mt-1 text-[10px] text-fg-subtle">
                    {mode === "attached"
                      ? "Connect to an existing dev server you started manually."
                      : "Let Skaffa start and manage the dev server for you."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="rounded-md border border-subtle bg-surface-inset px-4 py-2 text-sm font-medium text-fg-subtle hover:border-default hover:text-fg disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || (mode === "managed" && !selectedLauncher)}
              className="rounded-md border border-accent bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Starting..." : "Start Preview"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
