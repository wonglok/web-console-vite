import { useState, useCallback, useRef } from "react";
import { useEditorStore } from "../stores/editorStore";

export function DependenciesPanel() {
  const [input, setInput] = useState("");
  const installPackage = useEditorStore((s) => s.installPackage);
  const installedPackages = useEditorStore((s) => s.installedPackages);
  const isInstalling = useEditorStore((s) => s.isInstalling);
  const installMessage = useEditorStore((s) => s.installMessage);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInstall = useCallback(() => {
    const name = input.trim();
    if (!name || isInstalling) return;
    installPackage(name);
    setInput("");
    inputRef.current?.focus();
  }, [input, isInstalling, installPackage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleInstall();
      }
    },
    [handleInstall],
  );

  const entries = Object.entries(installedPackages);

  return (
    <div
      className="flex flex-col shrink-0"
      style={{
        borderTop: "1px solid var(--vscode-border)",
        background: "var(--vscode-sidebar)",
        maxHeight: "40%",
      }}
    >
      {/* Install input */}
      <div className="flex items-center gap-2 px-3 py-1.5">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="npm package (e.g. react@18)..."
          disabled={isInstalling}
          className="flex-1 text-xs px-2 py-1 outline-none font-mono"
          style={{
            background: "var(--vscode-input-bg)",
            color: "var(--vscode-input-fg)",
            border: "1px solid var(--vscode-input-border)",
          }}
        />
        <button
          onClick={handleInstall}
          disabled={!input.trim() || isInstalling}
          className="shrink-0 px-2 py-1 text-xs font-medium transition-colors cursor-pointer disabled:opacity-40"
          style={{
            background: "var(--vscode-button-bg)",
            color: "var(--vscode-button-fg)",
          }}
          onMouseEnter={(e) => {
            if (!(!input.trim() || isInstalling))
              e.currentTarget.style.background = "var(--vscode-button-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--vscode-button-bg)";
          }}
        >
          {isInstalling ? "Installing..." : "Install"}
        </button>
      </div>

      {/* Install progress */}
      {installMessage && (
        <div
          className="px-3 py-1 text-xs font-mono"
          style={{
            color: installMessage.startsWith("Failed")
              ? "var(--vscode-error)"
              : "var(--vscode-info)",
            borderTop: "1px solid var(--vscode-border)",
          }}
        >
          {installMessage}
        </div>
      )}

      {/* Header */}
      <div
        className="flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wider"
        style={{
          color: "var(--vscode-fg)",
          borderTop: "1px solid var(--vscode-border)",
        }}
      >
        Dependencies {entries.length > 0 && `(${entries.length})`}
      </div>

      {/* Package list */}
      <div className="overflow-y-auto">
        {entries.length === 0 ? (
          <div
            className="px-3 py-3 text-xs text-center"
            style={{ color: "var(--vscode-fg-dim)" }}
          >
            No packages installed yet
          </div>
        ) : (
          entries.map(([name, version]) => (
            <div
              key={name}
              className="flex items-center justify-between px-3 py-1 transition-colors"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--vscode-list-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <span
                className="text-xs font-mono"
                style={{ color: "var(--vscode-fg)" }}
              >
                {name}
              </span>
              <span
                className="text-xs font-mono"
                style={{ color: "var(--vscode-fg-muted)" }}
              >
                {version}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
