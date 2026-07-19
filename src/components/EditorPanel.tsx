import { useCallback, useRef, useEffect } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useEditorStore } from "../stores/editorStore";
import { FileTabs } from "./FileTabs";

// Comprehensive React + HTML DOM type declarations for Monaco TSX support
const REACT_DTS = `
declare module "react" {
  export = React;
}
declare namespace React {
  function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prev: T) => T)) => void];
  function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  function useRef<T>(initialValue?: T): { current: T | undefined };
  function useRef<T>(initialValue: T): { current: T };
  function useCallback<T extends (...args: any[]) => any>(callback: T, deps: readonly unknown[]): T;
  function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  function useContext<T>(context: React.Context<T>): T;
  function createContext<T>(defaultValue: T): React.Context<T>;
  function createElement<P extends object>(
    type: string | ((props: P) => React.ReactElement | null),
    props?: P,
    ...children: React.ReactNode[]
  ): React.ReactElement;
  function Fragment(props: { children?: React.ReactNode }): React.ReactElement | null;
  function forwardRef<T, P = object>(render: (props: P, ref: React.Ref<T>) => React.ReactElement | null): React.FC<P & { ref?: React.Ref<T> }>;

  export interface Context<T> { Provider: React.FC<{ value: T; children?: React.ReactNode }>; Consumer: React.FC<{ children: (value: T) => React.ReactNode }>; }
  export type FC<P = object> = (props: P & { children?: ReactNode }) => ReactElement | null;
  export type ReactNode = ReactElement | string | number | boolean | null | undefined | ReactNode[];
  export type ReactElement = { type: any; props: any; key: string | null };
  export type Ref<T> = { current: T | null } | ((instance: T | null) => void) | null;
  export type CSSProperties = { [key: string]: string | number | undefined };
  export type Dispatch<A> = (value: A) => void;
  export type SetStateAction<S> = S | ((prev: S) => S);

  export interface FormEvent<T = Element> { preventDefault(): void; stopPropagation(): void; target: T; currentTarget: T; }
  export interface ChangeEvent<T = Element> { target: T; currentTarget: T; preventDefault(): void; }
  export interface KeyboardEvent<T = Element> { key: string; code: string; target: T; currentTarget: T; preventDefault(): void; stopPropagation(): void; altKey: boolean; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; }
  export interface MouseEvent<T = Element> { target: T; currentTarget: T; preventDefault(): void; stopPropagation(): void; clientX: number; clientY: number; button: number; altKey: boolean; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; }
  export interface FocusEvent<T = Element> { target: T; currentTarget: T; }
  export interface PointerEvent<T = Element> { target: T; currentTarget: T; clientX: number; clientY: number; }

  // HTML attributes shared by all elements
  interface DOMAttributes<T> {
    children?: ReactNode;
    className?: string;
    id?: string;
    style?: CSSProperties;
    title?: string;
    tabIndex?: number;
    hidden?: boolean;
    lang?: string;
    dir?: string;
    role?: string;
    'aria-label'?: string;
    'aria-hidden'?: boolean;
    'aria-expanded'?: boolean;
    'data-*'?: string;
    key?: string | number;
    ref?: Ref<T>;
    dangerouslySetInnerHTML?: { __html: string };
    onClick?: (e: MouseEvent<T>) => void;
    onDoubleClick?: (e: MouseEvent<T>) => void;
    onMouseDown?: (e: MouseEvent<T>) => void;
    onMouseUp?: (e: MouseEvent<T>) => void;
    onMouseEnter?: (e: MouseEvent<T>) => void;
    onMouseLeave?: (e: MouseEvent<T>) => void;
    onMouseMove?: (e: MouseEvent<T>) => void;
    onFocus?: (e: FocusEvent<T>) => void;
    onBlur?: (e: FocusEvent<T>) => void;
    onChange?: (e: ChangeEvent<T>) => void;
    onInput?: (e: FormEvent<T>) => void;
    onSubmit?: (e: FormEvent<T>) => void;
    onKeyDown?: (e: KeyboardEvent<T>) => void;
    onKeyUp?: (e: KeyboardEvent<T>) => void;
    onKeyPress?: (e: KeyboardEvent<T>) => void;
    onPointerDown?: (e: PointerEvent<T>) => void;
    onPointerUp?: (e: PointerEvent<T>) => void;
    onPointerMove?: (e: PointerEvent<T>) => void;
    onScroll?: (e: React.UIEvent<T>) => void;
    onWheel?: (e: React.WheelEvent<T>) => void;
    onDrag?: (e: React.DragEvent<T>) => void;
    onDragStart?: (e: React.DragEvent<T>) => void;
    onDragEnd?: (e: React.DragEvent<T>) => void;
    onDragOver?: (e: React.DragEvent<T>) => void;
    onDrop?: (e: React.DragEvent<T>) => void;
  }

  interface HTMLAttributes<T> extends DOMAttributes<T> {
    defaultChecked?: boolean;
    defaultValue?: string | string[];
    suppressContentEditableWarning?: boolean;
    accessKey?: string;
    contentEditable?: boolean | "inherit";
    contextMenu?: string;
    draggable?: boolean;
    placeholder?: string;
    spellCheck?: boolean;
    autoFocus?: boolean;
  }

  interface AnchorHTMLAttributes<T> extends HTMLAttributes<T> { href?: string; target?: string; rel?: string; download?: string; }
  interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> { disabled?: boolean; type?: "button" | "submit" | "reset"; form?: string; }
  interface FormHTMLAttributes<T> extends HTMLAttributes<T> { action?: string; method?: string; encType?: string; noValidate?: boolean; }
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    type?: string; name?: string; value?: string | number; defaultValue?: string;
    placeholder?: string; disabled?: boolean; readOnly?: boolean; required?: boolean;
    min?: number | string; max?: number | string; step?: number | string;
    pattern?: string; autoComplete?: string; checked?: boolean; multiple?: boolean;
    accept?: string; minLength?: number; maxLength?: number; size?: number;
    onChange?: (e: ChangeEvent<T>) => void; onInput?: (e: FormEvent<T>) => void;
  }
  interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {
    name?: string; value?: string; defaultValue?: string; placeholder?: string;
    disabled?: boolean; readOnly?: boolean; required?: boolean; rows?: number; cols?: number;
    minLength?: number; maxLength?: number; wrap?: string;
  }
  interface SelectHTMLAttributes<T> extends HTMLAttributes<T> {
    name?: string; value?: string | string[]; defaultValue?: string | string[];
    disabled?: boolean; required?: boolean; multiple?: boolean; size?: number;
  }
  interface OptionHTMLAttributes<T> extends HTMLAttributes<T> { value?: string | number; selected?: boolean; disabled?: boolean; label?: string; }
  interface LabelHTMLAttributes<T> extends HTMLAttributes<T> { htmlFor?: string; }
  interface ImgHTMLAttributes<T> extends HTMLAttributes<T> { src?: string; alt?: string; width?: number | string; height?: number | string; loading?: "lazy" | "eager"; }
  interface MediaHTMLAttributes<T> extends HTMLAttributes<T> { src?: string; controls?: boolean; autoPlay?: boolean; loop?: boolean; muted?: boolean; }
  interface TableHTMLAttributes<T> extends HTMLAttributes<T> { cellPadding?: number | string; cellSpacing?: number | string; }
  interface TdHTMLAttributes<T> extends HTMLAttributes<T> { colSpan?: number; rowSpan?: number; }
  interface ThHTMLAttributes<T> extends HTMLAttributes<T> { colSpan?: number; rowSpan?: number; scope?: string; }
  interface IframeHTMLAttributes<T> extends HTMLAttributes<T> { src?: string; sandbox?: string; allow?: string; width?: number | string; height?: number | string; }
  interface ObjectHTMLAttributes<T> extends HTMLAttributes<T> { data?: string; type?: string; width?: number | string; height?: number | string; }
  interface MetaHTMLAttributes<T> extends HTMLAttributes<T> { name?: string; content?: string; charSet?: string; }
  interface LinkHTMLAttributes<T> extends HTMLAttributes<T> { href?: string; rel?: string; type?: string; media?: string; }
  interface StyleHTMLAttributes<T> extends HTMLAttributes<T> { media?: string; scoped?: boolean; }
  interface ScriptHTMLAttributes<T> extends HTMLAttributes<T> { src?: string; type?: string; async?: boolean; defer?: boolean; }
  interface ProgressHTMLAttributes<T> extends HTMLAttributes<T> { value?: number; max?: number; }
  interface DetailsHTMLAttributes<T> extends HTMLAttributes<T> { open?: boolean; }

  namespace JSX {
    interface Element extends React.ReactElement {}
    interface ElementClass { render(): React.ReactNode; }
    interface ElementAttributesProperty { props: {}; }
    interface ElementChildrenAttribute { children: {}; }
    interface IntrinsicElements {
      a: AnchorHTMLAttributes<HTMLAnchorElement>;
      abbr: HTMLAttributes<HTMLElement>;
      address: HTMLAttributes<HTMLElement>;
      area: HTMLAttributes<HTMLAreaElement>;
      article: HTMLAttributes<HTMLElement>;
      aside: HTMLAttributes<HTMLElement>;
      audio: MediaHTMLAttributes<HTMLAudioElement>;
      b: HTMLAttributes<HTMLElement>;
      base: HTMLAttributes<HTMLBaseElement>;
      bdi: HTMLAttributes<HTMLElement>;
      bdo: HTMLAttributes<HTMLElement>;
      blockquote: HTMLAttributes<HTMLElement>;
      body: HTMLAttributes<HTMLBodyElement>;
      br: HTMLAttributes<HTMLBRElement>;
      button: ButtonHTMLAttributes<HTMLButtonElement>;
      canvas: HTMLAttributes<HTMLCanvasElement>;
      caption: HTMLAttributes<HTMLElement>;
      cite: HTMLAttributes<HTMLElement>;
      code: HTMLAttributes<HTMLElement>;
      col: HTMLAttributes<HTMLTableColElement>;
      colgroup: HTMLAttributes<HTMLTableColElement>;
      data: HTMLAttributes<HTMLElement>;
      datalist: HTMLAttributes<HTMLDataListElement>;
      dd: HTMLAttributes<HTMLElement>;
      del: HTMLAttributes<HTMLElement>;
      details: DetailsHTMLAttributes<HTMLElement>;
      dfn: HTMLAttributes<HTMLElement>;
      dialog: HTMLAttributes<HTMLDialogElement>;
      div: HTMLAttributes<HTMLDivElement>;
      dl: HTMLAttributes<HTMLDListElement>;
      dt: HTMLAttributes<HTMLElement>;
      em: HTMLAttributes<HTMLElement>;
      embed: HTMLAttributes<HTMLEmbedElement>;
      fieldset: HTMLAttributes<HTMLFieldSetElement>;
      figcaption: HTMLAttributes<HTMLElement>;
      figure: HTMLAttributes<HTMLElement>;
      footer: HTMLAttributes<HTMLElement>;
      form: FormHTMLAttributes<HTMLFormElement>;
      h1: HTMLAttributes<HTMLHeadingElement>;
      h2: HTMLAttributes<HTMLHeadingElement>;
      h3: HTMLAttributes<HTMLHeadingElement>;
      h4: HTMLAttributes<HTMLHeadingElement>;
      h5: HTMLAttributes<HTMLHeadingElement>;
      h6: HTMLAttributes<HTMLHeadingElement>;
      head: HTMLAttributes<HTMLHeadElement>;
      header: HTMLAttributes<HTMLElement>;
      hgroup: HTMLAttributes<HTMLElement>;
      hr: HTMLAttributes<HTMLHRElement>;
      html: HTMLAttributes<HTMLHtmlElement>;
      i: HTMLAttributes<HTMLElement>;
      iframe: IframeHTMLAttributes<HTMLIFrameElement>;
      img: ImgHTMLAttributes<HTMLImageElement>;
      input: InputHTMLAttributes<HTMLInputElement>;
      ins: HTMLAttributes<HTMLElement>;
      kbd: HTMLAttributes<HTMLElement>;
      label: LabelHTMLAttributes<HTMLLabelElement>;
      legend: HTMLAttributes<HTMLLegendElement>;
      li: HTMLAttributes<HTMLLIElement>;
      link: LinkHTMLAttributes<HTMLLinkElement>;
      main: HTMLAttributes<HTMLElement>;
      map: HTMLAttributes<HTMLMapElement>;
      mark: HTMLAttributes<HTMLElement>;
      menu: HTMLAttributes<HTMLElement>;
      meta: MetaHTMLAttributes<HTMLMetaElement>;
      meter: HTMLAttributes<HTMLElement>;
      nav: HTMLAttributes<HTMLElement>;
      noscript: HTMLAttributes<HTMLElement>;
      object: ObjectHTMLAttributes<HTMLObjectElement>;
      ol: HTMLAttributes<HTMLOListElement>;
      optgroup: HTMLAttributes<HTMLOptGroupElement>;
      option: OptionHTMLAttributes<HTMLOptionElement>;
      output: HTMLAttributes<HTMLElement>;
      p: HTMLAttributes<HTMLParagraphElement>;
      picture: HTMLAttributes<HTMLElement>;
      pre: HTMLAttributes<HTMLPreElement>;
      progress: ProgressHTMLAttributes<HTMLProgressElement>;
      q: HTMLAttributes<HTMLElement>;
      rp: HTMLAttributes<HTMLElement>;
      rt: HTMLAttributes<HTMLElement>;
      ruby: HTMLAttributes<HTMLElement>;
      s: HTMLAttributes<HTMLElement>;
      samp: HTMLAttributes<HTMLElement>;
      script: ScriptHTMLAttributes<HTMLScriptElement>;
      section: HTMLAttributes<HTMLElement>;
      select: SelectHTMLAttributes<HTMLSelectElement>;
      slot: HTMLAttributes<HTMLElement>;
      small: HTMLAttributes<HTMLElement>;
      source: HTMLAttributes<HTMLSourceElement>;
      span: HTMLAttributes<HTMLSpanElement>;
      strong: HTMLAttributes<HTMLElement>;
      style: StyleHTMLAttributes<HTMLStyleElement>;
      sub: HTMLAttributes<HTMLElement>;
      summary: HTMLAttributes<HTMLElement>;
      sup: HTMLAttributes<HTMLElement>;
      table: TableHTMLAttributes<HTMLTableElement>;
      tbody: HTMLAttributes<HTMLTableSectionElement>;
      td: TdHTMLAttributes<HTMLTableCellElement>;
      template: HTMLAttributes<HTMLElement>;
      textarea: TextareaHTMLAttributes<HTMLTextAreaElement>;
      tfoot: HTMLAttributes<HTMLTableSectionElement>;
      th: ThHTMLAttributes<HTMLTableCellElement>;
      thead: HTMLAttributes<HTMLTableSectionElement>;
      time: HTMLAttributes<HTMLElement>;
      title: HTMLAttributes<HTMLTitleElement>;
      tr: HTMLAttributes<HTMLTableRowElement>;
      track: HTMLAttributes<HTMLTrackElement>;
      u: HTMLAttributes<HTMLElement>;
      ul: HTMLAttributes<HTMLUListElement>;
      video: MediaHTMLAttributes<HTMLVideoElement>;
      wbr: HTMLAttributes<HTMLElement>;

      // SVG
      svg: HTMLAttributes<SVGSVGElement>;
      circle: HTMLAttributes<SVGCircleElement>;
      path: HTMLAttributes<SVGPathElement>;
      rect: HTMLAttributes<SVGRectElement>;
      line: HTMLAttributes<SVGLineElement>;
      polygon: HTMLAttributes<SVGPolygonElement>;
      polyline: HTMLAttributes<SVGPolylineElement>;
      ellipse: HTMLAttributes<SVGEllipseElement>;
      text: HTMLAttributes<SVGTextElement>;
      g: HTMLAttributes<SVGGElement>;
      defs: HTMLAttributes<SVGDefsElement>;
      use: HTMLAttributes<SVGUseElement>;
    }
  }
}`;

