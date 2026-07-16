import { useState, useRef, useEffect } from "react";
import { useChatStore, type DisplayToolCall } from "../stores/chatStore";
import { useEditorStore } from "../stores/editorStore";

function ToolCallBlock({ tc }: { tc: DisplayToolCall }) {
  const [expanded, setExpanded] = useState(false);

  const statusColor: Record<string, string> = {
    pending: "var(--vscode-fg-muted)",
    running: "var(--vscode-warning)",
    done: "var(--vscode-success)",
    error: "var(--vscode-error)",
  };

  const statusIcon: Record<string, string> = {
    pending: "○",
    running: "◌",
    done: "✓",
    error: "✗",
  };

  return (
    <div className="my-0.5 text-xs" style={{ border: "1px solid var(--vscode-border)" }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-2 py-1 text-left transition-colors"
        style={{ background: "var(--vscode-sidebar)" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--vscode-list-hover)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--vscode-sidebar)";
        }}
      >
        <span style={{ color: statusColor[tc.status] }}>
          {statusIcon[tc.status]}
        </span>
        <span className="font-medium" style={{ color: "var(--vscode-fg)" }}>
          {tc.name}
        </span>
        <span className="truncate flex-1" style={{ color: "var(--vscode-fg-muted)" }}>
          {tc.name === "read_file" || tc.name === "write_file"
            ? (tc.args.path as string)
            : tc.name === "list_directory"
              ? (tc.args.path as string)
              : tc.name === "install_package"
                ? (tc.args.package as string)
                : ""}
        </span>
        <svg
          className="w-3 h-3 transition-transform shrink-0"
          style={{
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            color: "var(--vscode-fg-muted)",
          }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div
          className="px-2 py-1.5 font-mono max-h-48 overflow-y-auto"
          style={{
            background: "var(--vscode-editor)",
            color: "var(--vscode-fg)",
          }}
        >
          <pre className="whitespace-pre-wrap break-words">
            {tc.args.content
              ? String(tc.args.content).slice(0, 2000)
              : tc.result
                ? tc.result.slice(0, 2000)
                : "Waiting..."}
          </pre>
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
    <div className="h-full flex flex-col" style={{ background: "var(--vscode-editor)" }}>
      {/* Settings panel */}
      {showSettings && (
        <div
          className="px-3 py-2 space-y-2 shrink-0"
          style={{
            background: "var(--vscode-sidebar)",
            borderBottom: "1px solid var(--vscode-border)",
          }}
        >
          <div>
            <label
              className="block text-xs mb-0.5"
              style={{ color: "var(--vscode-fg-muted)" }}
            >
              API Key
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="sk-..."
              className="w-full px-2 py-1 text-xs outline-none font-mono"
              style={{
                background: "var(--vscode-input-bg)",
                color: "var(--vscode-input-fg)",
                border: "1px solid var(--vscode-input-border)",
              }}
            />
          </div>
          <div>
            <label
              className="block text-xs mb-0.5"
              style={{ color: "var(--vscode-fg-muted)" }}
            >
              Model
            </label>
            <input
              type="text"
              value={modelInput}
              onChange={(e) => setModelInput(e.target.value)}
              placeholder="deepseek-v4-pro"
              className="w-full px-2 py-1 text-xs outline-none"
              style={{
                background: "var(--vscode-input-bg)",
                color: "var(--vscode-input-fg)",
                border: "1px solid var(--vscode-input-border)",
              }}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveSettings}
              className="px-3 py-1 text-xs font-medium transition-colors cursor-pointer"
              style={{
                background: "var(--vscode-button-bg)",
                color: "var(--vscode-button-fg)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--vscode-button-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--vscode-button-bg)";
              }}
            >
              Save
            </button>
            <button
              onClick={() => setShowSettings(false)}
              className="px-3 py-1 text-xs transition-colors cursor-pointer"
              style={{
                background: "var(--vscode-button-secondary-bg)",
                color: "var(--vscode-fg)",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {messages.length === 0 && !currentProject && (
          <div
            className="text-center text-xs mt-8"
            style={{ color: "var(--vscode-fg-dim)" }}
          >
            Open a project to start coding with the agent.
          </div>
        )}
        {messages.length === 0 && currentProject && (
          <div
            className="text-center text-xs mt-8 px-2"
            style={{ color: "var(--vscode-fg-dim)" }}
          >
            Ask me to build features, fix bugs, or explain code.
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === "user" ? (
              <div className="flex justify-end">
                <div
                  className="max-w-[88%] px-3 py-1.5 text-sm"
                  style={{
                    background: "var(--vscode-button-bg)",
                    color: "var(--vscode-button-fg)",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ) : (
              <div>
                {msg.text && (
                  <div
                    className="text-sm whitespace-pre-wrap break-words leading-relaxed"
                    style={{ color: "var(--vscode-fg)" }}
                  >
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
              <div
                className="text-sm whitespace-pre-wrap break-words leading-relaxed"
                style={{ color: "var(--vscode-fg)" }}
              >
                {streamingText}
              </div>
            )}
            {streamingToolCalls.map((tc) => (
              <ToolCallBlock key={tc.id} tc={tc} />
            ))}
            {!streamingText && streamingToolCalls.length === 0 && (
              <div
                className="flex items-center gap-2 text-xs"
                style={{ color: "var(--vscode-fg-muted)" }}
              >
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
      <div
        className="px-3 py-2 shrink-0"
        style={{
          borderTop: "1px solid var(--vscode-border)",
          background: "var(--vscode-editor)",
        }}
      >
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
                  : "Ask the agent... (Enter to send, Shift+Enter for newline)"
            }
            disabled={isLoading || !currentProject}
            rows={2}
            className="flex-1 resize-none text-sm px-2 py-1 outline-none font-mono"
            style={{
              background: "var(--vscode-input-bg)",
              color: "var(--vscode-input-fg)",
              border: "1px solid var(--vscode-input-border)",
            }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !currentProject || !input.trim()}
            className="self-end px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40 cursor-pointer"
            style={{
              background: "var(--vscode-button-bg)",
              color: "var(--vscode-button-fg)",
            }}
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
