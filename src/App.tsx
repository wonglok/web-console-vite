import { EditorPanel } from './components/EditorPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { useEditorStore } from './stores/editorStore';

export default function App() {
  const exportProject = useEditorStore((s) => s.exportProject);

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <header className="flex items-center px-6 py-3 border-b border-gray-800 bg-gray-950 shrink-0">
        <h1 className="text-lg font-semibold text-white tracking-tight">
          Editor + Next.js Preview
        </h1>
        <span className="ml-3 text-xs text-gray-500 font-mono bg-gray-800 px-2 py-0.5 rounded">
          almostnode
        </span>
        <div className="ml-auto">
          <button
            onClick={exportProject}
            className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors cursor-pointer"
          >
            Export ZIP
          </button>
        </div>
      </header>

      {/* Main two-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Editor */}
        <div className="w-1/2 border-r border-gray-800">
          <EditorPanel />
        </div>

        {/* Right: Preview */}
        <div className="w-1/2">
          <PreviewPanel />
        </div>
      </div>
    </div>
  );
}
