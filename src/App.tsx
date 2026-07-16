import { useState, useRef, useCallback, useEffect } from "react";
import { EditorPanel } from "./components/EditorPanel";
import { PreviewPanel } from "./components/PreviewPanel";
import { WorkspaceSelector } from "./components/WorkspaceSelector";
import { ChatPanel } from "./components/ChatPanel";
import { FileTree } from "./components/FileTree";
import { useWorkspaceStore } from "./stores/workspaceStore";
import { useEditorStore } from "./stores/editorStore";

function EmptyState() {
  const workspaceName = useWorkspaceStore((s) => s.workspaceName);
  const projects = useWorkspaceStore((s) => s.projects);
  const openProject = useWorkspaceStore((s) => s.openProject);

  if (!workspaceName) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ background: "var(--vscode-editor)" }}
      >
        <div className="text-center">
          <svg
            className="w-12 h-12 mx-auto mb-4 opacity-30"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
            style={{ color: "var(--vscode-fg-muted)" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          <p className="text-base mb-1" style={{ color: "var(--vscode-fg)" }}>
            Select a workspace folder
          </p>
          <p className="text-xs" style={{ color: "var(--vscode-fg-dim)" }}>
            Choose a folder on your computer to store your projects
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex items-center justify-center"
      style={{ background: "var(--vscode-editor)" }}
    >
      <div className="text-center">
        <svg
          className="w-12 h-12 mx-auto mb-4 opacity-30"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
          style={{ color: "var(--vscode-fg-muted)" }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        {projects.length === 0 ? (
          <>
            <p className="text-base mb-1" style={{ color: "var(--vscode-fg)" }}>
              No projects yet
            </p>
            <p className="text-xs" style={{ color: "var(--vscode-fg-dim)" }}>
              Create a new project to get started
            </p>
          </>
        ) : (
          <>
            <p className="text-base mb-3" style={{ color: "var(--vscode-fg)" }}>
              Select a project
            </p>
            <div className="flex flex-col gap-1.5 max-w-xs mx-auto">
              {projects.map((name) => (
                <button
                  key={name}
                  onClick={() => openProject(name)}
                  className="px-4 py-1.5 text-sm text-left transition-colors"
                  style={{
                    background: "var(--vscode-list-hover)",
                    color: "var(--vscode-fg)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "var(--vscode-menu-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "var(--vscode-list-hover)";
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---- Activity Bar ----

function ActivityBar({
  active,
  onSelect,
}: {
  active: string | null;
  onSelect: (id: string) => void;
}) {
  const items = [
    {
      id: "explorer",
      label: "Explorer",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z" />
        </svg>
      ),
    },
    {
      id: "search",
      label: "Search",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.25 0a8.25 8.25 0 0 0-6.18 13.72L1 22.88l1.12 1 8.05-9.12A8.251 8.251 0 1 0 15.25.01zm0 2a6.25 6.25 0 1 1 0 12.5 6.25 6.25 0 0 1 0-12.5z" />
        </svg>
      ),
    },
    {
      id: "extensions",
      label: "Extensions",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13.5 1.5L9.75 5.25 13.5 9l-3.75 3.75L6 9l3.75-3.75L6 1.5 2.25 5.25 9.75 12.75 13.5 9l3.75 3.75L21 9l-3.75-3.75L21 1.5 17.25 5.25 13.5 1.5z" />
        </svg>
      ),
    },
    {
      id: "settings",
      label: "Settings",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.9 12.66a1 1 0 0 1 0-1.32l1.28-1.44a1 1 0 0 0 .12-1.17l-2-3.46a1 1 0 0 0-1.07-.48l-1.88.38a1 1 0 0 1-1.15-.66l-.61-1.83a1 1 0 0 0-.95-.68h-4a1 1 0 0 0-1 .68l-.56 1.83a1 1 0 0 1-1.15.66L5 4.79a1 1 0 0 0-1 .48L2 8.73a1 1 0 0 0 .1 1.17l1.27 1.44a1 1 0 0 1 0 1.32L2.1 14.1a1 1 0 0 0-.1 1.17l2 3.46a1 1 0 0 0 1.07.48l1.88-.38a1 1 0 0 1 1.15.66l.61 1.83a1 1 0 0 0 .95.68h4a1 1 0 0 0 .95-.68l.61-1.83a1 1 0 0 1 1.15-.66l1.88.38a1 1 0 0 0 1.07-.48l2-3.46a1 1 0 0 0-.12-1.17zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" />
        </svg>
      ),
    },
  ];

  return (
    <div
      className="h-full flex flex-col items-center shrink-0"
      style={{
        width: 48,
        background: "var(--vscode-activity-bar)",
        paddingTop: 4,
      }}
    >
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id === active ? "" : item.id)}
          className="w-full flex justify-center py-3 relative transition-colors"
          style={{
            color:
              active === item.id
                ? "var(--vscode-activity-bar-active)"
                : "var(--vscode-activity-bar-inactive)",
          }}
          onMouseEnter={(e) => {
            if (active !== item.id)
              e.currentTarget.style.color = "var(--vscode-activity-bar-active)";
          }}
          onMouseLeave={(e) => {
            if (active !== item.id)
              e.currentTarget.style.color =
                "var(--vscode-activity-bar-inactive)";
          }}
          title={item.label}
        >
          {/* Active indicator */}
          {active === item.id && (
            <div
              className="absolute left-0 top-1.5 bottom-1.5"
              style={{
                width: 2,
                background: "var(--vscode-activity-bar-active)",
              }}
            />
          )}
          <div className="w-6 h-6">{item.icon}</div>
        </button>
      ))}
    </div>
  );
}

// ---- Status Bar ----

function StatusBar({
  currentFile,
  language,
  currentProject,
}: {
  currentFile: string;
  language: string;
  currentProject: string | null;
}) {
  return (
    <div
      className="h-6 flex items-center px-2 text-xs shrink-0 select-none"
      style={{
        background: "var(--vscode-status-bar)",
        color: "var(--vscode-status-bar-fg)",
      }}
    >
      <div className="flex items-center gap-3">
        <span>✦ {currentProject || "no project"}</span>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <span>{currentFile}</span>
        <span>{language}</span>
        <span>UTF-8</span>
        <span>Spaces: 2</span>
      </div>
    </div>
  );
}

// ---- Main App ----

export default function App() {
  const currentProject = useWorkspaceStore((s) => s.currentProject);
  const currentFile = useEditorStore((s) => s.currentFile);
  const vfs = useEditorStore((s) => s.vfs);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatHeight, setChatHeight] = useState(250);
  const [activity, setActivity] = useState<string | null>("explorer");
  const resizing = useRef(false);
  const editorColumnRef = useRef<HTMLDivElement>(null);

  const hasProject = !!(currentProject && vfs);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizing.current = true;
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!resizing.current || !editorColumnRef.current) return;
      const rect = editorColumnRef.current.getBoundingClientRect();
      const h = rect.bottom - e.clientY;
      setChatHeight(Math.max(100, Math.min(h, rect.height * 0.6)));
    };
    const onMouseUp = () => {
      resizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // Handle activity bar clicks
  const handleActivity = useCallback(
    (id: string) => {
      if (id === "explorer") {
        setSidebarOpen(true);
      } else if (id === "search" || id === "extensions") {
        // Toggle chat panel focus via expanding it
        if (chatHeight < 200) setChatHeight(400);
      }
      setActivity(id);
    },
    [chatHeight],
  );

  const language = (() => {
    const ext = currentFile.split(".").pop();
    switch (ext) {
      case "tsx":
        return "TypeScript React";
      case "ts":
        return "TypeScript";
      case "jsx":
        return "JavaScript React";
      case "js":
        return "JavaScript";
      case "json":
        return "JSON";
      case "css":
        return "CSS";
      default:
        return ext?.toUpperCase() || "Plain Text";
    }
  })();

  return (
    <div
      className="h-screen flex flex-col"
      style={{ background: "var(--vscode-bg)" }}
    >
      {/* Title Bar */}
      <div
        className="h-8 flex items-center px-3 shrink-0 select-none text-xs"
        style={{
          background: "var(--vscode-title-bar)",
          color: "var(--vscode-fg-muted)",
        }}
      >
        <span className="font-medium" style={{ color: "var(--vscode-fg)" }}>
          Web Console
        </span>
        <span className="mx-2 opacity-40">—</span>
        <span className="opacity-60">{currentProject || "no project open"}</span>
        <div className="flex-1" />
        <WorkspaceSelector />
      </div>

      {/* Main layout */}
      {hasProject ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Activity Bar */}
          <ActivityBar active={activity} onSelect={handleActivity} />

          {/* Sidebar */}
          {sidebarOpen && (
            <div
              className="h-full flex flex-col shrink-0"
              style={{
                width: 260,
                background: "var(--vscode-sidebar)",
              }}
            >
              {/* Sidebar header */}
              <div
                className="flex items-center justify-between px-4 h-9 shrink-0 text-xs font-semibold uppercase tracking-wider select-none"
                style={{
                  color: "var(--vscode-fg)",
                  letterSpacing: "0.05em",
                }}
              >
                <span>Explorer</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="hover:opacity-70 transition-opacity"
                  style={{ color: "var(--vscode-fg-muted)" }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </div>
              <FileTree />
            </div>
          )}

          {/* Editor + Panel Column */}
          <div className="flex-1 flex overflow-hidden">
            <div
              ref={editorColumnRef}
              className="flex-1 flex flex-col"
              style={{ borderRight: "1px solid var(--vscode-border)" }}
            >
              <div className="flex-1 overflow-hidden">
                <EditorPanel />
              </div>

              {/* Panel resize handle */}
              <div
                onMouseDown={onMouseDown}
                className="h-0.5 shrink-0 transition-colors cursor-row-resize z-10"
                style={{ background: "var(--vscode-border)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--vscode-accent)";
                  e.currentTarget.style.height = "2px";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--vscode-border)";
                  e.currentTarget.style.height = "1px";
                }}
              />

              {/* Panel (Chat) */}
              <div
                className="shrink-0 flex flex-col"
                style={{ height: chatHeight }}
              >
                {/* Panel tabs */}
                <div
                  className="flex items-center h-8 shrink-0 text-xs select-none"
                  style={{
                    background: "var(--vscode-panel)",
                    borderTop: "1px solid var(--vscode-panel-border)",
                  }}
                >
                  <div
                    className="flex items-center gap-2 px-3 h-full shrink-0"
                    style={{
                      color: "var(--vscode-fg)",
                      borderTop: "2px solid var(--vscode-tab-active-border)",
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
                    </svg>
                    <span>Chat Agent</span>
                  </div>
                  <div className="flex-1" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <ChatPanel />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="flex-1 flex flex-col">
              <PreviewPanel />
            </div>
          </div>
        </div>
      ) : (
        <EmptyState />
      )}

      {/* Status Bar */}
      {hasProject && (
        <StatusBar
          currentFile={currentFile}
          language={language}
          currentProject={currentProject}
        />
      )}
    </div>
  );
}
