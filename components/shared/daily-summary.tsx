"use client";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  Check,
  Copy,
  Send,
  Sparkles,
  TrendingUp,
  Minus,
  X,
} from "lucide-react";
import { useDashboard } from "@/lib/store";
import { PLAN } from "@/lib/config";
import { cn, fmt } from "@/lib/utils";
import { computeMetrics } from "@/lib/selectors";
import {
  buildJulianMessage,
  dailyHighlights,
  dailyRisks,
  delta,
  getYesterday,
  snapshotEntry,
  writeEntry,
} from "@/lib/diary";
import { TextureCard } from "@/components/fx/texture-card";
import { SpotlightCard } from "@/components/fx/spotlight-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function DailySummary() {
  const { campaigns, daysElapsed } = useDashboard();
  const m = React.useMemo(() => computeMetrics(campaigns), [campaigns]);
  const yest = React.useMemo(() => getYesterday(campaigns, daysElapsed), [campaigns, daysElapsed]);

  const dSpend = delta(m.spend, yest.spend);
  const dCR = delta(m.totalConvCR, yest.cr);
  const dIC = delta(m.totalConvIC, yest.ic);

  const highlights = React.useMemo(() => dailyHighlights(campaigns), [campaigns]);
  const risks = React.useMemo(() => dailyRisks(campaigns), [campaigns]);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const julianText = React.useMemo(
    () => buildJulianMessage(campaigns, daysElapsed, PLAN.totalDays),
    [campaigns, daysElapsed],
  );

  function saveSnapshot() {
    const entry = snapshotEntry(campaigns, daysElapsed);
    writeEntry(entry);
    toast.success("Snapshot guardado · servirá de referencia para el delta de mañana");
  }

  function copyJulian() {
    navigator.clipboard.writeText(julianText);
    setCopied(true);
    toast.success("Mensaje copiado · listo para pegar");
    setTimeout(() => setCopied(false), 2200);
  }

  const yestDate = new Date(yest.dateISO);
  const yestStr = yestDate.toLocaleDateString("es", { day: "numeric", month: "short" });

  return (
    <>
      <SpotlightCard
        spotlightColor="var(--brand-violet)"
        intensity={0.22}
        className="p-0 overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 bg-background/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 grid place-items-center rounded-lg border border-[hsl(var(--brand-violet)/0.4)] bg-[hsl(var(--brand-violet)/0.12)] text-[hsl(var(--brand-violet))]">
              <CalendarClock className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-foreground">
                Resumen del día
              </div>
              <div className="text-[10px] text-muted-foreground">
                Día {daysElapsed} / {PLAN.totalDays} · vs. snapshot del {yestStr}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={saveSnapshot}
              className="h-7 px-2 text-[10px]"
            >
              <Sparkles className="size-3" />
              Guardar día
            </Button>
            <Button
              size="sm"
              variant="glow"
              onClick={() => setModalOpen(true)}
              className="h-7 px-2 text-[10px]"
            >
              <Send className="size-3" />
              Resumen para Julián
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-0">
          {/* Deltas */}
          <div className="p-4 border-r border-border/40">
            <div className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-3">
              Cambios vs. ayer
            </div>
            <div className="space-y-2">
              <DeltaRow
                label="Gasto"
                today={m.spend}
                d={dSpend}
                fmtFn={(v) => fmt.eur(v, { decimals: 0 })}
              />
              <DeltaRow
                label="Registros"
                today={m.totalConvCR}
                d={dCR}
                fmtFn={fmt.int}
                positiveIsGood
              />
              <DeltaRow
                label="Inicio pago"
                today={m.totalConvIC}
                d={dIC}
                fmtFn={fmt.int}
                positiveIsGood
              />
            </div>
          </div>

          {/* Highlights */}
          <div className="p-4 border-r border-border/40">
            <div className="text-[9px] uppercase tracking-[0.14em] text-[hsl(var(--success))] mb-3 flex items-center gap-1.5">
              <TrendingUp className="size-3" /> Highlights
            </div>
            <ul className="space-y-2">
              {highlights.length === 0 && (
                <li className="text-[11px] text-muted-foreground/70">
                  Sin highlights destacados hoy.
                </li>
              )}
              {highlights.map((h, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.35 }}
                  className="text-[11px] leading-snug text-foreground/90 flex gap-1.5"
                >
                  <span className="text-[hsl(var(--success))] mt-[2px]">●</span>
                  {h.text}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Risks */}
          <div className="p-4">
            <div className="text-[9px] uppercase tracking-[0.14em] text-[hsl(var(--destructive))] mb-3 flex items-center gap-1.5">
              <ArrowDownRight className="size-3" /> Riesgos del día
            </div>
            <ul className="space-y-2">
              {risks.length === 0 && (
                <li className="text-[11px] text-muted-foreground/70">
                  Ningún riesgo activo. Todo verde.
                </li>
              )}
              {risks.map((r, i) => {
                const dot =
                  r.tone === "danger"
                    ? "var(--destructive)"
                    : r.tone === "warning"
                      ? "var(--warning)"
                      : r.tone === "info"
                        ? "var(--info)"
                        : "var(--success)";
                return (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.35 }}
                    className="text-[11px] leading-snug text-foreground/90 flex gap-1.5"
                  >
                    <span style={{ color: `hsl(${dot})` }} className="mt-[2px]">
                      ●
                    </span>
                    {r.text}
                  </motion.li>
                );
              })}
            </ul>
          </div>
        </div>
      </SpotlightCard>

      <AnimatePresence>
        {modalOpen && (
          <JulianModal
            text={julianText}
            copied={copied}
            onCopy={copyJulian}
            onClose={() => setModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function DeltaRow({
  label,
  today,
  d,
  fmtFn,
  positiveIsGood = false,
}: {
  label: string;
  today: number;
  d: { diff: number; pct: number; dir: "up" | "down" | "flat" };
  fmtFn: (v: number) => string;
  positiveIsGood?: boolean;
}) {
  const Icon = d.dir === "up" ? ArrowUpRight : d.dir === "down" ? ArrowDownRight : Minus;
  // for spend, "up" is just informative; for CR/IC, "up" is good
  const tone: "success" | "danger" | "muted" =
    d.dir === "flat"
      ? "muted"
      : positiveIsGood
        ? d.dir === "up"
          ? "success"
          : "danger"
        : "muted";
  const toneClass =
    tone === "success"
      ? "text-[hsl(var(--success))]"
      : tone === "danger"
        ? "text-[hsl(var(--destructive))]"
        : "text-muted-foreground";
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">{label}</span>
      <div className="text-right">
        <div className="font-mono font-bold text-[15px] tabular leading-none text-foreground">
          {fmtFn(today)}
        </div>
        <div className={cn("text-[10px] font-mono mt-0.5 inline-flex items-center gap-0.5", toneClass)}>
          <Icon className="size-3" />
          {d.dir === "flat" ? "sin cambio" : `${d.diff > 0 ? "+" : ""}${fmtFn(d.diff)} · ${d.pct > 0 ? "+" : ""}${d.pct.toFixed(1)}%`}
        </div>
      </div>
    </div>
  );
}

function JulianModal({
  text,
  copied,
  onCopy,
  onClose,
}: {
  text: string;
  copied: boolean;
  onCopy: () => void;
  onClose: () => void;
}) {
  // close with Esc
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-background/85 backdrop-blur-md grid place-items-center px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[560px]"
      >
        <TextureCard className="p-0">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-background/40">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-[hsl(var(--brand-violet))]" />
              <h3 className="text-[13px] font-bold">Mensaje para Julián</h3>
              <Badge variant="violet">pegable</Badge>
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="size-7 grid place-items-center rounded-md border border-border/60 hover:bg-secondary text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <div className="p-5">
            <pre className="font-mono text-[12px] whitespace-pre-wrap leading-relaxed text-foreground/90 bg-background/60 rounded-lg border border-border/60 p-4 max-h-[340px] overflow-y-auto">
              {text}
            </pre>
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cerrar
              </Button>
              <Button variant="glow" size="sm" onClick={onCopy}>
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "Copiado" : "Copiar mensaje"}
              </Button>
            </div>
          </div>
        </TextureCard>
      </motion.div>
    </motion.div>
  );
}
