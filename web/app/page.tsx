"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  FileUp,
  Loader2,
  PanelLeft,
  Paperclip,
  SendHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DataPreview } from "@/components/app/data-preview";
import { MessageBubble, TypingIndicator } from "@/components/app/message-bubble";
import { Sidebar } from "@/components/app/sidebar";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { sendChat, uploadCsv, API_BASE } from "@/lib/api";
import { parseCsv } from "@/lib/csv";
import {
  loadSessions,
  newSession,
  saveSessions,
  PREVIEW_ROW_CAP,
  type ChatMessage,
  type Session,
} from "@/lib/sessions";
import { cn } from "@/lib/utils";

const HINTS = [
  "How many rows?",
  "Any missing values?",
  "Show column types",
  "Average of each column",
];

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Only messages added in this browser session animate in; restored history renders static.
  const [animateFrom, setAnimateFrom] = useState<number>(Infinity);

  const active = sessions.find((s) => s.id === activeId) ?? null;
  const dataLoaded = !!active && active.headers.length > 0;

  useEffect(() => {
    // Hydration from localStorage has to happen after mount so the client's
    // first render matches the statically exported HTML.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (window.matchMedia("(max-width: 767px)").matches) setCollapsed(true);
    const stored = loadSessions();
    if (stored.length) {
      setSessions(stored);
      setActiveId(stored[0].id);
    } else {
      const s = newSession();
      setSessions([s]);
      setActiveId(s.id);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveSessions(sessions);
  }, [sessions, hydrated]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && (active?.messages.length ?? 0) > 0) el.scrollTop = el.scrollHeight;
  }, [active?.messages.length, typing]);

  const updateActive = useCallback(
    (fn: (s: Session) => Session) => {
      setSessions((prev) => prev.map((s) => (s.id === activeId ? fn(s) : s)));
    },
    [activeId]
  );

  function pushMessage(msg: ChatMessage) {
    updateActive((s) => {
      const title =
        msg.role === "user" && s.title === "New conversation"
          ? msg.text.slice(0, 38) + (msg.text.length > 38 ? "…" : "")
          : s.title;
      return { ...s, title, messages: [...s.messages, msg] };
    });
  }

  function closeSidebarOnMobile() {
    if (window.matchMedia("(max-width: 767px)").matches) setCollapsed(true);
  }

  function handleNew() {
    const s = newSession();
    setSessions((prev) => [s, ...prev]);
    setActiveId(s.id);
    setAnimateFrom(0);
    closeSidebarOnMobile();
  }

  function handleSwitch(id: string) {
    setActiveId(id);
    const target = sessions.find((s) => s.id === id);
    setAnimateFrom(target ? target.messages.length : 0);
    closeSidebarOnMobile();
  }

  function handleRename(id: string) {
    const s = sessions.find((x) => x.id === id);
    if (!s) return;
    const title = window.prompt("Enter new title for this conversation:", s.title);
    if (title?.trim()) {
      setSessions((prev) =>
        prev.map((x) => (x.id === id ? { ...x, title: title.trim() } : x))
      );
    }
  }

  function handleDelete(id: string) {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (activeId === id) {
        if (next.length) setActiveId(next[0].id);
        else {
          const s = newSession();
          setActiveId(s.id);
          return [s];
        }
      }
      return next;
    });
  }

  async function handleUpload(file: File | undefined) {
    if (!file || !file.name.endsWith(".csv") || !activeId) return;
    setUploading(true);
    try {
      const text = await file.text();
      const { headers, rows } = parseCsv(text);
      const result = await uploadCsv(file, activeId);
      if (result.status === "success") {
        updateActive((s) => ({
          ...s,
          headers,
          rows: rows.slice(0, PREVIEW_ROW_CAP),
          totalRows: rows.length,
          filename: file.name,
          title:
            s.title === "New conversation" ? file.name.replace(".csv", "") : s.title,
        }));
        setAnimateFrom((prev) => Math.min(prev, active?.messages.length ?? 0));
        pushMessage({
          role: "bot",
          text: `Dataset loaded: ${file.name}\n\nReady for analysis. Ask me anything about your data.`,
        });
      } else {
        pushMessage({
          role: "bot",
          text: `Upload error: ${result.message}`,
          isError: true,
        });
      }
    } catch {
      pushMessage({
        role: "bot",
        text: `Cannot reach the server at ${API_BASE}. Is the backend running?`,
        isError: true,
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || !dataLoaded || typing || !activeId) return;
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setAnimateFrom((prev) => Math.min(prev, active?.messages.length ?? 0));
    pushMessage({ role: "user", text: msg });
    setTyping(true);
    try {
      const data = await sendChat(msg, activeId);
      pushMessage({
        role: "bot",
        text: data.reply || "No response.",
        code: data.code ?? null,
        chart: data.chart ?? null,
      });
    } catch {
      pushMessage({
        role: "bot",
        text: `Connection error. Is the backend running at ${API_BASE}?`,
        isError: true,
      });
    } finally {
      setTyping(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }

  const messages = active?.messages ?? [];

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      <Sidebar
        sessions={sessions}
        activeId={activeId}
        collapsed={collapsed}
        onNew={handleNew}
        onSwitch={handleSwitch}
        onRename={handleRename}
        onDelete={handleDelete}
      />

      {!collapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setCollapsed(true)}
          aria-hidden
        />
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 px-5">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle sidebar"
            onClick={() => setCollapsed((v) => !v)}
          >
            <PanelLeft className="size-4" />
          </Button>
          {collapsed && (
            <span className="font-display text-lg font-bold tracking-tight">
              Cognitus<span className="text-primary"> AI</span>
            </span>
          )}
          <div className="flex-1" />
          <ThemeToggle />
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-4 py-5 sm:px-6 sm:py-6">
            {dataLoaded && active?.filename ? (
              <DataPreview
                headers={active.headers}
                rows={active.rows}
                totalRows={active.totalRows}
                filename={active.filename}
                uploading={uploading}
                onReplace={handleUpload}
              />
            ) : null}

            {messages.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 py-2 text-center">
                <Image
                  src="/logo-white.png"
                  alt=""
                  width={56}
                  height={56}
                  className="opacity-80 invert dark:invert-0"
                />
                <div className="space-y-2">
                  <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                    Ask your data anything
                  </h1>
                  <p className="mx-auto max-w-80 text-sm leading-relaxed text-muted-foreground">
                    {dataLoaded
                      ? "Your dataset is loaded. Ask a question below."
                      : "Upload a CSV file, then ask questions in plain language."}
                  </p>
                </div>

                {!dataLoaded && (
                  <label
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragging(false);
                      handleUpload(e.dataTransfer.files?.[0]);
                    }}
                    className={cn(
                      "flex w-full max-w-md cursor-pointer flex-col items-center gap-2.5 rounded-2xl border-2 border-dashed bg-card px-8 py-7 transition-colors",
                      dragging
                        ? "border-primary bg-accent"
                        : "border-border hover:border-primary/50",
                      uploading && "pointer-events-none opacity-70"
                    )}
                  >
                    {uploading ? (
                      <Loader2 className="size-7 animate-spin text-primary" />
                    ) : (
                      <FileUp className="size-7 text-primary" />
                    )}
                    <span className="text-sm font-medium">
                      {uploading ? (
                        "Analyzing your file…"
                      ) : (
                        <>
                          Drop your CSV here or{" "}
                          <span className="text-primary underline underline-offset-4">
                            browse
                          </span>
                        </>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      One file per conversation, .csv only
                    </span>
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      disabled={uploading}
                      onClick={(e) => ((e.target as HTMLInputElement).value = "")}
                      onChange={(e) => handleUpload(e.target.files?.[0])}
                    />
                  </label>
                )}

                <div className="flex flex-wrap justify-center gap-2.5">
                  {HINTS.map((h) => (
                    <button
                      key={h}
                      onClick={() => {
                        setInput(h);
                        inputRef.current?.focus();
                      }}
                      className="rounded-xl border bg-card px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary active:translate-y-px"
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-5 pb-2">
                {messages.map((m, i) => (
                  <MessageBubble
                    key={i}
                    message={m}
                    animate={i >= animateFrom}
                  />
                ))}
                {typing ? <TypingIndicator /> : null}
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 px-5 pb-5 pt-1">
          <div className="mx-auto w-full max-w-3xl">
            <div className="flex items-end gap-2 rounded-2xl border bg-card p-2.5 transition-colors focus-within:border-ring/60">
              <label
                className={cn(
                  "flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  uploading && "pointer-events-none opacity-60"
                )}
                title={dataLoaded ? "Replace CSV file" : "Upload CSV file"}
              >
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Paperclip className="size-4" />
                )}
                <span className="sr-only">
                  {dataLoaded ? "Replace CSV file" : "Upload CSV file"}
                </span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  disabled={uploading}
                  onClick={(e) => ((e.target as HTMLInputElement).value = "")}
                  onChange={(e) => handleUpload(e.target.files?.[0])}
                />
              </label>
              <Textarea
                ref={inputRef}
                rows={1}
                value={input}
                placeholder={
                  dataLoaded
                    ? "Ask a question about your data…"
                    : "Upload a CSV file to start…"
                }
                onChange={(e) => {
                  setInput(e.target.value);
                  autoResize(e.target);
                }}
                onKeyDown={onKeyDown}
                className="max-h-36 min-h-9 flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
              />
              <Button
                size="icon"
                aria-label="Send message"
                disabled={!input.trim() || !dataLoaded || typing}
                onClick={() => handleSend()}
                className="rounded-xl"
              >
                <SendHorizontal className="size-4" />
              </Button>
            </div>
            <p className="mt-2.5 text-center font-mono text-[10px] text-muted-foreground/70">
              Enter to send, Shift+Enter for a new line
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
