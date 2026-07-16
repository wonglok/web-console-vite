/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import {
  VirtualFS,
  getServerBridge,
  NextDevServer,
  PackageManager,
} from "almostnode";
import type { ServerBridge } from "almostnode";

export interface FileTab {
  path: string;
  label: string;
}

interface HmrLog {
  path: string;
  timestamp: number;
}

interface EditorState {
  // Core almostnode instances
  vfs: VirtualFS | null;
  devServer: NextDevServer | null;
  bridge: ServerBridge | null;
  serverUrl: string;
  pkgManager: PackageManager | null;
  previewIframe: HTMLIFrameElement | null;

  // File state
  files: FileTab[];
  currentFile: string;
  editorContent: string;
  vfsVersion: number;

  // UI state
  isPreviewRunning: boolean;
  isPreviewLoading: boolean;
  hmrLogs: HmrLog[];

  // Package state
  installedPackages: Record<string, string>;
  isInstalling: boolean;
  installMessage: string;

  // Actions
  initVfs: (files?: Record<string, string>) => void;
  resetProject: () => void;
  loadFile: (path: string) => void;
  saveFile: () => void;
  updateEditorContent: (content: string) => void;
  setCurrentFile: (path: string) => void;
  startPreview: (iframeEl: HTMLIFrameElement) => Promise<void>;
  installPackage: (packageSpec: string) => Promise<void>;
  installFromPackageJson: () => Promise<void>;
  refreshInstalledPackages: () => void;
}

const defaultFiles: FileTab[] = [
  { path: "/app/page.tsx", label: "page.tsx" },
  { path: "/app/layout.tsx", label: "layout.tsx" },
  { path: "/app/about/page.tsx", label: "about/page.tsx" },
  { path: "/package.json", label: "package.json" },
];

