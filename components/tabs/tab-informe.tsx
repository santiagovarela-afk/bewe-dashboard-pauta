"use client";
import * as React from "react";
import { motion } from "motion/react";
import { Copy, Check, Sparkles, Download, MessageSquareText, Hash, Mail, FileText } from "lucide-react";
import { useDashboard } from "@/lib/store";
import { PLAN } from "@/lib/config";
import { fmt, daysUntil, cn } from "@/lib/utils";
import { computeMetrics } from "@/lib/selectors";
import { buildSlackShort, buildEmailReport, buildJulianFullReport } from "@/lib/diary";
import { SectionHeader } from "@/components/shared/section-header";
import { TextureCard } from "@/components/fx/texture-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Campaign } from "@/lib/types";

type Format = "exec" | "slack" | "email" | "julian";

/**
 * Deriva los pendientes URGENTES leyendo el estado real de campañas.
 * Devuelve solo los ítems que realmente aplican hoy · NO fabrica datos.
 *
 * Reglas:
 *  · C2 con CR + IC bajos (cap. de evento Reg saturada) → candidato Plan B switch a IC
 *  · cualquier campaña con flag === "critical" → CPT crítico, revisar adset perdedor
 *  · C3 con anomalía (flag === "anomaly") y status DELETED/PAUSED → confirmar pixel
 *  · Watchpoint Colombia → solo si alguna C4/C5/C6 tiene geo == "CO" o vertical de LATAM
 */
function derivePendientes(campaigns: Campaign[], _daysElapsed: number): string[] {
  const out: string[] = [];

  const c2 = campaigns.find((c) => c.code === "C2");
  if (c2) {
    // Plan B C2 si el CR está plano: <20 conv totales en el período y el IC también está bajo
    // (heurística simple — los ratios reales dependen de pacing).
    const c2Plano = c2.evCompleteReg < 20 && c2.spend > 0;
    if (c2Plano) {
      out.push(
        `C2 candidato Plan B · switch a InitiateCheckout (CR ${c2.evCompleteReg} · IC ${c2.evInitCheckout} · gasto ${fmt.eur(c2.spend)})`,
      );
    }
  }

  for (const c of campaigns) {
    if (c.flag === "critical") {
      const cptTxt = c.cpt !== null ? fmt.eur(c.cpt) : "—";
      out.push(`${c.code} CPT ${cptTxt} crítico · revisar adset perdedor`);
    }
  }

  for (const c of campaigns) {
    if (
      c.flag === "anomaly" &&
      (c.status === "DELETED" || c.status === "PAUSED" || c.status === "ARCHIVED")
    ) {
      out.push(`${c.code} anomalía pixel/CAPI confirmada · excluir del CPT global · no pausar más adsets`);
    }
  }

  // Watchpoint geo-leakage Colombia · solo si la concentración real de gasto en CO supera 30%
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  if (totalSpend > 0) {
    const coCampaigns = campaigns.filter((c) => /\bCO\b|colombia/i.test(c.geo));
    const coSpend = coCampaigns.reduce((s, c) => s + c.spend, 0);
    const coShare = coSpend / totalSpend;
    if (coShare > 0.3 && coCampaigns.length > 0) {
      const codes = coCampaigns.map((c) => c.code).join("/");
      out.push(
        `Watchpoint geo-leakage Colombia (${Math.round(coShare * 100)}% del gasto en ${codes}) · si ≥40% aplicar bid cap`,
      );
    }
  }

  return out;
}

/** Checklist manual del equipo · separado del derivado · no depende de data. */
const CHECKLIST_MANUAL: readonly string[] = [
  "Confirmar UTMs en CRM (que las nuevas campañas estén loggeando origen)",
];

