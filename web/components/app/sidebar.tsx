"use client";

import Image from "next/image";
import { MessageSquare, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Session } from "@/lib/sessions";
import { cn } from "@/lib/utils";

interface SidebarProps {
  sessions: Session[];
  activeId: string | null;
  collapsed: boolean;
  onNew: () => void;
  onSwitch: (id: string) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
}

export function Sidebar({
  sessions,
  activeId,
  collapsed,
  onNew,
  onSwitch,
  onRename,
  onDelete,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col overflow-hidden bg-sidebar transition-[width] duration-200 motion-reduce:transition-none",
        "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-40 max-md:border-r max-md:shadow-xl",
        collapsed ? "w-0 max-md:border-r-0 max-md:shadow-none" : "w-72"
      )}
      aria-hidden={collapsed}
    >
      <div className="flex h-full w-72 flex-col gap-4 p-5">
        <div className="flex items-center gap-3 px-1 pt-1">
          <Image
            src="/logo-white.png"
            alt="Cognitus AI logo"
            width={40}
            height={40}
            className="invert dark:invert-0"
          />
          <span className="font-display text-lg font-bold tracking-tight">
            Cognitus<span className="text-primary"> AI</span>
          </span>
        </div>

        <Button
          variant="outline"
          className="w-full justify-start gap-2 bg-card"
          onClick={onNew}
        >
          <Plus className="size-4" />
          New conversation
        </Button>

        <div className="flex min-h-0 flex-1 flex-col">
          <p className="px-2 pb-2 text-[11px] font-medium text-muted-foreground">
            History
          </p>
          {sessions.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs leading-relaxed text-muted-foreground">
              No conversations yet.
              <br />
              Start one above.
            </p>
          ) : (
            <ul className="flex flex-col gap-1 overflow-y-auto pr-1">
              {sessions.map((s) => (
                <li key={s.id} className="group relative">
                  <button
                    onClick={() => onSwitch(s.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors",
                      s.id === activeId
                        ? "bg-sidebar-accent text-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                    )}
                  >
                    <MessageSquare className="size-3.5 shrink-0 opacity-60" />
                    <span className="truncate pr-10">{s.title}</span>
                  </button>
                  <span className="absolute right-1.5 top-1/2 flex -translate-y-1/2 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    <button
                      aria-label={`Rename ${s.title}`}
                      onClick={() => onRename(s.id)}
                      className="rounded-md p-1 text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="size-3" />
                    </button>
                    <button
                      aria-label={`Delete ${s.title}`}
                      onClick={() => onDelete(s.id)}
                      className="rounded-md p-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}
