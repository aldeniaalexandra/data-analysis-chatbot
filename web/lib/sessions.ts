import type { ChartData } from "./api";

export interface ChatMessage {
  role: "user" | "bot";
  text: string;
  code?: string | null;
  chart?: ChartData | null;
  isError?: boolean;
}

export interface Session {
  id: string;
  title: string;
  messages: ChatMessage[];
  headers: string[];
  rows: string[][];
  // Full dataset size; `rows` only keeps a capped preview so the whole
  // session list fits within the localStorage quota.
  totalRows: number;
  filename: string | null;
}

const STORAGE_KEY = "cognitus-sessions-v1";

export const PREVIEW_ROW_CAP = 500;

export function newSession(): Session {
  return {
    id: Date.now().toString(),
    title: "New conversation",
    messages: [],
    headers: [],
    rows: [],
    totalRows: 0,
    filename: null,
  };
}

export function loadSessions(): Session[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Session[]) : [];
    return parsed.map((s) => ({ ...s, totalRows: s.totalRows ?? s.rows.length }));
  } catch {
    return [];
  }
}

export function saveSessions(sessions: Session[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // Storage full or unavailable; sessions stay in memory only.
  }
}
