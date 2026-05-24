"use client";
/**
 * Slide Tab Detail · slide reutilizable que dedica una pantalla completa a UNA tab.
 *
 * Layout:
 *   - Header: icon + nombre del tab + acento HSL
 *   - Mini-mockup visual (CSS-only, sin imágenes)
 *   - "Qué es"      → 1 línea
 *   - "Qué consigues" → 2-4 bullets con check
 *   - "Tu primer paso" → CTA destacado
 *
 * Cada tab pasa su propio `Mockup` (mini-mockup component renderable inline).
 * Si una tab no provee mockup, se cae a un placeholder neutro.
 */
import * as React from "react";
import { motion } from "motion/react";
import { CheckCircle2, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TabDetailContent {
  /** ID interno del tab (ej "dashboard"). */
  id: string;
  /** Nombre legible (ej "Dashboard"). */
  label: string;
  /** Icon del header. */
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  /** Color de acento HSL del tab (ej "var(--brand-violet)"). */
  accent: string;
  /** Emoji para acento visual rápido. */
  emoji: string;
  /** Frase "qué es", 1 línea. */
  whatIs: string;
  /** 2-4 bullets de "qué consigues". */
  achievements: string[];
  /** Acción concreta · "primer paso". */
  firstStep: string;
  /** Mini-mockup React (CSS-only). */
  Mockup: React.ComponentType<{ accent: string }>;
}

interface SlideTabDetailProps {
  content: TabDetailContent;
}

export function SlideTabDetail({ content }: SlideTabDetailProps) {
  const {
    label,
    Icon,
    accent,
    emoji,
    whatIs,
    achievements,
    firstStep,
    Mockup,
  } = content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="size-11 rounded-2xl grid place-items-center text-white shrink-0 shadow-[0_8px_24px_-8px_var(--tab-shadow)]"
          style={{
            background: `linear-gradient(135deg, hsl(${accent}), hsl(${accent}/0.55))`,
            ["--tab-shadow" as string]: `hsl(${accent}/0.6)`,
          }}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl md:text-2xl font-bold tracking-tight leading-tight">
              {label}
            </h2>
            <span aria-hidden className="text-[15px] leading-none">
              {emoji}
            </span>
          </div>
          <p
            className="text-[11.5px] mt-0.5 leading-snug"
            style={{ color: `hsl(${accent})` }}
          >
            {whatIs}
          </p>
        </div>
      </div>

      {/* Mini-mockup */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.12, duration: 0.35 }}
        className="rounded-xl border border-border bg-background/40 p-3 mb-4 overflow-hidden"
        style={{
          background: `linear-gradient(180deg, hsl(${accent}/0.05), hsl(var(--background)/0.4))`,
          borderColor: `hsl(${accent}/0.25)`,
        }}
      >
        <Mockup accent={accent} />
      </motion.div>

      {/* Qué consigues */}
      <div className="mb-3.5">
        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
          Qué consigues aquí
        </div>
        <ul className="space-y-1.5">
          {achievements.map((a, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.18 + 0.06 * i, duration: 0.26 }}
              className="flex gap-2 items-start text-[12px] text-muted-foreground leading-relaxed"
            >
              <CheckCircle2
                className="size-3.5 shrink-0 mt-0.5"
                style={{ color: `hsl(${accent})` }}
              />
              <span>{a}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Primer paso */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className={cn(
          "rounded-lg p-2.5 flex items-start gap-2.5 border",
        )}
        style={{
          background: `hsl(${accent}/0.08)`,
          borderColor: `hsl(${accent}/0.3)`,
        }}
      >
        <Compass
          className="size-4 shrink-0 mt-0.5"
          style={{ color: `hsl(${accent})` }}
        />
        <div className="min-w-0">
          <div
            className="text-[10px] font-mono uppercase tracking-wider mb-0.5"
            style={{ color: `hsl(${accent})` }}
          >
            Tu primer paso
          </div>
          <div className="text-[12px] text-foreground/90 leading-snug">
            {firstStep}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Mini-mockups por tab (CSS-only)
 * ───────────────────────────────────────────────────────────────────────────── */

function MockBar({
  pct,
  accent,
  delay = 0,
}: {
  pct: number;
  accent: string;
  delay?: number;
}) {
  return (
    <div className="h-1 rounded-full overflow-hidden bg-foreground/10">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ delay: 0.25 + delay, duration: 0.7, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ background: `hsl(${accent})` }}
      />
    </div>
  );
}

