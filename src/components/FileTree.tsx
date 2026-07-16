import { useState, useCallback } from "react";
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
}: {
  node: FileNode;
  depth: number;
  currentFile: string;
  onSelect: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);

  if (node.type === "directory") {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-0.5 h-6 text-left transition-colors"
          style={{
            paddingLeft: `${depth * 16}px`,
            paddingRight: 8,
          }}
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="text-xs truncate" style={{ color: "var(--vscode-fg)" }}>
            {node.name}
          </span>
        </button>
        {expanded &&
          node.children?.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              currentFile={currentFile}
              onSelect={onSelect}
            />
          ))}
      </div>
    );
  }

  const isActive = currentFile === node.path;
  return (
    <button
      onClick={() => onSelect(node.path)}
      className="w-full flex items-center gap-0.5 h-6 text-left transition-colors"
      style={{
        paddingLeft: `${depth * 16 + 16}px`,
        paddingRight: 8,
        background: isActive ? "var(--vscode-list-active)" : "transparent",
        color: isActive ? "var(--vscode-list-active-fg)" : "var(--vscode-fg)",
      }}
      onMouseEnter={(e) => {
        if (!isActive)
          e.currentTarget.style.background = "var(--vscode-list-hover)";
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = "transparent";
      }}
    >
      <span className="text-xs truncate">{node.name}</span>
    </button>
  );
}

export function FileTree() {
  const vfs = useEditorStore((s) => s.vfs);
  const vfsVersion = useEditorStore((s) => s.vfsVersion);
  const currentFile = useEditorStore((s) => s.currentFile);
  const setCurrentFile = useEditorStore((s) => s.setCurrentFile);

  const handleSelect = useCallback(
    (path: string) => {
      setCurrentFile(path);
    },
    [setCurrentFile],
  );

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
    </div>
  );
}
