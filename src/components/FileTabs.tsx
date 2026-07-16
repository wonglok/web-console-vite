import { useEditorStore } from '../stores/editorStore';

export function FileTabs() {
  const files = useEditorStore((s) => s.files);
  const currentFile = useEditorStore((s) => s.currentFile);
  const setCurrentFile = useEditorStore((s) => s.setCurrentFile);

  return (
    <div className="flex border-b border-gray-700 bg-gray-900 overflow-x-auto shrink-0">
      {files.map((file) => (
        <button
          key={file.path}
          onClick={() => setCurrentFile(file.path)}
          className={`px-4 py-2 text-sm whitespace-nowrap border-r border-gray-700 transition-colors cursor-pointer ${
            currentFile === file.path
              ? 'bg-gray-800 text-white border-b-2 border-b-blue-500'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
          }`}
        >
          {file.label}
        </button>
      ))}
    </div>
  );
}
