import { useState, useCallback } from "react";
import { useEditorStore } from "../stores/editorStore";

interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
}

function buildTree(
  entries: string[],
  readdirSync: (dir: string) => string[],
  statSync: (path: string) => { isDirectory(): boolean },
  dir = "/",
): FileNode[] {
  const nodes: FileNode[] = [];
  const dirEntries = readdirSync(dir);

  for (const name of dirEntries.sort()) {
    if (name === "node_modules" || name === ".next") continue;
    const path = dir === "/" ? `/${name}` : `${dir}/${name}`;
    try {
      const stat = statSync(path);
      if (stat.isDirectory()) {
        nodes.push({
          name,
          path,
          type: "directory",
          children: buildTree(entries, readdirSync, statSync, path),
        });
      } else {
        nodes.push({ name, path, type: "file" });
      }
    } catch {
      // skip entries that can't be stat'd
    }
  }

  // Sort: directories first, then files, alphabetically within each group
  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

function fileLabel(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  const colors: Record<string, string> = {
    tsx: "text-cyan-400",
    ts: "text-blue-400",
    jsx: "text-yellow-400",
    js: "text-yellow-300",
    json: "text-green-400",
    css: "text-purple-400",
    html: "text-orange-400",
    md: "text-gray-400",
    svg: "text-pink-400",
  };
  return colors[ext || ""] || "text-gray-400";
}

function FileIcon({ name, type }: { name: string; type: "file" | "directory" }) {
  if (type === "directory") {
    return (
      <svg
        className="w-4 h-4 text-yellow-500 shrink-0"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
      </svg>
    );
  }

  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "tsx" || ext === "jsx") {
    return (
      <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z" />
      </svg>
    );
  }
  if (ext === "json") {
    return (
      <svg className="w-4 h-4 text-green-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z" />
      </svg>
    );
  }
  if (ext === "css") {
    return (
      <svg className="w-4 h-4 text-purple-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z" />
    </svg>
  );
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
          className="w-full flex items-center gap-1.5 px-2 py-1 text-left hover:bg-gray-800/50 transition-colors cursor-pointer"
          style={{ paddingLeft: `${8 + depth * 14}px` }}
        >
          <svg
            className={`w-3 h-3 text-gray-500 shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
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
          <FileIcon name={node.name} type="directory" />
          <span className="text-xs text-gray-300 truncate">{node.name}</span>
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

  // File node
  const isActive = currentFile === node.path;
  return (
    <button
      onClick={() => onSelect(node.path)}
      className={`w-full flex items-center gap-1.5 px-2 py-1 text-left hover:bg-gray-800/50 transition-colors cursor-pointer ${
        isActive ? "bg-blue-600/20" : ""
      }`}
      style={{ paddingLeft: `${8 + depth * 14}px` }}
    >
      <span className="w-3 shrink-0" />
      <FileIcon name={node.name} type="file" />
      <span
        className={`text-xs truncate ${isActive ? "text-blue-300" : fileLabel(node.name)}`}
      >
        {node.name}
      </span>
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
    [],
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
        <div className="px-3 py-6 text-center text-xs text-gray-600">
          No files in project.
        </div>
      )}
    </div>
  );
}
