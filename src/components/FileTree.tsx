import { useState, useCallback, useRef, useEffect } from "react";
import { useEditorStore } from "../stores/editorStore";

interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
}

function buildTree(
  readdirSync: (dir: string) => string[],
  statSync: (path: string) => { isDirectory(): boolean },
  dir = "/",
): FileNode[] {
  const nodes: FileNode[] = [];
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }

  for (const name of entries.sort()) {
    if (name === "node_modules" || name === ".next") continue;
    const path = dir === "/" ? `/${name}` : `${dir}/${name}`;
    try {
      const stat = statSync(path);
      if (stat.isDirectory()) {
        nodes.push({
          name,
          path,
          type: "directory",
          children: buildTree(readdirSync, statSync, path),
        });
      } else {
        nodes.push({ name, path, type: "file" });
      }
    } catch {
      // skip
    }
  }

  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

function TreeNode({
  node,
  depth,
  currentFile,
  onSelect,
  onNewFile,
  onNewFolder,
  onContextMenu,
}: {
  node: FileNode;
  depth: number;
  currentFile: string;
  onSelect: (path: string) => void;
  onNewFile: (parentDir: string) => void;
  onNewFolder: (parentDir: string) => void;
  onContextMenu: (e: React.MouseEvent, path: string, createParent: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const [hovered, setHovered] = useState(false);

  if (node.type === "directory") {
    return (
      <div>
        <div
          className="group flex items-center w-full h-6 relative"
          style={{ paddingLeft: `${depth * 16}px` }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onContextMenu={(e) => onContextMenu(e, node.path, node.path)}
        >
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-0.5 h-full text-left transition-colors flex-1 min-w-0"
            style={{ paddingRight: 8 }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--vscode-list-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <svg
              className="w-4 h-4 shrink-0 transition-transform"
              style={{
                transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
                color: "var(--vscode-fg-muted)",
              }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-xs truncate" style={{ color: "var(--vscode-fg)" }}>
              {node.name}
            </span>
          </button>
          {hovered && (
            <div className="flex items-center shrink-0" style={{ paddingRight: 4 }}>
              <button
                title="New File"
                onClick={(e) => { e.stopPropagation(); onNewFile(node.path); }}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
                style={{ color: "var(--vscode-fg-muted)" }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button
                title="New Folder"
                onClick={(e) => { e.stopPropagation(); onNewFolder(node.path); }}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
                style={{ color: "var(--vscode-fg-muted)" }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-9 4V5a2 2 0 012-2h5l2 2h5a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
              </button>
            </div>
          )}
        </div>
        {expanded &&
          node.children?.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              currentFile={currentFile}
              onSelect={onSelect}
              onNewFile={onNewFile}
              onNewFolder={onNewFolder}
              onContextMenu={onContextMenu}
            />
          ))}
      </div>
    );
  }

  const isActive = currentFile === node.path;
  return (
    <button
      onClick={() => onSelect(node.path)}
      onContextMenu={(e) => {
        const parent = node.path.substring(0, node.path.lastIndexOf("/")) || "/";
        onContextMenu(e, node.path, parent);
      }}
      className="w-full flex items-center gap-0.5 h-6 text-left transition-colors"
      style={{
        paddingLeft: `${depth * 16 + 16}px`,
        paddingRight: 8,
        background: isActive ? "var(--vscode-list-active)" : "transparent",
        color: isActive ? "var(--vscode-list-active-fg)" : "var(--vscode-fg)",
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = "var(--vscode-list-hover)";
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = "transparent";
      }}
    >
      <span className="text-xs truncate">{node.name}</span>
    </button>
  );
}

function CreateModal({
  type,
  parentDir,
  onConfirm,
  onCancel,
}: {
  type: "file" | "folder";
  parentDir: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onCancel}
    >
      <div
        className="rounded-lg shadow-2xl border overflow-hidden"
        style={{
          width: 360,
          background: "var(--vscode-dropdown-bg, #252526)",
          borderColor: "var(--vscode-dropdown-border, #454545)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-4 py-3 text-sm font-medium border-b"
          style={{
            borderColor: "var(--vscode-dropdown-border, #454545)",
            color: "var(--vscode-fg)",
          }}
        >
          {type === "file" ? "New File" : "New Folder"}
          <span className="ml-1 text-xs" style={{ color: "var(--vscode-fg-dim)" }}>
            in {parentDir === "/" ? "/" : parentDir.split("/").pop()}
          </span>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="px-4 py-3">
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === "file" ? "filename.tsx" : "folder-name"}
              className="w-full px-2 py-1.5 text-xs rounded border outline-none transition-colors"
              style={{
                background: "var(--vscode-input-bg, #3c3c3c)",
                color: "var(--vscode-input-fg, #cccccc)",
                borderColor: "var(--vscode-input-border, #5a5a5a)",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--vscode-focus-border, #007fd4)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--vscode-input-border, #5a5a5a)"; }}
            />
          </div>
          <div
            className="px-4 py-2.5 flex justify-end gap-2 border-t"
            style={{ borderColor: "var(--vscode-dropdown-border, #454545)" }}
          >
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1 text-xs rounded transition-colors hover:bg-white/5"
              style={{ color: "var(--vscode-fg)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-3 py-1 text-xs rounded transition-colors disabled:opacity-50"
              style={{
                background: "var(--vscode-button-bg, #0e639c)",
                color: "var(--vscode-button-fg, #ffffff)",
              }}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RenameModal({
  oldPath,
  onConfirm,
  onCancel,
}: {
  oldPath: string;
  onConfirm: (newName: string) => void;
  onCancel: () => void;
}) {
  const oldName = oldPath.split("/").pop() || "";
  const parentDir = oldPath.substring(0, oldPath.lastIndexOf("/")) || "/";
  const [name, setName] = useState(oldName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === oldName) return;
    onConfirm(trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onCancel}
    >
      <div
        className="rounded-lg shadow-2xl border overflow-hidden"
        style={{
          width: 360,
          background: "var(--vscode-dropdown-bg, #252526)",
          borderColor: "var(--vscode-dropdown-border, #454545)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-4 py-3 text-sm font-medium border-b"
          style={{
            borderColor: "var(--vscode-dropdown-border, #454545)",
            color: "var(--vscode-fg)",
          }}
        >
          Rename
          <span className="ml-1 text-xs" style={{ color: "var(--vscode-fg-dim)" }}>
            {parentDir === "/" ? "/" : parentDir.split("/").pop()}
          </span>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="px-4 py-3">
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-2 py-1.5 text-xs rounded border outline-none transition-colors"
              style={{
                background: "var(--vscode-input-bg, #3c3c3c)",
                color: "var(--vscode-input-fg, #cccccc)",
                borderColor: "var(--vscode-input-border, #5a5a5a)",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--vscode-focus-border, #007fd4)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--vscode-input-border, #5a5a5a)"; }}
            />
          </div>
          <div
            className="px-4 py-2.5 flex justify-end gap-2 border-t"
            style={{ borderColor: "var(--vscode-dropdown-border, #454545)" }}
          >
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1 text-xs rounded transition-colors hover:bg-white/5"
              style={{ color: "var(--vscode-fg)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || name.trim() === oldName}
              className="px-3 py-1 text-xs rounded transition-colors disabled:opacity-50"
              style={{
                background: "var(--vscode-button-bg, #0e639c)",
                color: "var(--vscode-button-fg, #ffffff)",
              }}
            >
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ContextMenu({
  x,
  y,
  onNewFile,
  onNewFolder,
  onRename,
  onDelete,
  onClose,
}: {
  x: number;
  y: number;
  onNewFile: () => void;
  onNewFolder: () => void;
  onRename: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = () => onClose();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const adjustedX = Math.min(x, window.innerWidth - 160);
  const adjustedY = Math.min(y, window.innerHeight - 80);

  const itemStyle: React.CSSProperties = {
    color: "var(--vscode-menu-fg, #cccccc)",
    cursor: "pointer",
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] rounded-md border shadow-xl py-1 min-w-[140px]"
      style={{
        left: adjustedX,
        top: adjustedY,
        background: "var(--vscode-menu-bg, #252526)",
        borderColor: "var(--vscode-menu-border, #454545)",
      }}
    >
      <button
        onClick={() => { onNewFile(); onClose(); }}
        className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors"
        style={itemStyle}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--vscode-menu-selection, #094771)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        New File
      </button>
      <button
        onClick={() => { onNewFolder(); onClose(); }}
        className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors"
        style={itemStyle}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--vscode-menu-selection, #094771)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-9 4V5a2 2 0 012-2h5l2 2h5a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
        New Folder
      </button>
      <div
        className="my-1 border-t"
        style={{ borderColor: "var(--vscode-menu-border, #454545)" }}
      />
      <button
        onClick={() => { onRename(); onClose(); }}
        className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors"
        style={itemStyle}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--vscode-menu-selection, #094771)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Rename
      </button>
      <button
        onClick={() => { onDelete(); onClose(); }}
        className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors"
        style={itemStyle}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--vscode-menu-selection, #094771)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Delete
      </button>
    </div>
  );
}

export function FileTree() {
  const vfs = useEditorStore((s) => s.vfs);
  const vfsVersion = useEditorStore((s) => s.vfsVersion);
  const currentFile = useEditorStore((s) => s.currentFile);
  const setCurrentFile = useEditorStore((s) => s.setCurrentFile);
  const createFile = useEditorStore((s) => s.createFile);
  const createFolder = useEditorStore((s) => s.createFolder);
  const renameEntry = useEditorStore((s) => s.renameEntry);
  const deleteEntry = useEditorStore((s) => s.deleteEntry);

  const [modal, setModal] = useState<{
    type: "file" | "folder";
    parentDir: string;
  } | null>(null);

  const [renamePath, setRenamePath] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    path: string;
    createParent: string;
  } | null>(null);

  const handleSelect = useCallback(
    (path: string) => setCurrentFile(path),
    [setCurrentFile],
  );

  const handleCreate = useCallback(
    (name: string) => {
      if (!modal) return;
      const newPath =
        modal.parentDir === "/" ? `/${name}` : `${modal.parentDir}/${name}`;
      if (modal.type === "file") {
        createFile(newPath);
      } else {
        createFolder(newPath);
      }
      setModal(null);
    },
    [modal, createFile, createFolder],
  );

  const handleRename = useCallback(
    (newName: string) => {
      if (!renamePath) return;
      const parentDir = renamePath.substring(0, renamePath.lastIndexOf("/")) || "/";
      const newPath = parentDir === "/" ? `/${newName}` : `${parentDir}/${newName}`;
      renameEntry(renamePath, newPath);
      setRenamePath(null);
    },
    [renamePath, renameEntry],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, path: string, createParent: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, path, createParent });
    },
    [],
  );

  const handleContextNewFile = useCallback(() => {
    if (contextMenu) setModal({ type: "file", parentDir: contextMenu.createParent });
    setContextMenu(null);
  }, [contextMenu]);

  const handleContextNewFolder = useCallback(() => {
    if (contextMenu) setModal({ type: "folder", parentDir: contextMenu.createParent });
    setContextMenu(null);
  }, [contextMenu]);

  const handleContextRename = useCallback(() => {
    if (contextMenu) setRenamePath(contextMenu.path);
    setContextMenu(null);
  }, [contextMenu]);

  const handleContextDelete = useCallback(() => {
    if (contextMenu) deleteEntry(contextMenu.path);
    setContextMenu(null);
  }, [contextMenu, deleteEntry]);

  if (!vfs) return null;

  const tree = buildTree(
    (dir: string) => vfs.readdirSync(dir),
    (path: string) => vfs.statSync(path),
  );

  return (
    <div className="flex-1 overflow-y-auto py-1" data-version={vfsVersion}>
      {tree.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          depth={0}
          currentFile={currentFile}
          onSelect={handleSelect}
          onNewFile={(dir) => setModal({ type: "file", parentDir: dir })}
          onNewFolder={(dir) => setModal({ type: "folder", parentDir: dir })}
          onContextMenu={handleContextMenu}
        />
      ))}
      {tree.length === 0 && (
        <div
          className="px-3 py-6 text-center text-xs"
          style={{ color: "var(--vscode-fg-dim)" }}
        >
          No files in project.
        </div>
      )}
      {modal && (
        <CreateModal
          type={modal.type}
          parentDir={modal.parentDir}
          onConfirm={handleCreate}
          onCancel={() => setModal(null)}
        />
      )}
      {renamePath && (
        <RenameModal
          oldPath={renamePath}
          onConfirm={handleRename}
          onCancel={() => setRenamePath(null)}
        />
      )}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onNewFile={handleContextNewFile}
          onNewFolder={handleContextNewFolder}
          onRename={handleContextRename}
          onDelete={handleContextDelete}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
