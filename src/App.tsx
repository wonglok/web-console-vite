import { EditorPanel } from './components/EditorPanel';
import { PreviewPanel } from './components/PreviewPanel';

export default function App() {
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
