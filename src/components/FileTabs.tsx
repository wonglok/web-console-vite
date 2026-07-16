import { useEditorStore } from "../stores/editorStore";

export function FileTabs() {
  const files = useEditorStore((s) => s.files);
  const currentFile = useEditorStore((s) => s.currentFile);
  const setCurrentFile = useEditorStore((s) => s.setCurrentFile);

  if (files.length === 0) return null;

  return (
    <div
      className="flex items-center h-9 shrink-0 overflow-x-auto select-none"
      style={{
        background: "var(--vscode-tab-bg)",
        borderBottom: "1px solid var(--vscode-border)",
      }}
    >
      {files.map((file) => {
        const isActive = file.path === currentFile;
        return (
          <button
            key={file.path}
            onClick={() => setCurrentFile(file.path)}
            className="h-full flex items-center gap-2 px-3 text-xs shrink-0 transition-colors relative border-r"
            style={{
              background: isActive
                ? "var(--vscode-tab-active-bg)"
                : "transparent",
              color: isActive
                ? "var(--vscode-fg)"
                : "var(--vscode-tab-inactive-fg)",
              borderColor: "var(--vscode-border)",
              borderTop: isActive
                ? "2px solid var(--vscode-tab-active-border)"
                : "2px solid transparent",
            }}
            onMouseEnter={(e) => {
              if (!isActive)
                e.currentTarget.style.background = "var(--vscode-tab-hover-bg)";
            }}
            onMouseLeave={(e) => {
              if (!isActive)
                e.currentTarget.style.background = "transparent";
            }}
          >
            {file.label}
          </button>
        );
      })}
      <div className="flex-1 h-full" style={{ background: "var(--vscode-tab-bg)" }} />
    </div>
  );
}
