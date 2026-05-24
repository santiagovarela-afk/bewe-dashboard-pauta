"use client";
import * as React from "react";
import {
  ExternalLink,
  ImageOff,
  Pause,
  Play,
  Sparkles,
  Calendar,
  AlertTriangle,
  ShieldAlert,
  Info as InfoIcon,
} from "lucide-react";
import { Drawer } from "@/components/shared/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExplainedMetric } from "@/components/shared/explained-metric";
import { cn, fmt, ctrTone, cptTone, cpmTone } from "@/lib/utils";
import { GLOSSARY } from "@/lib/glossary";
import { PLAN } from "@/lib/config";
import type { MetaAd } from "@/lib/hooks/use-ads";
import {
  deriveAdMetrics,
  getAdAlerts,
  getBestThumb,
  getMediaType,
  type AdAlert,
} from "./ad-alerts";

interface AdDetailDrawerProps {
  ad: MetaAd | null;
  onClose: () => void;
  campaigns: Array<{ cid: string; code: string; name: string; vertical: string }>;
}

export function AdDetailDrawer({ ad, onClose, campaigns }: AdDetailDrawerProps) {
  if (!ad) return <Drawer open={false} onClose={onClose} />;

  const camp = campaigns.find((c) => c.cid === ad.campaign_id);
  const thumb = getBestThumb(ad);
  const mediaType = getMediaType(ad);
  const liveStatus = ad.effective_status ?? ad.status;
  const m = deriveAdMetrics(ad.ins);
  const alerts = getAdAlerts(ad);

  const adsManagerUrl = `https://www.facebook.com/adsmanager/manage/ads/edit?act=${PLAN.meta.accountIdNumeric}&selected_ad_ids=${ad.id}`;

  const daysActive = ad.created_time
    ? Math.max(
        1,
        Math.floor(
          (Date.now() - new Date(ad.created_time).getTime()) / 86400000,
        ),
      )
    : null;

  const copyTitle =
    ad.creative?.title ?? ad.creative?.object_story_spec?.video_data?.title;
  const copyBody =
    ad.creative?.body ??
    ad.creative?.object_story_spec?.link_data?.message ??
    ad.creative?.object_story_spec?.video_data?.message;
  const cta =
    ad.creative?.call_to_action_type ??
    ad.creative?.object_story_spec?.link_data?.call_to_action?.type ??
    ad.creative?.object_story_spec?.video_data?.call_to_action?.type;

  function askAi() {
    window.dispatchEvent(
      new CustomEvent("bw:ai-ask", {
        detail: {
          source: "anuncios-drawer",
          adId: ad!.id,
          adName: ad!.name,
          campaign: camp?.code ?? null,
          alerts: alerts.map((a) => ({ code: a.code, level: a.level })),
          metrics: m,
          prompt: `Analiza el anuncio "${ad!.name}" (${camp?.code ?? "sin camp"}): ${m.conversions} CR, CPR ${m.cpr?.toFixed(2) ?? "—"}, CTR ${m.ctr.toFixed(2)}%, gasto €${m.spend.toFixed(2)}, freq ${m.frequency.toFixed(2)}. ¿Qué hago: pausar, escalar o iterar?`,
        },
      }),
    );
    onClose();
  }

  return (
    <Drawer
      open={!!ad}
      onClose={onClose}
      width={520}
      title={ad.name}
      subtitle={
        camp ? `${camp.code} · ${camp.vertical}` : `Ad ID ${ad.id.slice(-10)}`
      }
      footer={
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              variant={liveStatus === "ACTIVE" ? "destructive" : "default"}
              size="sm"
              className="flex-1"
              onClick={() => {
                // eslint-disable-next-line no-console
                console.log(
                  `[ads] ${liveStatus === "ACTIVE" ? "PAUSE" : "ACTIVATE"} requested for`,
                  ad.id,
                );
              }}
            >
              {liveStatus === "ACTIVE" ? (
                <>
                  <Pause className="size-3.5" /> Pausar
                </>
              ) : (
                <>
                  <Play className="size-3.5" /> Activar
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={askAi}>
              <Sparkles className="size-3.5" /> Pedir análisis a Mark/Lúa
            </Button>
          </div>
          <a href={adsManagerUrl} target="_blank" rel="noreferrer" className="w-full">
            <Button variant="glow" size="sm" className="w-full">
              <ExternalLink className="size-3.5" /> Abrir en Meta Ads Manager
            </Button>
          </a>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Status / breadcrumb */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={liveStatus === "ACTIVE" ? "success" : "outline"}
            className="!text-[10px]"
          >
            {liveStatus}
          </Badge>
          {camp && (
            <Badge variant="violet" className="!text-[10px]">
              {camp.code}
            </Badge>
          )}
          <MediaTypeChip type={mediaType} />
          {daysActive !== null && (
            <span className="ml-auto text-[10px] text-muted-foreground inline-flex items-center gap-1">
              <Calendar className="size-3" /> {daysActive}d activo
            </span>
          )}
        </div>

        {/* Preview HD · full-bleed */}
        <div className="rounded-xl overflow-hidden border border-border bg-secondary/40 max-h-[460px]">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt={ad.name}
              className="w-full h-auto max-h-[460px] object-contain bg-black/40"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="aspect-square grid place-items-center text-muted-foreground/40">
              <ImageOff className="size-12" />
            </div>
          )}
        </div>

        {/* ALERTS · destacadas */}
        {alerts.length > 0 && <AlertsPanel alerts={alerts} />}

        {/* Métricas explicadas */}
        <section>
          <SectionTitle>Métricas del período · {fmtPeriod(ad.ins)}</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            <ExplainedCell
              label="Gasto"
              value={fmt.eur(m.spend, { decimals: 2 })}
              tone="violet"
              explanation="Inversión total acumulada en el período visible. Mide cuánto presupuesto consumió este creativo."
            />
            <ExplainedCell
              label="Impresiones"
              value={fmt.int(m.impressions)}
              explanation="Número total de veces que el anuncio fue mostrado. NO equivale a personas únicas (eso es reach)."
            />
            <ExplainedCell
              label="Clicks"
              value={fmt.int(m.clicks)}
              explanation="Clicks totales (incluye link clicks + reacciones + 'ver más'). Para clicks al link específicamente, mira CTR."
            />
            <ExplainedCell
              label="CTR"
              value={m.ctr ? `${m.ctr.toFixed(2)}%` : "—"}
              tone={ctrTone(m.ctr)}
              explanation={GLOSSARY.ctr.long ?? GLOSSARY.ctr.short}
            />
            <ExplainedCell
              label="CPM"
              value={m.cpm ? fmt.eur(m.cpm, { decimals: 2 }) : "—"}
              tone={cpmTone(m.cpm)}
              explanation={GLOSSARY.cpm.long ?? GLOSSARY.cpm.short}
            />
            <ExplainedCell
              label="Frecuencia"
              value={m.frequency ? `${m.frequency.toFixed(2)}×` : "—"}
              tone={
                m.frequency > 3 ? "danger" : m.frequency > 2 ? "warning" : "default"
              }
              explanation={GLOSSARY.frecuencia.long ?? GLOSSARY.frecuencia.short}
            />
            <ExplainedCell
              label="Reach"
              value={fmt.int(m.reach)}
              className="col-span-2"
              explanation="Personas únicas que vieron el anuncio al menos una vez. Reach × Frecuencia = Impresiones."
            />
          </div>
        </section>

        {/* Conversiones · solo si hay alguna */}
        {(m.cr > 0 || m.ic > 0 || m.conversions > 0) && (
          <section>
            <SectionTitle>Conversiones</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              <ExplainedCell
                label="CR (registros)"
                value={fmt.int(m.cr)}
                tone={m.cr > 0 ? "success" : "default"}
                explanation={GLOSSARY.cr.long ?? GLOSSARY.cr.short}
              />
              <ExplainedCell
                label="IC (checkout iniciado)"
                value={fmt.int(m.ic)}
                explanation={GLOSSARY.ic.long ?? GLOSSARY.ic.short}
              />
              <ExplainedCell
                label="CPR"
                value={m.cpr ? fmt.eur(m.cpr, { decimals: 2 }) : "—"}
                tone={cptTone(m.cpr ?? undefined)}
                explanation="Cost Per Result · gasto ÷ conversiones del evento objetivo. Target Bewe ≤ €5, crítico > €15."
              />
              <ExplainedCell
                label="CPL"
                value={m.cpl ? fmt.eur(m.cpl, { decimals: 2 }) : "—"}
                tone={cptTone(m.cpl ?? undefined)}
                explanation="Costo por Lead · spend dividido entre registros completos (CR). Sirve para comparar entre adsets con mismo objetivo."
              />
              <ExplainedCell
                label="CPTrial"
                value={m.cpTrial ? fmt.eur(m.cpTrial, { decimals: 2 }) : "—"}
                tone={cptTone(m.cpTrial ?? undefined)}
                className="col-span-2"
                explanation="Costo por InitiateCheckout (trial iniciado). Si CPTrial bajo pero CPR alto → bug onboarding."
              />
            </div>
          </section>
        )}

        {/* Copy del creativo */}
        {(copyTitle || copyBody || cta) && (
          <section>
            <SectionTitle>Copy del creativo</SectionTitle>
            <div className="space-y-2 rounded-lg border border-border/60 bg-card/60 p-3">
              {copyTitle && (
                <div className="text-[12px] font-semibold leading-snug">
                  {copyTitle}
                </div>
              )}
              {copyBody && (
                <div className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {copyBody}
                </div>
              )}
              {cta && (
                <Badge variant="cyan" className="!text-[9px] mt-1">
                  CTA · {cta.replace(/_/g, " ")}
                </Badge>
              )}
            </div>
          </section>
        )}
      </div>
    </Drawer>
  );
}

function AlertsPanel({ alerts }: { alerts: AdAlert[] }) {
  const critical = alerts.filter((a) => a.level === "critical");
  const warning = alerts.filter((a) => a.level === "warning");
  const info = alerts.filter((a) => a.level === "info");
  return (
    <section className="rounded-xl border border-[hsl(var(--warning)/0.35)] bg-[hsl(var(--warning)/0.06)] p-3">
      <div className="flex items-center gap-2 mb-2">
        <ShieldAlert className="size-4 text-[hsl(var(--warning))]" />
        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--warning))]">
          Diagnóstico · {alerts.length} {alerts.length === 1 ? "alerta" : "alertas"}
        </div>
      </div>
      <div className="space-y-1.5">
        {[...critical, ...warning, ...info].map((a, i) => (
          <AlertRow key={a.code + i} a={a} />
        ))}
      </div>
    </section>
  );
}

