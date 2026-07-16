import { useState } from "react";
import { useWorkspaceStore } from "../stores/workspaceStore";

export function WorkspaceSelector() {
  const workspaceName = useWorkspaceStore((s) => s.workspaceName);
  const projects = useWorkspaceStore((s) => s.projects);
  const currentProject = useWorkspaceStore((s) => s.currentProject);
  const isLoading = useWorkspaceStore((s) => s.isLoading);
  const selectWorkspace = useWorkspaceStore((s) => s.selectWorkspace);
  const createProject = useWorkspaceStore((s) => s.createProject);
  const openProject = useWorkspaceStore((s) => s.openProject);
  const deleteProject = useWorkspaceStore((s) => s.deleteProject);
  const closeProject = useWorkspaceStore((s) => s.closeProject);

  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);

  const handleCreateProject = async () => {
    const name = newProjectName.trim();
    if (!name) return;
    await createProject(name);
    setNewProjectName("");
    setShowNewProject(false);
  };

  if (!workspaceName) {
    return (
      <button
        onClick={selectWorkspace}
        disabled={isLoading}
        className="px-3 py-0.5 text-xs transition-colors disabled:opacity-50 cursor-pointer"
        style={{
          background: "var(--vscode-button-bg)",
          color: "var(--vscode-button-fg)",
        }}
        onMouseEnter={(e) => {
          if (!isLoading)
            e.currentTarget.style.background = "var(--vscode-button-hover)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--vscode-button-bg)";
        }}
      >
        {isLoading ? "Opening..." : "Select Workspace"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      {/* Workspace badge */}
      <span
        className="flex items-center gap-1 px-2 py-0.5"
        style={{ color: "var(--vscode-fg-muted)" }}
      >
        <svg
          className="w-3 h-3 opacity-60"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
        {workspaceName}
        <button
          onClick={selectWorkspace}
          className="opacity-50 hover:opacity-100 ml-0.5"
          title="Change workspace"
        >
          <svg
            className="w-2.5 h-2.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
      </span>

      {/* Project selector */}
      <div className="relative">
        <button
          onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
          className="flex items-center gap-1.5 px-2 py-0.5 transition-colors"
          style={{
            color: "var(--vscode-fg)",
            border: "1px solid var(--vscode-border)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--vscode-list-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <span className="truncate max-w-[140px]">
            {currentProject || "Select project"}
          </span>
          <svg
            className="w-3 h-3 opacity-50 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {projectDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setProjectDropdownOpen(false)}
            />
            <div
              className="absolute top-full mt-0.5 left-0 w-56 z-20 shadow-lg"
              style={{
                background: "var(--vscode-menu)",
                color: "var(--vscode-menu-fg)",
                border: "1px solid var(--vscode-border)",
              }}
            >
              {projects.length === 0 ? (
                <div
                  className="px-4 py-6 text-center"
                  style={{ color: "var(--vscode-fg-dim)" }}
                >
                  No projects yet
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto">
                  {projects.map((name) => (
                    <div
                      key={name}
                      className="flex items-center justify-between px-3 py-1 cursor-pointer transition-colors"
                      style={{
                        background:
                          currentProject === name
                            ? "var(--vscode-menu-hover)"
                            : "transparent",
                        color: "var(--vscode-menu-fg)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "var(--vscode-menu-hover)";
                      }}
                      onMouseLeave={(e) => {
                        if (currentProject !== name)
                          e.currentTarget.style.background = "transparent";
                      }}
                      onClick={() => {
                        openProject(name);
                        setProjectDropdownOpen(false);
                      }}
                    >
                      <span className="truncate">{name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            confirm(
                              `Delete project "${name}"? This cannot be undone.`,
                            )
                          ) {
                            deleteProject(name);
                            setProjectDropdownOpen(false);
                          }
                        }}
                        className="opacity-40 hover:opacity-100 ml-2 shrink-0"
                        style={{ color: "var(--vscode-close)" }}
                        title="Delete project"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* New project button */}
      {showNewProject ? (
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateProject();
              if (e.key === "Escape") {
                setShowNewProject(false);
                setNewProjectName("");
              }
            }}
            placeholder="project-name"
            autoFocus
            className="px-2 py-0.5 text-xs outline-none w-36"
            style={{
              background: "var(--vscode-input-bg)",
              color: "var(--vscode-input-fg)",
              border: "1px solid var(--vscode-accent)",
            }}
          />
          <button
            onClick={handleCreateProject}
            disabled={!newProjectName.trim()}
            className="px-2 py-0.5 text-xs transition-colors disabled:opacity-40 cursor-pointer"
            style={{
              background: "var(--vscode-button-bg)",
              color: "var(--vscode-button-fg)",
            }}
          >
            Create
          </button>
          <button
            onClick={() => {
              setShowNewProject(false);
              setNewProjectName("");
            }}
            className="opacity-60 hover:opacity-100"
            style={{ color: "var(--vscode-fg-muted)" }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowNewProject(true)}
          className="flex items-center gap-1 px-2 py-0.5 text-xs transition-colors cursor-pointer"
          style={{
            color: "var(--vscode-fg-muted)",
            border: "1px solid var(--vscode-border)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--vscode-fg)";
            e.currentTarget.style.borderColor = "var(--vscode-fg-muted)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--vscode-fg-muted)";
            e.currentTarget.style.borderColor = "var(--vscode-border)";
          }}
        >
          <svg
            className="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          New
        </button>
      )}

      {/* Close */}
      {currentProject && (
        <button
          onClick={closeProject}
          className="opacity-50 hover:opacity-100 ml-1"
          style={{ color: "var(--vscode-fg-muted)" }}
          title="Close project"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
