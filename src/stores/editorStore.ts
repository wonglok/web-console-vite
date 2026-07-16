/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { VirtualFS, getServerBridge, NextDevServer } from "almostnode";
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

  // File state
  files: FileTab[];
  currentFile: string;
  editorContent: string;

  // UI state
  isPreviewRunning: boolean;
  isPreviewLoading: boolean;
  hmrLogs: HmrLog[];

  // Actions
  initVfs: () => void;
  loadFile: (path: string) => void;
  saveFile: () => void;
  updateEditorContent: (content: string) => void;
  setCurrentFile: (path: string) => void;
  startPreview: (iframeEl: HTMLIFrameElement) => Promise<void>;
}

const defaultFiles: FileTab[] = [
  { path: "/app/page.tsx", label: "page.tsx" },
  { path: "/app/layout.tsx", label: "layout.tsx" },
  { path: "/app/about/page.tsx", label: "about/page.tsx" },
];

export const useEditorStore = create<EditorState>()((set, get) => ({
  vfs: null,
  devServer: null,
  bridge: null,
  serverUrl: "",
  files: defaultFiles,
  currentFile: defaultFiles[0].path,
  editorContent: "",
  isPreviewRunning: false,
  isPreviewLoading: false,
  hmrLogs: [],

  initVfs: () => {
    const vfs = new VirtualFS();
    vfs.mkdirSync("/app/about", { recursive: true });

    vfs.writeFileSync(
      "/app/layout.tsx",
      `export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div lang="en">
      <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 16 }}>
        <nav style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <a href="/">Home</a>
          <a href="/about">About</a>
        </nav>
        <main>{children}</main>
      </div>
    </div>
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

    const currentFile = get().currentFile;
    const content = vfs.readFileSync(currentFile, "utf8") as string;

    set({ vfs, editorContent: content });
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
    // HMR triggers automatically — devServer watches the VFS
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
}));
