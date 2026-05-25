"use client";
/**
 * Help Guide · drawer/accordion contextual para cualquier tab.
 *
 * Botón "Cómo leer esta tab" en topbar de la tab → abre drawer con 4 secciones:
 *  1. Qué muestra · descripción corta de la tab
 *  2. Cómo interpretar colores · semáforos verde/amarillo/rojo
 *  3. Acciones recomendadas · qué hacer cuando ves X
 *  4. Quién puede editar · roles
 *
 * Cada tab pasa su propio HelpGuideContent. Es reutilizable.
 */
import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronDown,
  CircleHelp,
  Lightbulb,
  Palette,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 *  Tipos del contenido por tab
 * ─────────────────────────────────────────────────────────────────────── */

export interface HelpSemaforo {
  /** Color HSL token (ej "var(--success)"). */
  color: string;
  /** Etiqueta corta (Verde · Amarillo · Rojo). */
  label: string;
  /** Qué significa. */
  meaning: string;
}

export interface HelpAction {
  /** Condición ("Si ves CPL > €2.20…"). */
  when: string;
  /** Qué hacer ("…revisá la campaña C2 en Anuncios"). */
  then: string;
}

export interface HelpGuideContent {
  /** Título principal del drawer (nombre de la tab). */
  title: string;
  /** Subtítulo corto · qué es esta tab en 1 línea. */
  tagline: string;
  /** Qué muestra · 1-2 párrafos cortos. */
  whatItShows: React.ReactNode;
  /** Semáforos · cómo interpretar colores. */
  semaforos: HelpSemaforo[];
  /** Acciones recomendadas. */
  actions: HelpAction[];
  /** Roles que pueden editar/modificar. */
  editableBy: Array<{ role: string; canDo: string }>;
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Trigger button
 * ─────────────────────────────────────────────────────────────────────── */

interface HelpGuideTriggerProps {
  content: HelpGuideContent;
  className?: string;
}

/**
 * Botón compacto "Cómo leer esto" que abre el drawer.
 * Usalo arriba a la derecha de cada tab principal.
 */
export function HelpGuideTrigger({ content, className }: HelpGuideTriggerProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "group inline-flex items-center gap-1.5 rounded-full border border-border bg-card/40 backdrop-blur px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:border-[hsl(var(--brand-violet)/0.5)] hover:bg-[hsl(var(--brand-violet)/0.08)] transition",
          className,
        )}
        title="Abrir guía de esta tab"
      >
        <CircleHelp className="size-3.5 text-[hsl(var(--brand-violet))]" />
        <span className="font-medium">Cómo leer esta tab</span>
      </button>
      <HelpGuideDrawer content={content} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Drawer principal · portaleado al body para evitar overflow
 * ─────────────────────────────────────────────────────────────────────── */

interface HelpGuideDrawerProps {
  content: HelpGuideContent;
  open: boolean;
  onClose: () => void;
}

