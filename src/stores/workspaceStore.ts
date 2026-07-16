import { create } from "zustand";
import { useEditorStore } from "./editorStore";

interface WorkspaceState {
  workspaceHandle: FileSystemDirectoryHandle | null;
  workspaceName: string;
  projects: string[];
  currentProject: string | null;
  isLoading: boolean;

  selectWorkspace: () => Promise<void>;
  refreshProjects: () => Promise<void>;
  createProject: (name: string) => Promise<void>;
  openProject: (name: string) => Promise<void>;
  deleteProject: (name: string) => Promise<void>;
  closeProject: () => void;

  // Helpers for editorStore to sync saves to disk
  syncFileToDisk: (path: string, content: string) => Promise<void>;
}

async function readDirectoryRecursive(
  dirHandle: FileSystemDirectoryHandle,
  basePath = "/",
): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  for await (const [name, handle] of dirHandle.entries()) {
    const path = basePath + name;
    if (handle.kind === "file") {
      const file = await handle.getFile();
      files[path] = await file.text();
    } else if (
      handle.kind === "directory" &&
      name !== "node_modules" &&
      name !== ".next"
    ) {
      Object.assign(
        files,
        await readDirectoryRecursive(handle, path + "/"),
      );
    }
  }
  return files;
}

async function ensureDir(
  rootHandle: FileSystemDirectoryHandle,
  dirPath: string,
): Promise<FileSystemDirectoryHandle> {
  const parts = dirPath.split("/").filter(Boolean);
  let current = rootHandle;
  for (const part of parts) {
    current = await current.getDirectoryHandle(part, { create: true });
  }
  return current;
}

async function writeFileToHandle(
  rootHandle: FileSystemDirectoryHandle,
  filePath: string,
  content: string,
): Promise<void> {
  const parts = filePath.split("/").filter(Boolean);
  const fileName = parts.pop()!;
  const dirHandle =
    parts.length > 0 ? await ensureDir(rootHandle, parts.join("/")) : rootHandle;
  const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

const DB_NAME = "web-console-workspace";
const DB_VERSION = 1;
const STORE_NAME = "handles";

function openHandleDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function storeHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openHandleDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(handle, "workspace");
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

async function restoreHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openHandleDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get("workspace");
      req.onsuccess = async () => {
        db.close();
        const handle = req.result as FileSystemDirectoryHandle | undefined;
        if (!handle) {
          resolve(null);
          return;
        }
        // Re-verify permission
        const opts: FileSystemHandlePermissionDescriptor = {
          mode: "readwrite",
        };
        const permission =
          (await handle.queryPermission(opts)) === "granted" ||
          (await handle.requestPermission(opts)) === "granted";
        resolve(permission ? handle : null);
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

async function scanProjects(
  handle: FileSystemDirectoryHandle,
): Promise<string[]> {
  const projects: string[] = [];
  for await (const [name, child] of handle.entries()) {
    if (child.kind === "directory" && name !== ".DS_Store") {
      projects.push(name);
    }
  }
  return projects.sort();
}

export const useWorkspaceStore = create<WorkspaceState>()((set, get) => ({
  workspaceHandle: null,
  workspaceName: "",
  projects: [],
  currentProject: null,
  isLoading: false,

  selectWorkspace: async () => {
    set({ isLoading: true });
    try {
      const handle = await window.showDirectoryPicker({ mode: "readwrite" });
      await storeHandle(handle);
      const projects = await scanProjects(handle);
      set({
        workspaceHandle: handle,
        workspaceName: handle.name,
        projects,
        currentProject: null,
        isLoading: false,
      });
    } catch (err) {
      // User cancelled the picker
      set({ isLoading: false });
      if ((err as Error).name !== "AbortError") throw err;
    }
  },

  refreshProjects: async () => {
    const { workspaceHandle } = get();
    if (!workspaceHandle) return;
    const projects = await scanProjects(workspaceHandle);
    set({ projects });
  },

  createProject: async (name: string) => {
    const { workspaceHandle } = get();
    if (!workspaceHandle) return;

    // Create project subdirectory
    const projectHandle = await workspaceHandle.getDirectoryHandle(name, {
      create: true,
    });

    // Initialize default Next.js project files in the subdirectory
    await writeFileToHandle(
      projectHandle,
      "package.json",
      JSON.stringify(
        {
          name,
          version: "1.0.0",
          private: true,
          scripts: {
            dev: "next dev",
            build: "next build",
            start: "next start",
          },
          dependencies: {},
        },
        null,
        2,
      ),
    );

    await writeFileToHandle(
      projectHandle,
      "app/layout.tsx",
      `export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 16 }}>
        <nav style={{ display: 'flex', gap: 16, marginBottom: "12px" }}>
          <a href="/">Home</a>
          <a href="/about">About</a>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
`,
    );

    await writeFileToHandle(
      projectHandle,
      "app/page.tsx",
      `'use client';
import { useState } from 'react';

export default function Home() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <h1>Welcome!</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  );
}
`,
    );

    await writeFileToHandle(
      projectHandle,
      "app/about/page.tsx",
      `export default function About() {
  return <h1>About</h1>;
}
`,
    );

    // Refresh project list and open the new project
    await get().refreshProjects();
    await get().openProject(name);
  },

  openProject: async (name: string) => {
    const { workspaceHandle } = get();
    if (!workspaceHandle) return;

    set({ isLoading: true });

    // Close current project first
    const { closeProject } = get();
    closeProject();

    // Read all files from the project subdirectory
    const projectHandle = await workspaceHandle.getDirectoryHandle(name);
    const files = await readDirectoryRecursive(projectHandle);

    // Initialize VFS with the loaded files
    const editorStore = useEditorStore.getState();
    editorStore.initVfs(files);

    set({ currentProject: name, isLoading: false });
  },

  deleteProject: async (name: string) => {
    const { workspaceHandle, currentProject } = get();
    if (!workspaceHandle) return;

    await workspaceHandle.removeEntry(name, { recursive: true });

    if (currentProject === name) {
      get().closeProject();
    }

    await get().refreshProjects();
  },

  closeProject: () => {
    const editorStore = useEditorStore.getState();
    editorStore.resetProject();
    set({ currentProject: null });
  },

  syncFileToDisk: async (path: string, content: string) => {
    const { workspaceHandle, currentProject } = get();
    if (!workspaceHandle || !currentProject) return;

    const projectHandle =
      await workspaceHandle.getDirectoryHandle(currentProject);
    await writeFileToHandle(projectHandle, path.slice(1), content); // Remove leading /
  },
}));

// Try to restore workspace on store initialization
(async () => {
  const handle = await restoreHandle();
  if (handle) {
    const projects = await scanProjects(handle);
    useWorkspaceStore.setState({
      workspaceHandle: handle,
      workspaceName: handle.name,
      projects,
    });
  }
})();
