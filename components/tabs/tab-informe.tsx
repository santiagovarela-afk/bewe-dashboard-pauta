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

type Format = "exec" | "slack" | "email" | "julian";

const FORMAT_META: Record<Format, { label: string; sub: string; Icon: typeof Hash; tone: string }> = {
  exec: { label: "Informe completo", sub: "Operativo detallado · interno", Icon: FileText, tone: "violet" },
  slack: { label: "Slack · 3 líneas", sub: "Pegar en #bewe-pauta o WhatsApp", Icon: Hash, tone: "cyan" },
  email: { label: "Email ejecutivo", sub: "1 página · al equipo", Icon: Mail, tone: "lime" },
  julian: { label: "Julián · completo", sub: "Reporte largo · estructurado", Icon: MessageSquareText, tone: "ember" },
};

export function TabInforme() {
  const { campaigns, daysElapsed, snapshot } = useDashboard();
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
    () => buildEmailReport(campaigns, daysElapsed, PLAN.totalDays),
    [campaigns, daysElapsed],
  );
  const julianText = React.useMemo(
    () => buildJulianFullReport(campaigns, daysElapsed, PLAN.totalDays),
    [campaigns, daysElapsed],
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
    r += `✗ PLAN B C2: switch a InitiateCheckout (${campaigns.find((c) => c.code === "C2")?.evCompleteReg ?? 0} CR)\n`;
    r += `✗ C1 CPT €${campaigns.find((c) => c.code === "C1")?.cpt?.toFixed(2)} cruzó umbral crítico — revisar A1.3_INT_BELLEZA\n`;
    r += `□ C3 anomalía CAPI confirmada — excluir de CPT global, no pausar\n`;
    r += `□ Watchpoint geo-leakage Colombia en C4/C5/C6 (≥40% → bid cap)\n`;
    r += `□ 26 mayo (Día 14): Activar C7 si ≥1000 visits + ≥30 trials\n`;
    r += `□ Crear C8 LATAM_TOOLS\n`;
    r += `□ Confirmar UTMs en CRM\n\n`;

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