function AlertRow({ a }: { a: AdAlert }) {
  const tone = {
    critical: {
      bg: "bg-[hsl(var(--destructive)/0.10)]",
      border: "border-[hsl(var(--destructive)/0.4)]",
      text: "text-[hsl(var(--destructive))]",
      Icon: AlertTriangle,
    },
    warning: {
      bg: "bg-[hsl(var(--warning)/0.10)]",
      border: "border-[hsl(var(--warning)/0.4)]",
      text: "text-[hsl(var(--warning))]",
      Icon: AlertTriangle,
    },
    info: {
      bg: "bg-[hsl(var(--info)/0.08)]",
      border: "border-[hsl(var(--info)/0.3)]",
      text: "text-[hsl(var(--info))]",
      Icon: InfoIcon,
    },
  }[a.level];
  return (
    <div
      className={cn("rounded-md border px-2.5 py-2 flex items-start gap-2", tone.bg, tone.border)}
    >
      <span className="text-[13px] leading-tight mt-0.5">{a.icon}</span>
      <div className="flex-1 min-w-0">
        <div className={cn("text-[11px] font-semibold", tone.text)}>
          {a.message}
        </div>
        <div className="text-[10px] text-muted-foreground leading-snug mt-0.5">
          {a.explanation}
        </div>
      </div>
    </div>
  );
}

