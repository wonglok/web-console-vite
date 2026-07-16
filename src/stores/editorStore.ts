/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import {
  VirtualFS,
  getServerBridge,
  ViteDevServer,
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
  devServer: ViteDevServer | null;
  bridge: ServerBridge | null;
  serverUrl: string;
  pkgManager: PackageManager | null;

  // File state
  files: FileTab[];
  currentFile: string;
  editorContent: string;

  // UI state
  isPreviewRunning: boolean;
  isPreviewLoading: boolean;
  hmrLogs: HmrLog[];

  // Package state
  installedPackages: Record<string, string>;
  isInstalling: boolean;
  installMessage: string;

  // Actions
  initVfs: () => void;
  loadFile: (path: string) => void;
  saveFile: () => void;
  updateEditorContent: (content: string) => void;
  setCurrentFile: (path: string) => void;
  startPreview: (iframeEl: HTMLIFrameElement) => Promise<void>;
  installPackage: (packageSpec: string) => Promise<void>;
  refreshInstalledPackages: () => void;
}

const defaultFiles: FileTab[] = [
  { path: "/src/App.tsx", label: "App.tsx" },
  { path: "/src/main.tsx", label: "main.tsx" },
  { path: "/index.html", label: "index.html" },
  { path: "/package.json", label: "package.json" },
];

export const useEditorStore = create<EditorState>()((set, get) => ({
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

  initVfs: () => {
    const vfs = new VirtualFS();
    vfs.mkdirSync("/src", { recursive: true });

    // package.json for dependency tracking
    vfs.writeFileSync(
      "/package.json",
      JSON.stringify(
        {
          name: "my-vite-app",
          version: "1.0.0",
          private: true,
          type: "module",
          scripts: {
            dev: "vite",
            build: "vite build",
            preview: "vite preview",
          },
          dependencies: {},
        },
        null,
        2,
      ),
    );

    // index.html — Vite entry point
    vfs.writeFileSync(
      "/index.html",
      `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    );

    // src/main.tsx — React bootstrap with JSX (App inlined)
    vfs.writeFileSync(
      "/src/main.tsx",
      `import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 32 }}>
      <h1>Vite + React</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
`,
    );

    // src/App.tsx — Editable component reference with JSX
    vfs.writeFileSync(
      "/src/App.tsx",
      `// Edit main.tsx for the active app. This file is a reference.
import React, { useState } from 'react';

export function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 32 }}>
      <h1>Vite + React</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
    </div>
  );
}
`,
    );

    const pkgManager = new PackageManager(vfs);
    const currentFile = get().currentFile;
    const content = vfs.readFileSync(currentFile, "utf8") as string;

    set({ vfs, pkgManager, editorContent: content });

    // Auto-install base packages needed by the Vite app
    pkgManager
      .install("react", { save: true })
      .then(() => pkgManager.install("react-dom", { save: true }))
      .then(() => {
        set({ installedPackages: pkgManager.list() });
      })
      .catch(() => {
        // Packages resolve from CDN at runtime if install fails
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

    if (existingDevServer) {
      existingDevServer.stop();
    }

    const devServer = new ViteDevServer(vfs, { port: 5173 });
    devServer.start();

    const bridge = getServerBridge();
    await bridge.initServiceWorker();
    bridge.registerServer(devServer as any, 5173);

    const serverUrl = bridge.getServerUrl(5173) + "/";

    // devServer.on("hmr-update", (update: { path: string }) => {
    //   set((state) => ({
    //     hmrLogs: [
    //       ...state.hmrLogs.slice(-9),
    //       { path: update.path, timestamp: Date.now() },
    //     ],
    //   }));
    // });

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

      const installed = pkgManager.list();
      set({
        installedPackages: installed,
        isInstalling: false,
        installMessage: "",
      });
    } catch (err: any) {
      set({
        isInstalling: false,
        installMessage: `Failed: ${err?.message || String(err)}`,
      });
    }
  },

  refreshInstalledPackages: () => {
    const { pkgManager } = get();
    if (!pkgManager) return;
    set({ installedPackages: pkgManager.list() });
  },
}));
