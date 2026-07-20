"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { Check, ChevronRight, Copy } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { ChatMessage } from "@/lib/sessions";
import { cn } from "@/lib/utils";
import { ChatChart } from "./chat-chart";

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Collapsible className="mt-3">
      <CollapsibleTrigger className="group flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-primary">
        <ChevronRight className="size-3 transition-transform group-data-[state=open]:rotate-90 motion-reduce:transition-none" />
        View executed code
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 overflow-hidden rounded-xl border bg-muted/60">
          <div className="flex items-center justify-end border-b border-border/60 px-2 py-1">
            <button
              onClick={copy}
              aria-label="Copy code"
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-primary"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            </button>
          </div>
          <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-foreground/80">
            <code>{code}</code>
          </pre>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function MessageBubble({
  message,
  animate,
}: {
  message: ChatMessage;
  animate: boolean;
}) {
  const reduce = useReducedMotion();
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={animate && !reduce ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={cn("flex gap-3", isUser && "flex-row-reverse")}
    >
      {isUser ? (
        <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-xl border bg-muted font-mono text-[9px] text-muted-foreground">
          You
        </div>
      ) : (
        <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary">
          <Image
            src="/logo-white.png"
            alt=""
            width={16}
            height={16}
            className="dark:invert"
          />
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed md:max-w-[76%]",
          isUser
            ? "rounded-tr-md border bg-card"
            : "rounded-tl-md border bg-card",
          message.isError && "text-destructive"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
        {message.chart ? <ChatChart chart={message.chart} /> : null}
        {message.code ? <CodeBlock code={message.code} /> : null}
      </div>
    </motion.div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary">
        <Image
          src="/logo-white.png"
          alt=""
          width={16}
          height={16}
          className="dark:invert"
        />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border bg-card px-4 py-3.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 animate-pulse rounded-full bg-primary motion-reduce:animate-none"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}