export function EditorPanel() {
  const editorContent = useEditorStore((s) => s.editorContent);
  const updateEditorContent = useEditorStore((s) => s.updateEditorContent);
  const saveFile = useEditorStore((s) => s.saveFile);
  const currentFile = useEditorStore((s) => s.currentFile);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  function handleEditorWillMount(monaco: typeof import("monaco-editor")) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ts = monaco.typescript as any;

    ts.typescriptDefaults.setCompilerOptions({
      target: ts.ScriptTarget.Latest,
      jsx: ts.JsxEmit.React,
      jsxFactory: "React.createElement",
      jsxFragmentFactory: "React.Fragment",
      allowNonTsExtensions: true,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      module: ts.ModuleKind.ESNext,
      lib: ["dom", "dom.iterable", "esnext"],
    });

    ts.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    });
    ts.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    });

    // Provide React + HTML type declarations so Monaco can resolve JSX, React imports, and HTML elements
    ts.typescriptDefaults.addExtraLib(REACT_DTS, "react.d.ts");
  }

  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;

      editor.addAction({
        id: "save-file",
        label: "Save File",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
        run: () => {
          const value = editor.getValue();
          updateEditorContent(value);
          saveFile();
        },
      });

      // Bind Cmd+A / Ctrl+A to select all
      editor.addAction({
        id: "select-all-editor",
        label: "Select All",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyA],
        run: () => {
          const model = editor.getModel();
          if (model) {
            editor.setSelection(model.getFullModelRange());
          }
        },
      });
    },
    [updateEditorContent, saveFile],
  );

  // Intercept Cmd+S / Ctrl+S at the document level to prevent browser "Save Page" dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        e.stopPropagation();
        const editor = editorRef.current;
        if (editor) {
          const value = editor.getValue();
          updateEditorContent(value);
          saveFile();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [updateEditorContent, saveFile]);

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined) {
        updateEditorContent(value);
      }
    },
    [updateEditorContent],
  );

  const language = (() => {
    const ext = currentFile.split(".").pop();
    switch (ext) {
      case "tsx":
        return "typescript";
      case "ts":
        return "typescript";
      case "jsx":
        return "javascript";
      case "js":
        return "javascript";
      case "json":
        return "json";
      case "css":
        return "css";
      case "html":
        return "html";
      case "md":
        return "markdown";
      default:
        return "plaintext";
    }
  })();

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "var(--vscode-editor)" }}
    >
      <FileTabs />
      <div className="flex-1">
        <Editor
          height="100%"
          language={language}
          value={editorContent}
          onChange={handleChange}
          beforeMount={handleEditorWillMount}
          onMount={handleMount}
          theme="vs-light"
          defaultLanguage="typescript"
          options={{
            fontSize: 13,
            fontFamily:
              "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            lineNumbers: "on",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "off",
            tabSize: 2,
            renderWhitespace: "selection",
            bracketPairColorization: { enabled: true },
            automaticLayout: true,
            padding: { top: 8 },
          }}
          loading={
            <div
              className="flex items-center justify-center h-full text-sm"
              style={{
                background: "var(--vscode-editor)",
                color: "var(--vscode-fg-dim)",
              }}
            >
              Loading editor...
            </div>
          }
        />
      </div>
    </div>
  );
}