const FORMAT_META: Record<Format, { label: string; sub: string; Icon: typeof Hash; tone: string }> = {
  exec: { label: "Informe completo", sub: "Operativo detallado · interno", Icon: FileText, tone: "violet" },
  slack: { label: "Slack · 3 líneas", sub: "Pegar en #bewe-pauta o WhatsApp", Icon: Hash, tone: "cyan" },
  email: { label: "Email ejecutivo", sub: "1 página · al equipo", Icon: Mail, tone: "lime" },
  julian: { label: "Julián · completo", sub: "Reporte largo · estructurado", Icon: MessageSquareText, tone: "ember" },
};

export function TabInforme() {
  const { campaigns, daysElapsed, snapshot, daily } = useDashboard();
  const m = computeMetrics(campaigns);
  const dToD7 = daysUntil(PLAN.day7ISO);

  const [format, setFormat] = React.useState<Format>("exec");
  const [execText, setExecText] = React.useState<string>("");
  const [copied, setCopied] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);

  const slackText = React.useMemo(
    () => buildSlackShort(campaigns, daysElapsed, PLAN.totalDays),
    [campaigns, daysElapsed],
  );
  const emailText = React.useMemo(
    () => buildEmailReport(campaigns, daysElapsed, PLAN.totalDays, daily),
    [campaigns, daysElapsed, daily],
  );
  const julianText = React.useMemo(
    () => buildJulianFullReport(campaigns, daysElapsed, PLAN.totalDays, daily),
    [campaigns, daysElapsed, daily],
  );

  const generate = React.useCallback(() => {
    setGenerating(true);
    let r = "";
    r += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    r += `INFORME DE PAUTA — BEWE MAYO 2026\n`;
    r += `Snapshot: ${snapshot.label} · Día ${daysElapsed}/${PLAN.totalDays}\n`;
    r += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    r += `RESUMEN EJECUTIVO\n─────────────────\n`;
    r += `Gasto acumulado: ${fmt.eur(m.spend)} / €${PLAN.budget} (${Math.round(m.budgetPct)}%)\n`;
    r += `Registros (CompleteRegistration): ${m.totalConvCR}\n`;
    r += `Inicios de pago (InitCheckout · excl C3): ${m.totalConvIC}\n`;
    r += `CPT Registro (C1/C2/C4): ${m.cptReg ? fmt.eur(m.cptReg) : "—"} → ${
      m.cptReg
        ? m.cptReg <= PLAN.cpt.target
          ? "✓ EN OBJETIVO"
          : m.cptReg <= PLAN.cpt.warn
            ? "⚠ POR ENCIMA"
            : "✗ CRÍTICO"
        : "—"
    }\n`;
    r += `CPT Inicio pago (C5/C6): ${m.cptIco ? fmt.eur(m.cptIco) : "—"} → ${
      m.cptIco
        ? m.cptIco <= PLAN.cpt.target
          ? "✓ EN OBJETIVO"
          : m.cptIco <= PLAN.cpt.warn
            ? "⚠ POR ENCIMA"
            : "✗ CRÍTICO"
        : "—"
    }\n`;
    r += `Próxima revisión: Día 7 (19 mayo, ${dToD7 > 0 ? "en " + dToD7 + " días" : dToD7 === 0 ? "HOY" : "pasado"})\n\n`;

    r += `ESTADO POR CAMPAÑA\n───────────────────\n`;
    campaigns.forEach((c) => {
      const s =
        c.flag === "critical"
          ? "🚨 CRÍTICO"
          : c.flag === "anomaly"
            ? "⚠ VERIFICAR"
            : c.flag === "warn"
              ? "⚠ ATENCIÓN"
              : "✓ OK";
      r += `${c.code} ${c.name} (${c.status})\n  Gasto: ${fmt.eur(c.spend)} | CompleteReg: ${c.evCompleteReg} | InitCheckout: ${c.evInitCheckout} | CPT: ${c.cpt ? fmt.eur(c.cpt) : "—"} | CTR: ${c.ctr.toFixed(2)}% | ${s}\n`;
      if (c.flag === "critical") r += `  → Plan B / pausar adset con peor CPT\n`;
      if (c.flag === "anomaly") r += `  → Verificar pixel en Eventos Manager\n`;
      r += "\n";
    });

    r += `PENDIENTES URGENTES\n────────────────────\n`;
    const pendientes = derivePendientes(campaigns, daysElapsed);
    if (pendientes.length === 0) {
      r += `Sin pendientes derivados de la data hoy · seguimiento normal.\n`;
    } else {
      for (const p of pendientes) {
        r += `✗ ${p}\n`;
      }
    }
    r += `\n`;

    r += `CHECKLIST MANUAL DEL EQUIPO\n────────────────────────────\n`;
    for (const item of CHECKLIST_MANUAL) {
      r += `□ ${item}\n`;
    }
    r += `\n`;

    r += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    r += `Generado por Bewe Pauta OS · ${new Date().toLocaleString("es")}\n`;
    setExecText(r);
    setTimeout(() => setGenerating(false), 400);
  }, [campaigns, daysElapsed, m, snapshot, dToD7]);

  React.useEffect(() => {
    generate();
  }, [generate]);

  const currentText = React.useMemo(() => {
    switch (format) {
      case "slack":
        return slackText;
      case "email":
        return emailText;
      case "julian":
        return julianText;
      default:
        return execText;
    }
  }, [format, slackText, emailText, julianText, execText]);

  function copy() {
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    toast.success(`${FORMAT_META[format].label} copiado al portapapeles`);
    setTimeout(() => setCopied(false), 2200);
  }

  function download() {
    const blob = new Blob([currentText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bewe-${format}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-[920px] mx-auto space-y-5">
      <SectionHeader
        title="Informe de estado · mayo 2026"
        sub="Cuatro formatos · operativo, Slack, email ejecutivo, reporte para Julián"
        right={
          <>
            <Button onClick={generate} size="sm" variant="glow">
              <Sparkles className="size-3.5" />
              {generating ? "Generando…" : "Regenerar"}
            </Button>
            <Button onClick={copy} size="sm" variant="outline">
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
            <Button onClick={download} size="sm" variant="outline">
              <Download className="size-3.5" />
              .txt
            </Button>
          </>
        }
      />

      {/* Selector de formato */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {(Object.keys(FORMAT_META) as Format[]).map((f) => {
          const meta = FORMAT_META[f];
          const active = format === f;
          return (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={cn(
                "group relative text-left px-3 py-2.5 rounded-xl border transition-all",
                active
                  ? "border-[hsl(var(--brand-violet)/0.55)] bg-[hsl(var(--brand-violet)/0.08)]"
                  : "border-border bg-card/30 hover:border-foreground/30 hover:bg-card/50",
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <meta.Icon
                  className="size-3.5"
                  style={{ color: `hsl(var(--brand-${meta.tone}))` }}
                />
                <div className="text-[11px] font-bold leading-none">{meta.label}</div>
                {active && (
                  <Badge variant="violet" className="ml-auto text-[9px] px-1.5 py-0">
                    activo
                  </Badge>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground leading-snug">{meta.sub}</div>
            </button>
          );
        })}
      </div>

      {/* Output */}
      <motion.div
        key={format + currentText.length}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <TextureCard className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-background/40">
            <div className="flex items-center gap-2">
              {(() => {
                const Icon = FORMAT_META[format].Icon;
                return (
                  <Icon
                    className="size-4"
                    style={{ color: `hsl(var(--brand-${FORMAT_META[format].tone}))` }}
                  />
                );
              })()}
              <h3 className="text-[12px] font-bold">{FORMAT_META[format].label}</h3>
              <Badge variant="outline" className="font-mono text-[9px]">
                {currentText.split("\n").length} líneas · {currentText.length} chars
              </Badge>
            </div>
          </div>
          <div className="p-5 max-h-[640px] overflow-y-auto">
            <pre className="font-mono text-[12px] whitespace-pre-wrap leading-relaxed text-foreground/90">
              {currentText}
            </pre>
          </div>
        </TextureCard>
      </motion.div>
    </div>
  );
}
