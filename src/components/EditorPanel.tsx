import { useRef, useCallback } from 'react';
import { useEditorStore } from '../stores/editorStore';
import { FileTabs } from './FileTabs';
import { DependenciesPanel } from './DependenciesPanel';

export function EditorPanel() {
  const editorContent = useEditorStore((s) => s.editorContent);
  const updateEditorContent = useEditorStore((s) => s.updateEditorContent);
  const saveFile = useEditorStore((s) => s.saveFile);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveFile();
      }
      // Tab key inserts spaces
      if (e.key === 'Tab') {
        e.preventDefault();
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const newValue =
          editorContent.substring(0, start) + '  ' + editorContent.substring(end);
        updateEditorContent(newValue);
        // Restore cursor position after React re-render
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 2;
        });
      }
    },
    [saveFile, editorContent, updateEditorContent]
  );

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <FileTabs />
      <textarea
        ref={textareaRef}
        value={editorContent}
        onChange={(e) => updateEditorContent(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 w-full resize-none bg-gray-900 text-gray-200 p-4 font-mono text-sm leading-relaxed outline-none border-0"
        style={{ tabSize: 2 }}
        spellCheck={false}
      />
      <DependenciesPanel />
    </div>
  );
}