function HelpGuideDrawer({ content, open, onClose }: HelpGuideDrawerProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  const node = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="help-guide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="Guía de la tab"
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Cerrar guía"
            onClick={onClose}
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className={cn(
              "relative h-full w-full max-w-md bg-card/95 backdrop-blur-2xl border-l border-border",
              "shadow-[-30px_0_80px_-30px_hsl(var(--brand-violet)/0.4)]",
              "flex flex-col",
            )}
          >
            {/* Header */}
            <div className="shrink-0 px-5 pt-5 pb-4 border-b border-border/60">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-9 rounded-xl grid place-items-center bg-gradient-to-br from-[hsl(var(--brand-violet))] to-[hsl(var(--brand-cyan))] shadow-[0_8px_20px_-8px_hsl(var(--brand-violet)/0.6)]">
                    <Sparkles className="size-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-[hsl(var(--brand-violet))]">
                      Guía rápida
                    </div>
                    <h2 className="font-display text-lg font-bold tracking-tight leading-tight truncate">
                      {content.title}
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 size-8 grid place-items-center rounded-full border border-border bg-background/40 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition"
                  aria-label="Cerrar"
                >
                  <X className="size-3.5" />
                </button>
              </div>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                {content.tagline}
              </p>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
              <HelpSection
                Icon={Lightbulb}
                title="Qué muestra esta tab"
                accent="var(--brand-violet)"
                defaultOpen
              >
                <div className="text-[12.5px] text-muted-foreground leading-relaxed">
                  {content.whatItShows}
                </div>
              </HelpSection>

              <HelpSection
                Icon={Palette}
                title="Cómo interpretar los colores"
                accent="var(--brand-cyan)"
              >
                <div className="space-y-2">
                  {content.semaforos.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-background/30 p-2.5"
                    >
                      <span
                        className="mt-1 size-3 rounded-full shrink-0 shadow-[0_0_10px_-2px_var(--dot-color)]"
                        style={{
                          background: `hsl(${s.color})`,
                          ["--dot-color" as string]: `hsl(${s.color})`,
                        }}
                      />
                      <div className="min-w-0">
                        <div
                          className="text-[11.5px] font-bold uppercase tracking-[0.08em]"
                          style={{ color: `hsl(${s.color})` }}
                        >
                          {s.label}
                        </div>
                        <div className="text-[11.5px] text-muted-foreground leading-snug mt-0.5">
                          {s.meaning}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </HelpSection>

              <HelpSection
                Icon={Sparkles}
                title="Acciones recomendadas"
                accent="var(--brand-lime)"
              >
                <ul className="space-y-2">
                  {content.actions.map((a, i) => (
                    <li
                      key={i}
                      className="rounded-lg border border-border/50 bg-background/30 p-2.5"
                    >
                      <div className="text-[11.5px] leading-relaxed">
                        <span className="text-[hsl(var(--brand-lime))] font-semibold">
                          Si {a.when}
                        </span>
                        <span className="text-muted-foreground"> · entonces </span>
                        <span className="text-foreground">{a.then}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </HelpSection>

              <HelpSection
                Icon={ShieldCheck}
                title="Quién puede editar"
                accent="var(--brand-ember)"
              >
                <ul className="space-y-1.5">
                  {content.editableBy.map((r, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-[11.5px] text-muted-foreground"
                    >
                      <span className="font-mono text-[10px] uppercase tracking-[0.08em] px-1.5 py-0.5 rounded bg-[hsl(var(--brand-ember)/0.12)] text-[hsl(var(--brand-ember))] font-bold">
                        {r.role}
                      </span>
                      <span className="leading-snug">{r.canDo}</span>
                    </li>
                  ))}
                </ul>
              </HelpSection>
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-border/60 bg-card/95 backdrop-blur-xl px-5 py-3 flex items-center justify-between gap-3">
              <span className="text-[10.5px] text-muted-foreground/70">
                Cerrá con{" "}
                <kbd className="px-1 py-0.5 rounded border border-border bg-background/60 text-[10px] font-mono">
                  Esc
                </kbd>
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-[11px]"
              >
                Entendido
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(node, document.body);
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Acordeón de sección
 * ─────────────────────────────────────────────────────────────────────── */

interface HelpSectionProps {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  accent: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function HelpSection({ Icon, title, accent, defaultOpen, children }: HelpSectionProps) {
  const [open, setOpen] = React.useState(Boolean(defaultOpen));
  return (
    <div className="rounded-xl border border-border bg-background/30 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 px-3.5 py-3 hover:bg-card/50 transition text-left"
        aria-expanded={open}
      >
        <div
          className="size-7 rounded-md grid place-items-center shrink-0 border"
          style={{
            background: `hsl(${accent} / 0.12)`,
            borderColor: `hsl(${accent} / 0.35)`,
            color: `hsl(${accent})`,
          }}
        >
          <Icon className="size-3.5" />
        </div>
        <h3 className="flex-1 text-[12.5px] font-semibold leading-tight">{title}</h3>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3.5 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Contenido por defecto · Tab Dashboard
 * ─────────────────────────────────────────────────────────────────────── */

export const HELP_DASHBOARD: HelpGuideContent = {
  title: "Dashboard · panel ejecutivo",
  tagline:
    "Tu primera parada cada mañana. Resume gasto, leads, CPL y señales operativas en una sola pantalla.",
  whatItShows: (
    <>
      <p>
        El <strong className="text-foreground">hero</strong> muestra el periodo activo
        (Hoy · 7 días · Mes · Custom) con gasto, leads y CPL. Debajo, las{" "}
        <strong className="text-foreground">métricas clave</strong> ofrecen el snapshot
        cross-campaña.
      </p>
      <p className="mt-2">
        La sección{" "}
        <strong className="text-foreground">atención requerida</strong> destila
        alertas concretas (CPL drift, frecuencia alta, CPM alto) · no muestra ruido.
        Si no hay nada, todo está dentro de rango.
      </p>
    </>
  ),
  semaforos: [
    {
      color: "var(--success)",
      label: "Verde · en target",
      meaning:
        "CPL ≤ €2.20, CTR 1.5%-4%, CPM < €9. Mantener · sin acciones urgentes.",
    },
    {
      color: "var(--warning)",
      label: "Amarillo · atención",
      meaning:
        "Métricas drifteando · CPL +25% vs sem pasada, frecuencia > 2.5×, CPM > €5.",
    },
    {
      color: "var(--destructive)",
      label: "Rojo · crítico",
      meaning:
        "CPL +60%, frecuencia > 3.5×, CPM > €9. Pausar o ajustar creativo HOY.",
    },
  ],
  actions: [
    {
      when: "ves CPL subiendo > €2.20",
      then: "abrí Campañas y revisá las CR (C1·C2·C4) · puede ser fatiga creativa.",
    },
    {
      when: "una campaña entra en atención con frecuencia > 3×",
      then: "rotá creativos en Open Design o pausá temporalmente.",
    },
    {
      when: "el embudo SaaS muestra trial 0",
      then: "es analytics pendiente · GA4 requiere conectarse para ese paso.",
    },
    {
      when: "estás arrancando el día",
      then: "leé el Daily Summary y comprobá Plan B (MX Servicios).",
    },
  ],
  editableBy: [
    { role: "admin", canDo: "todo · presupuesto, tokens, memoria del agente" },
    { role: "lead", canDo: "rangos de fecha y rotación creativa" },
    { role: "content", canDo: "solo lectura · sin permisos de pauta" },
  ],
};
