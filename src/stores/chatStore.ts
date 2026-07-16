import { create } from "zustand";
import OpenAI from "openai";
import { useEditorStore } from "./editorStore";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// --- Types ---

export interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  toolCalls?: DisplayToolCall[];
  timestamp: number;
}

export interface DisplayToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: string;
  status: "pending" | "running" | "done" | "error";
}

interface ChatState {
  messages: DisplayMessage[];
  apiMessages: ChatCompletionMessageParam[];
  isLoading: boolean;
  streamingText: string;
  streamingToolCalls: DisplayToolCall[];
  apiKey: string;
  model: string;

  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
}

// --- Constants ---

const SYSTEM_PROMPT = `You are an expert coding assistant integrated into a web-based code editor. The user is building a Next.js application. You can read files, write files, and list directories in their project.

Guidelines:
- Be concise and direct. Write code, not essays.
- When asked to build a feature, read existing files first to understand the project structure, then write the necessary code.
- Prefer editing existing files over creating new ones when appropriate.
- Use TypeScript and React best practices.
- The project uses Tailwind CSS v4 for styling.
- When writing files, write the complete file content (not just diffs).
- Default to App Router conventions (app/ directory).`;

const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read the contents of a file in the project",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description:
              "File path relative to project root, e.g. /app/page.tsx",
          },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description:
        "Write or overwrite a file in the project. Provide the complete file content.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description:
              "File path relative to project root, e.g. /app/components/Nav.tsx",
          },
          content: {
            type: "string",
            description: "Complete file contents",
          },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_directory",
      description: "List files and subdirectories in a project directory",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Directory path, e.g. /app or / (root)",
          },
        },
        required: ["path"],
      },
    },
  },
];

// --- Helpers ---

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function loadApiKey(): string {
  try {
    return localStorage.getItem("chat-api-key") || "";
  } catch {
    return "";
  }
}

function saveApiKey(key: string) {
  try {
    localStorage.setItem("chat-api-key", key);
  } catch {
    // ignore
  }
}

function getClient(apiKey: string): OpenAI {
  return new OpenAI({
    baseURL: "/api/deepseek/v1",
    apiKey,
    dangerouslyAllowBrowser: true,
  });
}

// --- Execute tools ---

function executeTool(name: string, args: Record<string, unknown>): string {
  const editor = useEditorStore.getState();
  const vfs = editor.vfs;

  if (!vfs) return "Error: No project is open.";

  switch (name) {
    case "read_file": {
      const path = args.path as string;
      try {
        return vfs.readFileSync(path, "utf8") as string;
      } catch {
        return `Error: File not found at "${path}"`;
      }
    }

    case "write_file": {
      const path = args.path as string;
      const content = args.content as string;
      const dir = path.substring(0, path.lastIndexOf("/"));
      if (dir) {
        try {
          vfs.mkdirSync(dir, { recursive: true });
        } catch {
          // dir may already exist
        }
      }
      vfs.writeFileSync(path, content);

      if (editor.currentFile === path) {
        editor.updateEditorContent(content);
      }

      const newFiles = editor.files.some((f) => f.path === path)
        ? editor.files
        : [
            ...editor.files,
            {
              path,
              label:
                path.split("/").slice(2).join("/") ||
                path.split("/").pop() ||
                path,
            },
          ];

      import("./workspaceStore").then(({ useWorkspaceStore }) => {
        useWorkspaceStore.getState().syncFileToDisk(path, content);
      });

      useEditorStore.setState({ files: newFiles });

      return `Successfully wrote ${path}`;
    }

    case "list_directory": {
      const path = args.path as string;
      try {
        const entries = vfs.readdirSync(path);
        const lines: string[] = [];
        for (const name of entries) {
          if (name === "node_modules" || name === ".next") continue;
          const fullPath = path === "/" ? `/${name}` : `${path}/${name}`;
          try {
            const stat = vfs.statSync(fullPath);
            const prefix = stat.isDirectory() ? "📁" : "📄";
            lines.push(`${prefix} ${fullPath}`);
          } catch {
            lines.push(` ? ${fullPath}`);
          }
        }
        return lines.length > 0 ? lines.join("\n") : "(empty directory)";
      } catch {
        return `Error: Directory not found at "${path}"`;
      }
    }

    default:
      return `Unknown tool: ${name}`;
  }
}

