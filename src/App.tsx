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
      <div className="flex-1 flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <svg
            className="w-16 h-16 text-gray-700 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          <p className="text-gray-400 text-lg mb-2">Select a workspace folder</p>
          <p className="text-gray-600 text-sm">
            Choose a folder on your computer to store your projects
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-950">
      <div className="text-center">
        <svg
          className="w-16 h-16 text-gray-700 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        {projects.length === 0 ? (
          <>
            <p className="text-gray-400 text-lg mb-2">No projects yet</p>
            <p className="text-gray-600 text-sm">
              Create a new project to get started
            </p>
          </>
        ) : (
          <>
            <p className="text-gray-400 text-lg mb-3">Select a project</p>
            <div className="flex flex-col gap-2 max-w-xs mx-auto">
              {projects.map((name) => (
                <button
                  key={name}
                  onClick={() => openProject(name)}
                  className="px-4 py-2 text-sm text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md transition-colors cursor-pointer text-left"
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

export default function App() {
  const currentProject = useWorkspaceStore((s) => s.currentProject);
  const vfs = useEditorStore((s) => s.vfs);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatHeight, setChatHeight] = useState(288);
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
      setChatHeight(Math.max(120, Math.min(h, rect.height * 0.7)));
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

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <header className="flex items-center px-6 py-3 border-b border-gray-800 bg-gray-950 shrink-0 gap-3">
        {hasProject && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 text-gray-500 hover:text-gray-300 rounded transition-colors cursor-pointer shrink-0"
            title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
        )}
        <h1 className="text-lg font-semibold text-white tracking-tight shrink-0">
          Editor + Next.js Preview
        </h1>
        <span className="text-xs text-gray-500 font-mono bg-gray-800 px-2 py-0.5 rounded shrink-0">
          almostnode
        </span>
        <div className="ml-auto">
          <WorkspaceSelector />
        </div>
      </header>

      {/* Main content */}
      {hasProject ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar: File tree */}
          {sidebarOpen && (
            <div className="h-full flex flex-col bg-gray-950 border-r border-gray-800 w-64 shrink-0">
              <div className="px-3 py-2 border-b border-gray-800 shrink-0">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Files
                </span>
              </div>
              <FileTree />
            </div>
          )}

          {/* Center: Editor + Chat, Right: Preview */}
          <div className="flex-1 flex overflow-hidden">
            <div ref={editorColumnRef} className="flex-1 flex flex-col border-r border-gray-800">
              <div className="flex-1 overflow-hidden">
                <EditorPanel />
              </div>
              {/* Drag handle */}
              <div
                onMouseDown={onMouseDown}
                className="h-1 bg-gray-800 hover:bg-blue-500 cursor-row-resize shrink-0 transition-colors"
              />
              <div className="border-t border-gray-800 shrink-0" style={{ height: chatHeight }}>
                <ChatPanel />
              </div>
            </div>
            <div className="flex-1">
              <PreviewPanel />
            </div>
          </div>
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
