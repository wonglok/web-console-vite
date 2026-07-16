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
      className="flex flex-col border-t border-gray-700 bg-gray-900 shrink-0"
      style={{ maxHeight: "40%" }}
    >
      {/* Install input */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-800">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="npm package name (e.g. react@18)..."
          disabled={isInstalling}
          className="flex-1 bg-gray-800 text-gray-200 text-xs rounded px-2 py-1.5 outline-none border border-gray-700 focus:border-blue-500 disabled:opacity-50 font-mono"
        />
        <button
          onClick={handleInstall}
          disabled={!input.trim() || isInstalling}
          className="shrink-0 px-3 py-1.5 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isInstalling ? "Installing..." : "Install"}
        </button>
      </div>

      {/* Install progress */}
      {installMessage && (
        <div
          className={`px-3 py-1.5 text-xs font-mono border-b border-gray-800 ${
            installMessage.startsWith("Failed")
              ? "text-red-400 bg-red-900/20"
              : "text-blue-400"
          }`}
        >
          {installMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-700/50">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          Dependencies {entries.length > 0 && `(${entries.length})`}
        </span>
      </div>

      {/* Package list */}
      <div className="overflow-y-auto">
        {entries.length === 0 ? (
          <div className="px-3 py-4 text-xs text-gray-500 text-center">
            No packages installed yet
          </div>
        ) : (
          entries.map(([name, version]) => (
            <div
              key={name}
              className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-800/50 border-b border-gray-800/50 last:border-0"
            >
              <span className="text-xs text-gray-300 font-mono">{name}</span>
              <span className="text-xs text-gray-500 font-mono">{version}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
