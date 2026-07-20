export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  "https://data-analysis-chatbot-production.up.railway.app";

export interface ChartData {
  type?: "bar" | "pie" | "line";
  title?: string;
  labels: string[];
  values: number[];
}

export interface ChatReply {
  reply: string;
  code?: string | null;
  chart?: ChartData | null;
}

export interface UploadResult {
  status: "success" | "error";
  message: string;
  summary?: unknown;
}

export async function uploadCsv(file: File): Promise<UploadResult> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: fd });
  return res.json();
}

export async function sendChat(message: string): Promise<ChatReply> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  return res.json();
}