export function MockDashboard({ accent }: { accent: string }) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {[
        { k: "Gasto", v: "€1.842" },
        { k: "CPL", v: "€2.13" },
        { k: "CTR", v: "1.84%" },
        { k: "Leads", v: "864" },
      ].map((x, i) => (
        <motion.div
          key={x.k}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + 0.05 * i, duration: 0.3 }}
          className="rounded-md border border-border/60 bg-background/60 p-1.5"
        >
          <div className="text-[8px] font-mono uppercase tracking-wider text-muted-foreground leading-none mb-1">
            {x.k}
          </div>
          <div
            className="text-[12px] font-bold tabular-nums leading-none"
            style={{ color: `hsl(${accent})` }}
          >
            {x.v}
          </div>
          <div className="mt-1">
            <MockBar pct={45 + i * 15} accent={accent} delay={i * 0.04} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function MockCampanas({ accent }: { accent: string }) {
  const rows = [
    { c: "C1", n: "MX · Belleza", g: 320, b: 520, st: "ACTIVE" },
    { c: "C2", n: "MX · Comercio", g: 240, b: 420, st: "ACTIVE" },
    { c: "C3", n: "MX · Servicios", g: 180, b: 320, st: "PAUSED" },
  ];
  return (
    <div className="space-y-1">
      {rows.map((r, i) => (
        <motion.div
          key={r.c}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 + 0.07 * i, duration: 0.28 }}
          className="flex items-center gap-2 rounded-md border border-border/50 bg-background/60 px-2 py-1.5"
        >
          <span
            className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
            style={{
              background: `hsl(${accent}/0.18)`,
              color: `hsl(${accent})`,
            }}
          >
            {r.c}
          </span>
          <span className="text-[10.5px] text-foreground/85 flex-1 truncate">
            {r.n}
          </span>
          <span className="flex-1">
            <MockBar pct={(r.g / r.b) * 100} accent={accent} delay={i * 0.05} />
          </span>
          <span
            className={cn(
              "text-[8.5px] font-mono uppercase px-1 py-0.5 rounded shrink-0",
              r.st === "ACTIVE"
                ? "bg-[hsl(var(--brand-lime)/0.18)] text-[hsl(var(--brand-lime))]"
                : "bg-foreground/10 text-muted-foreground",
            )}
          >
            {r.st}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

export function MockEstrategia({ accent }: { accent: string }) {
  const gauges = [
    { k: "CPT", v: "€1.92", pct: 35, tone: "ok" },
    { k: "CPL", v: "€2.13", pct: 55, tone: "warn" },
    { k: "Budget", v: "61%", pct: 61, tone: "ok" },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {gauges.map((g, i) => {
        const color =
          g.tone === "ok"
            ? "hsl(var(--brand-lime))"
            : g.tone === "warn"
              ? "hsl(38 92% 55%)"
              : "hsl(0 80% 60%)";
        return (
          <motion.div
            key={g.k}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + 0.06 * i, duration: 0.3 }}
            className="rounded-md border border-border/60 bg-background/60 p-1.5 text-center"
          >
            <div className="text-[8px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
              {g.k}
            </div>
            <div
              className="size-9 mx-auto rounded-full grid place-items-center mb-1 relative"
              style={{ background: `conic-gradient(${color} ${g.pct}%, hsl(var(--border)) 0)` }}
            >
              <div className="size-7 rounded-full bg-background grid place-items-center">
                <span
                  className="text-[8.5px] font-bold tabular-nums"
                  style={{ color }}
                >
                  {g.pct}%
                </span>
              </div>
            </div>
            <div className="text-[9.5px] font-mono text-foreground/85">
              {g.v}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export function MockPaid({ accent }: { accent: string }) {
  const plats = [
    { n: "Meta", v: "€1.842", pct: 78, on: true },
    { n: "Google", v: "—", pct: 0, on: false },
    { n: "TikTok", v: "—", pct: 0, on: false },
  ];
  return (
    <div className="space-y-1.5">
      {plats.map((p, i) => (
        <motion.div
          key={p.n}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 + 0.07 * i, duration: 0.28 }}
          className="flex items-center gap-2"
        >
          <span className="text-[10px] font-mono w-12 text-foreground/85">
            {p.n}
          </span>
          <span className="flex-1">
            <MockBar pct={p.on ? p.pct : 4} accent={p.on ? accent : "var(--muted-foreground)"} delay={i * 0.05} />
          </span>
          <span
            className={cn(
              "text-[9.5px] font-mono tabular-nums w-12 text-right",
              p.on ? "text-foreground/85" : "text-muted-foreground/60",
            )}
          >
            {p.v}
          </span>
        </motion.div>
      ))}
      <div className="text-[8.5px] font-mono uppercase tracking-wider text-muted-foreground/70 mt-1 pt-1 border-t border-border/40">
        Cross-platform · 1 sola vista
      </div>
    </div>
  );
}

export function MockAnuncios({ accent }: { accent: string }) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 + 0.05 * i, duration: 0.28 }}
          className="aspect-square rounded-md relative overflow-hidden border border-border/60"
          style={{
            background: `linear-gradient(${135 + i * 30}deg, hsl(${accent}/0.45), hsl(${accent}/0.1))`,
          }}
        >
          <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5 bg-background/70 backdrop-blur-sm text-[7.5px] font-mono">
            <span style={{ color: `hsl(${accent})` }}>CTR</span>{" "}
            {(1.2 + i * 0.3).toFixed(2)}%
          </div>
          {i === 0 && (
            <span className="absolute top-0.5 right-0.5 text-[7px] font-mono px-1 rounded bg-[hsl(var(--brand-lime)/0.85)] text-background">
              TOP
            </span>
          )}
        </motion.div>
      ))}
    </div>
  );
}

