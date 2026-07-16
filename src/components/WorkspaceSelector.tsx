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
        className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors cursor-pointer disabled:opacity-50"
      >
        {isLoading ? "Opening..." : "Select Workspace"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Workspace badge */}
      <span className="text-xs text-gray-400 font-mono bg-gray-800 px-2 py-0.5 rounded flex items-center gap-2">
        <svg
          className="w-3.5 h-3.5 text-gray-500"
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
          className="text-gray-500 hover:text-gray-300 ml-1"
          title="Change workspace"
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
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
      </span>

      {/* Project selector */}
      <div className="relative">
        <button
          onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-200 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors cursor-pointer border border-gray-700"
        >
          <span className="truncate max-w-[180px]">
            {currentProject || "Select project"}
          </span>
          <svg
            className="w-3.5 h-3.5 text-gray-500 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {projectDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setProjectDropdownOpen(false)}
            />
            <div className="absolute top-full mt-1 left-0 w-64 bg-gray-800 border border-gray-700 rounded-md shadow-xl z-20 overflow-hidden">
              {projects.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-500">
                  No projects yet. Create one to get started.
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto">
                  {projects.map((name) => (
                    <div
                      key={name}
                      className={`flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-700 cursor-pointer ${
                        currentProject === name
                          ? "bg-blue-600/20 text-blue-400"
                          : "text-gray-300"
                      }`}
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
                        className="text-gray-500 hover:text-red-400 ml-2 shrink-0 cursor-pointer"
                        title="Delete project"
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

      {/* New project button or dialog */}
      {showNewProject ? (
        <div className="flex items-center gap-2">
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
            className="px-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-gray-200 outline-none focus:border-blue-500 w-48"
          />
          <button
            onClick={handleCreateProject}
            disabled={!newProjectName.trim()}
            className="px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-500 rounded transition-colors cursor-pointer disabled:opacity-50"
          >
            Create
          </button>
          <button
            onClick={() => {
              setShowNewProject(false);
              setNewProjectName("");
            }}
            className="text-gray-500 hover:text-gray-300 text-sm cursor-pointer"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowNewProject(true)}
          className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md transition-colors cursor-pointer flex items-center gap-1"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Project
        </button>
      )}

      {/* Close project button */}
      {currentProject && (
        <button
          onClick={closeProject}
          className="text-gray-500 hover:text-gray-300 text-sm ml-2 cursor-pointer"
          title="Close project"
        >
          <svg
            className="w-4 h-4"
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
