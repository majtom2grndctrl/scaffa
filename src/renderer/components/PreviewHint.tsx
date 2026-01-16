import { useEffect, useState } from 'react';

export interface PreviewHintProps {
  /** Whether to show the hint (triggers animation) */
  show: boolean;
  /** Callback when hint animation completes and hint should be hidden */
  onComplete?: () => void;
}

/**
 * PreviewHint - Scaffa-owned discoverability hint for inspect controls.
 *
 * This component is rendered by Scaffa UI (not injected into the guest app DOM),
 * ensuring it cannot conflict with app styling or layout.
 *
 * Design:
 * - Appears when a preview session becomes ready
 * - Shows click-to-select instruction (Editor View, v0)
 * - Alt/Option modifier is reserved for Preview Mode (deferred)
 * - Displays for ~4s and fades out
 * - Never captures pointer events
 * - Positioned in top-left corner
 */
export const PreviewHint = ({ show, onComplete }: PreviewHintProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 4000); // 4s total (matches animation duration)
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed left-3 top-3 z-50 animate-hint-fade rounded-lg border border-white/20 bg-black/70 px-3 py-2 text-xs text-white/95 shadow-lg backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col gap-1.5">
        <div className="font-medium opacity-90">Editor View</div>
        <div>Click to inspect</div>
        <div className="opacity-85">
          <kbd className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-[11px]">
            Esc
          </kbd>{' '}
          clears selection
        </div>
      </div>
    </div>
  );
};