export function MockOrganico({ accent }: { accent: string }) {
  const nets = [
    { n: "IG", h: "@bewe_software", k: "50k", e: "3.4%" },
    { n: "FB", h: "Bewe Software", k: "114k", e: "1.8%" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {nets.map((p, i) => (
        <motion.div
          key={p.n}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + 0.07 * i, duration: 0.3 }}
          className="rounded-md border border-border/60 bg-background/60 p-2"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="size-5 rounded-md grid place-items-center text-[10px] font-bold text-white"
              style={{ background: `hsl(${accent})` }}
            >
              {p.n}
            </span>
            <span className="text-[9.5px] font-mono text-foreground/85 truncate">
              {p.h}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-[14px] font-bold tabular-nums"
              style={{ color: `hsl(${accent})` }}
            >
              {p.k}
            </span>
            <span className="text-[8.5px] font-mono text-muted-foreground">
              followers
            </span>
          </div>
          <div className="text-[8.5px] font-mono text-muted-foreground mt-0.5">
            ER {p.e}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function MockParrilla({ accent }: { accent: string }) {
  const cells = Array.from({ length: 21 }, (_, i) => i);
  const scheduled = new Set([2, 5, 8, 11, 14, 17, 19]);
  return (
    <div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
          <div
            key={d}
            className="text-center text-[8px] font-mono uppercase text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 + i * 0.01, duration: 0.2 }}
            className={cn(
              "aspect-square rounded-sm border text-[7.5px] grid place-items-center",
              scheduled.has(i)
                ? "border-transparent text-white font-bold"
                : "border-border/40 bg-background/40 text-muted-foreground/60",
            )}
            style={
              scheduled.has(i)
                ? { background: `hsl(${accent}/0.7)` }
                : undefined
            }
          >
            {i + 1}
          </motion.div>
        ))}
      </div>
      <div className="text-[8.5px] font-mono text-muted-foreground/70 mt-1.5">
        7 posts programados · próximo en 2 días
      </div>
    </div>
  );
}

export function MockOpenDesign({ accent }: { accent: string }) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="col-span-1 aspect-square rounded-md grid place-items-center relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, hsl(${accent}/0.7), hsl(${accent}/0.2))`,
        }}
      >
        <div className="text-white font-bold text-[10px] text-center px-1 leading-tight">
          Bewe<br />Software
        </div>
        <span className="absolute top-0.5 right-0.5 text-[7px] font-mono px-1 rounded bg-background/80 text-foreground/85">
          IG
        </span>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.22, duration: 0.3 }}
        className="col-span-2 aspect-square rounded-md p-2 flex flex-col gap-1"
        style={{
          background: `hsl(${accent}/0.1)`,
          border: `1px dashed hsl(${accent}/0.4)`,
        }}
      >
        <div className="text-[8.5px] font-mono uppercase tracking-wider text-muted-foreground">
          Prompt
        </div>
        <div className="text-[10px] text-foreground/90 leading-snug">
          “Post anuncio Bewe Reservas · violeta”
        </div>
        <div className="mt-auto flex items-center gap-1">
          <span
            className="size-1.5 rounded-full animate-pulse"
            style={{ background: `hsl(${accent})` }}
          />
          <span className="text-[8.5px] font-mono" style={{ color: `hsl(${accent})` }}>
            Generando con Mark…
          </span>
        </div>
      </motion.div>
    </div>
  );
}

