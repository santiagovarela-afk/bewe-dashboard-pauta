"use client";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { CalendarDays, Check } from "lucide-react";
import { useDashboard, type DatePreset } from "@/lib/store";
import { cn } from "@/lib/utils";

const PRESETS: { id: DatePreset | "today" | "yesterday"; label: string }[] = [
  { id: "today", label: "Hoy" },
  { id: "yesterday", label: "Ayer" },
  { id: "last_3d", label: "Últimos 3d" },
  { id: "last_7d", label: "Últimos 7d" },
  { id: "last_14d", label: "Últimos 14d" },
  { id: "this_month", label: "Mes en curso" },
];

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}
function isoDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function DateRangePicker() {
  const { dateRange, setDateRange, hasDailyBreakdown } = useDashboard();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function applyPreset(id: (typeof PRESETS)[number]["id"]) {
    const today = isoToday();
    let from = today;
    let to = today;
    switch (id) {
      case "today":
        from = today;
        to = today;
        break;
      case "yesterday":
        from = isoDaysAgo(1);
        to = isoDaysAgo(1);
        break;
      case "last_3d":
        from = isoDaysAgo(2);
        to = today;
        break;
      case "last_7d":
        from = isoDaysAgo(6);
        to = today;
        break;
      case "last_14d":
        from = isoDaysAgo(13);
        to = today;
        break;
      case "this_month": {
        const d = new Date();
        from = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
        to = today;
        break;
      }
    }
    setDateRange({ from, to });
    setOpen(false);
  }

  const label = dateRange.from === dateRange.to ? formatES(dateRange.from) : `${formatES(dateRange.from)} → ${formatES(dateRange.to)}`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-2 h-8 px-3 rounded-full border text-[11px] whitespace-nowrap transition-colors hover:border-foreground/30",
          "border-border bg-card/40 text-muted-foreground hover:text-foreground",
          open && "border-foreground/40 text-foreground",
        )}
        title="Filtrar por fechas (cliente · sin re-fetch)"
      >
        <CalendarDays className="size-3" />
        <span className="font-mono">{label}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 mt-2 z-50 w-[340px] rounded-xl border border-border bg-popover/95 backdrop-blur-xl shadow-2xl p-3"
          >
            <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-bold mb-2 px-1">
              Presets rápidos
            </div>
            <div className="grid grid-cols-2 gap-1">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p.id)}
                  className="text-[11px] text-left px-2 py-1.5 rounded-md hover:bg-secondary text-foreground/90"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="border-t border-border/60 mt-3 pt-3">
              <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-bold mb-2 px-1">
                Rango personalizado
              </div>
              <div className="grid grid-cols-2 gap-2 px-1">
                <label className="block">
                  <div className="text-[10px] text-muted-foreground mb-1">Desde</div>
                  <input
                    type="date"
                    value={dateRange.from}
                    max={dateRange.to}
                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                    className="w-full h-8 bg-background border border-border rounded-md px-2 text-[11px] font-mono"
                  />
                </label>
                <label className="block">
                  <div className="text-[10px] text-muted-foreground mb-1">Hasta</div>
                  <input
                    type="date"
                    value={dateRange.to}
                    min={dateRange.from}
                    max={isoToday()}
                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                    className="w-full h-8 bg-background border border-border rounded-md px-2 text-[11px] font-mono"
                  />
                </label>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-border/40 text-[10px] text-muted-foreground/80 flex items-center gap-1.5 px-1">
              {hasDailyBreakdown ? (
                <>
                  <Check className="size-3 text-[hsl(var(--success))]" />
                  Breakdown diario disponible · filtra sin re-llamar API.
                </>
              ) : (
                <>
                  ⓘ El filtro cliente requiere haber pulsado "Actualizar" primero
                  con el token Meta configurado.
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatES(iso: string) {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}`;
}