function ExplainedCell({
  label,
  value,
  tone = "default",
  explanation,
  className,
}: {
  label: string;
  value: string;
  tone?:
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "violet"
    | "lime"
    | "ember"
    | "cyan";
  explanation: React.ReactNode;
  className?: string;
}) {
  const toneColor: Record<string, string> = {
    default: "text-foreground",
    success: "text-[hsl(var(--success))]",
    warning: "text-[hsl(var(--warning))]",
    danger: "text-[hsl(var(--destructive))]",
    info: "text-[hsl(var(--info))]",
    violet: "text-[hsl(var(--brand-violet))]",
    lime: "text-[hsl(var(--brand-lime))]",
    ember: "text-[hsl(var(--brand-ember))]",
    cyan: "text-[hsl(var(--brand-cyan))]",
  };
  return (
    <div
      className={cn(
        "rounded-md border border-border/60 bg-card/60 px-3 py-2",
        className,
      )}
    >
      <ExplainedMetric explanation={explanation} width={300}>
        <div className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/80 font-bold">
          {label}
        </div>
      </ExplainedMetric>
      <div className={cn("font-mono font-bold text-[14px] mt-0.5", toneColor[tone])}>
        {value}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2">
      {children}
    </div>
  );
}

function MediaTypeChip({ type }: { type: ReturnType<typeof getMediaType> }) {
  if (type === "video")
    return (
      <Badge variant="cyan" className="!text-[10px]">
        Video
      </Badge>
    );
  if (type === "carousel")
    return (
      <Badge variant="ember" className="!text-[10px]">
        Carrusel
      </Badge>
    );
  if (type === "image")
    return (
      <Badge variant="outline" className="!text-[10px]">
        Imagen
      </Badge>
    );
  return null;
}

function fmtPeriod(ins: MetaAd["ins"]): string {
  if (!ins?.date_start || !ins?.date_stop) return "this_month";
  const fm = (s: string) =>
    new Date(s).toLocaleDateString("es", { day: "2-digit", month: "short" });
  return `${fm(ins.date_start)} → ${fm(ins.date_stop)}`;
}