export function MockSeo({ accent }: { accent: string }) {
  const kws = [
    { k: "software gestión salón", p: 4 },
    { k: "agenda online belleza", p: 7 },
    { k: "punto de venta belleza", p: 12 },
  ];
  return (
    <div className="space-y-1.5">
      <div className="text-[8.5px] font-mono uppercase tracking-wider text-muted-foreground">
        Top keywords · GSC
      </div>
      {kws.map((k, i) => (
        <motion.div
          key={k.k}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 + 0.07 * i, duration: 0.28 }}
          className="flex items-center gap-2 text-[10px]"
        >
          <span className="text-foreground/85 flex-1 truncate">{k.k}</span>
          <span
            className="font-mono font-bold px-1.5 py-0.5 rounded text-[9px]"
            style={{
              background: `hsl(${accent}/0.18)`,
              color: `hsl(${accent})`,
            }}
          >
            #{k.p}
          </span>
        </motion.div>
      ))}
      <div className="pt-1 mt-1 border-t border-border/40 flex items-center gap-1.5">
        <span
          className="size-1.5 rounded-full animate-pulse"
          style={{ background: `hsl(${accent})` }}
        />
        <span className="text-[8.5px] font-mono text-muted-foreground">
          AEO · 18/30 prompts te mencionan
        </span>
      </div>
    </div>
  );
}

export function MockPerformance({ accent }: { accent: string }) {
  const funnel = [
    { k: "Impr", v: "184k", w: 100 },
    { k: "Click", v: "3.4k", w: 60 },
    { k: "Lead", v: "864", w: 30 },
    { k: "Act", v: "212", w: 14 },
  ];
  return (
    <div className="space-y-1">
      {funnel.map((f, i) => (
        <motion.div
          key={f.k}
          initial={{ opacity: 0, scaleX: 0.6 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.15 + 0.06 * i, duration: 0.3 }}
          style={{ width: `${f.w}%`, transformOrigin: "left" }}
          className="rounded-md border border-border/60 px-2 py-1 flex items-center justify-between"
        >
          <span className="text-[9.5px] font-mono uppercase tracking-wider text-muted-foreground">
            {f.k}
          </span>
          <span
            className="text-[10.5px] font-bold tabular-nums"
            style={{ color: `hsl(${accent})` }}
          >
            {f.v}
          </span>
        </motion.div>
      ))}
      <div className="flex items-center justify-between pt-1 mt-1 border-t border-border/40">
        <span className="text-[8.5px] font-mono text-muted-foreground">
          LTV/CAC
        </span>
        <span
          className="text-[10.5px] font-bold tabular-nums"
          style={{ color: `hsl(${accent})` }}
        >
          3.4×
        </span>
      </div>
    </div>
  );
}

export function MockInforme({ accent }: { accent: string }) {
  const formats = [
    { n: "Slack short", l: "3 líneas", emo: "💬" },
    { n: "Email exec", l: "1 página", emo: "✉️" },
    { n: "Julián full", l: "3 páginas", emo: "📄" },
  ];
  return (
    <div className="space-y-1">
      {formats.map((f, i) => (
        <motion.div
          key={f.n}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + 0.07 * i, duration: 0.28 }}
          className="flex items-center gap-2 rounded-md border border-border/60 bg-background/60 px-2 py-1.5"
        >
          <span aria-hidden className="text-[12px] leading-none">
            {f.emo}
          </span>
          <span className="text-[10.5px] font-semibold text-foreground/90 flex-1">
            {f.n}
          </span>
          <span
            className="text-[9px] font-mono px-1.5 py-0.5 rounded"
            style={{
              background: `hsl(${accent}/0.18)`,
              color: `hsl(${accent})`,
            }}
          >
            {f.l}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

export function MockConfig({ accent }: { accent: string }) {
  const items = [
    { k: "Meta Conectado", v: "✓", ok: true },
    { k: "Memoria agente", v: "24 notas", ok: true },
    { k: "Personalidad", v: "Mark", ok: true },
  ];
  return (
    <div className="space-y-1">
      {items.map((it, i) => (
        <motion.div
          key={it.k}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 + 0.07 * i, duration: 0.28 }}
          className="flex items-center gap-2 rounded-md border border-border/60 bg-background/60 px-2 py-1.5"
        >
          <span
            className="size-2 rounded-full"
            style={{
              background: it.ok ? "hsl(var(--brand-lime))" : "hsl(38 92% 55%)",
            }}
          />
          <span className="text-[10.5px] text-foreground/85 flex-1">
            {it.k}
          </span>
          <span
            className="text-[9.5px] font-mono"
            style={{ color: `hsl(${accent})` }}
          >
            {it.v}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
