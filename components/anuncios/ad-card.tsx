"use client";
import * as React from "react";
import { motion } from "motion/react";
import { ImageOff, Play, Image as ImageIcon, Trophy, AlertTriangle, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SpotlightCard } from "@/components/fx/spotlight-card";
import { fmt } from "@/lib/utils";
import type { MetaAd } from "@/lib/hooks/use-ads";
import {
  getAdAlerts,
  deriveAdMetrics,
  getBestThumb,
  getMediaType,
  type AdAlert,
} from "./ad-alerts";

interface AdCardProps {
  ad: MetaAd;
  campaignCode?: string;
  campaignName?: string;
  /** Si se pasa, muestra pin TOP #N en el thumb. */
  topRank?: number;
  /** Si true, muestra pin LOSS (CPR > 4× target). */
  loss?: boolean;
  index?: number;
  onOpen: (ad: MetaAd) => void;
}

export function AdCard({ ad, campaignCode, campaignName, topRank, loss, index = 0, onOpen }: AdCardProps) {
  const thumb = getBestThumb(ad);
  const m = deriveAdMetrics(ad.ins);
  const alerts = getAdAlerts(ad);
  const mediaType = getMediaType(ad);
  const liveStatus = ad.effective_status ?? ad.status;
  const critical = alerts.filter((a) => a.level === "critical");
  const warnings = alerts.filter((a) => a.level === "warning");
  const isWinner = alerts.some((a) => a.code === "winner");

  return (
    <motion.button
      onClick={() => onOpen(ad)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.4), duration: 0.35 }}
      className="text-left group"
    >
      <SpotlightCard
        className="overflow-hidden h-full hover:border-foreground/30 transition-colors"
        spotlightColor={
          isWinner
            ? "var(--brand-lime)"
            : critical.length
              ? "var(--destructive)"
              : warnings.length
                ? "var(--warning)"
                : "var(--brand-violet)"
        }
      >
        {/* Media · 4:5 portrait works for IG vertical creative, fallback to square */}
        <div className="aspect-[4/5] bg-secondary/60 relative overflow-hidden">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt={ad.name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              draggable={false}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground/40">
              <ImageOff className="size-8" />
            </div>
          )}

          {/* Top-left: status + campaign + media type */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1 max-w-[80%]">
            <Badge
              variant={liveStatus === "ACTIVE" ? "success" : "outline"}
              className="!text-[9px] backdrop-blur bg-background/70"
            >
              {liveStatus}
            </Badge>
            {campaignCode && (
              <Badge
                variant="violet"
                className="!text-[9px] backdrop-blur bg-background/70"
              >
                {campaignCode}
              </Badge>
            )}
            <MediaPill type={mediaType} />
          </div>

          {/* Top-right: pins (TOP rank, LOSS) + winner + alerts */}
          <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
            {typeof topRank === "number" && topRank > 0 && (
              <Badge variant="lime" className="!text-[9px] !px-1.5 backdrop-blur bg-background/70">
                <Trophy className="size-2.5 mr-0.5" /> TOP #{topRank}
              </Badge>
            )}
            {loss && (
              <Badge variant="danger" className="!text-[9px] !px-1.5 backdrop-blur bg-background/70">
                <TrendingDown className="size-2.5 mr-0.5" /> LOSS
              </Badge>
            )}
            {!topRank && isWinner && (
              <Badge variant="lime" className="!text-[9px] !px-1.5 backdrop-blur bg-background/70">
                <Trophy className="size-2.5 mr-0.5" /> Top
              </Badge>
            )}
            {(critical.length > 0 || warnings.length > 0) && (
              <AlertStack alerts={alerts} />
            )}
          </div>

          {/* Bottom gradient + media play indicator */}
          {mediaType === "video" && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="size-12 rounded-full bg-black/55 backdrop-blur grid place-items-center border border-white/20 group-hover:scale-110 transition-transform">
                <Play className="size-5 text-white fill-white" />
              </div>
            </div>
          )}
        </div>

        <div className="p-3">
          {(campaignCode || campaignName) && (
            <div
              className="text-[9px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--brand-violet))] mb-1 truncate"
              title={campaignName ?? campaignCode}
            >
              {campaignCode ? `[${campaignCode}]` : ""}
              {campaignCode && campaignName ? " · " : ""}
              {campaignName ?? ""}
            </div>
          )}
          <div
            className="text-[11px] font-mono font-semibold truncate"
            title={ad.name}
          >
            {ad.name}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5 mb-2 truncate">
            {ad.creative?.title ?? ad.creative?.body?.slice(0, 60) ?? "—"}
          </div>

          {/* Top 3 metrics · spend + CR/CPR (or CTR if no CR) */}
          <div className="grid grid-cols-3 gap-1.5 text-[10px]">
            <Stat label="Gasto" value={fmt.eur(m.spend, { decimals: 0 })} />
            {m.conversions > 0 ? (
              <>
                <Stat label="CR" value={fmt.int(m.conversions)} tone="success" />
                <Stat
                  label="CPR"
                  value={m.cpr ? fmt.eur(m.cpr, { decimals: 2 }) : "—"}
                  tone={m.cpr && m.cpr > 15 ? "danger" : m.cpr && m.cpr > 5 ? "warning" : "success"}
                />
              </>
            ) : (
              <>
                <Stat
                  label="CTR"
                  value={m.ctr ? `${m.ctr.toFixed(2)}%` : "—"}
                  tone={m.ctr >= 1.5 ? "success" : m.ctr >= 1 ? "warning" : "danger"}
                />
                <Stat
                  label="Freq"
                  value={m.frequency ? `${m.frequency.toFixed(1)}×` : "—"}
                  tone={m.frequency > 2 ? "warning" : "default"}
                />
              </>
            )}
          </div>
        </div>
      </SpotlightCard>
    </motion.button>
  );
}