export const useEditorStore = create<EditorState>()((set, get) => ({
  vfs: null,
  devServer: null,
  bridge: null,
  serverUrl: "",
  pkgManager: null,
  previewIframe: null,
  files: defaultFiles,
  currentFile: defaultFiles[0].path,
  editorContent: "",
  vfsVersion: 0,
  isPreviewRunning: false,
  isPreviewLoading: false,
  hmrLogs: [],
  installedPackages: {},
  isInstalling: false,
  installMessage: "",

  initVfs: (files?: Record<string, string>) => {
    const vfs = new VirtualFS();

    if (files) {
      // Load existing project files from disk
      for (const [path, content] of Object.entries(files)) {
        const dir = path.substring(0, path.lastIndexOf("/"));
        if (dir) {
          try {
            vfs.mkdirSync(dir, { recursive: true });
          } catch {
            // directory may already exist
          }
        }
        vfs.writeFileSync(path, content);
      }

      const pkgManager = new PackageManager(vfs);
      const state = get();
      const firstFile = state.currentFile;
      const content = (() => {
        try {
          return vfs.readFileSync(firstFile, "utf8") as string;
        } catch {
          return "";
        }
      })();

      // Build file tabs from loaded files (excluding node_modules, .next)
      const tabEntries: FileTab[] = [];
      const walkVfs = (dir: string) => {
        const entries = vfs.readdirSync(dir);
        for (const name of entries) {
          const fullPath = dir === "/" ? `/${name}` : `${dir}/${name}`;
          if (name === "node_modules" || name === ".next") continue;
          try {
            const stat = vfs.statSync(fullPath);
            if (stat.isDirectory()) {
              walkVfs(fullPath);
            } else {
              tabEntries.push({
                path: fullPath,
                label: fullPath.split("/").slice(2).join("/") || name,
              });
            }
          } catch {
            // skip entries that can't be stated
          }
        }
      };
      walkVfs("/");

      set({
        vfs,
        pkgManager,
        editorContent: content,
        files: tabEntries.length > 0 ? tabEntries : defaultFiles,
        currentFile: tabEntries.length > 0 ? tabEntries[0].path : firstFile,
        installedPackages: {},
      });
      get().refreshInstalledPackages();
    } else {
      // Create new project with defaults
      vfs.mkdirSync("/app/about", { recursive: true });

      vfs.writeFileSync(
        "/package.json",
        JSON.stringify(
          {
            name: "my-nextjs-app",
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

      vfs.writeFileSync(
        "/app/layout.tsx",
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

      vfs.writeFileSync(
        "/app/page.tsx",
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

      vfs.writeFileSync(
        "/app/about/page.tsx",
        `export default function About() {
  return <h1>About</h1>;
}
`,
      );

      const pkgManager = new PackageManager(vfs);
      const currentFile = get().currentFile;
      const content = vfs.readFileSync(currentFile, "utf8") as string;

      set({ vfs, pkgManager, editorContent: content });
      get().refreshInstalledPackages();
    }
  },

  resetProject: () => {
    const { devServer } = get();
    if (devServer) {
      devServer.stop();
    }
    set({
      vfs: null,
      devServer: null,
      bridge: null,
      serverUrl: "",
      pkgManager: null,
      files: defaultFiles,
      currentFile: defaultFiles[0].path,
      editorContent: "",
      isPreviewRunning: false,
      isPreviewLoading: false,
      hmrLogs: [],
      installedPackages: {},
      isInstalling: false,
      installMessage: "",
    });
  },

  loadFile: (path: string) => {
    const { vfs } = get();
    if (!vfs) return;
    const content = vfs.readFileSync(path, "utf8") as string;
    set({ editorContent: content, currentFile: path });
  },

  saveFile: () => {
    const { vfs, currentFile, editorContent } = get();
    if (!vfs) return;
    vfs.writeFileSync(currentFile, editorContent);

    // Sync to disk asynchronously (fire-and-forget)
    import("./workspaceStore").then(({ useWorkspaceStore }) => {
      useWorkspaceStore.getState().syncFileToDisk(currentFile, editorContent);
    });
  },

  updateEditorContent: (content: string) => {
    set({ editorContent: content });
  },

  setCurrentFile: (path: string) => {
    const { loadFile } = get();
    loadFile(path);
  },

  startPreview: async (iframeEl: HTMLIFrameElement) => {
    const { vfs, devServer: existingDevServer } = get();
    if (!vfs) return;

    set({ isPreviewLoading: true });

    // Stop existing dev server if running
    if (existingDevServer) {
      existingDevServer.stop();
    }

    const devServer = new NextDevServer(vfs, { port: 3000, root: "/" });
    devServer.start();

    const bridge = getServerBridge();
    await bridge.initServiceWorker();
    bridge.registerServer(devServer as any, 3000);

    const serverUrl = bridge.getServerUrl(3000) + "/";

    devServer.on("hmr-update", (update: { path: string }) => {
      set((state) => ({
        hmrLogs: [
          ...state.hmrLogs.slice(-9),
          { path: update.path, timestamp: Date.now() },
        ],
      }));
    });

    iframeEl.onload = () => {
      if (iframeEl.contentWindow) {
        devServer.setHMRTarget(iframeEl.contentWindow);
      }
      set({ isPreviewLoading: false, isPreviewRunning: true });
    };

    iframeEl.src = serverUrl;

    set({ devServer, bridge, serverUrl });
  },

  installPackage: async (packageSpec: string) => {
    const { pkgManager } = get();
    if (!pkgManager) return;

    set({ isInstalling: true, installMessage: `Installing ${packageSpec}...` });

    try {
      await pkgManager.install(packageSpec, {
        save: true,
        onProgress: (message: string) => {
          set({ installMessage: message });
        },
      });

      set({
        isInstalling: false,
        installMessage: "",
      });
      get().refreshInstalledPackages();
    } catch (err: any) {
      set({
        isInstalling: false,
        installMessage: `Failed: ${err?.message || String(err)}`,
      });
    }
  },

  installFromPackageJson: async () => {
    const { pkgManager } = get();
    if (!pkgManager) return;

    set({ isInstalling: true, installMessage: "Installing all dependencies from package.json..." });

    try {
      await pkgManager.installFromPackageJson({
        save: true,
        onProgress: (message: string) => {
          set({ installMessage: message });
        },
      });

      set({
        isInstalling: false,
        installMessage: "",
      });
      get().refreshInstalledPackages();
    } catch (err: any) {
      set({
        isInstalling: false,
        installMessage: `Failed: ${err?.message || String(err)}`,
      });
    }
  },

  refreshInstalledPackages: () => {
    const { pkgManager, vfs } = get();
    if (!pkgManager || !vfs) return;

    // Merge: pkgManager.list() + dependencies from package.json
    const packages: Record<string, string> = {};
    try {
      const raw = vfs.readFileSync("/package.json", "utf8") as string;
      const pkgJson = JSON.parse(raw);
      if (pkgJson.dependencies) {
        Object.assign(packages, pkgJson.dependencies);
      }
    } catch {
      // package.json may not exist yet
    }
    // pkgManager.list() takes precedence for version info
    Object.assign(packages, pkgManager.list());
    set({ installedPackages: packages });
  },
}));
