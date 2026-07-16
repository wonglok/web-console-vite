import { useState, useRef, useEffect } from "react";
import { useChatStore, type DisplayToolCall } from "../stores/chatStore";
import { useEditorStore } from "../stores/editorStore";

function ToolCallBlock({ tc }: { tc: DisplayToolCall }) {
  const [expanded, setExpanded] = useState(false);

  const statusColor = {
    pending: "text-gray-400",
    running: "text-yellow-400",
    done: "text-green-400",
    error: "text-red-400",
  }[tc.status];

  const statusIcon = {
    pending: "○",
    running: "◌",
    done: "✓",
    error: "✗",
  }[tc.status];

  return (
    <div className="my-1 border border-gray-700 rounded-md overflow-hidden text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-750 text-left cursor-pointer"
      >
        <span className={statusColor}>{statusIcon}</span>
        <span className="text-gray-300 font-medium">{tc.name}</span>
        <span className="text-gray-500 truncate flex-1">
          {tc.name === "read_file" || tc.name === "write_file"
            ? (tc.args.path as string)
            : tc.name === "list_directory"
              ? (tc.args.path as string)
              : ""}
        </span>
        <svg
          className={`w-3 h-3 text-gray-500 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {expanded && (
        <div className="px-3 py-2 bg-gray-900 font-mono text-gray-400 max-h-48 overflow-y-auto">
          {tc.args.content ? (
            <pre className="whitespace-pre-wrap break-words">
              {String(tc.args.content).slice(0, 2000)}
            </pre>
          ) : tc.result ? (
            <pre className="whitespace-pre-wrap break-words">
              {tc.result.slice(0, 2000)}
            </pre>
          ) : (
            <pre className="text-gray-500">Waiting...</pre>
          )}
        </div>
      )}
    </div>
  );
}

export function ChatPanel() {
  const messages = useChatStore((s) => s.messages);
  const isLoading = useChatStore((s) => s.isLoading);
  const streamingText = useChatStore((s) => s.streamingText);
  const streamingToolCalls = useChatStore((s) => s.streamingToolCalls);
  const apiKey = useChatStore((s) => s.apiKey);
  const model = useChatStore((s) => s.model);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const clearChat = useChatStore((s) => s.clearChat);
  const setApiKey = useChatStore((s) => s.setApiKey);
  const setModel = useChatStore((s) => s.setModel);
  const currentProject = useEditorStore((s) => s.vfs !== null);

  const [input, setInput] = useState("");
  const [showSettings, setShowSettings] = useState(!apiKey);
  const [keyInput, setKeyInput] = useState(apiKey);
  const [modelInput, setModelInput] = useState(model);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText, streamingToolCalls]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSaveSettings = () => {
    setApiKey(keyInput.trim());
    setModel(modelInput.trim() || "deepseek-v4-pro");
    setShowSettings(false);
  };

  return (
    <div className="h-full flex flex-col bg-gray-950 border-r border-gray-800 w-80 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
            />
          </svg>
          <span className="text-sm font-medium text-gray-200">Chat Agent</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1 rounded transition-colors cursor-pointer ${
              showSettings
                ? "bg-gray-700 text-gray-200"
                : "text-gray-500 hover:text-gray-300"
            }`}
            title="Settings"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.827 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.827 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.827-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.827-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
          <button
            onClick={clearChat}
            className="p-1 text-gray-500 hover:text-gray-300 rounded transition-colors cursor-pointer"
            title="Clear chat"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="px-3 py-3 border-b border-gray-800 bg-gray-900 space-y-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">API Key</label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="sk-..."
              className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-gray-200 outline-none focus:border-blue-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Model</label>
            <input
              type="text"
              value={modelInput}
              onChange={(e) => setModelInput(e.target.value)}
              placeholder="deepseek-v4-pro"
              className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-gray-200 outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleSaveSettings}
            className="w-full px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors cursor-pointer"
          >
            Save Settings
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 && !currentProject && (
          <div className="text-center text-gray-600 text-xs mt-8">
            Open a project to start coding with the agent.
          </div>
        )}
        {messages.length === 0 && currentProject && (
          <div className="text-center text-gray-600 text-xs mt-8 px-2">
            Ask me to build features, fix bugs, or explain code. I can read and
            write files in your project.
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === "user" ? (
              <div className="flex justify-end">
                <div className="max-w-[90%] bg-blue-600/20 text-blue-100 rounded-lg px-3 py-2 text-sm">
                  {msg.text}
                </div>
              </div>
            ) : (
              <div>
                {msg.text && (
                  <div className="text-sm text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
                    {msg.text}
                  </div>
                )}
                {msg.toolCalls?.map((tc) => (
                  <ToolCallBlock key={tc.id} tc={tc} />
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Streaming response */}
        {isLoading && (
          <div>
            {streamingText && (
              <div className="text-sm text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
                {streamingText}
              </div>
            )}
            {streamingToolCalls.map((tc) => (
              <ToolCallBlock key={tc.id} tc={tc} />
            ))}
            {!streamingText && streamingToolCalls.length === 0 && (
              <div className="flex items-center gap-2 text-gray-500 text-xs">
                <svg
                  className="animate-spin w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Thinking...
              </div>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-2.5 border-t border-gray-800 shrink-0">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              !apiKey
                ? "Set API key in settings..."
                : !currentProject
                  ? "Open a project first..."
                  : "Ask the agent..."
            }
            disabled={isLoading || !currentProject}
            rows={2}
            className="flex-1 resize-none bg-gray-800 text-gray-200 text-sm px-3 py-1.5 rounded-md outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-600 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !currentProject || !input.trim()}
            className="self-end px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