// --- Store ---

export const useChatStore = create<ChatState>()((set, get) => ({
  messages: [],
  apiMessages: [],
  isLoading: false,
  streamingText: "",
  streamingToolCalls: [],
  apiKey: loadApiKey(),
  model: "deepseek-v4-pro",

  setApiKey: (key: string) => {
    saveApiKey(key);
    set({ apiKey: key });
  },

  setModel: (model: string) => {
    set({ model });
  },

  clearChat: () => {
    set({
      messages: [],
      apiMessages: [],
      streamingText: "",
      streamingToolCalls: [],
    });
  },

  sendMessage: async (content: string) => {
    const { apiKey, apiMessages, model } = get();
    if (!apiKey) {
      set((s) => ({
        messages: [
          ...s.messages,
          {
            id: uid(),
            role: "assistant",
            text: "Please set your DeepSeek API key first. Click the settings icon in the chat header.",
            timestamp: Date.now(),
          },
        ],
      }));
      return;
    }

    const client = getClient(apiKey);

    // Add user message
    const userMsg: DisplayMessage = {
      id: uid(),
      role: "user",
      text: content,
      timestamp: Date.now(),
    };

    set((s) => ({
      messages: [...s.messages, userMsg],
      isLoading: true,
      streamingText: "",
      streamingToolCalls: [],
    }));

    const newApiMessages: ChatCompletionMessageParam[] = [
      ...apiMessages,
      { role: "user", content },
    ];

    const currentMessages = newApiMessages;
    const displayMessages: DisplayMessage[] = [...get().messages];

    try {
      let maxTurns = 10;

      while (maxTurns-- > 0) {
        const stream = await client.chat.completions.create({
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...currentMessages,
          ],
          tools: TOOLS,
          stream: true,
        });

        let accumulatedText = "";
        const toolCallMap = new Map<
          number,
          { id: string; name: string; arguments: string }
        >();
        const streamingList: DisplayToolCall[] = [];
        let finishReason: string | null = null;

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta;
          finishReason = chunk.choices[0]?.finish_reason || finishReason;

          if (delta?.content) {
            accumulatedText += delta.content;
            set({ streamingText: accumulatedText });
          }

          if (delta?.tool_calls) {
            for (const tcDelta of delta.tool_calls) {
              const idx = tcDelta.index;
              if (!toolCallMap.has(idx)) {
                const tc = {
                  id: tcDelta.id || "",
                  name: tcDelta.function?.name || "",
                  arguments: "",
                };
                toolCallMap.set(idx, tc);
                const displayTc: DisplayToolCall = {
                  id: tc.id,
                  name: tc.name,
                  args: {},
                  status: "pending",
                };
                streamingList.push(displayTc);
                set({ streamingToolCalls: [...streamingList] });
              }

              const tc = toolCallMap.get(idx)!;
              if (tcDelta.id) tc.id = tcDelta.id;
              if (tcDelta.function?.name) tc.name = tcDelta.function.name;
              if (tcDelta.function?.arguments) {
                tc.arguments += tcDelta.function.arguments;
                // Find matching display tc and update
                const displayTc = streamingList.find(
                  (d) => d.id === tc.id || d.name === tc.name,
                );
                if (displayTc) {
                  displayTc.args = {
                    ...displayTc.args,
                    _partial:
                      ((displayTc.args._partial as string) || "") +
                      tcDelta.function.arguments,
                  };
                  set({ streamingToolCalls: [...streamingList] });
                }
              }
            }
          }
        }

        // Resolve tool calls — parse accumulated JSON
        for (const [, tc] of toolCallMap) {
          const displayTc = streamingList.find(
            (d) => d.id === tc.id || d.name === tc.name,
          );
          if (displayTc) {
            try {
              displayTc.args = JSON.parse(tc.arguments);
            } catch {
              displayTc.args = {};
            }
            displayTc.status = "running";
          }
        }
        set({ streamingToolCalls: [...streamingList] });

        if (finishReason !== "tool_calls" || toolCallMap.size === 0) {
          // Final text response
          const assistantMsg: DisplayMessage = {
            id: uid(),
            role: "assistant",
            text: accumulatedText,
            toolCalls:
              streamingList.length > 0 ? [...streamingList] : undefined,
            timestamp: Date.now(),
          };

          currentMessages.push({
            role: "assistant",
            content: accumulatedText || null,
            tool_calls:
              streamingList.length > 0
                ? [...toolCallMap.entries()].map(([, tc]) => ({
                    id: tc.id,
                    type: "function" as const,
                    function: {
                      name: tc.name,
                      arguments: tc.arguments,
                    },
                  }))
                : undefined,
          });

          displayMessages.push(assistantMsg);
          set({
            messages: [...displayMessages],
            apiMessages: currentMessages,
            isLoading: false,
            streamingText: "",
            streamingToolCalls: [],
          });
          return;
        }

        // Tool use — execute tools
        for (const [, tc] of toolCallMap) {
          const displayTc = streamingList.find(
            (d) => d.id === tc.id || d.name === tc.name,
          );

          let parsedArgs: Record<string, unknown> = {};
          try {
            parsedArgs = JSON.parse(tc.arguments);
          } catch {
            // keep empty
          }

          if (displayTc) {
            displayTc.args = parsedArgs;
            displayTc.status = "running";
          }
          set({ streamingToolCalls: [...streamingList] });

          const result = executeTool(tc.name, parsedArgs);

          if (displayTc) {
            displayTc.result = result;
            displayTc.status = result.startsWith("Error") ? "error" : "done";
          }
        }

        // Build assistant message with tool calls for API
        const assistantToolCalls = [...toolCallMap.entries()].map(([, tc]) => ({
          id: tc.id,
          type: "function" as const,
          function: {
            name: tc.name,
            arguments: tc.arguments,
          },
        }));

        currentMessages.push({
          role: "assistant",
          content: accumulatedText || null,
          tool_calls: assistantToolCalls,
        });

        // Add tool result messages
        for (const [, tc] of toolCallMap) {
          const displayTc = streamingList.find(
            (d) => d.id === tc.id || d.name === tc.name,
          );
          currentMessages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: displayTc?.result || "",
          });
        }

        // Add to display
        const assistantMsg: DisplayMessage = {
          id: uid(),
          role: "assistant",
          text: accumulatedText || "",
          toolCalls: streamingList.map((tc) => ({ ...tc })),
          timestamp: Date.now(),
        };
        displayMessages.push(assistantMsg);

        set({
          streamingText: "",
          streamingToolCalls: [],
          messages: [...displayMessages],
        });
      }

      // Max turns reached
      set({
        isLoading: false,
        apiMessages: currentMessages,
        messages: [
          ...displayMessages,
          {
            id: uid(),
            role: "assistant",
            text: "(Reached maximum tool use turns for this message.)",
            timestamp: Date.now(),
          },
        ],
        streamingText: "",
        streamingToolCalls: [],
      });
    } catch (err) {
      set((s) => ({
        isLoading: false,
        streamingText: "",
        streamingToolCalls: [],
        messages: [
          ...s.messages,
          {
            id: uid(),
            role: "assistant",
            text: `Error: ${(err as Error).message || String(err)}`,
            timestamp: Date.now(),
          },
        ],
      }));
    }
  },
}));
