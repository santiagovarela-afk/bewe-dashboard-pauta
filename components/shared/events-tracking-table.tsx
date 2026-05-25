"use client";
import * as React from "react";
import { CheckCircle2, MinusCircle } from "lucide-react";
import { useDashboard } from "@/lib/store";
import { FUNNEL_EVENTS, type FunnelEventMapping } from "@/lib/event-mapping";
import { TextureCard } from "@/components/fx/texture-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EventsTrackingTableProps {
  /** Si GA4 está configurado · viene del endpoint /api/analytics/funnel */
  ga4Configured?: boolean;
}

/**
 * Tabla del mapeo canónico de eventos del funnel SaaS Bewe.
 * Muestra el estado activo de cada evento según:
 *  - GA4 configurado · habilita los eventos GA4
 *  - Meta API trae conteos > 0 para ese metaCapiEvent en el rango actual
 */
export function EventsTrackingTable({ ga4Configured }: EventsTrackingTableProps) {
  const { campaigns } = useDashboard();

  // Calcula los totales por metaCapiEvent agregando todas las campañas en el
  // rango activo. Sólo se usa para inferir si Meta está reportando ese evento.
  const metaTotals = React.useMemo(() => {
    const totals: Record<string, number> = {
      link_click: 0,
      lead: 0,
      initiate_checkout: 0,
      complete_registration: 0,
      start_trial: 0,
      subscribe: 0,
    };
    for (const c of campaigns) {
      totals.link_click += c.clicks;
      totals.lead += c.evContact;
      totals.initiate_checkout += c.evInitCheckout;
      totals.complete_registration += c.evCompleteReg;
      totals.start_trial += c.evStartTrial;
      totals.subscribe += c.evSubscribe;
    }
    return totals;
  }, [campaigns]);

  function getStatus(ev: FunnelEventMapping): {
    label: string;
    tone: "success" | "warning" | "default";
    Icon: React.ComponentType<{ className?: string }>;
  } {
    const metaActive =
      ev.metaCapiEvent !== null && (metaTotals[ev.metaCapiEvent] ?? 0) > 0;
    const ga4Active = ev.ga4Event !== null && ga4Configured === true;
    if (metaActive || ga4Active) {
      return { label: "activo", tone: "success", Icon: CheckCircle2 };
    }
    // si tiene fuente pero no llega data, marcar pendiente
    if (ev.metaCapiEvent !== null || ev.ga4Event !== null) {
      return { label: "pendiente", tone: "warning", Icon: MinusCircle };
    }
    return { label: "manual", tone: "default", Icon: MinusCircle };
  }

  return (
    <TextureCard className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-border/40 bg-card/40 backdrop-blur">
              <th className="text-left font-bold uppercase tracking-[0.1em] text-[10px] text-muted-foreground px-4 py-3">
                Acción
              </th>
              <th className="text-left font-bold uppercase tracking-[0.1em] text-[10px] text-muted-foreground px-4 py-3">
                GA4
              </th>
              <th className="text-left font-bold uppercase tracking-[0.1em] text-[10px] text-muted-foreground px-4 py-3">
                Meta CAPI
              </th>
              <th className="text-left font-bold uppercase tracking-[0.1em] text-[10px] text-muted-foreground px-4 py-3">
                Qué mide
              </th>
              <th className="text-right font-bold uppercase tracking-[0.1em] text-[10px] text-muted-foreground px-4 py-3">
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {FUNNEL_EVENTS.map((ev, i) => {
              const status = getStatus(ev);
              return (
                <tr
                  key={ev.stage}
                  className={cn(
                    "border-b border-border/20 transition-colors",
                    "hover:bg-card/30",
                    i % 2 === 0 ? "bg-transparent" : "bg-card/10",
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground leading-tight">
                      {ev.label}
                    </div>
                    {ev.isConversion && (
                      <div className="text-[9px] uppercase tracking-[0.1em] text-[hsl(var(--brand-lime))] mt-0.5">
                        conversión
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {ev.ga4Event ? (
                      <code className="font-mono text-[11px] text-[hsl(var(--brand-cyan))] bg-[hsl(var(--brand-cyan)/0.08)] px-1.5 py-0.5 rounded">
                        {ev.ga4Event}
                      </code>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {ev.metaCapiEvent ? (
                      <code className="font-mono text-[11px] text-[hsl(var(--brand-violet))] bg-[hsl(var(--brand-violet)/0.08)] px-1.5 py-0.5 rounded">
                        {ev.metaCapiEvent}
                      </code>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground leading-snug max-w-[260px]">
                    {ev.description}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Badge
                      variant={
                        status.tone === "success"
                          ? "success"
                          : status.tone === "warning"
                            ? "warning"
                            : "outline"
                      }
                      className="inline-flex items-center gap-1"
                    >
                      <status.Icon className="size-3" />
                      {status.label}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </TextureCard>
  );
}
