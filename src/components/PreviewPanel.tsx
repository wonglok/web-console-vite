import { useRef, useCallback, useEffect } from "react";
import { useEditorStore } from "../stores/editorStore";

export function PreviewPanel() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const startPreview = useEditorStore((s) => s.startPreview);
  const isPreviewRunning = useEditorStore((s) => s.isPreviewRunning);
  const isPreviewLoading = useEditorStore((s) => s.isPreviewLoading);
  const hmrLogs = useEditorStore((s) => s.hmrLogs);
  const serverUrl = useEditorStore((s) => s.serverUrl);
  const vfs = useEditorStore((s) => s.vfs);
  const autoStartedRef = useRef(false);

  useEffect(() => {
    useEditorStore.setState({ previewIframe: iframeRef.current });
  }, []);

  // Auto-start preview when a project is opened
  useEffect(() => {
    if (
      vfs &&
      !isPreviewRunning &&
      !isPreviewLoading &&
      !autoStartedRef.current
    ) {
      autoStartedRef.current = true;
      // Wait a tick for the iframe to be in the DOM
      requestAnimationFrame(() => {
        if (iframeRef.current) {
          startPreview(iframeRef.current);
        }
      });
    }
    if (!vfs) {
      autoStartedRef.current = false;
    }
  }, [vfs, isPreviewRunning, isPreviewLoading, startPreview]);

  const handleStart = useCallback(() => {
    if (iframeRef.current) {
      startPreview(iframeRef.current);
    }
  }, [startPreview]);

  return (
    <div className="flex flex-col h-full" style={{ background: "#fff" }}>
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-3 h-9 shrink-0 select-none"
        style={{
          background: "var(--vscode-editor)",
          borderBottom: "1px solid var(--vscode-border)",
        }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={handleStart}
            disabled={!vfs || isPreviewLoading}
            className="px-3 py-1 text-xs font-medium transition-colors cursor-pointer disabled:opacity-40"
            style={{
              background: "var(--vscode-button-bg)",
              color: "var(--vscode-button-fg)",
            }}
            onMouseEnter={(e) => {
              if (!(!vfs || isPreviewLoading))
                e.currentTarget.style.background = "var(--vscode-button-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--vscode-button-bg)";
            }}
          >
            {isPreviewLoading
              ? "Starting..."
              : isPreviewRunning
                ? "Restart Preview"
                : "Start Preview"}
          </button>
          {serverUrl && (
            <span
              className="text-xs font-mono truncate max-w-60"
              style={{ color: "var(--vscode-fg-muted)" }}
            >
              {serverUrl}
            </span>
          )}
        </div>
        {hmrLogs.length > 0 && (
          <div className="text-xs" style={{ color: "var(--vscode-success)" }}>
            HMR: {hmrLogs[hmrLogs.length - 1].path}
          </div>
        )}
      </div>

      {/* Iframe / empty state */}
      <div className="flex-1 relative bg-white">
        <iframe
          ref={iframeRef}
          title="Preview"
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
        />
        {!isPreviewRunning && !isPreviewLoading && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            style={{ background: "var(--vscode-editor)" }}
          >
            <svg
              className="w-12 h-12 opacity-40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: "var(--vscode-fg-muted)" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span
              className="text-sm"
              style={{ color: "var(--vscode-fg-muted)" }}
            >
              Click "Start Preview" to launch the Next.js preview
            </span>
          </div>
        )}
        {isPreviewLoading && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "rgba(30,30,30,0.7)" }}
          >
            <div
              className="flex items-center gap-2"
              style={{ color: "var(--vscode-accent)" }}
            >
              <svg
                className="animate-spin w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span className="text-sm font-medium text-white">
                Starting Next.js dev server...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
