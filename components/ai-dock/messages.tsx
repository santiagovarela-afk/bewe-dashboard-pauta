"use client";
import * as React from "react";
import { motion } from "motion/react";
import { Bot, BookmarkPlus, Sparkles, User } from "lucide-react";
import { cn, escapeHtml } from "@/lib/utils";
import { useDashboard } from "@/lib/store";

export interface Msg {
  id: string;
  role: "user" | "bot";
  text: string;
  ts: number;
}

/** Avatar del bot — cambia entre Mark (violet→cyan + Bot) y Lúa (ember→violet + Sparkles). */
function BotAvatar({ size = "size-7" }: { size?: string }) {
  const { aiPersona } = useDashboard();
  const isMark = aiPersona === "mark";
  return (
    <div
      className={cn(
        "shrink-0 rounded-full grid place-items-center text-white",
        size,
        isMark
          ? "bg-gradient-to-br from-[hsl(var(--brand-violet))] to-[hsl(var(--brand-cyan))] shadow-[0_4px_12px_-4px_hsl(var(--brand-violet)/0.6)]"
          : "bg-gradient-to-br from-[hsl(var(--brand-ember))] to-[hsl(var(--brand-violet))] shadow-[0_4px_12px_-4px_hsl(var(--brand-ember)/0.6)]",
      )}
      aria-label={isMark ? "Mark OS" : "Lúa OS"}
    >
      {isMark ? <Bot className="size-3.5" /> : <Sparkles className="size-3.5" />}
    </div>
  );
}

/**
 * Minimal markdown renderer:
 *  - **bold**            → <strong>
 *  - `inline code`       → <code>
 *  - lines starting "- " → <li>
 *  - currency €123.45    → mono lime span
 *  - \n                  → <br/>
 *
 * Input is escaped first → safe to dangerously set as HTML.
 */
function renderMarkdown(raw: string): string {
  const escaped = escapeHtml(raw);

  // Split into lines so we can wrap bullets in <ul>
  const lines = escaped.split("\n");
  const out: string[] = [];
  let inList = false;
  for (const line of lines) {
    const bulletMatch = line.match(/^\s*[-*]\s+(.*)$/);
    if (bulletMatch) {
      if (!inList) {
        out.push("<ul class='list-disc pl-4 space-y-0.5 my-1'>");
        inList = true;
      }
      out.push(`<li>${bulletMatch[1]}</li>`);
    } else {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      out.push(line);
    }
  }
  if (inList) out.push("</ul>");

  let html = out.join("\n");

  // Inline code first to protect from later passes
  html = html.replace(
    /`([^`]+)`/g,
    "<code class='font-mono text-[0.85em] px-1 py-0.5 rounded bg-muted/60 border border-border/60'>$1</code>",
  );

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong class='font-semibold text-foreground'>$1</strong>");

  // Currency € → mono lime
  html = html.replace(
    /(€\s?[\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?)/g,
    "<span class='font-mono text-[hsl(var(--brand-lime))]'>$1</span>",
  );

  // Plain newlines (not inside <ul>/<li>) → <br/>
  // We need to avoid breaking existing tags — replace remaining \n with <br/>
  html = html.replace(/\n(?!<\/?(ul|li))/g, "<br/>");

  return html;
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "ahora";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return new Date(ts).toLocaleDateString("es", { day: "2-digit", month: "short" });
}

interface MessageProps {
  msg: Msg;
  /** Show timestamp below bubble (only if >1 min old or last in group). */
  showTime?: boolean;
  /** Callback when user clicks "Guardar en memoria" — only shown on bot messages. */
  onSaveMemory?: (msg: Msg) => void;
}

export function Message({ msg, showTime = false, onSaveMemory }: MessageProps) {
  const isUser = msg.role === "user";
  const old = Date.now() - msg.ts > 60_000;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex gap-2 w-full",
        isUser ? "justify-end flex-row-reverse" : "justify-start",
      )}
    >
      {isUser ? (
        <div className="shrink-0 size-7 rounded-full grid place-items-center mt-0.5 bg-muted border border-border text-muted-foreground">
          <User className="size-3.5" />
        </div>
      ) : (
        <div className="mt-0.5">
          <BotAvatar />
        </div>
      )}
      <div className={cn("flex flex-col max-w-[88%]", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm leading-relaxed break-words",
            isUser
              ? "bg-primary/15 border border-primary/25 text-foreground rounded-tr-sm"
              : "bg-card border border-border text-foreground/95 rounded-tl-sm",
          )}
        >
          <div
            className="[&_strong]:text-foreground [&_ul]:my-1"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
          />
        </div>
        <div className="mt-0.5 flex items-center gap-2 px-1">
          {(showTime || old) && (
            <span className="text-[10px] text-muted-foreground/70 font-mono">
              {timeAgo(msg.ts)}
            </span>
          )}
          {!isUser && onSaveMemory && msg.id !== "greeting" && (
            <button
              type="button"
              onClick={() => onSaveMemory(msg)}
              title="Guardar en memoria del agente"
              aria-label="Guardar en memoria"
              className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/70 hover:text-[hsl(var(--brand-violet))] transition-colors font-mono"
            >
              <BookmarkPlus className="size-3" />
              Recordar
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex gap-2 items-start"
    >
      <BotAvatar />
      <div className="rounded-2xl rounded-tl-sm px-3 py-2.5 bg-card border border-border flex items-center gap-1">
        <span className="size-1.5 rounded-full bg-[hsl(var(--brand-violet))] animate-bounce [animation-delay:-0.3s]" />
        <span className="size-1.5 rounded-full bg-[hsl(var(--brand-violet))] animate-bounce [animation-delay:-0.15s]" />
        <span className="size-1.5 rounded-full bg-[hsl(var(--brand-violet))] animate-bounce" />
      </div>
    </motion.div>
  );
}
