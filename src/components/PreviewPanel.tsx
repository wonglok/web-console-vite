import { useRef, useCallback } from "react";
import { useEditorStore } from "../stores/editorStore";

export function PreviewPanel() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const startPreview = useEditorStore((s) => s.startPreview);
  const isPreviewRunning = useEditorStore((s) => s.isPreviewRunning);
  const isPreviewLoading = useEditorStore((s) => s.isPreviewLoading);
  const hmrLogs = useEditorStore((s) => s.hmrLogs);
  const serverUrl = useEditorStore((s) => s.serverUrl);
  const vfs = useEditorStore((s) => s.vfs);

  const handleStart = useCallback(() => {
    if (iframeRef.current) {
      startPreview(iframeRef.current);
    }
  }, [startPreview]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={handleStart}
            disabled={!vfs || isPreviewLoading}
            className="px-4 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {isPreviewLoading
              ? "Starting..."
              : isPreviewRunning
                ? "Restart Preview"
                : "Start Preview"}
          </button>
          {serverUrl && (
            <span className="text-xs text-gray-500 font-mono truncate max-w-75">
              {serverUrl}
            </span>
          )}
        </div>
        {hmrLogs.length > 0 && (
          <div className="text-xs text-green-600 font-medium">
            HMR: {hmrLogs[hmrLogs.length - 1].path}
          </div>
        )}
      </div>

      {/* Iframe or empty state */}
      <div className="flex-1 relative">
        <iframe
          ref={iframeRef}
          title="Preview"
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
        />
        {!isPreviewRunning && !isPreviewLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-400 gap-3">
            <svg
              className="w-12 h-12 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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
            <span className="text-sm">
              Click "Start Preview" to launch the Vite preview
            </span>
          </div>
        )}
        {isPreviewLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80">
            <div className="flex items-center gap-2 text-blue-600">
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
              <span className="text-sm font-medium">
                Starting Vite dev server...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