function AlertStack({ alerts }: { alerts: AdAlert[] }) {
  // Mostrar icons únicos (sin texto). Tooltip nativo con título.
  const unique = alerts.slice(0, 4);
  return (
    <div className="flex gap-0.5">
      {unique.map((a, i) => (
        <div
          key={a.code + i}
          title={`${a.message} · ${a.explanation}`}
          className={
            a.level === "critical"
              ? "size-5 grid place-items-center rounded-md bg-[hsl(var(--destructive)/0.92)] text-white text-[10px] shadow"
              : a.level === "warning"
                ? "size-5 grid place-items-center rounded-md bg-[hsl(var(--warning)/0.92)] text-black text-[10px] shadow"
                : "size-5 grid place-items-center rounded-md bg-background/80 text-foreground text-[10px] backdrop-blur shadow"
          }
        >
          {a.icon}
        </div>
      ))}
      {alerts.length > unique.length && (
        <div className="size-5 grid place-items-center rounded-md bg-background/80 text-[9px] font-mono backdrop-blur shadow">
          +{alerts.length - unique.length}
        </div>
      )}
    </div>
  );
}

function MediaPill({ type }: { type: ReturnType<typeof getMediaType> }) {
  if (type === "video") {
    return (
      <Badge variant="cyan" className="!text-[9px] backdrop-blur bg-background/70">
        <Play className="size-2.5 mr-0.5" /> Video
      </Badge>
    );
  }
  if (type === "carousel") {
    return (
      <Badge variant="ember" className="!text-[9px] backdrop-blur bg-background/70">
        Carrusel
      </Badge>
    );
  }
  if (type === "image") {
    return (
      <Badge variant="outline" className="!text-[9px] backdrop-blur bg-background/70">
        <ImageIcon className="size-2.5 mr-0.5" /> Imagen
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="!text-[9px] backdrop-blur bg-background/70">
      <AlertTriangle className="size-2.5 mr-0.5" /> ?
    </Badge>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneColor = {
    default: "text-foreground",
    success: "text-[hsl(var(--success))]",
    warning: "text-[hsl(var(--warning))]",
    danger: "text-[hsl(var(--destructive))]",
  } as const;
  return (
    <div className="border-t border-border/40 pt-1">
      <div className="text-[8px] uppercase tracking-[0.1em] text-muted-foreground/80">
        {label}
      </div>
      <div className={`font-mono font-semibold text-[11px] ${toneColor[tone]}`}>
        {value}
      </div>
    </div>
  );
}
